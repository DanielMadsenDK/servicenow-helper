-- Providers Seeding Script
-- This script seeds initial AI providers (OpenRouter and Hugging Face) with proper configuration

-- Function to seed providers data
CREATE OR REPLACE FUNCTION seed_providers_data()
RETURNS INTEGER AS $$
DECLARE
    providers_count INTEGER;
    inserted_count INTEGER := 0;
BEGIN
    -- Check if providers already exist
    SELECT COUNT(*) INTO providers_count
    FROM "providers";

    -- If providers already exist, skip seeding
    IF providers_count > 0 THEN
        RAISE NOTICE 'Providers table already contains data (% providers found), skipping seeding...', providers_count;
        RETURN 0;
    END IF;

    -- Insert initial providers
    INSERT INTO "providers" (
        name,
        display_name,
        endpoint,
        is_active,
        priority,
        rate_limit_per_minute,
        created_at,
        updated_at
    )
    VALUES
        -- OpenRouter (current default provider)
        (
            'openrouter',
            'OpenRouter',
            'd8f43068-431e-405b-bdbb-e7dba6862299',
            true,
            100, -- Higher priority = appears first
            NULL, -- No specific rate limit info
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        ),
        -- Hugging Face (secondary provider)
        (
            'huggingface',
            'Hugging Face',
            'd8f43068-431e-405b-bdbb-e7dba6862298',
            true,
            90, -- Lower priority than OpenRouter
            NULL, -- No specific rate limit info
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        )
    ON CONFLICT (name) DO NOTHING;

    GET DIAGNOSTICS inserted_count = ROW_COUNT;

    RAISE NOTICE 'Seeded % providers successfully', inserted_count;
    RAISE NOTICE 'Providers added: OpenRouter (priority 100), Hugging Face (priority 90)';
    RAISE NOTICE 'Note: endpoint fields are seeded with default N8N webhook GUIDs';
    RAISE NOTICE 'API keys are read from environment variables: OPENROUTER_API_KEY, HUGGINGFACE_API_KEY';

    RETURN inserted_count;
END;
$$ LANGUAGE plpgsql;

-- Execute the seeding
DO $$
DECLARE
    result INTEGER;
BEGIN
    RAISE NOTICE 'Starting providers seeding...';

    -- Check if providers table exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'providers') THEN
        RAISE NOTICE 'providers table does not exist. Please run create-providers-table.sql first.';
        RETURN;
    END IF;

    -- Seed providers data
    SELECT seed_providers_data() INTO result;

    IF result > 0 THEN
        RAISE NOTICE 'Providers seeding completed successfully!';
        RAISE NOTICE 'Summary: % providers added to the database', result;
        RAISE NOTICE '';
        RAISE NOTICE 'NEXT STEPS:';
        RAISE NOTICE '1. Set up environment variables for API keys:';
        RAISE NOTICE '   - OPENROUTER_API_KEY=your_openrouter_key';
        RAISE NOTICE '   - HUGGINGFACE_API_KEY=your_huggingface_key';
        RAISE NOTICE '2. Import the corresponding N8N workflows with matching webhook GUIDs';
        RAISE NOTICE '3. Update endpoints if using custom N8N webhook endpoints';
        RAISE NOTICE 'Note: API keys follow the pattern {PROVIDER_NAME}_API_KEY';
    ELSE
        RAISE NOTICE 'No new providers were seeded (table already contains data)';
    END IF;
END;
$$;

-- Clean up the temporary function
DROP FUNCTION IF EXISTS seed_providers_data();

-- Display current providers for verification
DO $$
DECLARE
    provider_record RECORD;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE 'Current providers in database:';
    RAISE NOTICE '----------------------------------------';

    FOR provider_record IN
        SELECT name, display_name, is_active, priority
        FROM "providers"
        ORDER BY priority DESC, name
    LOOP
        RAISE NOTICE '% (%) - Priority: %, Active: %, API Key: %_API_KEY',
            provider_record.display_name,
            provider_record.name,
            provider_record.priority,
            provider_record.is_active,
            UPPER(provider_record.name);
    END LOOP;
END;
$$;