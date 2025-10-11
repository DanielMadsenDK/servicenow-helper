#!/bin/bash

echo "🚀 Setting up N8N with credentials and workflow..."

# Environment variables are already passed via docker-compose.yml
# Just verify they exist
echo "Checking environment variables..."
echo "CLAUDE_API_KEY: ${CLAUDE_API_KEY:0:20}..."
echo "OPENAI_API_KEY: ${OPENAI_API_KEY:0:20}..."
echo "WEBHOOK_API_KEY: ${WEBHOOK_API_KEY:0:20}..."
echo "OPENROUTER_API_KEY: ${OPENROUTER_API_KEY:0:20}..."

# Detect if we're running inside Docker
if [ -f /.dockerenv ]; then
    N8N_HOST="n8n:5678"
    POSTGRES_CONTAINER="servicenow-helper-postgres-1"
    N8N_CONTAINER="servicenow-helper-n8n-1"
    INIT_FLAG_CHECK="docker exec $N8N_CONTAINER test -f /home/node/.n8n/.initialized"
else
    N8N_HOST="localhost:5678"
    POSTGRES_CONTAINER="servicenow-helper-postgres-1"
    N8N_CONTAINER="servicenow-helper-n8n-1"
    INIT_FLAG_CHECK="docker exec $N8N_CONTAINER test -f /home/node/.n8n/.initialized"
fi

# Check if already initialized
echo "Checking if N8N is already initialized..."
if $INIT_FLAG_CHECK > /dev/null 2>&1; then
    echo "✅ N8N is already initialized! Skipping setup."
    echo "If you need to re-initialize, remove the .initialized file:"
    echo "docker exec $N8N_CONTAINER rm /home/node/.n8n/.initialized"
    exit 0
fi

echo "🆕 N8N not initialized. Proceeding with setup..."

# Wait for N8N to be ready
echo "Waiting for N8N to be ready..."
for i in {1..30}; do
    if curl -s http://$N8N_HOST/healthz > /dev/null 2>&1; then
        echo "✅ N8N healthcheck passed!"
        break
    fi
    echo "Waiting for healthcheck... ($i/30)"
    sleep 2
done

# Additional wait for REST API to be fully available
echo "Waiting for N8N REST API to be available..."
for i in {1..20}; do
    # Test if the owner setup endpoint is available
    TEST_RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null http://$N8N_HOST/rest/owner/setup)
    if [ "$TEST_RESPONSE" = "200" ] || [ "$TEST_RESPONSE" = "400" ]; then
        echo "✅ N8N REST API is ready!"
        break
    fi
    echo "Waiting for REST API... ($i/20) - Status: $TEST_RESPONSE"
    sleep 3
done

# Create admin user
echo "Creating admin user..."
curl -s -X POST "http://$N8N_HOST/rest/owner/setup" \
    -H "Content-Type: application/json" \
    -d '{"email": "admin@servicenow-helper.local", "firstName": "Admin", "lastName": "User", "password": "Admin123"}' > /dev/null
echo "✅ Admin user created"

# Login and get session token
echo "Logging in to n8n..."
LOGIN_RESPONSE=$(curl -s -D /tmp/n8n-headers.txt -X POST "http://$N8N_HOST/rest/login" \
    -H "Content-Type: application/json" \
    -d '{"emailOrLdapLoginId": "admin@servicenow-helper.local", "password": "Admin123"}')

# Debug: show response
echo "Login response status: $(echo "$LOGIN_RESPONSE" | grep -o '"id"' | head -c 10)"

# Extract session cookie value from Set-Cookie header
# Try multiple extraction methods
SESSION_TOKEN=$(grep -i "set-cookie: n8n-auth=" /tmp/n8n-headers.txt | sed 's/.*n8n-auth=//I' | cut -d';' -f1)

# If that didn't work, try without case-insensitive flag
if [ -z "$SESSION_TOKEN" ]; then
    SESSION_TOKEN=$(grep "Set-Cookie: n8n-auth=" /tmp/n8n-headers.txt | sed 's/.*n8n-auth=//' | cut -d';' -f1)
