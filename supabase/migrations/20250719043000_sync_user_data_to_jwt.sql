-- Create index on user email for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_email ON public."user"(email);

-- Function to sync user data to JWT app_metadata
CREATE OR REPLACE FUNCTION sync_user_to_jwt()
RETURNS TRIGGER AS $$
BEGIN
    -- Update auth.users app_metadata with user table data (email only for security)
    UPDATE auth.users 
    SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object(
        'email', NEW.email,
        'is_admin', NEW.is_admin
    )
    WHERE id = NEW.auth_user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for syncing user data to JWT
DROP TRIGGER IF EXISTS sync_user_to_jwt_on_insert ON public."user";
CREATE TRIGGER sync_user_to_jwt_on_insert
    AFTER INSERT ON public."user"
    FOR EACH ROW EXECUTE FUNCTION sync_user_to_jwt();

DROP TRIGGER IF EXISTS sync_user_to_jwt_on_update ON public."user";
CREATE TRIGGER sync_user_to_jwt_on_update
    AFTER UPDATE ON public."user"
    FOR EACH ROW EXECUTE FUNCTION sync_user_to_jwt();

-- Update existing users' JWT metadata if any exist
DO $$
DECLARE
    user_record RECORD;
BEGIN
    FOR user_record IN SELECT * FROM public."user" LOOP
        UPDATE auth.users 
        SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object(
            'email', user_record.email,
            'is_admin', user_record.is_admin
        )
        WHERE id = user_record.auth_user_id;
    END LOOP;
END $$;