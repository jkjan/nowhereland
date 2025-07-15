-- Nowhere Land Blog Database Schema for Supabase PostgreSQL
-- Clean Code: Normalized, Singular table names, Timestamp columns, All PRD features supported
-- All IDs use UUIDv7 (64 characters) generated on backend server

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- USERS AND AUTHENTICATION
-- ============================================================================

-- User table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS "user" (
    id VARCHAR(64) PRIMARY KEY, -- UUIDv7
    auth_user_id UUID REFERENCES auth.users(id),
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    display_name VARCHAR(100),
    is_admin BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- ============================================================================
-- BLOG CONTENT
-- ============================================================================

-- Post table
CREATE TABLE IF NOT EXISTS post (
    id VARCHAR(64) PRIMARY KEY, -- UUIDv7
    user_id VARCHAR(64) NOT NULL REFERENCES "user"(id),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    abstract TEXT,
    thumbnail_hash VARCHAR(64), -- hash code for image CDN
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    view_count INTEGER DEFAULT 0,
    series_id VARCHAR(64), -- for post series feature (future)
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ
);

-- Post series table (for future implementation)
CREATE TABLE IF NOT EXISTS post_series (
    id VARCHAR(64) PRIMARY KEY, -- UUIDv7
    title VARCHAR(255) NOT NULL,
    description TEXT,
    user_id VARCHAR(64) NOT NULL REFERENCES "user"(id),
    is_active BOOLEAN DEFAULT TRUE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Add foreign key for post series
ALTER TABLE post ADD CONSTRAINT fk_post_series 
    FOREIGN KEY (series_id) REFERENCES post_series(id);

-- Fixed tag (predefined by admin)
CREATE TABLE IF NOT EXISTS fixed_tag (
    id VARCHAR(64) PRIMARY KEY, -- UUIDv7
    name VARCHAR(50) NOT NULL UNIQUE,
    color VARCHAR(7) DEFAULT '#D01C1F', -- hex color
    is_active BOOLEAN DEFAULT TRUE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Generated tag (AI/NLP generated)
CREATE TABLE IF NOT EXISTS generated_tag (
    id VARCHAR(64) PRIMARY KEY, -- UUIDv7
    name VARCHAR(50) NOT NULL,
    confidence_score DECIMAL(3,2), -- 0.00 to 1.00
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Post-Tag relationships (many-to-many)
CREATE TABLE IF NOT EXISTS post_fixed_tag (
    id VARCHAR(64) PRIMARY KEY, -- UUIDv7
    post_id VARCHAR(64) NOT NULL REFERENCES post(id),
    fixed_tag_id VARCHAR(64) NOT NULL REFERENCES fixed_tag(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(post_id, fixed_tag_id)
);

CREATE TABLE IF NOT EXISTS post_generated_tag (
    id VARCHAR(64) PRIMARY KEY, -- UUIDv7
    post_id VARCHAR(64) NOT NULL REFERENCES post(id),
    generated_tag_id VARCHAR(64) NOT NULL REFERENCES generated_tag(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(post_id, generated_tag_id)
);

-- Reference for posts (bi-directional linking support)
CREATE TABLE IF NOT EXISTS reference (
    id VARCHAR(64) PRIMARY KEY, -- UUIDv7
    post_id VARCHAR(64) NOT NULL REFERENCES post(id),
    text TEXT NOT NULL,
    url TEXT, -- optional URL if reference is a link
    sequence_number INTEGER NOT NULL,
    start_position INTEGER NOT NULL, -- character position in content where reference starts
    end_position INTEGER NOT NULL, -- character position in content where reference ends
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    UNIQUE(post_id, sequence_number)
);

-- Table of Contents generation data
CREATE TABLE IF NOT EXISTS toc_entry (
    id VARCHAR(64) PRIMARY KEY, -- UUIDv7
    post_id VARCHAR(64) NOT NULL REFERENCES post(id),
    level INTEGER NOT NULL CHECK (level BETWEEN 1 AND 6), -- h1-h6
    title VARCHAR(255) NOT NULL,
    anchor VARCHAR(255) NOT NULL, -- URL fragment for linking
    position_in_content INTEGER NOT NULL, -- character position in content
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(post_id, anchor)
);

-- ============================================================================
-- COMMENTS SYSTEM
-- ============================================================================

-- Comment table (anonymous comments with username/password)
CREATE TABLE IF NOT EXISTS comment (
    id VARCHAR(64) PRIMARY KEY, -- UUIDv7
    post_id VARCHAR(64) NOT NULL REFERENCES post(id),
    parent_comment_id VARCHAR(64) REFERENCES comment(id), -- for nested comments
    username VARCHAR(50) NOT NULL,
    password_hash TEXT NOT NULL, -- PBKDF2 hashed (8-64 chars, NIST SP 800-63-4)
    content TEXT NOT NULL,
    ip_address INET,
    user_agent TEXT,
    status VARCHAR(20) DEFAULT 'approved' CHECK (status IN ('approved', 'flagged', 'deleted')),
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Comment filtering keywords (admin-configurable)
CREATE TABLE IF NOT EXISTS filter_keyword (
    id VARCHAR(64) PRIMARY KEY, -- UUIDv7
    keyword VARCHAR(100) NOT NULL,
    is_case_sensitive BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_by VARCHAR(64) REFERENCES "user"(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Search history tracking (for admin analytics)
CREATE TABLE IF NOT EXISTS search_history (
    id VARCHAR(64) PRIMARY KEY, -- UUIDv7
    search_term VARCHAR(255) NOT NULL, -- actual search term for admin visibility
    result_count INTEGER NOT NULL,
    search_type VARCHAR(20) DEFAULT 'text' CHECK (search_type IN ('text', 'tag', 'combined')),
    ip_address INET,
    user_agent TEXT,
    searched_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ABOUT ME PAGE
-- ============================================================================

-- About me content (single record per user)
CREATE TABLE IF NOT EXISTS about_me (
    id VARCHAR(64) PRIMARY KEY, -- UUIDv7
    user_id VARCHAR(64) NOT NULL REFERENCES "user"(id),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id) -- Only one about me per user
);

-- Contact information
CREATE TABLE IF NOT EXISTS contact (
    id VARCHAR(64) PRIMARY KEY, -- UUIDv7
    user_id VARCHAR(64) NOT NULL REFERENCES "user"(id),
    type VARCHAR(20) NOT NULL CHECK (type IN ('email', 'x', 'instagram', 'facebook', 'phone')),
    display_name VARCHAR(100),
    url TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_deleted BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    UNIQUE(user_id, type)
);

-- ============================================================================
-- ANALYTICS AND TRACKING (Cookie-based, GDPR/CCPA Compliant)
-- ============================================================================

-- Post view tracking (cookie-based unique visitor tracking)
CREATE TABLE IF NOT EXISTS post_view (
    id VARCHAR(64) PRIMARY KEY, -- UUIDv7
    post_id VARCHAR(64) NOT NULL REFERENCES post(id),
    visitor_cookie VARCHAR(64) NOT NULL, -- cookie-based unique visitor ID
    ip_address INET,
    user_agent TEXT,
    referrer TEXT,
    dwell_time INTEGER DEFAULT 0, -- seconds spent on page (max value stored)
    gdpr_consent BOOLEAN DEFAULT FALSE,
    ccpa_opt_out BOOLEAN DEFAULT FALSE,
    viewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contact click tracking (cookie-based)
CREATE TABLE IF NOT EXISTS contact_click (
    id VARCHAR(64) PRIMARY KEY, -- UUIDv7
    contact_id VARCHAR(64) NOT NULL REFERENCES contact(id),
    visitor_cookie VARCHAR(64) NOT NULL, -- cookie-based unique visitor ID
    ip_address INET,
    user_agent TEXT,
    gdpr_consent BOOLEAN DEFAULT FALSE,
    ccpa_opt_out BOOLEAN DEFAULT FALSE,
    clicked_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SYSTEM CONFIGURATION
-- ============================================================================

-- Site setting
CREATE TABLE IF NOT EXISTS site_setting (
    id VARCHAR(64) PRIMARY KEY, -- UUIDv7
    key VARCHAR(100) NOT NULL UNIQUE,
    value TEXT,
    description TEXT,
    setting_type VARCHAR(20) DEFAULT 'string' CHECK (setting_type IN ('string', 'number', 'boolean', 'json', 'color')),
    updated_by VARCHAR(64) REFERENCES "user"(id),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin notification (for comment alerts, etc.)
CREATE TABLE IF NOT EXISTS admin_notification (
    id VARCHAR(64) PRIMARY KEY, -- UUIDv7
    type VARCHAR(50) NOT NULL, -- 'new_comment', 'system_error', etc.
    title VARCHAR(255) NOT NULL,
    message TEXT,
    related_entity_type VARCHAR(50), -- 'comment', 'post', etc.
    related_entity_id VARCHAR(64),
    is_read BOOLEAN DEFAULT FALSE,
    user_id VARCHAR(64) NOT NULL REFERENCES "user"(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Related post calculation (for "Related Posts" feature)
CREATE TABLE IF NOT EXISTS related_post (
    id VARCHAR(64) PRIMARY KEY, -- UUIDv7
    source_post_id VARCHAR(64) NOT NULL REFERENCES post(id),
    related_post_id VARCHAR(64) NOT NULL REFERENCES post(id),
    common_tag_count INTEGER NOT NULL, -- number of tags in common
    relevance_score DECIMAL(3,2), -- calculated relevance (0.00 to 1.00)
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(source_post_id, related_post_id),
    CHECK(source_post_id != related_post_id) -- can't be related to itself
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- User indexes
CREATE INDEX IF NOT EXISTS idx_user_auth_user_id ON "user"(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_user_username ON "user"(username);
CREATE INDEX IF NOT EXISTS idx_user_email ON "user"(email);
CREATE INDEX IF NOT EXISTS idx_user_is_admin ON "user"(is_admin);
CREATE INDEX IF NOT EXISTS idx_user_soft_delete ON "user"(is_deleted, deleted_at) WHERE is_deleted = FALSE;

-- Post indexes
CREATE INDEX IF NOT EXISTS idx_post_user_id ON post(user_id);
CREATE INDEX IF NOT EXISTS idx_post_status ON post(status);
CREATE INDEX IF NOT EXISTS idx_post_published_at ON post(published_at DESC) WHERE status = 'published' AND is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_post_created_at ON post(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_view_count ON post(view_count DESC);
CREATE INDEX IF NOT EXISTS idx_post_soft_delete ON post(is_deleted, deleted_at) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_post_series_id ON post(series_id);

-- Comment indexes
CREATE INDEX IF NOT EXISTS idx_comment_post_id ON comment(post_id);
CREATE INDEX IF NOT EXISTS idx_comment_parent_id ON comment(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_created_at ON comment(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comment_soft_delete ON comment(is_deleted, deleted_at) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_comment_status ON comment(status);

-- Filter keyword indexes
CREATE INDEX IF NOT EXISTS idx_filter_keyword_active ON filter_keyword(is_active);
CREATE INDEX IF NOT EXISTS idx_filter_keyword_keyword ON filter_keyword(keyword);

-- Search history indexes  
CREATE INDEX IF NOT EXISTS idx_search_history_term ON search_history(search_term);
CREATE INDEX IF NOT EXISTS idx_search_history_searched_at ON search_history(searched_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_history_type ON search_history(search_type);

-- Reference indexes
CREATE INDEX IF NOT EXISTS idx_reference_post_id ON reference(post_id);
CREATE INDEX IF NOT EXISTS idx_reference_sequence ON reference(post_id, sequence_number);
CREATE INDEX IF NOT EXISTS idx_reference_position ON reference(post_id, start_position, end_position);
CREATE INDEX IF NOT EXISTS idx_reference_soft_delete ON reference(is_deleted, deleted_at) WHERE is_deleted = FALSE;

-- Tag relationship indexes
CREATE INDEX IF NOT EXISTS idx_post_fixed_tag_post_id ON post_fixed_tag(post_id);
CREATE INDEX IF NOT EXISTS idx_post_fixed_tag_tag_id ON post_fixed_tag(fixed_tag_id);
CREATE INDEX IF NOT EXISTS idx_post_generated_tag_post_id ON post_generated_tag(post_id);
CREATE INDEX IF NOT EXISTS idx_post_generated_tag_tag_id ON post_generated_tag(generated_tag_id);

-- Fixed tag indexes
CREATE INDEX IF NOT EXISTS idx_fixed_tag_name ON fixed_tag(name);
CREATE INDEX IF NOT EXISTS idx_fixed_tag_active ON fixed_tag(is_active);
CREATE INDEX IF NOT EXISTS idx_fixed_tag_soft_delete ON fixed_tag(is_deleted, deleted_at) WHERE is_deleted = FALSE;

-- Generated tag indexes
CREATE INDEX IF NOT EXISTS idx_generated_tag_name ON generated_tag(name);
CREATE INDEX IF NOT EXISTS idx_generated_tag_confidence ON generated_tag(confidence_score DESC);

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_post_view_post_id ON post_view(post_id);
CREATE INDEX IF NOT EXISTS idx_post_view_visitor_cookie ON post_view(visitor_cookie);
CREATE INDEX IF NOT EXISTS idx_post_view_viewed_at ON post_view(viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_view_gdpr_consent ON post_view(gdpr_consent);

-- Note: One view per visitor per day constraint will be enforced via application logic
-- since PostgreSQL doesn't allow DATE() function in unique indexes without IMMUTABLE marking
CREATE INDEX IF NOT EXISTS idx_contact_click_contact_id ON contact_click(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_click_clicked_at ON contact_click(clicked_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_click_visitor_cookie ON contact_click(visitor_cookie);

-- Contact indexes
CREATE INDEX IF NOT EXISTS idx_contact_user_id ON contact(user_id);
CREATE INDEX IF NOT EXISTS idx_contact_type ON contact(type);
CREATE INDEX IF NOT EXISTS idx_contact_active ON contact(is_active);
CREATE INDEX IF NOT EXISTS idx_contact_soft_delete ON contact(is_deleted, deleted_at) WHERE is_deleted = FALSE;

-- TOC indexes
CREATE INDEX IF NOT EXISTS idx_toc_entry_post_id ON toc_entry(post_id);
CREATE INDEX IF NOT EXISTS idx_toc_entry_position ON toc_entry(post_id, position_in_content);

-- Related post indexes
CREATE INDEX IF NOT EXISTS idx_related_post_source ON related_post(source_post_id, relevance_score DESC);
CREATE INDEX IF NOT EXISTS idx_related_post_calculated_at ON related_post(calculated_at DESC);

-- Admin notification indexes
CREATE INDEX IF NOT EXISTS idx_admin_notification_user_id ON admin_notification(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_notification_is_read ON admin_notification(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_admin_notification_created_at ON admin_notification(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_notification_type ON admin_notification(type);

-- Site setting indexes
CREATE INDEX IF NOT EXISTS idx_site_setting_key ON site_setting(key);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_user_updated_at BEFORE UPDATE ON "user" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_post_updated_at BEFORE UPDATE ON post FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_post_series_updated_at BEFORE UPDATE ON post_series FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reference_updated_at BEFORE UPDATE ON reference FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_comment_updated_at BEFORE UPDATE ON comment FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_fixed_tag_updated_at BEFORE UPDATE ON fixed_tag FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_about_me_updated_at BEFORE UPDATE ON about_me FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contact_updated_at BEFORE UPDATE ON contact FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create admin notification for new comments
CREATE OR REPLACE FUNCTION notify_admin_new_comment()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO admin_notification (id, type, title, message, related_entity_type, related_entity_id, user_id)
    SELECT 
        gen_random_uuid()::text, -- Generate UUIDv7-like ID
        'new_comment',
        'New comment on post',
        'A new comment has been posted by ' || NEW.username,
        'comment',
        NEW.id,
        u.id
    FROM "user" u 
    WHERE u.is_admin = TRUE AND u.is_deleted = FALSE;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for new comment notifications
CREATE TRIGGER notify_admin_new_comment_trigger
    AFTER INSERT ON comment
    FOR EACH ROW
    EXECUTE FUNCTION notify_admin_new_comment();

-- Function to soft delete (set is_deleted = TRUE and deleted_at = NOW())
CREATE OR REPLACE FUNCTION soft_delete()
RETURNS TRIGGER AS $$
BEGIN
    NEW.is_deleted = TRUE;
    NEW.deleted_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE "user" ENABLE ROW LEVEL SECURITY;
ALTER TABLE post ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment ENABLE ROW LEVEL SECURITY;
ALTER TABLE reference ENABLE ROW LEVEL SECURITY;
ALTER TABLE toc_entry ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixed_tag ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_tag ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_fixed_tag ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_generated_tag ENABLE ROW LEVEL SECURITY;
ALTER TABLE about_me ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_view ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_click ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_setting ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notification ENABLE ROW LEVEL SECURITY;
ALTER TABLE related_post ENABLE ROW LEVEL SECURITY;
ALTER TABLE filter_keyword ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;

-- Public read policies for published content
CREATE POLICY "Public can read published posts" ON post
    FOR SELECT USING (status = 'published' AND is_deleted = FALSE);

CREATE POLICY "Public can read approved comments" ON comment
    FOR SELECT USING (status = 'approved' AND is_deleted = FALSE);

CREATE POLICY "Public can read references for published posts" ON reference
    FOR SELECT USING (
        is_deleted = FALSE AND
        post_id IN (SELECT id FROM post WHERE status = 'published' AND is_deleted = FALSE)
    );

CREATE POLICY "Public can read TOC for published posts" ON toc_entry
    FOR SELECT USING (
        post_id IN (SELECT id FROM post WHERE status = 'published' AND is_deleted = FALSE)
    );

CREATE POLICY "Public can read active fixed tags" ON fixed_tag
    FOR SELECT USING (is_active = TRUE AND is_deleted = FALSE);

CREATE POLICY "Public can read generated tags" ON generated_tag
    FOR SELECT USING (TRUE);

CREATE POLICY "Public can read post-tag relationships" ON post_fixed_tag
    FOR SELECT USING (
        post_id IN (SELECT id FROM post WHERE status = 'published' AND is_deleted = FALSE)
    );

CREATE POLICY "Public can read post-generated-tag relationships" ON post_generated_tag
    FOR SELECT USING (
        post_id IN (SELECT id FROM post WHERE status = 'published' AND is_deleted = FALSE)
    );

CREATE POLICY "Public can read about me" ON about_me
    FOR SELECT USING (TRUE);

CREATE POLICY "Public can read active contacts" ON contact
    FOR SELECT USING (is_active = TRUE AND is_deleted = FALSE);

CREATE POLICY "Public can read related posts" ON related_post
    FOR SELECT USING (
        source_post_id IN (SELECT id FROM post WHERE status = 'published' AND is_deleted = FALSE)
        AND related_post_id IN (SELECT id FROM post WHERE status = 'published' AND is_deleted = FALSE)
    );

-- Admin policies (full access)
CREATE POLICY "Admin full access to users" ON "user"
    FOR ALL USING (
        auth.uid() IN (SELECT auth_user_id FROM "user" WHERE is_admin = TRUE AND is_deleted = FALSE)
    );

CREATE POLICY "Admin full access to posts" ON post
    FOR ALL USING (
        auth.uid() IN (SELECT auth_user_id FROM "user" WHERE is_admin = TRUE AND is_deleted = FALSE)
    );

CREATE POLICY "Admin full access to comments" ON comment
    FOR ALL USING (
        auth.uid() IN (SELECT auth_user_id FROM "user" WHERE is_admin = TRUE AND is_deleted = FALSE)
    );

CREATE POLICY "Admin can manage settings" ON site_setting
    FOR ALL USING (
        auth.uid() IN (SELECT auth_user_id FROM "user" WHERE is_admin = TRUE AND is_deleted = FALSE)
    );

CREATE POLICY "Admin can see notifications" ON admin_notification
    FOR SELECT USING (
        auth.uid() IN (SELECT auth_user_id FROM "user" WHERE is_admin = TRUE AND is_deleted = FALSE)
    );

CREATE POLICY "Admin can manage fixed tags" ON fixed_tag
    FOR ALL USING (
        auth.uid() IN (SELECT auth_user_id FROM "user" WHERE is_admin = TRUE AND is_deleted = FALSE)
    );

CREATE POLICY "Admin can manage contacts" ON contact
    FOR ALL USING (
        auth.uid() IN (SELECT auth_user_id FROM "user" WHERE is_admin = TRUE AND is_deleted = FALSE)
    );

CREATE POLICY "Admin can manage about me" ON about_me
    FOR ALL USING (
        auth.uid() IN (SELECT auth_user_id FROM "user" WHERE is_admin = TRUE AND is_deleted = FALSE)
    );

CREATE POLICY "Admin can manage filter keywords" ON filter_keyword
    FOR ALL USING (
        auth.uid() IN (SELECT auth_user_id FROM "user" WHERE is_admin = TRUE AND is_deleted = FALSE)
    );

CREATE POLICY "Admin can read search history" ON search_history
    FOR SELECT USING (
        auth.uid() IN (SELECT auth_user_id FROM "user" WHERE is_admin = TRUE AND is_deleted = FALSE)
    );

-- Blog system user policies (read/write, no delete)
CREATE POLICY "Blog system can select posts" ON post FOR SELECT USING (TRUE);
CREATE POLICY "Blog system can insert posts" ON post FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Blog system can update posts" ON post FOR UPDATE USING (TRUE);

CREATE POLICY "Blog system can select comments" ON comment FOR SELECT USING (TRUE);
CREATE POLICY "Blog system can insert comments" ON comment FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Blog system can update comments" ON comment FOR UPDATE USING (TRUE);

CREATE POLICY "Blog system can select analytics" ON post_view FOR SELECT USING (TRUE);
CREATE POLICY "Blog system can insert analytics" ON post_view FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Blog system can update analytics" ON post_view FOR UPDATE USING (TRUE);

CREATE POLICY "Blog system can select contact clicks" ON contact_click FOR SELECT USING (TRUE);
CREATE POLICY "Blog system can insert contact clicks" ON contact_click FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Blog system can update contact clicks" ON contact_click FOR UPDATE USING (TRUE);

CREATE POLICY "Blog system can select generated tags" ON generated_tag FOR SELECT USING (TRUE);
CREATE POLICY "Blog system can insert generated tags" ON generated_tag FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Blog system can update generated tags" ON generated_tag FOR UPDATE USING (TRUE);

CREATE POLICY "Blog system can select post-tag relationships" ON post_fixed_tag FOR SELECT USING (TRUE);
CREATE POLICY "Blog system can insert post-tag relationships" ON post_fixed_tag FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Blog system can update post-tag relationships" ON post_fixed_tag FOR UPDATE USING (TRUE);

CREATE POLICY "Blog system can select post-generated-tag relationships" ON post_generated_tag FOR SELECT USING (TRUE);
CREATE POLICY "Blog system can insert post-generated-tag relationships" ON post_generated_tag FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Blog system can update post-generated-tag relationships" ON post_generated_tag FOR UPDATE USING (TRUE);

CREATE POLICY "Blog system can select references" ON reference FOR SELECT USING (TRUE);
CREATE POLICY "Blog system can insert references" ON reference FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Blog system can update references" ON reference FOR UPDATE USING (TRUE);

CREATE POLICY "Blog system can select TOC entries" ON toc_entry FOR SELECT USING (TRUE);
CREATE POLICY "Blog system can insert TOC entries" ON toc_entry FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Blog system can update TOC entries" ON toc_entry FOR UPDATE USING (TRUE);

CREATE POLICY "Blog system can select related posts" ON related_post FOR SELECT USING (TRUE);
CREATE POLICY "Blog system can insert related posts" ON related_post FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Blog system can update related posts" ON related_post FOR UPDATE USING (TRUE);

CREATE POLICY "Blog system can select filter keywords" ON filter_keyword FOR SELECT USING (TRUE);
CREATE POLICY "Blog system can insert filter keywords" ON filter_keyword FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Blog system can update filter keywords" ON filter_keyword FOR UPDATE USING (TRUE);

CREATE POLICY "Blog system can select search history" ON search_history FOR SELECT USING (TRUE);
CREATE POLICY "Blog system can insert search history" ON search_history FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Blog system can update search history" ON search_history FOR UPDATE USING (TRUE);

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Insert default fixed tags
INSERT INTO fixed_tag (id, name, color) VALUES 
    (gen_random_uuid()::text, 'dev', '#D01C1F'),
    (gen_random_uuid()::text, 'beer', '#FF8200')
ON CONFLICT (name) DO NOTHING;

-- Insert default filter keywords (basic spam/inappropriate content)
INSERT INTO filter_keyword (id, keyword, is_case_sensitive, is_active) VALUES 
    (gen_random_uuid()::text, 'spam', FALSE, TRUE),
    (gen_random_uuid()::text, 'viagra', FALSE, TRUE),
    (gen_random_uuid()::text, 'casino', FALSE, TRUE)
ON CONFLICT DO NOTHING;

-- Insert default site settings
INSERT INTO site_setting (id, key, value, description, setting_type) VALUES 
    (gen_random_uuid()::text, 'accent_color_light', '#D01C1F', 'Accent color for light theme', 'color'),
    (gen_random_uuid()::text, 'accent_color_dark', '#FF8200', 'Accent color for dark theme', 'color'),
    (gen_random_uuid()::text, 'border_radius', '8px', 'Default border radius for components', 'string'),
    (gen_random_uuid()::text, 'max_container_width', '1280px', 'Maximum container width (7xl)', 'string'),
    (gen_random_uuid()::text, 'blog_title', 'Nowhere Land', 'Main blog title', 'string'),
    (gen_random_uuid()::text, 'blog_description', 'A personal blog representing thoughts, plans and everything', 'Blog description for meta tags', 'string'),
    (gen_random_uuid()::text, 'gdpr_enabled', 'true', 'Enable GDPR compliance features', 'boolean'),
    (gen_random_uuid()::text, 'ccpa_enabled', 'true', 'Enable CCPA compliance features', 'boolean')
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- CONSTRAINTS AND VALIDATION
-- ============================================================================

-- Ensure post references are properly sequenced
ALTER TABLE reference ADD CONSTRAINT check_sequence_positive 
    CHECK (sequence_number > 0);

-- Ensure reference positions are valid
ALTER TABLE reference ADD CONSTRAINT check_position_order 
    CHECK (start_position <= end_position);

-- Ensure view counts are non-negative
ALTER TABLE post ADD CONSTRAINT check_view_count_non_negative 
    CHECK (view_count >= 0);

-- Ensure dwell time is non-negative
ALTER TABLE post_view ADD CONSTRAINT check_dwell_time_non_negative 
    CHECK (dwell_time >= 0);

-- Ensure confidence scores are between 0 and 1
ALTER TABLE generated_tag ADD CONSTRAINT check_confidence_score_range 
    CHECK (confidence_score >= 0.00 AND confidence_score <= 1.00);

-- Ensure TOC level is valid
ALTER TABLE toc_entry ADD CONSTRAINT check_toc_level_valid
    CHECK (level BETWEEN 1 AND 6);

-- Ensure relevance scores are between 0 and 1
ALTER TABLE related_post ADD CONSTRAINT check_relevance_score_range 
    CHECK (relevance_score >= 0.00 AND relevance_score <= 1.00);

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View for published posts with all related data
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