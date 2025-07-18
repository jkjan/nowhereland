-- Fix RLS policies for user table to prevent infinite recursion

-- Drop any existing policies that might cause recursion
DROP POLICY IF EXISTS "Users can read their own data" ON public."user";
DROP POLICY IF EXISTS "Users can update their own data" ON public."user";
DROP POLICY IF EXISTS "Admin can read all users" ON public."user";
DROP POLICY IF EXISTS "Admin can update all users" ON public."user";

-- Disable RLS temporarily to avoid recursion during setup
ALTER TABLE public."user" DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE public."user" ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies

-- Allow users to read their own record based on auth.uid()
CREATE POLICY "Users can read own record" ON public."user"
    FOR SELECT
    USING (auth_user_id = auth.uid());

-- Allow users to update their own record based on auth.uid()  
CREATE POLICY "Users can update own record" ON public."user"
    FOR UPDATE
    USING (auth_user_id = auth.uid());

-- Allow service role to read all (for admin functions)
CREATE POLICY "Service role can read all" ON public."user"
    FOR SELECT
    USING (auth.role() = 'service_role');

-- Allow service role to insert/update/delete (for triggers and admin functions)
CREATE POLICY "Service role can modify all" ON public."user"
    FOR ALL
    USING (auth.role() = 'service_role');

-- Allow authenticated users to read basic user info (for admin checks)
CREATE POLICY "Authenticated can read basic info" ON public."user"
    FOR SELECT
    USING (auth.role() = 'authenticated');