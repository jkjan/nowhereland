-- Function to sync user metadata to JWT token
CREATE OR REPLACE FUNCTION sync_user_metadata_to_jwt()
RETURNS TRIGGER AS $$
DECLARE
    user_rec RECORD;
BEGIN
    -- Get the user record (works for both INSERT and UPDATE)
    IF TG_OP = 'DELETE' THEN
        user_rec := OLD;
    ELSE
        user_rec := NEW;
    END IF;

    -- Update auth.users raw_app_meta_data with user info
    UPDATE auth.users
    SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object(
        'is_admin', user_rec.is_admin,
        'is_active', user_rec.is_active,
        'display_name', user_rec.display_name,
        'username', user_rec.username
    )
    WHERE id = user_rec.auth_user_id;

    -- For DELETE operations, we might want to clear the metadata
    IF TG_OP = 'DELETE' THEN
        UPDATE auth.users
        SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) - 'is_admin' - 'is_active' - 'display_name' - 'username'
        WHERE id = user_rec.auth_user_id;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS sync_user_metadata_on_insert ON public."user";
DROP TRIGGER IF EXISTS sync_user_metadata_on_update ON public."user";
DROP TRIGGER IF EXISTS sync_user_metadata_on_delete ON public."user";

-- Create triggers to sync metadata when user table changes
CREATE TRIGGER sync_user_metadata_on_insert
    AFTER INSERT ON public."user"
    FOR EACH ROW
    EXECUTE FUNCTION sync_user_metadata_to_jwt();

CREATE TRIGGER sync_user_metadata_on_update
    AFTER UPDATE ON public."user"
    FOR EACH ROW
    EXECUTE FUNCTION sync_user_metadata_to_jwt();

CREATE TRIGGER sync_user_metadata_on_delete
    AFTER DELETE ON public."user"
    FOR EACH ROW
    EXECUTE FUNCTION sync_user_metadata_to_jwt();

-- Sync existing user data to JWT metadata
UPDATE auth.users
SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object(
    'is_admin', u.is_admin,
    'is_active', u.is_active,
    'display_name', u.display_name,
    'username', u.username
)
FROM public."user" u
WHERE auth.users.id = u.auth_user_id;