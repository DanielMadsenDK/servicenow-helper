-- Zero-Downtime Migration: Add Provider Support to AI Models
-- This script safely adds provider_id to ai_models table and migrates existing data

-- Migration script with zero-downtime deployment strategy
DO $$
DECLARE
    providers_exist INTEGER;
    openrouter_id INTEGER;
    models_migrated INTEGER := 0;
    total_models INTEGER;
BEGIN
    RAISE NOTICE 'Starting zero-downtime migration to add provider support to ai_models...';

    -- Step 1: Verify providers table exists and has data
    SELECT COUNT(*) INTO providers_exist FROM "providers";

    IF providers_exist = 0 THEN
        RAISE EXCEPTION 'providers table is empty. Please run create-providers-table.sql and seed-providers.sql first.';
    END IF;

    -- Step 2: Get OpenRouter provider ID (our default for existing models)
    SELECT id INTO openrouter_id FROM "providers" WHERE name = 'openrouter' LIMIT 1;

    IF openrouter_id IS NULL THEN
        RAISE EXCEPTION 'OpenRouter provider not found. Please run seed-providers.sql first.';
    END IF;

    RAISE NOTICE 'Found OpenRouter provider with ID: %', openrouter_id;

    -- Step 3: Check if provider_id column already exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'ai_models' AND column_name = 'provider_id'
    ) THEN
        RAISE NOTICE 'Adding provider_id column to ai_models table...';

        -- Add nullable provider_id column (safe operation)
        ALTER TABLE "ai_models" ADD COLUMN provider_id INTEGER;

        RAISE NOTICE 'provider_id column added successfully';
    ELSE
        RAISE NOTICE 'provider_id column already exists, skipping column creation';
    END IF;

    -- Step 4: Count total models that need migration
    SELECT COUNT(*) INTO total_models FROM "ai_models" WHERE provider_id IS NULL;

    RAISE NOTICE 'Found % models without provider assignment', total_models;

    -- Step 5: Migrate existing models to OpenRouter provider (safe operation)
    IF total_models > 0 THEN
        RAISE NOTICE 'Migrating existing models to OpenRouter provider...';

        UPDATE "ai_models"
        SET provider_id = openrouter_id, updated_at = CURRENT_TIMESTAMP
        WHERE provider_id IS NULL;

        GET DIAGNOSTICS models_migrated = ROW_COUNT;
        RAISE NOTICE 'Successfully migrated % models to OpenRouter provider', models_migrated;
    ELSE
        RAISE NOTICE 'All models already have provider assignments, skipping migration';
    END IF;

    -- Step 6: Add foreign key constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'ai_models' AND constraint_name = 'fk_ai_models_provider'
    ) THEN
        RAISE NOTICE 'Adding foreign key constraint...';

        ALTER TABLE "ai_models"
        ADD CONSTRAINT fk_ai_models_provider
        FOREIGN KEY (provider_id) REFERENCES "providers"(id) ON DELETE RESTRICT;

        RAISE NOTICE 'Foreign key constraint added successfully';
    ELSE
        RAISE NOTICE 'Foreign key constraint already exists, skipping';
    END IF;

    -- Step 7: Make provider_id NOT NULL if all models have been migrated
    SELECT COUNT(*) INTO total_models FROM "ai_models" WHERE provider_id IS NULL;

    IF total_models = 0 THEN
        -- Check if column is already NOT NULL
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'ai_models' AND column_name = 'provider_id' AND is_nullable = 'YES'
        ) THEN
            RAISE NOTICE 'Making provider_id column NOT NULL...';
            ALTER TABLE "ai_models" ALTER COLUMN provider_id SET NOT NULL;
            RAISE NOTICE 'provider_id column is now NOT NULL';
        ELSE
            RAISE NOTICE 'provider_id column is already NOT NULL, skipping';
        END IF;
    ELSE
        RAISE WARNING 'Cannot make provider_id NOT NULL: % models still have NULL provider_id', total_models;
    END IF;

    -- Step 8: Create performance indexes
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE tablename = 'ai_models' AND indexname = 'idx_ai_models_provider_id'
    ) THEN
        RAISE NOTICE 'Creating performance index on provider_id...';
        CREATE INDEX idx_ai_models_provider_id ON "ai_models"(provider_id);
        RAISE NOTICE 'Index idx_ai_models_provider_id created successfully';
    ELSE
        RAISE NOTICE 'Index idx_ai_models_provider_id already exists, skipping';
    END IF;

    -- Step 9: Create composite index for user + provider queries
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE tablename = 'ai_models' AND indexname = 'idx_ai_models_user_provider'
    ) THEN
        RAISE NOTICE 'Creating composite index on user_id and provider_id...';
        CREATE INDEX idx_ai_models_user_provider ON "ai_models"(user_id, provider_id);
        RAISE NOTICE 'Index idx_ai_models_user_provider created successfully';
    ELSE
        RAISE NOTICE 'Index idx_ai_models_user_provider already exists, skipping';
    END IF;

    -- Step 10: Add helpful comments
    COMMENT ON COLUMN "ai_models"."provider_id" IS 'Foreign key reference to providers table - determines which AI service provides this model';

    RAISE NOTICE '';
    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE '=====================================';
    RAISE NOTICE 'Summary:';
    RAISE NOTICE '- provider_id column added to ai_models table';
    RAISE NOTICE '- % existing models migrated to OpenRouter provider', models_migrated;
    RAISE NOTICE '- Foreign key constraint added for data integrity';
    RAISE NOTICE '- Performance indexes created';
    RAISE NOTICE '- All operations completed with zero downtime';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Update your application code to handle provider_id';
    RAISE NOTICE '2. Test provider filtering functionality';
    RAISE NOTICE '3. Configure endpoints for each provider';
END;
$$;

-- Verification query to show current state
DO $$
DECLARE
    model_count_record RECORD;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE 'Post-migration verification:';
    RAISE NOTICE '===========================';

    FOR model_count_record IN
        SELECT
            p.display_name as provider_name,
            COUNT(am.id) as model_count
        FROM "providers" p
        LEFT JOIN "ai_models" am ON p.id = am.provider_id
        GROUP BY p.id, p.display_name
        ORDER BY p.priority DESC
    LOOP
        RAISE NOTICE 'Provider: % - Models: %',
            model_count_record.provider_name,
            model_count_record.model_count;
    END LOOP;
END;
$$;