fi

# If still empty, try lowercase
if [ -z "$SESSION_TOKEN" ]; then
    SESSION_TOKEN=$(grep "set-cookie: n8n-auth=" /tmp/n8n-headers.txt | sed 's/.*n8n-auth=//' | cut -d';' -f1)
fi

if [ -n "$SESSION_TOKEN" ]; then
    echo "✅ Session established (token length: ${#SESSION_TOKEN})"
    COOKIE_HEADER="Cookie: n8n-auth=$SESSION_TOKEN"
else
    echo "❌ Failed to get session token"
    echo "Headers file content:"
    cat /tmp/n8n-headers.txt
    echo ""
    echo "Login response:"
    echo "$LOGIN_RESPONSE" | head -c 200
    exit 1
fi

# Create credentials using n8n API
echo "Creating credentials..."

echo "  - Creating Anthropic credential..."
ANTHRO_RESULT=$(curl -s -H "$COOKIE_HEADER" -X POST "http://$N8N_HOST/rest/credentials" \
    -H "Content-Type: application/json" \
    -d "{\"name\": \"Anthropic account\", \"type\": \"anthropicApi\", \"data\": {\"apiKey\": \"$CLAUDE_API_KEY\"}}")
if echo "$ANTHRO_RESULT" | grep -q '"id"'; then
    echo "    ✅ Created"
else
    echo "    ⚠️ May have failed: $(echo $ANTHRO_RESULT | head -c 100)"
fi

echo "  - Creating OpenAI credential..."
OPENAI_RESULT=$(curl -s -H "$COOKIE_HEADER" -X POST "http://$N8N_HOST/rest/credentials" \
    -H "Content-Type: application/json" \
    -d "{\"name\": \"OpenAi account\", \"type\": \"openAiApi\", \"data\": {\"apiKey\": \"$OPENAI_API_KEY\"}}")
if echo "$OPENAI_RESULT" | grep -q '"id"'; then
    echo "    ✅ Created"
else
    echo "    ⚠️ May have failed"
fi

echo "  - Creating PostgreSQL credential..."
PG_RESULT=$(curl -s -H "$COOKIE_HEADER" -X POST "http://$N8N_HOST/rest/credentials" \
    -H "Content-Type: application/json" \
    -d '{"name": "Postgres account", "type": "postgres", "data": {"host": "postgres", "port": 5432, "database": "n8n", "user": "n8n", "password": "n8n_password", "ssl": "disable"}}')
if echo "$PG_RESULT" | grep -q '"id"'; then
    echo "    ✅ Created"
else
    echo "    ⚠️ May have failed"
fi

echo "  - Creating Header Auth credential..."
HEADER_RESULT=$(curl -s -H "$COOKIE_HEADER" -X POST "http://$N8N_HOST/rest/credentials" \
    -H "Content-Type: application/json" \
    -d "{\"name\": \"Header Auth account\", \"type\": \"httpHeaderAuth\", \"data\": {\"name\": \"apikey\", \"value\": \"$WEBHOOK_API_KEY\"}}")
if echo "$HEADER_RESULT" | grep -q '"id"'; then
    echo "    ✅ Created"
else
    echo "    ⚠️ May have failed"
fi

echo "  - Creating OpenRouter credential..."
ROUTER_RESULT=$(curl -s -H "$COOKIE_HEADER" -X POST "http://$N8N_HOST/rest/credentials" \
    -H "Content-Type: application/json" \
    -d "{\"name\": \"OpenRouter account\", \"type\": \"openRouterApi\", \"data\": {\"apiKey\": \"$OPENROUTER_API_KEY\"}}")
if echo "$ROUTER_RESULT" | grep -q '"id"'; then
    echo "    ✅ Created"
else
    echo "    ⚠️ May have failed"
fi

echo "✅ Credentials created"

# Wait for credentials to be persisted
sleep 2

