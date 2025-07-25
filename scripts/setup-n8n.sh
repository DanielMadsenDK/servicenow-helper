#!/bin/bash

echo "🚀 Setting up N8N with credentials and workflow..."

# Load environment variables
if [ -f .env ]; then
    source .env
fi

# Detect if we're running inside Docker
if [ -f /.dockerenv ]; then
    N8N_HOST="n8n:5678"
    POSTGRES_CONTAINER="servicenow-aisupporttool-postgres-1"
    N8N_CONTAINER="servicenow-aisupporttool-n8n-1"
    INIT_FLAG_CHECK="docker exec $N8N_CONTAINER test -f /home/node/.n8n/.initialized"
else
    N8N_HOST="localhost:5678"
    POSTGRES_CONTAINER="servicenow-aisupporttool-postgres-1"
    N8N_CONTAINER="servicenow-aisupporttool-n8n-1"
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
        echo "✅ N8N is ready!"
        break
    fi
    echo "Waiting... ($i/30)"
    sleep 2
done

# Create admin user
echo "Creating admin user..."
curl -s -X POST "http://$N8N_HOST/rest/owner/setup" \
    -H "Content-Type: application/json" \
    -d '{"email": "admin@servicenow-helper.local", "firstName": "Admin", "lastName": "User", "password": "Admin123"}' > /dev/null
echo "✅ Admin user created"

# Login and save session
echo "Logging in..."
curl -s -c cookies.txt -X POST "http://$N8N_HOST/rest/login" \
    -H "Content-Type: application/json" \
    -d '{"emailOrLdapLoginId": "admin@servicenow-helper.local", "password": "Admin123"}' > /dev/null
echo "✅ Session established"

# Create credentials
echo "Creating credentials..."

echo "  - Creating Anthropic credential..."
curl -s -b cookies.txt -X POST "http://$N8N_HOST/rest/credentials" \
    -H "Content-Type: application/json" \
    -d "{\"name\": \"Anthropic account\", \"type\": \"anthropicApi\", \"data\": {\"apiKey\": \"$CLAUDE_API_KEY\"}}" > /dev/null

echo "  - Creating OpenAI credential..."
curl -s -b cookies.txt -X POST "http://$N8N_HOST/rest/credentials" \
    -H "Content-Type: application/json" \
    -d "{\"name\": \"OpenAi account\", \"type\": \"openAiApi\", \"data\": {\"apiKey\": \"$OPENAI_API_KEY\"}}" > /dev/null

echo "  - Creating PostgreSQL credential..."
curl -s -b cookies.txt -X POST "http://$N8N_HOST/rest/credentials" \
    -H "Content-Type: application/json" \
    -d '{"name": "Postgres account", "type": "postgres", "data": {"host": "postgres", "port": 5432, "database": "n8n", "user": "n8n", "password": "n8n_password", "ssl": "disable"}}' > /dev/null

echo "  - Creating Header Auth credential..."
curl -s -b cookies.txt -X POST "http://$N8N_HOST/rest/credentials" \
    -H "Content-Type: application/json" \
    -d "{\"name\": \"Header Auth account\", \"type\": \"httpHeaderAuth\", \"data\": {\"name\": \"apikey\", \"value\": \"$WEBHOOK_API_KEY\"}}" > /dev/null

echo "✅ Credentials created"

# Get credential IDs
echo "Getting credential IDs..."
# Wait a bit more for n8n to fully initialize
sleep 5
CREDS_RESPONSE=$(curl -s -b cookies.txt "http://$N8N_HOST/rest/credentials")
# If still getting startup message, wait and retry
if echo "$CREDS_RESPONSE" | grep -q "starting up"; then
    echo "N8N still starting up, waiting 10 more seconds..."
    sleep 10
    CREDS_RESPONSE=$(curl -s -b cookies.txt "http://$N8N_HOST/rest/credentials")
fi
# If unauthorized, re-login and retry
if echo "$CREDS_RESPONSE" | grep -q "Unauthorized"; then
    echo "Session expired, re-logging in..."
    curl -s -c cookies.txt -X POST "http://$N8N_HOST/rest/login" \
        -H "Content-Type: application/json" \
        -d '{"emailOrLdapLoginId": "admin@servicenow-helper.local", "password": "Admin123"}' > /dev/null
    sleep 2
    CREDS_RESPONSE=$(curl -s -b cookies.txt "http://$N8N_HOST/rest/credentials")
fi

# Debug: show the response
echo "Credentials response length: $(echo "$CREDS_RESPONSE" | wc -c)"
echo "First 200 chars: $(echo "$CREDS_RESPONSE" | head -c 200)"

