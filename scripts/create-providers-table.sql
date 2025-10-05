-- Enhanced Providers Table Migration Script
-- This script creates the providers table with enhanced fields for production-ready multi-provider support

-- Create providers table with enhanced schema
CREATE TABLE IF NOT EXISTS "providers" (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,                    -- Internal provider name (e.g., 'openrouter', 'huggingface')
    display_name VARCHAR(100) NOT NULL,                  -- Human-readable name (e.g., 'OpenRouter', 'Hugging Face')
    endpoint TEXT NOT NULL,                              -- Base endpoint for N8N webhook calls
    is_active BOOLEAN NOT NULL DEFAULT true,            -- Allow enabling/disabling providers
    priority INTEGER DEFAULT 0,                         -- For sorting and default selection (higher = first)
    rate_limit_per_minute INTEGER,                       -- Optional rate limiting information
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_providers_active ON "providers"(is_active, priority DESC);
CREATE INDEX IF NOT EXISTS idx_providers_name ON "providers"(name);

-- Add helpful comments for documentation
COMMENT ON TABLE "providers" IS 'AI service providers configuration table for multi-provider support';
COMMENT ON COLUMN "providers"."name" IS 'Internal provider identifier (lowercase, no spaces) - used for API key environment variable: {NAME}_API_KEY';
COMMENT ON COLUMN "providers"."display_name" IS 'Human-readable provider name shown in UI';
COMMENT ON COLUMN "providers"."endpoint" IS 'Base endpoint for N8N webhook integration';
COMMENT ON COLUMN "providers"."is_active" IS 'Whether this provider is available for selection';
COMMENT ON COLUMN "providers"."priority" IS 'Display order priority (higher values appear first)';
COMMENT ON COLUMN "providers"."rate_limit_per_minute" IS 'Optional rate limiting information for this provider';

-- Log successful creation
DO $$
BEGIN
    RAISE NOTICE 'Providers table created successfully with enhanced schema';
    RAISE NOTICE 'Table includes: name, display_name, endpoint, is_active, priority, rate_limit_per_minute';
    RAISE NOTICE 'API keys should be configured as environment variables using the pattern: {PROVIDER_NAME}_API_KEY';
    RAISE NOTICE 'Indexes created: idx_providers_active, idx_providers_name';
END $$;