# Get credential IDs using API
echo "Getting credential IDs..."
CREDS_RESPONSE=$(curl -s -H "$COOKIE_HEADER" "http://$N8N_HOST/rest/credentials")

# Extract IDs using jq or grep
if command -v jq >/dev/null 2>&1; then
    ANTHROPIC_ID=$(echo "$CREDS_RESPONSE" | jq -r '.data[] | select(.type=="anthropicApi") | .id' 2>/dev/null || echo "")
    OPENAI_ID=$(echo "$CREDS_RESPONSE" | jq -r '.data[] | select(.type=="openAiApi") | .id' 2>/dev/null || echo "")
    POSTGRES_ID=$(echo "$CREDS_RESPONSE" | jq -r '.data[] | select(.type=="postgres") | .id' 2>/dev/null || echo "")
    HEADER_ID=$(echo "$CREDS_RESPONSE" | jq -r '.data[] | select(.type=="httpHeaderAuth") | .id' 2>/dev/null || echo "")
    OPENROUTER_ID=$(echo "$CREDS_RESPONSE" | jq -r '.data[] | select(.type=="openRouterApi") | .id' 2>/dev/null || echo "")
else
    # Fallback: get from database if jq not available
    ANTHROPIC_ID=$(docker exec $POSTGRES_CONTAINER psql -U n8n -d n8n -t -c "SELECT id FROM public.credentials_entity WHERE type = 'anthropicApi' LIMIT 1" | tr -d ' ')
    OPENAI_ID=$(docker exec $POSTGRES_CONTAINER psql -U n8n -d n8n -t -c "SELECT id FROM public.credentials_entity WHERE type = 'openAiApi' LIMIT 1" | tr -d ' ')
    POSTGRES_ID=$(docker exec $POSTGRES_CONTAINER psql -U n8n -d n8n -t -c "SELECT id FROM public.credentials_entity WHERE type = 'postgres' LIMIT 1" | tr -d ' ')
    HEADER_ID=$(docker exec $POSTGRES_CONTAINER psql -U n8n -d n8n -t -c "SELECT id FROM public.credentials_entity WHERE type = 'httpHeaderAuth' LIMIT 1" | tr -d ' ')
    OPENROUTER_ID=$(docker exec $POSTGRES_CONTAINER psql -U n8n -d n8n -t -c "SELECT id FROM public.credentials_entity WHERE type = 'openRouterApi' LIMIT 1" | tr -d ' ')
fi

echo "Found credential IDs:"
echo "  Anthropic: $ANTHROPIC_ID"
echo "  OpenAI: $OPENAI_ID"
echo "  Postgres: $POSTGRES_ID"
echo "  Header: $HEADER_ID"
echo "  OpenRouter: $OPENROUTER_ID"

