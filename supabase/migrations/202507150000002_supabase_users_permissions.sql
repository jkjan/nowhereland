-- Database Users and Permissions Setup for Supabase
-- This script should be run in Supabase SQL Editor with postgres superuser privileges

-- ============================================================================
-- CREATE DATABASE USERS
-- ============================================================================

-- Create blog_system user (read/write only, no delete permissions)
-- This user will be used by the application backend
CREATE USER blog_system WITH PASSWORD 'your_secure_blog_system_password_here';

-- Create admin user (full permissions)
-- This user will be used for admin operations and maintenance
CREATE USER admin WITH PASSWORD 'your_secure_admin_password_here';

-- ============================================================================
-- GRANT BASIC PERMISSIONS
-- ============================================================================

-- Grant connect permission to database
GRANT CONNECT ON DATABASE postgres TO blog_system;
GRANT CONNECT ON DATABASE postgres TO admin;

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO blog_system;
GRANT USAGE ON SCHEMA public TO admin;

-- Grant usage on auth schema for authentication
GRANT USAGE ON SCHEMA auth TO blog_system;
GRANT USAGE ON SCHEMA auth TO admin;

-- ============================================================================
-- BLOG_SYSTEM USER PERMISSIONS (Read/Write, No Delete)
-- ============================================================================

-- Grant read/write permissions on all current tables
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO blog_system;

-- Grant permissions on sequences (for ID generation if needed)
GRANT SELECT, USAGE ON ALL SEQUENCES IN SCHEMA public TO blog_system;

-- Grant permissions for future tables (important for schema updates)
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE ON TABLES TO blog_system;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, USAGE ON SEQUENCES TO blog_system;

-- Explicitly revoke delete permissions (safety measure)
REVOKE DELETE ON ALL TABLES IN SCHEMA public FROM blog_system;

-- Grant specific auth table permissions (for user authentication)
GRANT SELECT ON auth.users TO blog_system;

-- ============================================================================
-- ADMIN USER PERMISSIONS (Full Access)
-- ============================================================================

-- Grant full permissions on all current tables
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO admin;

-- Grant permissions on sequences
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO admin;

-- Grant permissions for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO admin;

-- Grant specific auth table permissions
GRANT SELECT, UPDATE ON auth.users TO admin;

-- ============================================================================
-- FUNCTION PERMISSIONS
-- ============================================================================

-- Grant execute permissions on functions to blog_system
GRANT EXECUTE ON FUNCTION update_updated_at_column() TO blog_system;
GRANT EXECUTE ON FUNCTION notify_admin_new_comment() TO blog_system;
GRANT EXECUTE ON FUNCTION soft_delete() TO blog_system;

-- Grant execute permissions on functions to admin
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO admin;

-- ============================================================================
-- VIEW PERMISSIONS
-- ============================================================================

-- Grant select permissions on views to blog_system
GRANT SELECT ON published_post_with_tags TO blog_system;
GRANT SELECT ON daily_analytics TO blog_system;
GRANT SELECT ON contact_analytics TO blog_system;
GRANT SELECT ON post_performance TO blog_system;

-- Grant permissions on new tables
GRANT SELECT, INSERT, UPDATE ON filter_keyword TO blog_system;
GRANT SELECT, INSERT, UPDATE ON search_history TO blog_system;

-- Grant select permissions on views to admin
GRANT SELECT ON ALL TABLES IN SCHEMA public TO admin; -- This includes views

-- ============================================================================
-- SECURITY CONSIDERATIONS
-- ============================================================================

-- Ensure blog_system cannot access sensitive auth data
REVOKE ALL ON auth.users FROM blog_system;
GRANT SELECT (id, email, created_at, updated_at) ON auth.users TO blog_system;

-- Ensure blog_system cannot delete any records (double-check)
DO $$
DECLARE
    table_name text;
BEGIN
    FOR table_name IN 
        SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    LOOP
        EXECUTE format('REVOKE DELETE ON %I FROM blog_system', table_name);
    END LOOP;
END $$;

-- ============================================================================
-- MONITORING AND AUDITING
-- ============================================================================

-- Create audit log table (optional, for tracking database changes)
CREATE TABLE IF NOT EXISTS audit_log (
    id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    table_name VARCHAR(100) NOT NULL,
    operation VARCHAR(10) NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    old_values JSONB,
    new_values JSONB,
    user_id VARCHAR(64),
    database_user VARCHAR(100) DEFAULT current_user,
    performed_at TIMESTAMPTZ DEFAULT NOW(),
    ip_address INET
);

-- Create audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO audit_log (table_name, operation, old_values, database_user)
        VALUES (TG_TABLE_NAME, TG_OP, row_to_json(OLD), current_user);
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_log (table_name, operation, old_values, new_values, database_user)
        VALUES (TG_TABLE_NAME, TG_OP, row_to_json(OLD), row_to_json(NEW), current_user);
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO audit_log (table_name, operation, new_values, database_user)
        VALUES (TG_TABLE_NAME, TG_OP, row_to_json(NEW), current_user);
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply audit triggers to sensitive tables (optional)
-- Uncomment the following lines if you want to enable auditing

-- CREATE TRIGGER audit_user_changes
--     AFTER INSERT OR UPDATE OR DELETE ON "user"
--     FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- CREATE TRIGGER audit_post_changes
--     AFTER INSERT OR UPDATE OR DELETE ON post
--     FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- CREATE TRIGGER audit_comment_changes
--     AFTER INSERT OR UPDATE OR DELETE ON comment
--     FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify permissions for blog_system user
-- Run these queries to check if permissions are correctly set:

/*
-- Check table permissions
SELECT 
    grantee, 
    table_name, 
    privilege_type 
FROM information_schema.role_table_grants 
WHERE grantee = 'blog_system' 
ORDER BY table_name, privilege_type;

-- Check sequence permissions
SELECT 
    grantee, 
    object_name, 
    privilege_type 
FROM information_schema.role_usage_grants 
WHERE grantee = 'blog_system' 
  AND object_type = 'SEQUENCE';

-- Check function permissions
SELECT 
    grantee,
    routine_name,
    privilege_type
FROM information_schema.role_routine_grants
WHERE grantee = 'blog_system';
*/

-- ============================================================================
-- USAGE INSTRUCTIONS
-- ============================================================================

/*
1. Run this script in Supabase SQL Editor as postgres user
2. Update the passwords for blog_system and admin users
3. Update your application configuration to use blog_system user for database connections
4. Use admin user only for maintenance and admin operations
5. Store passwords securely (use environment variables)

Connection strings format:
- Blog System: postgresql://blog_system:password@host:port/database
- Admin: postgresql://admin:password@host:port/database

Environment variables example:
DATABASE_URL_BLOG_SYSTEM=postgresql://blog_system:your_password@your_host:5432/postgres
DATABASE_URL_ADMIN=postgresql://admin:your_password@your_host:5432/postgres
*/