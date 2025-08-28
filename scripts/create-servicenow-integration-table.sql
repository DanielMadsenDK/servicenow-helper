-- Migration script to create ServiceNow integration queue table
-- This script creates the servicenow_integration_queue table for managing integration payloads

-- Create servicenow_integration_queue table
CREATE TABLE IF NOT EXISTS "servicenow_integration_queue" (
    id SERIAL PRIMARY KEY,
    payload TEXT NOT NULL,
    correlation_id UUID DEFAULT gen_random_uuid() NOT NULL,
    type VARCHAR(100) NOT NULL,
    target_table VARCHAR(255) NOT NULL,
    state VARCHAR(50) DEFAULT 'new' NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_servicenow_integration_queue_correlation_id ON "servicenow_integration_queue"(correlation_id);
CREATE INDEX IF NOT EXISTS idx_servicenow_integration_queue_state ON "servicenow_integration_queue"(state);
CREATE INDEX IF NOT EXISTS idx_servicenow_integration_queue_type ON "servicenow_integration_queue"(type);
CREATE INDEX IF NOT EXISTS idx_servicenow_integration_queue_target_table ON "servicenow_integration_queue"(target_table);
CREATE INDEX IF NOT EXISTS idx_servicenow_integration_queue_created_at ON "servicenow_integration_queue"(created_at);
CREATE INDEX IF NOT EXISTS idx_servicenow_integration_queue_state_type ON "servicenow_integration_queue"(state, type);

-- Add helpful comments
COMMENT ON TABLE "servicenow_integration_queue" IS 'Queue table for managing ServiceNow integration payloads with correlation tracking';
COMMENT ON COLUMN "servicenow_integration_queue"."payload" IS 'JSON or text payload containing the data to be processed';
COMMENT ON COLUMN "servicenow_integration_queue"."correlation_id" IS 'Auto-generated UUID for tracking and correlating integration requests';
COMMENT ON COLUMN "servicenow_integration_queue"."type" IS 'Type of integration operation (e.g., create, update, delete)';
COMMENT ON COLUMN "servicenow_integration_queue"."target_table" IS 'Target ServiceNow table for the integration payload';
COMMENT ON COLUMN "servicenow_integration_queue"."state" IS 'Processing state of the integration (new, processing, completed, failed)';

-- Log successful creation
DO $$
BEGIN
    -- Check if servicenow_integration_queue table was created successfully
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'servicenow_integration_queue') THEN
        RAISE NOTICE 'servicenow_integration_queue table created successfully!';
        RAISE NOTICE 'Table includes auto-generated UUID correlation_id and default state of "new"';
        RAISE NOTICE 'Performance indexes created for: correlation_id, state, type, target_table, created_at, and composite state+type';
    ELSE
        RAISE EXCEPTION 'Failed to create servicenow_integration_queue table.';
    END IF;
END;
$$;