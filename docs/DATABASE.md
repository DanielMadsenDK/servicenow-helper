# Database Configuration

This document provides comprehensive information about database setup, configuration, and management for the ServiceNow Helper application.

## Table of Contents

- [Overview](#overview)
- [Database Technology](#database-technology)
- [Multi-Provider Setup](#multi-provider-setup)
- [Provider Database Schema](#provider-database-schema)
- [Agent Models Migration](#agent-models-migration)
- [Database Schema](#database-schema)
- [Manual Setup](#manual-setup)
- [Troubleshooting](#troubleshooting)

---

## Overview

ServiceNow Helper uses **PostgreSQL 15.x** with **pgvector 0.8.1** extension for data storage and vector-based search capabilities.

### Key Database Tables

| Table | Purpose | Key Features |
|-------|---------|--------------|
| `ServiceNowSupportTool` | Conversation history | Stores questions, answers, sessions |
| `user_settings` | User preferences | Stores personalized settings per user |
| `agent_models` | Agent model configurations | Maps agents to AI models per user |
| `providers` | AI provider configurations | Manages multiple AI provider endpoints |
| `ai_models` | AI model definitions | Stores model metadata and capabilities |
| `capabilities` | Model capabilities | Tracks text, image, audio support |

### Database Features

- **Persistent Storage**: All data persists across container restarts
- **Vector Search**: pgvector extension enables semantic search
- **User Isolation**: Settings and configurations stored per user
- **Transaction Support**: ACID compliance for data integrity
- **Backup & Recovery**: Standard PostgreSQL backup tools compatible

---

## Database Technology

### PostgreSQL 15.x

**Why PostgreSQL:**
- Robust, enterprise-grade open-source database
- Excellent JSON support for flexible data structures
- Strong transaction support for data integrity
- pgvector extension for AI/ML workloads
- Proven reliability and performance

**Version:**
- PostgreSQL 15.x (stable release, latest patch)
- Compatible with Docker containerization
- Supports all required features and extensions
- Supported until November 2027

### pgvector 0.8.1 Extension

**Purpose:**
- Enable vector similarity search for AI embeddings
- Support semantic search in knowledge store
- Efficient nearest-neighbor queries

**Features:**
- IVFFlat and HNSW indexing algorithms
- Cosine distance, L2 distance, inner product metrics
- Optimized for large-scale vector data

---

## Multi-Provider Setup

The application includes comprehensive database setup for multiple AI providers.

### Automatic Setup (Recommended)

The first-time setup profile automatically creates and seeds provider tables:

```bash
# First time setup (includes provider configuration)
docker compose --profile setup up -d
```

This automatically runs:
1. `scripts/create-providers-table.sql` - Creates provider table
2. `scripts/seed-providers.sql` - Inserts default providers (OpenRouter, Hugging Face)

### Manual Setup (If Needed)

If automatic setup fails, manually run the SQL scripts:

```bash
# Create provider table
docker exec -i servicenow-helper-postgres-1 psql -U n8n -d n8n < scripts/create-providers-table.sql

# Seed default providers
docker exec -i servicenow-helper-postgres-1 psql -U n8n -d n8n < scripts/seed-providers.sql
```

### Verifying Provider Setup

Check that providers were created successfully:

```bash
docker exec -it servicenow-helper-postgres-1 psql -U n8n -d n8n -c "SELECT * FROM providers;"
```

Expected output:
```
 id |    name     |  display_name   |                    endpoint                     | is_active | priority
----+-------------+-----------------+-------------------------------------------------+-----------+----------
  1 | openrouter  | OpenRouter      | http://n8n:5678/webhook/openrouter-chat       | t         |      100
  2 | huggingface | Hugging Face    | http://n8n:5678/webhook/huggingface-chat      | t         |       90
```

---

## Provider Database Schema

The `providers` table manages AI provider configurations and endpoints.

### Table Structure

```sql
CREATE TABLE IF NOT EXISTS providers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(200) NOT NULL,
    endpoint TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 0,
    rate_limit_per_minute INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Column Definitions

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| `id` | SERIAL | Primary key | Auto-increment, NOT NULL |
| `name` | VARCHAR(100) | Provider identifier | UNIQUE, NOT NULL (e.g., `openrouter`, `huggingface`) |
| `display_name` | VARCHAR(200) | Human-readable name | NOT NULL (e.g., `OpenRouter`, `Hugging Face`) |
| `endpoint` | TEXT | N8N webhook endpoint URL | NOT NULL (e.g., `http://n8n:5678/webhook/openrouter-chat`) |
| `is_active` | BOOLEAN | Provider availability status | DEFAULT true |
| `priority` | INTEGER | Display/selection priority | DEFAULT 0 (higher = more prominent) |
| `rate_limit_per_minute` | INTEGER | Rate limiting (optional) | NULL allowed |
| `created_at` | TIMESTAMP | Record creation time | DEFAULT CURRENT_TIMESTAMP |
| `updated_at` | TIMESTAMP | Last modification time | DEFAULT CURRENT_TIMESTAMP |

### Default Providers

**OpenRouter (Priority 100):**
- **Name**: `openrouter`
- **Display Name**: `OpenRouter`
- **Endpoint**: `http://n8n:5678/webhook/openrouter-chat`
- **Features**: Comprehensive model catalog with 200+ models
- **Status**: Active

**Hugging Face (Priority 90):**
- **Name**: `huggingface`
- **Display Name**: `Hugging Face`
- **Endpoint**: `http://n8n:5678/webhook/huggingface-chat`
- **Features**: Open-source and cost-effective models
- **Status**: Active

### Adding Custom Providers

To add a new AI provider:

```sql
INSERT INTO providers (name, display_name, endpoint, is_active, priority)
VALUES ('custom_provider', 'Custom Provider', 'http://n8n:5678/webhook/custom-chat', true, 80);
```

**Requirements:**
1. Create corresponding N8N workflow webhook
2. Add API key environment variable: `{PROVIDER_NAME}_API_KEY`
3. Ensure endpoint URL is accessible from Next.js container
4. Test provider connectivity before enabling

---

## Agent Models Migration

The application includes a comprehensive database migration system for agent model configuration.

### Automatic Migration (Recommended)

The setup profile automatically runs the migration:

```bash
# First time setup (includes migration)
docker compose --profile setup up -d
```

This runs `scripts/migrate-to-agent-models.sql` automatically.

### Manual Migration (If Needed)

If automatic migration fails or if you need to re-run:

```bash
# Run migration script
docker exec -i servicenow-helper-postgres-1 psql -U n8n -d n8n < scripts/migrate-to-agent-models.sql
```

### Migration Features

**Key Features:**
- **Unique Constraints**: One model per agent per user
- **Backward Compatibility**: Preserves existing single-model configurations
- **Default Values**: Three default agents automatically created for new users
- **Migration Safety**: Comprehensive error handling and rollback capabilities
- **Idempotent**: Safe to run multiple times

**What the Migration Does:**
1. Creates `agent_models` table if not exists
2. Migrates existing model configurations from `user_settings`
3. Creates default agent configurations for all existing users
4. Sets up proper indexes and constraints
5. Validates data integrity

### Verifying Migration

Check migration success:

```bash
docker exec -it servicenow-helper-postgres-1 psql -U n8n -d n8n -c "SELECT * FROM agent_models LIMIT 9;"
```

Expected output:
```
 id | user_id | agent_name        | model_name                   | created_at          | updated_at
----+---------+-------------------+------------------------------+---------------------+---------------------
  1 | admin   | orchestration     | anthropic/claude-sonnet-4    | 2024-01-15 10:30:00 | 2024-01-15 10:30:00
  2 | admin   | planner_large     | anthropic/claude-sonnet-4    | 2024-01-15 10:30:00 | 2024-01-15 10:30:00
  3 | admin   | planner_small     | anthropic/claude-sonnet-4    | 2024-01-15 10:30:00 | 2024-01-15 10:30:00
  4 | admin   | coder_large       | anthropic/claude-sonnet-4    | 2024-01-15 10:30:00 | 2024-01-15 10:30:00
  5 | admin   | coder_small       | anthropic/claude-sonnet-4    | 2024-01-15 10:30:00 | 2024-01-15 10:30:00
  6 | admin   | architect_large   | anthropic/claude-sonnet-4    | 2024-01-15 10:30:00 | 2024-01-15 10:30:00
  7 | admin   | architect_small   | anthropic/claude-sonnet-4    | 2024-01-15 10:30:00 | 2024-01-15 10:30:00
  8 | admin   | process_sme_large | anthropic/claude-sonnet-4    | 2024-01-15 10:30:00 | 2024-01-15 10:30:00
  9 | admin   | process_sme_small | anthropic/claude-sonnet-4    | 2024-01-15 10:30:00 | 2024-01-15 10:30:00
```

---

## Database Schema

### `agent_models` Table

Stores individual AI model configurations per user per agent.

```sql
CREATE TABLE IF NOT EXISTS agent_models (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    agent_name VARCHAR(100) NOT NULL,
    model_name VARCHAR(500) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, agent_name)
);
```

**Column Definitions:**

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| `id` | SERIAL | Primary key | Auto-increment, NOT NULL |
| `user_id` | VARCHAR(255) | User identifier | NOT NULL |
| `agent_name` | VARCHAR(100) | Agent identifier | NOT NULL (orchestration, planner_large, planner_small, coder_large, coder_small, architect_large, architect_small, process_sme_large, process_sme_small) |
| `model_name` | VARCHAR(500) | Selected AI model | NOT NULL (e.g., `anthropic/claude-sonnet-4`) |
| `created_at` | TIMESTAMP | Record creation time | DEFAULT CURRENT_TIMESTAMP |
| `updated_at` | TIMESTAMP | Last modification time | DEFAULT CURRENT_TIMESTAMP |

**Constraints:**
- `UNIQUE(user_id, agent_name)` - One model per agent per user

**Supported Agents (9 Total):**

**Orchestration Agent:**
- `orchestration` - Coordinates overall response and routing between specialized agents

**Planner Agents:**
- `planner_large` - Strategic planning for complex tasks requiring deep analysis
- `planner_small` - Planning for well-defined, straightforward tasks

**Coder Agents:**
- `coder_large` - Complex code generation and implementations
- `coder_small` - Simple code snippets and well-defined implementations

**Architect Agents:**
- `architect_large` - Complex system architecture and framework design
- `architect_small` - Well-defined architecture and design tasks

**Process SME Agents:**
- `process_sme_large` - Complex workflow analysis and process optimization
- `process_sme_small` - Quick process questions and basic guidance

### `user_settings` Table

Stores user preferences and configuration.

```sql
CREATE TABLE IF NOT EXISTS user_settings (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL UNIQUE,
    show_welcome_section BOOLEAN DEFAULT true,
    default_search_mode BOOLEAN DEFAULT false,
    default_request_type VARCHAR(50) DEFAULT 'documentation',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Column Definitions:**

| Column | Type | Description | Default |
|--------|------|-------------|---------|
| `id` | SERIAL | Primary key | Auto-increment |
| `user_id` | VARCHAR(255) | User identifier | UNIQUE, NOT NULL |
| `show_welcome_section` | BOOLEAN | Show welcome info box | true |
| `default_search_mode` | BOOLEAN | Enable search by default | false |
| `default_request_type` | VARCHAR(50) | Default question type | 'documentation' |
| `created_at` | TIMESTAMP | Record creation time | CURRENT_TIMESTAMP |
| `updated_at` | TIMESTAMP | Last modification time | CURRENT_TIMESTAMP |

### `ServiceNowSupportTool` Table

Stores conversation history and Q&A pairs.

```sql
CREATE TABLE IF NOT EXISTS ServiceNowSupportTool (
    id SERIAL PRIMARY KEY,
    session_key VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    question TEXT NOT NULL,
    answer TEXT,
    request_type VARCHAR(50),
    search_mode BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**
- `session_key` - Fast session lookup
- `user_id` - User conversation filtering
- `created_at` - Chronological ordering

### `ai_models` Table

Stores AI model definitions and metadata.

```sql
CREATE TABLE IF NOT EXISTS ai_models (
    id SERIAL PRIMARY KEY,
    model_name VARCHAR(500) NOT NULL UNIQUE,
    provider_id INTEGER REFERENCES providers(id),
    display_name VARCHAR(500),
    is_free BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### `capabilities` Table

Tracks model capabilities (text, image, audio).

```sql
CREATE TABLE IF NOT EXISTS capabilities (
    id SERIAL PRIMARY KEY,
    model_id INTEGER REFERENCES ai_models(id) ON DELETE CASCADE,
    capability_type VARCHAR(50) NOT NULL,
    is_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Capability Types:**
- `text` - Text processing (all models)
- `image` - Image/visual analysis
- `audio` - Audio file processing

---

## Manual Setup

### Creating Database Tables

If you need to manually create tables (not recommended, use Docker setup):

```bash
# Connect to PostgreSQL container
docker exec -it servicenow-helper-postgres-1 psql -U n8n -d n8n

# Run table creation commands
\i scripts/create-providers-table.sql
\i scripts/seed-providers.sql
\i scripts/migrate-to-agent-models.sql
\i scripts/add-multimodal-capabilities.sql
\i scripts/create-agent-prompts-table.sql
\i scripts/seed-agent-prompts.sql
\i scripts/seed-ai-models.sql
```

### Verifying Database Setup

**Check all tables exist:**

```sql
SELECT tablename FROM pg_tables WHERE schemaname = 'public';
```

Expected tables:
- `ServiceNowSupportTool`
- `user_settings`
- `agent_models`
- `providers`
- `ai_models`
- `capabilities`

**Check table structures:**

```sql
\d providers
\d agent_models
\d user_settings
```

**Check data was seeded:**

```sql
SELECT COUNT(*) FROM providers;
SELECT COUNT(*) FROM ai_models;
SELECT COUNT(*) FROM agent_models;
```

---

## Environment Variables

### Required Database Variables

```env
# PostgreSQL Configuration
POSTGRES_USER=n8n
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=n8n

# N8N Database Connection
DB_TYPE=postgresdb
DB_POSTGRESDB_HOST=postgres
DB_POSTGRESDB_PORT=5432
DB_POSTGRESDB_DATABASE=n8n
DB_POSTGRESDB_USER=n8n
DB_POSTGRESDB_PASSWORD=your_secure_password

# Next.js Database Connection
DATABASE_URL=postgresql://n8n:your_secure_password@postgres:5432/n8n
```

### Connection String Format

```
postgresql://[user]:[password]@[host]:[port]/[database]
```

**Example:**
```
postgresql://n8n:password123@localhost:5432/n8n
```

---

## Database Maintenance

### Backup

**Manual Backup:**

```bash
# Backup entire database
docker exec servicenow-helper-postgres-1 pg_dump -U n8n -d n8n > backup.sql

# Backup specific table
docker exec servicenow-helper-postgres-1 pg_dump -U n8n -d n8n -t agent_models > agent_models_backup.sql
```

**Automatic Backups:**
- Configure cron jobs for scheduled backups
- Use PostgreSQL continuous archiving (WAL)
- Consider third-party backup solutions (pgBackRest, Barman)

### Restore

**From SQL Dump:**

```bash
# Restore entire database
docker exec -i servicenow-helper-postgres-1 psql -U n8n -d n8n < backup.sql

# Restore specific table
docker exec -i servicenow-helper-postgres-1 psql -U n8n -d n8n < agent_models_backup.sql
```

### Cleanup

**Remove old conversation history:**

```sql
DELETE FROM ServiceNowSupportTool WHERE created_at < NOW() - INTERVAL '90 days';
```

**Vacuum database:**

```bash
docker exec -it servicenow-helper-postgres-1 psql -U n8n -d n8n -c "VACUUM FULL;"
```

---

## Troubleshooting

### Common Issues

**Connection Refused:**
- **Symptom**: `ECONNREFUSED` errors when connecting to database
- **Solution**:
  - Verify PostgreSQL container is running: `docker ps | grep postgres`
  - Check database credentials in `.env`
  - Ensure correct port mapping in `docker-compose.yml`

**Migration Failed:**
- **Symptom**: Errors during `migrate-to-agent-models.sql` execution
- **Solution**:
  - Check PostgreSQL logs: `docker logs servicenow-helper-postgres-1`
  - Verify database permissions: user must have CREATE, INSERT rights
  - Check for table conflicts: migration is idempotent, safe to re-run

**Provider Table Missing:**
- **Symptom**: Errors about missing `providers` table
- **Solution**:
  - Manually run: `docker exec -i servicenow-helper-postgres-1 psql -U n8n -d n8n < scripts/create-providers-table.sql`
  - Verify: `docker exec -it servicenow-helper-postgres-1 psql -U n8n -d n8n -c "\dt"`

**Data Not Persisting:**
- **Symptom**: Data disappears after container restart
- **Solution**:
  - Verify volume mount in `docker-compose.yml`
  - Check volume exists: `docker volume ls | grep postgres`
  - Ensure proper permissions on volume mount

### Diagnostic Commands

**Check Database Status:**

```bash
docker exec -it servicenow-helper-postgres-1 psql -U n8n -d n8n -c "SELECT version();"
```

**Check Table Sizes:**

```bash
docker exec -it servicenow-helper-postgres-1 psql -U n8n -d n8n -c "
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
"
```

**Check Active Connections:**

```bash
docker exec -it servicenow-helper-postgres-1 psql -U n8n -d n8n -c "
SELECT datname, usename, application_name, client_addr, state
FROM pg_stat_activity
WHERE datname = 'n8n';
"
```

**Check pgvector Extension:**

```bash
docker exec -it servicenow-helper-postgres-1 psql -U n8n -d n8n -c "SELECT * FROM pg_extension WHERE extname = 'vector';"
```

---

## Performance Optimization

### Indexing Strategy

**Create indexes for frequently queried columns:**

```sql
-- Index for user lookup
CREATE INDEX idx_agent_models_user_id ON agent_models(user_id);

-- Index for session lookup
CREATE INDEX idx_conversations_session_key ON ServiceNowSupportTool(session_key);

-- Index for chronological queries
CREATE INDEX idx_conversations_created_at ON ServiceNowSupportTool(created_at DESC);

-- Index for provider lookup
CREATE INDEX idx_ai_models_provider_id ON ai_models(provider_id);
```

### Connection Pooling

**N8N automatically pools connections, but monitor:**

```sql
-- Check max connections
SHOW max_connections;

-- Current connection usage
SELECT count(*) FROM pg_stat_activity;
```

### Query Optimization

**Use EXPLAIN ANALYZE for slow queries:**

```sql
EXPLAIN ANALYZE SELECT * FROM agent_models WHERE user_id = 'admin';
```

**Optimize with appropriate indexes and query structure.**

---

## Security Considerations

### Access Control

**Database Users:**
- Use dedicated user for application (`n8n`)
- Limit permissions to required operations only
- Never use superuser for application connections

**Network Security:**
- Database only accessible within Docker network
- No external port exposure in production
- Use SSL/TLS for production deployments

### Data Protection

**Sensitive Data:**
- Passwords hashed before storage
- API keys stored in environment variables, not database
- User data isolated per user_id

**Encryption:**
- Enable PostgreSQL SSL in production
- Encrypt backups at rest
- Use secure channels for database communication

---

## Additional Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/15/)
- [pgvector Extension](https://github.com/pgvector/pgvector)
- [Docker PostgreSQL](https://hub.docker.com/_/postgres)
- [N8N Database Configuration](https://docs.n8n.io/hosting/configuration/configuration-methods/)

---

## Related Documentation

- [Architecture Guide](./ARCHITECTURE.md) - System architecture overview
- [Development Guide](./DEVELOPMENT.md) - Development setup and workflows
- [Environment Variables](./ENVIRONMENT_VARIABLES.md) - Complete environment configuration
- [Usage Guide](./USAGE.md) - Application usage and features
