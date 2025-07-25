# ServiceNow AI Support Tool - Automated Setup

This document describes the fully automated setup process for the ServiceNow AI Support Tool.

## Quick Start

1. **Copy and configure environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

2. **First time setup (recommended):**
   ```bash
   docker compose --profile setup up -d
   ```

   **OR start the application normally:**
   ```bash
   docker compose up -d
   ```

3. **If needed, run manual setup:**
   ```bash
   ./scripts/setup-n8n.sh
   ```

4. **Access the application:**
   - Frontend: http://localhost:3000
   - N8N (optional): http://localhost:5678

That's it! Fully automated setup complete.

## Environment Variables

Create a `.env` file with the following variables:

```env
# Required API Keys
OPENAI_API_KEY=your-openai-api-key-here
OPENROUTER_API_KEY=your-openrouter-api-key-here
WEBHOOK_API_KEY=your-secure-webhook-api-key-here

# Application Configuration
JWT_SECRET=your-jwt-secret-here
AUTH_USERNAME=admin
AUTH_PASSWORD=password123

# N8N Configuration  
N8N_WEBHOOK_URL=http://localhost:5678/webhook/d8f43068-431e-405b-bdbb-e7dba6862299
N8N_WEBHOOK_URL_RESPONSE=http://localhost:5678/webhook/3d871efe-423d-422d-b431-33a1f8888e2c
N8N_API_KEY=your-api-key-here

# N8N Encryption Key - MUST be a securely generated random string
N8N_ENCRYPTION_KEY=your-secure-n8n-encryption-key-here

# Database Configuration (for session storage if needed)
DATABASE_URL=postgresql://n8n:n8n_password@localhost:5432/n8n

# App Configuration
NODE_ENV=devel
```

## What Gets Automated

The setup process automatically:

1. **Creates N8N default user** with email `admin@servicenow-helper.local` and password `admin123`
2. **Sets up API credentials** for OpenAI and OpenRouter using your environment variables
3. **Creates webhook authentication** using your specified API key
4. **Configures PostgreSQL connections** for both N8N and the application
5. **Imports and activates the workflow** with correct credential mappings
6. **Creates the required database table** for tracking requests

## Architecture

- **PostgreSQL**: Shared database for N8N workflows, chat memory, and session storage
- **N8N**: Workflow engine with automated credential setup
- **Next.js**: Frontend application with authentication

## Default Credentials

- **Application**: Use AUTH_USERNAME/AUTH_PASSWORD from your .env file
- **N8N Admin**: admin@servicenow-helper.local / admin123

## Troubleshooting

### If the setup fails:
1. Check that all API keys are valid in your `.env` file
2. Ensure ports 3000 and 5678 are available
3. Clear volumes and restart: `docker compose down -v && docker compose up -d`

### To view initialization logs:
```bash
docker compose logs n8n
```

### To reset the setup:
```bash
docker compose down -v
docker compose up -d
```

## Manual Override

If you need to manually configure N8N:
1. Access N8N at http://localhost:5678
2. Login with admin@servicenow-helper.local / admin123
3. The credentials will already be set up from your environment variables

## Files Created

The automated setup creates:
- `/n8n/init/setup.sh` - Main initialization script
- `/n8n/init/update-workflow.sh` - Workflow credential updater
- `/n8n/init/workflow-template.json` - Workflow template with placeholders
- `/n8n/init/workflow.json` - Generated workflow with correct credential IDs

## Security Notes

- All API keys are stored securely in N8N's encrypted credential system
- Webhook endpoints are protected with API key authentication
- Database connections use internal Docker network communication
- No sensitive data is logged or exposed

## Advanced Configuration

### Custom Database Settings
Modify the PostgreSQL environment variables in docker-compose.yml if needed.

### Custom N8N Configuration
Additional N8N settings can be added to the docker-compose.yml environment section.

### Workflow Modifications
The workflow will be automatically imported. To modify it:
1. Edit `n8n/init/workflow-template.json`
2. Restart the containers: `docker compose restart n8n`