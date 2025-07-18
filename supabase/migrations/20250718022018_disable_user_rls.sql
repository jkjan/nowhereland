-- Disable RLS on user table to avoid infinite recursion
-- Security will be handled at application level

-- Drop all policies
DROP POLICY IF EXISTS "Enable read for users based on user_id" ON public."user";
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public."user";
DROP POLICY IF EXISTS "Enable insert for service role" ON public."user";
DROP POLICY IF EXISTS "Enable delete for admins" ON public."user";

-- Drop the function
DROP FUNCTION IF EXISTS public.is_admin();

-- Disable RLS completely
ALTER TABLE public."user" DISABLE ROW LEVEL SECURITY;