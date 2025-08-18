-- Migration script to create agent_prompts table for storing AI agent prompts
-- This script creates the agent_prompts table for flexible prompt management

-- Create agent_prompts table
CREATE TABLE IF NOT EXISTS "agent_prompts" (
    id SERIAL PRIMARY KEY,
    agent_name VARCHAR(100) NOT NULL,
    prompt_type VARCHAR(50) NOT NULL DEFAULT 'system',
    prompt_content TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(agent_name, prompt_type)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_agent_prompts_agent_name ON "agent_prompts"(agent_name);
CREATE INDEX IF NOT EXISTS idx_agent_prompts_agent_type ON "agent_prompts"(agent_name, prompt_type);
CREATE INDEX IF NOT EXISTS idx_agent_prompts_active ON "agent_prompts"(is_active);

-- Add helpful comments
COMMENT ON TABLE "agent_prompts" IS 'Stores AI agent prompts for flexible prompt management and future customization';
COMMENT ON COLUMN "agent_prompts"."agent_name" IS 'Name of the AI agent (orchestration, business_rule, client_script, etc.)';
COMMENT ON COLUMN "agent_prompts"."prompt_type" IS 'Type of prompt (system, base, etc.) for potential future prompt variations';
COMMENT ON COLUMN "agent_prompts"."prompt_content" IS 'The actual prompt text content for the agent';
COMMENT ON COLUMN "agent_prompts"."is_active" IS 'Flag for prompt versioning and activation control';

-- Log successful creation
DO $$
BEGIN
    -- Check if agent_prompts table was created successfully
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'agent_prompts') THEN
        RAISE NOTICE 'agent_prompts table created successfully!';
        RAISE NOTICE 'Table is ready for prompt seeding.';
    ELSE
        RAISE EXCEPTION 'Failed to create agent_prompts table.';
    END IF;
END;
$$;