# Update workflow with credential IDs
if [ -f n8n/init/workflow-template.json ] && [ -n "$ANTHROPIC_ID" ]; then
    echo "Updating workflow with credential IDs..."
    sed -e "s/ANTHROPIC_CREDENTIAL_ID/$ANTHROPIC_ID/g" \
        -e "s/OPENAI_CREDENTIAL_ID/$OPENAI_ID/g" \
        -e "s/POSTGRES_CREDENTIAL_ID/$POSTGRES_ID/g" \
        -e "s/HEADER_AUTH_CREDENTIAL_ID/$HEADER_ID/g" \
        -e "s/OPENROUTER_CREDENTIAL_ID/$OPENROUTER_ID/g" \
        n8n/init/workflow-template.json > workflow-final.json
    
    # Import main workflow using API
    echo "Importing main workflow..."

    WORKFLOW_RESULT=$(curl -s -H "$COOKIE_HEADER" -X POST "http://$N8N_HOST/rest/workflows" \
        -H "Content-Type: application/json" \
        -d @workflow-final.json)

    if echo "$WORKFLOW_RESULT" | grep -q '"id"'; then
        echo "✅ Main workflow imported successfully"

        # Activate main workflow
        WORKFLOW_ID=$(echo "$WORKFLOW_RESULT" | jq -r '.data.id' 2>/dev/null || echo "$WORKFLOW_RESULT" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
        if [ -n "$WORKFLOW_ID" ]; then
            echo "Activating main workflow (ID: $WORKFLOW_ID)..."
            curl -s -H "$COOKIE_HEADER" -X POST "http://$N8N_HOST/rest/workflows/$WORKFLOW_ID/activate" > /dev/null
            echo "✅ Main workflow activated"
        fi
    else
        echo "❌ Main workflow import failed"
        echo "Result: $(echo $WORKFLOW_RESULT | head -c 200)"
    fi
    
    # Note: The add-qa-pair functionality is now integrated into the main workflow
    echo "ℹ️  Add-QA-Pair functionality is integrated into the main workflow"
    
    # Restart N8N to register webhooks properly
    echo "Restarting N8N to register webhooks..."
    if [ -f /.dockerenv ]; then
        # Running inside Docker - use docker command
        docker restart $N8N_CONTAINER > /dev/null 2>&1
    else
        # Running on host - use docker compose
        docker compose restart n8n > /dev/null 2>&1
    fi
    sleep 15
    echo "✅ N8N restarted and webhooks registered"
    
    # Clean up
    rm -f workflow-final.json
else
    echo "❌ Cannot update workflow - missing template or credentials"
fi

# Create database table
echo "Creating database tables and installing pgvector..."
if [ -f /.dockerenv ]; then
    # Running inside Docker - use docker exec
    docker exec $POSTGRES_CONTAINER psql -U n8n -d n8n -c "
    -- Install pgvector extension
    CREATE EXTENSION IF NOT EXISTS vector;
    
    -- Create existing tables
    CREATE TABLE IF NOT EXISTS \"ServiceNowSupportTool\" (
        id SERIAL PRIMARY KEY,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        key VARCHAR(255) UNIQUE NOT NULL,
        response TEXT,
        state VARCHAR(50) NOT NULL,
        prompt TEXT,
        model VARCHAR(100),
        question TEXT
    );
    
    CREATE TABLE IF NOT EXISTS \"user_settings\" (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        setting_key VARCHAR(255) NOT NULL,
        setting_value TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, setting_key)
    );
    
    CREATE TABLE IF NOT EXISTS \"ai_models\" (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        model_name VARCHAR(500) NOT NULL,
        display_name VARCHAR(500),
        is_free BOOLEAN NOT NULL DEFAULT false,
        is_default BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, model_name)
    );
    
    -- Create vector database tables for RAG
    CREATE TABLE IF NOT EXISTS \"qa_knowledge_base\" (
        id SERIAL PRIMARY KEY,
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        question_embedding vector(1536),
        answer_embedding vector(1536),
        category VARCHAR(50),
        tags TEXT[],
        quality_score FLOAT DEFAULT 0,
        usage_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS \"qa_feedback\" (
        id SERIAL PRIMARY KEY,
        qa_id INTEGER REFERENCES \"qa_knowledge_base\"(id) ON DELETE CASCADE,
        user_session VARCHAR(255),
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        feedback_text TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Create vector indexes for efficient similarity search
    CREATE INDEX IF NOT EXISTS idx_qa_question_embedding ON \"qa_knowledge_base\" USING ivfflat (question_embedding vector_cosine_ops);
    CREATE INDEX IF NOT EXISTS idx_qa_answer_embedding ON \"qa_knowledge_base\" USING ivfflat (answer_embedding vector_cosine_ops);
    
    -- Create regular indexes for performance
    CREATE INDEX IF NOT EXISTS idx_qa_category ON \"qa_knowledge_base\"(category);
    CREATE INDEX IF NOT EXISTS idx_qa_quality_score ON \"qa_knowledge_base\"(quality_score);
    CREATE INDEX IF NOT EXISTS idx_qa_usage_count ON \"qa_knowledge_base\"(usage_count);
    CREATE INDEX IF NOT EXISTS idx_qa_created_at ON \"qa_knowledge_base\"(created_at);
    
    -- Create indexes for ai_models table
    CREATE INDEX IF NOT EXISTS idx_ai_models_user_id ON \"ai_models\"(user_id);
    CREATE INDEX IF NOT EXISTS idx_ai_models_is_default ON \"ai_models\"(user_id, is_default);
    " > /dev/null 2>&1 && echo "✅ Database tables and pgvector extension created"

    # Create providers table FIRST (required for ai_models seeding)
    echo "Creating providers table..."
    if [ -f scripts/create-providers-table.sql ]; then
        docker exec -i $POSTGRES_CONTAINER psql -U n8n -d n8n < scripts/create-providers-table.sql > /dev/null 2>&1 && echo "✅ Providers table created" || echo "⚠️ Providers table creation failed"
    else
        echo "⚠️ Providers table creation script not found, skipping..."
    fi

    # Seed providers data SECOND (required before seeding ai_models)
    echo "Seeding providers data..."
    if [ -f scripts/seed-providers.sql ]; then
        docker exec -i $POSTGRES_CONTAINER psql -U n8n -d n8n < scripts/seed-providers.sql > /dev/null 2>&1 && echo "✅ Providers data seeded" || echo "⚠️ Providers seeding failed"
    else
        echo "⚠️ Providers seeding script not found, skipping..."
    fi

    # Add provider column to ai_models table THIRD (before seeding models)
    echo "Adding provider support to ai_models table..."
    if [ -f scripts/add-provider-to-ai-models.sql ]; then
        docker exec -i $POSTGRES_CONTAINER psql -U n8n -d n8n < scripts/add-provider-to-ai-models.sql > /dev/null 2>&1 && echo "✅ Provider column added to ai_models" || echo "⚠️ Provider migration failed"
    else
        echo "⚠️ Provider migration script not found, skipping..."
    fi

    # Seed AI models FOURTH (now that providers exist and column is added)
    echo "Seeding default AI models with OpenRouter provider..."
    if [ -f scripts/seed-ai-models.sql ]; then
        docker exec -i $POSTGRES_CONTAINER psql -U n8n -d n8n < scripts/seed-ai-models.sql > /dev/null 2>&1 && echo "✅ AI models seeded with provider references" || echo "⚠️ AI models seeding failed (may be expected if no users exist yet)"
    else
        echo "⚠️ AI models seeding script not found, skipping..."
    fi

    # Run multimodal capabilities migration
    echo "Adding multimodal capabilities support..."
    if [ -f scripts/add-multimodal-capabilities.sql ]; then
        docker exec -i $POSTGRES_CONTAINER psql -U n8n -d n8n < scripts/add-multimodal-capabilities.sql > /dev/null 2>&1 && echo "✅ Multimodal capabilities added" || echo "⚠️ Multimodal capabilities migration failed"
    else
        echo "⚠️ Multimodal capabilities migration script not found, skipping..."
    fi

    # Run agent models migration
    echo "Migrating to agent models system..."
    if [ -f scripts/migrate-to-agent-models.sql ]; then
        docker exec -i $POSTGRES_CONTAINER psql -U n8n -d n8n < scripts/migrate-to-agent-models.sql > /dev/null 2>&1 && echo "✅ Agent models migration completed" || echo "⚠️ Agent models migration failed"
    else
        echo "⚠️ Agent models migration script not found, skipping..."
    fi

    # Create ServiceNow integration table
    echo "Creating ServiceNow integration table..."
    if [ -f scripts/create-servicenow-integration-table.sql ]; then
        docker exec -i $POSTGRES_CONTAINER psql -U n8n -d n8n < scripts/create-servicenow-integration-table.sql > /dev/null 2>&1 && echo "✅ ServiceNow integration table created" || echo "⚠️ ServiceNow integration table creation failed"
    else
        echo "⚠️ ServiceNow integration table migration script not found, skipping..."
    fi

    # Add visible request types setting
    echo "Adding visible request types setting..."
    if [ -f scripts/add-visible-request-types.sql ]; then
        docker exec -i $POSTGRES_CONTAINER psql -U n8n -d n8n < scripts/add-visible-request-types.sql > /dev/null 2>&1 && echo "✅ Visible request types setting added" || echo "⚠️ Visible request types migration failed"
    else
        echo "⚠️ Visible request types migration script not found, skipping..."
    fi

    # Mark as initialized inside container
    docker exec $N8N_CONTAINER touch /home/node/.n8n/.initialized > /dev/null 2>&1
