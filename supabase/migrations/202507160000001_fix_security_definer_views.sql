-- Fix SECURITY DEFINER Views - NWL-16
-- Remove security vulnerabilities by recreating views with security_invoker=on
-- This ensures views respect Row Level Security policies of the querying user
-- instead of bypassing RLS with view creator's permissions

-- ============================================================================
-- Drop existing views that have SECURITY DEFINER issues
-- ============================================================================

-- Drop views in dependency order (dependent views first)
DROP VIEW IF EXISTS daily_analytics;
DROP VIEW IF EXISTS contact_analytics; 
DROP VIEW IF EXISTS post_performance;
DROP VIEW IF EXISTS published_post_with_tags;

-- ============================================================================
-- Recreate views with SECURITY INVOKER to respect RLS policies
-- ============================================================================

-- View for published posts with all related data
-- CRITICAL: Used by search-handler edge function
CREATE VIEW published_post_with_tags AS
SELECT 
    p.id,
    p.title,
    p.abstract,
    p.thumbnail_hash,
    p.view_count,
    p.published_at,
    p.created_at,
    p.series_id,
    COALESCE(
        ARRAY_AGG(DISTINCT ft.name) FILTER (WHERE ft.name IS NOT NULL), 
        ARRAY[]::VARCHAR[]
    ) as fixed_tags,
    COALESCE(
        ARRAY_AGG(DISTINCT gt.name) FILTER (WHERE gt.name IS NOT NULL), 
        ARRAY[]::VARCHAR[]
    ) as generated_tags,
    COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'approved' AND c.is_deleted = FALSE) as comment_count
FROM post p
LEFT JOIN post_fixed_tag pft ON p.id = pft.post_id
LEFT JOIN fixed_tag ft ON pft.fixed_tag_id = ft.id AND ft.is_active = TRUE AND ft.is_deleted = FALSE
LEFT JOIN post_generated_tag pgt ON p.id = pgt.post_id
LEFT JOIN generated_tag gt ON pgt.generated_tag_id = gt.id
LEFT JOIN comment c ON p.id = c.post_id
WHERE p.status = 'published' AND p.is_deleted = FALSE
GROUP BY p.id, p.title, p.abstract, p.thumbnail_hash, p.view_count, p.published_at, p.created_at, p.series_id;

-- Analytics view for dashboard
CREATE VIEW daily_analytics AS
SELECT 
    DATE(pv.viewed_at) as view_date,
    COUNT(DISTINCT pv.visitor_cookie) as unique_visitors,
    COUNT(*) as total_views,
    AVG(pv.dwell_time) as avg_dwell_time,
    COUNT(DISTINCT pv.post_id) as posts_viewed
FROM post_view pv
WHERE pv.gdpr_consent = TRUE OR pv.ccpa_opt_out = FALSE
GROUP BY DATE(pv.viewed_at)
ORDER BY view_date DESC;

-- Contact click analytics
CREATE VIEW contact_analytics AS
SELECT 
    c.type,
    c.display_name,
    COUNT(cc.id) as click_count,
    COUNT(DISTINCT cc.visitor_cookie) as unique_clickers,
    DATE(cc.clicked_at) as click_date
FROM contact c
LEFT JOIN contact_click cc ON c.id = cc.contact_id
WHERE c.is_active = TRUE AND c.is_deleted = FALSE
  AND (cc.gdpr_consent = TRUE OR cc.ccpa_opt_out = FALSE OR cc.id IS NULL)
GROUP BY c.id, c.type, c.display_name, DATE(cc.clicked_at)
ORDER BY click_date DESC, click_count DESC;

-- Post performance view
CREATE VIEW post_performance AS
SELECT 
    p.id,
    p.title,
    p.view_count,
    p.published_at,
    COUNT(DISTINCT pv.visitor_cookie) as unique_visitors,
    COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'approved' AND c.is_deleted = FALSE) as comment_count,
    AVG(pv.dwell_time) as avg_dwell_time
FROM post p
LEFT JOIN post_view pv ON p.id = pv.post_id 
  AND (pv.gdpr_consent = TRUE OR pv.ccpa_opt_out = FALSE)
LEFT JOIN comment c ON p.id = c.post_id
WHERE p.status = 'published' AND p.is_deleted = FALSE
GROUP BY p.id, p.title, p.view_count, p.published_at
ORDER BY p.published_at DESC;

-- ============================================================================
-- Update permissions for the fixed views
-- ============================================================================

-- Grant select permissions on views to blog_system user (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'blog_system') THEN
        GRANT SELECT ON published_post_with_tags TO blog_system;
        GRANT SELECT ON daily_analytics TO blog_system;
        GRANT SELECT ON contact_analytics TO blog_system;
        GRANT SELECT ON post_performance TO blog_system;
    END IF;
END $$;

-- ============================================================================
-- Apply security_invoker to all views to prevent SECURITY DEFINER behavior
-- ============================================================================

-- Set security_invoker=on for all views to respect RLS of querying user
ALTER VIEW published_post_with_tags SET (security_invoker = on);
ALTER VIEW daily_analytics SET (security_invoker = on);
ALTER VIEW contact_analytics SET (security_invoker = on);
ALTER VIEW post_performance SET (security_invoker = on);

-- ============================================================================
-- Migration Notes
-- ============================================================================

-- This migration fixes security vulnerabilities identified by Supabase advisor:
-- - Removes SECURITY DEFINER behavior that bypassed RLS policies
-- - Views now respect Row Level Security of the querying user
-- - Maintains identical functionality while improving security
-- 
-- Views affected:
-- - published_post_with_tags (used by search-handler edge function)
-- - daily_analytics (admin dashboard)
-- - contact_analytics (admin dashboard)  
-- - post_performance (admin dashboard)
--
-- Post-migration testing required:
-- - Verify search-handler edge function still works
-- - Confirm admin can access analytics views
-- - Run Supabase security advisor to verify fix