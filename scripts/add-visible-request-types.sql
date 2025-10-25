-- Migration script to add visible_request_types setting for existing users
-- This script ensures all users have the visible_request_types setting with default values

DO $$
DECLARE
    user_record RECORD;
    total_users INTEGER := 0;
    users_updated INTEGER := 0;
    default_visible_types TEXT := '["recommendation","script","troubleshoot","ai-agent","ai-skill"]';
BEGIN
    RAISE NOTICE 'Starting visible_request_types migration...';

    -- Check if user_settings table exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_settings') THEN
        RAISE EXCEPTION 'user_settings table does not exist. Migration failed.';
    END IF;

    -- Get all distinct users from user_settings table
    FOR user_record IN
        SELECT DISTINCT user_id
        FROM "user_settings"
    LOOP
        total_users := total_users + 1;

        -- Check if user already has visible_request_types setting
        IF NOT EXISTS (
            SELECT 1 FROM "user_settings"
            WHERE user_id = user_record.user_id
            AND setting_key = 'visible_request_types'
        ) THEN
            -- Insert default visible_request_types for this user
            INSERT INTO "user_settings" (user_id, setting_key, setting_value, created_at, updated_at)
            VALUES (
                user_record.user_id,
                'visible_request_types',
                default_visible_types,
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            );

            users_updated := users_updated + 1;
            RAISE NOTICE 'Added visible_request_types for user: %', user_record.user_id;
        ELSE
            RAISE NOTICE 'User % already has visible_request_types setting, skipping...', user_record.user_id;
        END IF;
    END LOOP;

    RAISE NOTICE 'Visible request types migration completed!';
    RAISE NOTICE 'Summary: % users processed, % users updated with default visible_request_types', total_users, users_updated;

    -- If no users exist yet, that's fine - new users will get defaults from the application
    IF total_users = 0 THEN
        RAISE NOTICE 'No existing users found. New users will automatically receive default visible_request_types.';
    END IF;
END;
$$;

-- Add helpful comment
COMMENT ON TABLE "user_settings" IS 'Stores user-specific settings as key-value pairs. Supports visible_request_types as JSON array for controlling which request modes are visible in the UI.';
