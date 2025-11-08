-- Migration script to convert code-specific agents to role-based agents
-- This script:
-- 1. Keeps the orchestration agent unchanged
-- 2. Removes business_rule, client_script, script_include entries
-- 3. Adds 8 new role-based agents: planner, coder, architect, process_sme (each with large and small variants)
-- 4. Sets all new agents to Claude Sonnet 4 as default

-- Delete old code-specific agents (keeping orchestration)
DELETE FROM "agent_models"
WHERE agent_name IN ('business_rule', 'client_script', 'script_include');

-- For each existing user, add the 8 new agents with default Claude Sonnet 4 model
INSERT INTO "agent_models" (user_id, agent_name, model_name)
SELECT DISTINCT user_id, 'planner_large', 'anthropic/claude-sonnet-4'
FROM "agent_models"
WHERE agent_name = 'orchestration'
ON CONFLICT (user_id, agent_name) DO NOTHING;

INSERT INTO "agent_models" (user_id, agent_name, model_name)
SELECT DISTINCT user_id, 'planner_small', 'anthropic/claude-sonnet-4'
FROM "agent_models"
WHERE agent_name = 'orchestration'
ON CONFLICT (user_id, agent_name) DO NOTHING;

INSERT INTO "agent_models" (user_id, agent_name, model_name)
SELECT DISTINCT user_id, 'coder_large', 'anthropic/claude-sonnet-4'
FROM "agent_models"
WHERE agent_name = 'orchestration'
ON CONFLICT (user_id, agent_name) DO NOTHING;

INSERT INTO "agent_models" (user_id, agent_name, model_name)
SELECT DISTINCT user_id, 'coder_small', 'anthropic/claude-sonnet-4'
FROM "agent_models"
WHERE agent_name = 'orchestration'
ON CONFLICT (user_id, agent_name) DO NOTHING;

INSERT INTO "agent_models" (user_id, agent_name, model_name)
SELECT DISTINCT user_id, 'architect_large', 'anthropic/claude-sonnet-4'
FROM "agent_models"
WHERE agent_name = 'orchestration'
ON CONFLICT (user_id, agent_name) DO NOTHING;

INSERT INTO "agent_models" (user_id, agent_name, model_name)
SELECT DISTINCT user_id, 'architect_small', 'anthropic/claude-sonnet-4'
FROM "agent_models"
WHERE agent_name = 'orchestration'
ON CONFLICT (user_id, agent_name) DO NOTHING;

INSERT INTO "agent_models" (user_id, agent_name, model_name)
SELECT DISTINCT user_id, 'process_sme_large', 'anthropic/claude-sonnet-4'
FROM "agent_models"
WHERE agent_name = 'orchestration'
ON CONFLICT (user_id, agent_name) DO NOTHING;

INSERT INTO "agent_models" (user_id, agent_name, model_name)
SELECT DISTINCT user_id, 'process_sme_small', 'anthropic/claude-sonnet-4'
FROM "agent_models"
WHERE agent_name = 'orchestration'
ON CONFLICT (user_id, agent_name) DO NOTHING;

-- Update agent_prompts table with new agents (only if table exists)
-- This is optional as the table may not exist yet
DO $$
BEGIN
  -- Check if agent_prompts table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'agent_prompts') THEN
    -- Delete old code-specific agent prompts
    DELETE FROM "agent_prompts"
    WHERE agent_name IN ('business_rule', 'client_script', 'script_include');

    -- Insert placeholder prompts for new agents (user will populate these)
    INSERT INTO "agent_prompts" (agent_name, prompt_type, prompt_content, is_active)
    VALUES
      ('planner_large', 'system', 'You are an expert planner agent designed for complex strategic planning tasks.', TRUE),
      ('planner_small', 'system', 'You are a planner agent designed for well-defined planning tasks.', TRUE),
      ('coder_large', 'system', 'You are an expert code generation agent designed for complex coding tasks.', TRUE),
      ('coder_small', 'system', 'You are a code generation agent designed for simple coding tasks.', TRUE),
      ('architect_large', 'system', 'You are an expert architect agent designed for complex system architecture design.', TRUE),
      ('architect_small', 'system', 'You are an architect agent designed for well-defined architecture tasks.', TRUE),
      ('process_sme_large', 'system', 'You are an expert process subject matter expert for complex workflow analysis.', TRUE),
      ('process_sme_small', 'system', 'You are a process subject matter expert for straightforward process questions.', TRUE)
    ON CONFLICT (agent_name, prompt_type) DO NOTHING;

    RAISE NOTICE 'agent_prompts table updated with new agent entries.';
  ELSE
    RAISE NOTICE 'agent_prompts table does not exist yet. Skipping prompt updates. Run create-agent-prompts-table.sql first if you need prompt management.';
  END IF;
END;
$$;
