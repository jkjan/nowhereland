-- Function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    admin_exists_count INTEGER;
    new_user_id TEXT;
BEGIN
    -- Generate UUIDv7 for user
    new_user_id := gen_random_uuid()::text;
    
    -- Log that the trigger is firing
    RAISE LOG 'Trigger handle_new_user firing for user: %', NEW.email;
    
    -- Check if any admin already exists
    SELECT COUNT(*) INTO admin_exists_count 
    FROM public."user" 
    WHERE is_admin = true AND is_deleted = false;
    
    RAISE LOG 'Admin exists count: %', admin_exists_count;
    
    -- Insert into public.user table
    INSERT INTO public."user" (
        id,
        auth_user_id,
        username,
        email,
        display_name,
        is_admin,
        is_active
    ) VALUES (
        new_user_id,
        NEW.id,
        split_part(NEW.email, '@', 1), -- Use email prefix as username
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
        CASE WHEN admin_exists_count = 0 THEN true ELSE false END,
        CASE WHEN admin_exists_count = 0 THEN true ELSE false END  -- Auto-activate if first user (admin)
    );
    
    RAISE LOG 'Successfully created user record for: %', NEW.email;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Error in handle_new_user trigger: %', SQLERRM;
        -- Don't fail the auth user creation, just log the error
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signups
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();