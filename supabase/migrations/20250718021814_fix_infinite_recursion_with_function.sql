-- Fix infinite recursion by dropping problematic policies and creating simple ones

-- Drop all existing policies
DROP POLICY IF EXISTS "Admin can read all users" ON public."user";
DROP POLICY IF EXISTS "Users can read own data" ON public."user";
DROP POLICY IF EXISTS "Admin can update all users" ON public."user";
DROP POLICY IF EXISTS "Users can update own data" ON public."user";
DROP POLICY IF EXISTS "Service role full access" ON public."user";

-- Create a simple function to check if current user is admin (without recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public."user" WHERE auth_user_id = auth.uid() LIMIT 1),
    false
  );
$$;

-- Simple policies using the function
CREATE POLICY "Enable read for users based on user_id" ON public."user"
    FOR SELECT
    USING (
        auth_user_id = auth.uid() 
        OR public.is_admin() = true
        OR auth.role() = 'service_role'
    );

CREATE POLICY "Enable update for users based on user_id" ON public."user"
    FOR UPDATE
    USING (
        auth_user_id = auth.uid() 
        OR public.is_admin() = true
        OR auth.role() = 'service_role'
    );

CREATE POLICY "Enable insert for service role" ON public."user"
    FOR INSERT
    WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Enable delete for admins" ON public."user"
    FOR DELETE
    USING (
        public.is_admin() = true
        OR auth.role() = 'service_role'
    );