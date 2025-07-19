-- Restore proper RLS policies
-- Admin users (is_admin = true) should see all user data
-- Regular users should only see their own data

-- Re-enable RLS
ALTER TABLE public."user" ENABLE ROW LEVEL SECURITY;

-- Policy: Admin users can see all user data
CREATE POLICY "Admin can read all users" ON public."user"
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public."user" admin_user 
            WHERE admin_user.auth_user_id = auth.uid() 
            AND admin_user.is_admin = true
        )
    );

-- Policy: Users can read their own data
CREATE POLICY "Users can read own data" ON public."user"
    FOR SELECT
    USING (auth_user_id = auth.uid());

-- Policy: Admin users can update all user data
CREATE POLICY "Admin can update all users" ON public."user"
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public."user" admin_user 
            WHERE admin_user.auth_user_id = auth.uid() 
            AND admin_user.is_admin = true
        )
    );

-- Policy: Users can update their own data
CREATE POLICY "Users can update own data" ON public."user"
    FOR UPDATE
    USING (auth_user_id = auth.uid());

-- Policy: Service role can do everything (for triggers)
CREATE POLICY "Service role full access" ON public."user"
    FOR ALL
    USING (auth.role() = 'service_role');