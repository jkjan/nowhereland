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

-- Insert admin user for testing
INSERT INTO "user" (id, username, email, is_admin) VALUES 
    ('admin', 'admin', 'admin@nowhereland.com', TRUE)
ON CONFLICT (username) DO NOTHING;

-- Insert default fixed tags
INSERT INTO fixed_tag (id, name, color) VALUES 
    (gen_random_uuid()::text, 'dev', '#D01C1F'),
    (gen_random_uuid()::text, 'beer', '#FF8200')
ON CONFLICT (name) DO NOTHING;