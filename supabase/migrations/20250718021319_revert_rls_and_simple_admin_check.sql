-- Revert RLS policies and just disable RLS for simplicity
-- Only implement simple admin check in application logic

-- Drop the policies I created
DROP POLICY IF EXISTS "Users can read own record" ON public."user";
DROP POLICY IF EXISTS "Users can update own record" ON public."user";
DROP POLICY IF EXISTS "Service role can read all" ON public."user";
DROP POLICY IF EXISTS "Service role can modify all" ON public."user";
DROP POLICY IF EXISTS "Authenticated can read basic info" ON public."user";

-- Disable RLS completely to avoid recursion issues
ALTER TABLE public."user" DISABLE ROW LEVEL SECURITY;