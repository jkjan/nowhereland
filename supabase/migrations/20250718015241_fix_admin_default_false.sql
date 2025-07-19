-- Fix the trigger to NEVER automatically set is_admin = true
-- Only you should manually set is_admin = true for yourself
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_user_id TEXT;
BEGIN
    -- Generate UUIDv7 for user
    new_user_id := gen_random_uuid()::text;
    
    -- Log that the trigger is firing
    RAISE LOG 'Trigger handle_new_user firing for user: %', NEW.email;
    
    -- Insert into public.user table with is_admin = false ALWAYS
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
        false, -- ALWAYS false - admin must be set manually
        false  -- Not active until manually approved
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