else
    # Running on host - use docker exec
    docker exec $POSTGRES_CONTAINER psql -U n8n -d n8n -c "
    -- Install pgvector extension
    CREATE EXTENSION IF NOT EXISTS vector;
    
    -- Create existing tables
    CREATE TABLE IF NOT EXISTS \"ServiceNowSupportTool\" (
        id SERIAL PRIMARY KEY,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        key VARCHAR(255) UNIQUE NOT NULL,
        response TEXT,
        state VARCHAR(50) NOT NULL,
        prompt TEXT,
        model VARCHAR(100),
        question TEXT
    );
    
    CREATE TABLE IF NOT EXISTS \"user_settings\" (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        setting_key VARCHAR(255) NOT NULL,
        setting_value TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, setting_key)
    );
    
    CREATE TABLE IF NOT EXISTS \"ai_models\" (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        model_name VARCHAR(500) NOT NULL,
        display_name VARCHAR(500),
        is_free BOOLEAN NOT NULL DEFAULT false,
        is_default BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, model_name)
    );
    
    -- Create vector database tables for RAG
    CREATE TABLE IF NOT EXISTS \"qa_knowledge_base\" (
        id SERIAL PRIMARY KEY,
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        question_embedding vector(1536),
        answer_embedding vector(1536),
        category VARCHAR(50),
        tags TEXT[],
        quality_score FLOAT DEFAULT 0,
        usage_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS \"qa_feedback\" (
        id SERIAL PRIMARY KEY,
        qa_id INTEGER REFERENCES \"qa_knowledge_base\"(id) ON DELETE CASCADE,
        user_session VARCHAR(255),
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        feedback_text TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Create vector indexes for efficient similarity search
    CREATE INDEX IF NOT EXISTS idx_qa_question_embedding ON \"qa_knowledge_base\" USING ivfflat (question_embedding vector_cosine_ops);
    CREATE INDEX IF NOT EXISTS idx_qa_answer_embedding ON \"qa_knowledge_base\" USING ivfflat (answer_embedding vector_cosine_ops);
    
    -- Create regular indexes for performance
    CREATE INDEX IF NOT EXISTS idx_qa_category ON \"qa_knowledge_base\"(category);
    CREATE INDEX IF NOT EXISTS idx_qa_quality_score ON \"qa_knowledge_base\"(quality_score);
    CREATE INDEX IF NOT EXISTS idx_qa_usage_count ON \"qa_knowledge_base\"(usage_count);
    CREATE INDEX IF NOT EXISTS idx_qa_created_at ON \"qa_knowledge_base\"(created_at);
    
    -- Create indexes for ai_models table
    CREATE INDEX IF NOT EXISTS idx_ai_models_user_id ON \"ai_models\"(user_id);
    CREATE INDEX IF NOT EXISTS idx_ai_models_is_default ON \"ai_models\"(user_id, is_default);
    " > /dev/null 2>&1 && echo "✅ Database tables and pgvector extension created"

    # Create providers table FIRST (required for ai_models seeding)
    echo "Creating providers table..."
    if [ -f scripts/create-providers-table.sql ]; then
        docker exec -i $POSTGRES_CONTAINER psql -U n8n -d n8n < scripts/create-providers-table.sql > /dev/null 2>&1 && echo "✅ Providers table created" || echo "⚠️ Providers table creation failed"
    else
        echo "⚠️ Providers table creation script not found, skipping..."
    fi

    # Seed providers data SECOND (required before seeding ai_models)
    echo "Seeding providers data..."
    if [ -f scripts/seed-providers.sql ]; then
        docker exec -i $POSTGRES_CONTAINER psql -U n8n -d n8n < scripts/seed-providers.sql > /dev/null 2>&1 && echo "✅ Providers data seeded" || echo "⚠️ Providers seeding failed"
    else
        echo "⚠️ Providers seeding script not found, skipping..."
    fi

    # Add provider column to ai_models table THIRD (before seeding models)
    echo "Adding provider support to ai_models table..."
    if [ -f scripts/add-provider-to-ai-models.sql ]; then
        docker exec -i $POSTGRES_CONTAINER psql -U n8n -d n8n < scripts/add-provider-to-ai-models.sql > /dev/null 2>&1 && echo "✅ Provider column added to ai_models" || echo "⚠️ Provider migration failed"
    else
        echo "⚠️ Provider migration script not found, skipping..."
    fi

    # Seed AI models FOURTH (now that providers exist and column is added)
    echo "Seeding default AI models with OpenRouter provider..."
    if [ -f scripts/seed-ai-models.sql ]; then
        docker exec -i $POSTGRES_CONTAINER psql -U n8n -d n8n < scripts/seed-ai-models.sql > /dev/null 2>&1 && echo "✅ AI models seeded with provider references" || echo "⚠️ AI models seeding failed (may be expected if no users exist yet)"
    else
        echo "⚠️ AI models seeding script not found, skipping..."
    fi

    # Run multimodal capabilities migration
    echo "Adding multimodal capabilities support..."
    if [ -f scripts/add-multimodal-capabilities.sql ]; then
        docker exec -i $POSTGRES_CONTAINER psql -U n8n -d n8n < scripts/add-multimodal-capabilities.sql > /dev/null 2>&1 && echo "✅ Multimodal capabilities added" || echo "⚠️ Multimodal capabilities migration failed"
    else
        echo "⚠️ Multimodal capabilities migration script not found, skipping..."
    fi

    # Run agent models migration
    echo "Migrating to agent models system..."
    if [ -f scripts/migrate-to-agent-models.sql ]; then
        docker exec -i $POSTGRES_CONTAINER psql -U n8n -d n8n < scripts/migrate-to-agent-models.sql > /dev/null 2>&1 && echo "✅ Agent models migration completed" || echo "⚠️ Agent models migration failed"
    else
        echo "⚠️ Agent models migration script not found, skipping..."
    fi

    # Create ServiceNow integration table
    echo "Creating ServiceNow integration table..."
    if [ -f scripts/create-servicenow-integration-table.sql ]; then
        docker exec -i $POSTGRES_CONTAINER psql -U n8n -d n8n < scripts/create-servicenow-integration-table.sql > /dev/null 2>&1 && echo "✅ ServiceNow integration table created" || echo "⚠️ ServiceNow integration table creation failed"
    else
        echo "⚠️ ServiceNow integration table migration script not found, skipping..."
    fi

    # Add visible request types setting
    echo "Adding visible request types setting..."
    if [ -f scripts/add-visible-request-types.sql ]; then
        docker exec -i $POSTGRES_CONTAINER psql -U n8n -d n8n < scripts/add-visible-request-types.sql > /dev/null 2>&1 && echo "✅ Visible request types setting added" || echo "⚠️ Visible request types migration failed"
    else
        echo "⚠️ Visible request types migration script not found, skipping..."
    fi

    # Mark as initialized inside container
    docker exec $N8N_CONTAINER touch /home/node/.n8n/.initialized > /dev/null 2>&1
fi

# Clean up
rm -f /tmp/n8n-headers.txt

echo ""
echo "🎉 N8N Setup Complete!"
echo ""
echo "Access N8N at: http://localhost:5678"
echo "Login: admin@servicenow-helper.local / Admin123"
echo ""