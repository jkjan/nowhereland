-- Login History Schema for Nowhere Land Blog
-- Simple structure using UUIDv7 and standard PostgreSQL types

-- Login History Table
CREATE TABLE IF NOT EXISTS public.login_history (
    id VARCHAR(64) PRIMARY KEY, -- UUIDv7 generated from backend
    user_id UUID NOT NULL REFERENCES auth.users(id), -- Match auth.users UUID type
    login_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ip_address_hash VARCHAR(64), -- Hashed IP for privacy
    user_agent TEXT,
    country_code VARCHAR(2), -- ISO country code
    city VARCHAR(100),
    is_suspicious BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_login_history_user_id ON public.login_history(user_id);
CREATE INDEX idx_login_history_login_time ON public.login_history(login_time DESC);
CREATE INDEX idx_login_history_suspicious ON public.login_history(is_suspicious) WHERE is_suspicious = true;

-- RLS Policies
ALTER TABLE public.login_history ENABLE ROW LEVEL SECURITY;

-- Admin can view all login history (using your actual user table)
CREATE POLICY "Admin can view all login history" 
ON public.login_history FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public."user" 
        WHERE "user".auth_user_id = auth.uid() 
        AND "user".is_admin = true
        AND "user".is_active = true
        AND "user".is_deleted = false
    )
);

-- System can insert login records
CREATE POLICY "System can insert login history" 
ON public.login_history FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Cleanup function (90 days retention)
CREATE OR REPLACE FUNCTION cleanup_login_history()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    DELETE FROM public.login_history 
    WHERE login_time < NOW() - INTERVAL '90 days';
END;
$$;