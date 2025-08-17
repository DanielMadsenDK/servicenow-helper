-- Migration script to implement multi-agent AI model configuration
-- This script creates the agent_models table and migrates existing user settings

-- Create agent_models table
CREATE TABLE IF NOT EXISTS "agent_models" (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    agent_name VARCHAR(100) NOT NULL,
    model_name VARCHAR(500) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, agent_name)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_agent_models_user_id ON "agent_models"(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_models_agent_name ON "agent_models"(agent_name);
CREATE INDEX IF NOT EXISTS idx_agent_models_user_agent ON "agent_models"(user_id, agent_name);

-- Function to migrate existing default_ai_model settings to agent models
CREATE OR REPLACE FUNCTION migrate_user_to_agent_models(user_id_param TEXT, default_model TEXT)
RETURNS INTEGER AS $$
DECLARE
    inserted_count INTEGER := 0;
BEGIN
    -- Insert default agents for this user with their current default model
    INSERT INTO "agent_models" (user_id, agent_name, model_name, created_at, updated_at)
    VALUES 
        (user_id_param, 'orchestration', default_model, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (user_id_param, 'business_rule', default_model, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (user_id_param, 'client_script', default_model, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT (user_id, agent_name) DO NOTHING;
    
    GET DIAGNOSTICS inserted_count = ROW_COUNT;
    RETURN inserted_count;
END;
$$ LANGUAGE plpgsql;

-- Migrate existing users from default_ai_model to agent models
DO $$
DECLARE
    user_record RECORD;
    default_model TEXT;
    total_users INTEGER := 0;
    total_migrated INTEGER := 0;
    agents_inserted INTEGER;
BEGIN
    RAISE NOTICE 'Starting migration to agent models...';
    
    -- Check if agent_models table was created successfully
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'agent_models') THEN
        RAISE EXCEPTION 'agent_models table does not exist. Migration failed.';
    END IF;
    
    -- Loop through all users who have a default_ai_model setting
    FOR user_record IN 
        SELECT user_id, setting_value 
        FROM "user_settings" 
        WHERE setting_key = 'default_ai_model'
    LOOP
        total_users := total_users + 1;
        
        -- Parse the default model (remove quotes if JSON string)
        default_model := trim(both '"' from user_record.setting_value);
        
        -- If model is empty or null, use a sensible default
        IF default_model IS NULL OR default_model = '' OR default_model = 'null' THEN
            default_model := 'anthropic/claude-sonnet-4';
        END IF;
        
        -- Migrate this user to agent models
        SELECT migrate_user_to_agent_models(user_record.user_id, default_model) INTO agents_inserted;
        
        IF agents_inserted > 0 THEN
            total_migrated := total_migrated + 1;
            RAISE NOTICE 'Migrated user % to agent models with model: %', user_record.user_id, default_model;
        ELSE
            RAISE NOTICE 'User % already has agent models, skipping...', user_record.user_id;
        END IF;
    END LOOP;
    
    -- Also set up default agents for users who don't have default_ai_model setting
    FOR user_record IN 
        SELECT DISTINCT user_id 
        FROM "user_settings" 
        WHERE user_id NOT IN (
            SELECT user_id FROM "user_settings" WHERE setting_key = 'default_ai_model'
        )
    LOOP
        total_users := total_users + 1;
        
        -- Use default model for users without explicit setting
        SELECT migrate_user_to_agent_models(user_record.user_id, 'anthropic/claude-sonnet-4') INTO agents_inserted;
        
        IF agents_inserted > 0 THEN
            total_migrated := total_migrated + 1;
            RAISE NOTICE 'Set up default agent models for user: %', user_record.user_id;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Agent models migration completed!';
    RAISE NOTICE 'Summary: % users processed, % users migrated to agent models', total_users, total_migrated;
END;
$$;

-- Clean up the temporary function
DROP FUNCTION IF EXISTS migrate_user_to_agent_models(TEXT, TEXT);

-- Add helpful comments
COMMENT ON TABLE "agent_models" IS 'Maps AI agents to specific models for each user (orchestration, business_rule, client_script, etc.)';
COMMENT ON COLUMN "agent_models"."agent_name" IS 'Name of the AI agent (orchestration, business_rule, client_script, etc.)';
COMMENT ON COLUMN "agent_models"."model_name" IS 'The AI model assigned to this agent (e.g., anthropic/claude-sonnet-4)';