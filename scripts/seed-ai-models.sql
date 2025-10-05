-- AI Models Seeding Script
-- This script seeds default AI models for users who don't have any models yet

-- Function to seed AI models for a specific user
CREATE OR REPLACE FUNCTION seed_ai_models_for_user(user_id_param TEXT)
RETURNS INTEGER AS $$
DECLARE
    models_count INTEGER;
    inserted_count INTEGER := 0;
    openrouter_id INTEGER;
BEGIN
    -- Check if user already has AI models
    SELECT COUNT(*) INTO models_count
    FROM "ai_models"
    WHERE user_id = user_id_param;

    -- If user already has models, skip seeding
    IF models_count > 0 THEN
        RETURN 0;
    END IF;

    -- Get OpenRouter provider ID (default provider for all models)
    SELECT id INTO openrouter_id FROM "providers" WHERE name = 'openrouter' LIMIT 1;

    IF openrouter_id IS NULL THEN
        RAISE WARNING 'OpenRouter provider not found. Models will be created without provider_id. Please run seed-providers.sql first.';
    END IF;

    -- Insert default models for this user with OpenRouter as the provider
    IF openrouter_id IS NOT NULL THEN
        -- Insert with provider_id if column exists
        INSERT INTO "ai_models" (user_id, model_name, display_name, is_free, is_default, provider_id, created_at, updated_at)
        VALUES
            (user_id_param, 'anthropic/claude-sonnet-4', 'Claude Sonnet 4', false, true, openrouter_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
            (user_id_param, 'anthropic/claude-opus-4', 'Claude Opus 4', false, false, openrouter_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
            (user_id_param, 'deepseek/deepseek-chat-v3-0324:free', 'DeepSeek V3', true, false, openrouter_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
            (user_id_param, 'openai/gpt-4.1-mini', 'GPT 4.1 Mini', false, false, openrouter_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
            (user_id_param, 'openai/gpt-4.1', 'GPT 4.1', false, false, openrouter_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT (user_id, model_name) DO NOTHING;
    ELSE
        -- Fallback: Insert without provider_id (for backward compatibility)
        INSERT INTO "ai_models" (user_id, model_name, display_name, is_free, is_default, created_at, updated_at)
        VALUES
            (user_id_param, 'anthropic/claude-sonnet-4', 'Claude Sonnet 4', false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
            (user_id_param, 'anthropic/claude-opus-4', 'Claude Opus 4', false, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
            (user_id_param, 'deepseek/deepseek-chat-v3-0324:free', 'DeepSeek V3', true, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
            (user_id_param, 'openai/gpt-4.1-mini', 'GPT 4.1 Mini', false, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
            (user_id_param, 'openai/gpt-4.1', 'GPT 4.1', false, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT (user_id, model_name) DO NOTHING;
    END IF;

    GET DIAGNOSTICS inserted_count = ROW_COUNT;
    RETURN inserted_count;
END;
$$ LANGUAGE plpgsql;

-- Seed AI models for all users who don't have any models yet
DO $$
DECLARE
    user_record RECORD;
    total_users INTEGER := 0;
    total_seeded INTEGER := 0;
    models_inserted INTEGER;
BEGIN
    RAISE NOTICE 'Starting AI models seeding...';
    
    -- Check if ai_models table exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_models') THEN
        RAISE NOTICE 'ai_models table does not exist. Skipping seeding.';
        RETURN;
    END IF;
    
    -- Loop through all users in user_settings table
    FOR user_record IN 
        SELECT DISTINCT user_id FROM "user_settings"
    LOOP
        total_users := total_users + 1;
        
        -- Seed models for this user
        SELECT seed_ai_models_for_user(user_record.user_id) INTO models_inserted;
        
        IF models_inserted > 0 THEN
            total_seeded := total_seeded + 1;
            RAISE NOTICE 'Seeded % AI models for user: %', models_inserted, user_record.user_id;
        ELSE
            RAISE NOTICE 'User % already has AI models, skipping...', user_record.user_id;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'AI models seeding completed!';
    RAISE NOTICE 'Summary: % users processed, % users seeded with AI models', total_users, total_seeded;
END;
$$;

-- Keep the function available for dynamic seeding (don't drop it)
-- This allows the application to call it when a new user logs in
COMMENT ON FUNCTION seed_ai_models_for_user(TEXT) IS 'Seeds default AI models for a user if they have none';