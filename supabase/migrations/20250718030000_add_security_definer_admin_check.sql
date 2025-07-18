-- Create security definer function to check admin existence
-- This function bypasses RLS to avoid circular dependency issues

CREATE OR REPLACE FUNCTION public.check_admin_exists()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with creator's privileges (bypasses RLS)
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public."user" 
    WHERE is_admin = true
    LIMIT 1
  );
END;
$$;

-- Grant execute permission to authenticated and anonymous users
GRANT EXECUTE ON FUNCTION public.check_admin_exists() TO authenticated, anon;

-- Re-enable RLS on user table
ALTER TABLE public."user" ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies for the user table
-- Policy for users to read their own data
CREATE POLICY "Users can read their own data" ON public."user"
  FOR SELECT 
  TO authenticated
  USING (auth.uid() = auth_user_id);

-- Policy for users to update their own data
CREATE POLICY "Users can update their own data" ON public."user"
  FOR UPDATE 
  TO authenticated
  USING (auth.uid() = auth_user_id);

-- Policy for admin to read all user data
CREATE POLICY "Admin can read all user data" ON public."user"
  FOR SELECT 
  TO authenticated
  USING ((auth.jwt() ->> 'is_admin')::boolean = true);

-- Policy for admin to update all user data
CREATE POLICY "Admin can update all user data" ON public."user"
  FOR UPDATE 
  TO authenticated
  USING ((auth.jwt() ->> 'is_admin')::boolean = true);

-- Policy for admin to delete user data
CREATE POLICY "Admin can delete user data" ON public."user"
  FOR DELETE 
  TO authenticated
  USING ((auth.jwt() ->> 'is_admin')::boolean = true);