# Simplified extraction using jq if available, otherwise fallback to grep
if command -v jq >/dev/null 2>&1; then
    echo "Using jq for credential extraction..."
    ANTHROPIC_ID=$(echo "$CREDS_RESPONSE" | jq -r '.data[] | select(.type=="anthropicApi") | .id' 2>/dev/null || echo "")
    OPENAI_ID=$(echo "$CREDS_RESPONSE" | jq -r '.data[] | select(.type=="openAiApi") | .id' 2>/dev/null || echo "")
    POSTGRES_ID=$(echo "$CREDS_RESPONSE" | jq -r '.data[] | select(.type=="postgres") | .id' 2>/dev/null || echo "")
    HEADER_ID=$(echo "$CREDS_RESPONSE" | jq -r '.data[] | select(.type=="httpHeaderAuth") | .id' 2>/dev/null || echo "")
else
    echo "Using grep/sed for credential extraction..."
    # Simpler pattern matching
    ANTHROPIC_ID=$(echo "$CREDS_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    OPENAI_ID=$(echo "$CREDS_RESPONSE" | grep -o '"id":"[^"]*"' | head -2 | tail -1 | cut -d'"' -f4)
    POSTGRES_ID=$(echo "$CREDS_RESPONSE" | grep -o '"id":"[^"]*"' | head -3 | tail -1 | cut -d'"' -f4)
    HEADER_ID=$(echo "$CREDS_RESPONSE" | grep -o '"id":"[^"]*"' | head -4 | tail -1 | cut -d'"' -f4)
fi

echo "Found credential IDs:"
echo "  Anthropic: $ANTHROPIC_ID"
echo "  OpenAI: $OPENAI_ID"
echo "  Postgres: $POSTGRES_ID"
echo "  Header: $HEADER_ID"

# Update workflow with credential IDs
if [ -f n8n/init/workflow-template.json ] && [ -n "$ANTHROPIC_ID" ]; then
    echo "Updating workflow with credential IDs..."
    sed -e "s/ANTHROPIC_CREDENTIAL_ID/$ANTHROPIC_ID/g" \
        -e "s/OPENAI_CREDENTIAL_ID/$OPENAI_ID/g" \
        -e "s/POSTGRES_CREDENTIAL_ID/$POSTGRES_ID/g" \
        -e "s/HEADER_AUTH_CREDENTIAL_ID/$HEADER_ID/g" \
        n8n/init/workflow-template.json > workflow-final.json
    
    # Import main workflow
    echo "Importing main workflow..."
    WORKFLOW_RESULT=$(curl -s -b cookies.txt -X POST "http://$N8N_HOST/rest/workflows" \
        -H "Content-Type: application/json" \
        -d @workflow-final.json)
    
    if echo "$WORKFLOW_RESULT" | grep -q '"id":'; then
        echo "✅ Main workflow imported successfully"
        
        # Activate main workflow
        WORKFLOW_ID=$(echo "$WORKFLOW_RESULT" | jq -r '.data.id' 2>/dev/null || echo "$WORKFLOW_RESULT" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
        if [ -n "$WORKFLOW_ID" ]; then
            echo "Activating main workflow..."
            curl -s -b cookies.txt -X POST "http://$N8N_HOST/rest/workflows/$WORKFLOW_ID/activate" > /dev/null
            echo "✅ Main workflow activated"
        fi
    else
        echo "❌ Main workflow import failed"
        echo "Result: $WORKFLOW_RESULT"
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
    
    # Seed AI models for existing users
    echo "Seeding default AI models..."
    if [ -f scripts/seed-ai-models.sql ]; then
        docker exec -i $POSTGRES_CONTAINER psql -U n8n -d n8n < scripts/seed-ai-models.sql > /dev/null 2>&1 && echo "✅ AI models seeded" || echo "⚠️ AI models seeding failed (may be expected if no users exist yet)"
    else
        echo "⚠️ AI models seeding script not found, skipping..."
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
    
    # Seed AI models for existing users
    echo "Seeding default AI models..."
    if [ -f scripts/seed-ai-models.sql ]; then
        docker exec -i $POSTGRES_CONTAINER psql -U n8n -d n8n < scripts/seed-ai-models.sql > /dev/null 2>&1 && echo "✅ AI models seeded" || echo "⚠️ AI models seeding failed (may be expected if no users exist yet)"
    else
        echo "⚠️ AI models seeding script not found, skipping..."
    fi
    
    # Mark as initialized inside container
    docker exec $N8N_CONTAINER touch /home/node/.n8n/.initialized > /dev/null 2>&1
fi

# Clean up
rm -f cookies.txt

echo ""
echo "🎉 N8N Setup Complete!"
echo ""
echo "Access N8N at: http://localhost:5678"
echo "Login: admin@servicenow-helper.local / Admin123"
echo ""