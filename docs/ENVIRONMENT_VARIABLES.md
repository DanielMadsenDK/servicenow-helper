# Environment Variables

This document describes all environment variables used by the ServiceNow AI Support Tool.

## Required Variables

These variables must be configured in your `.env` file:

| Variable | Description | Example |
|----------|-------------|---------|
| `OPENAI_API_KEY` | OpenAI API key | `sk-proj-...` |
| `OPENROUTER_API_KEY` | OpenRouter API key (provides access to multiple AI models for multi-agent architecture) | `sk-or-v1-...` |
| `WEBHOOK_API_KEY` | Secure key for webhook authentication | `564669d2-7b3c-4c24-b44a-be72461ccd4f` |
| `JWT_SECRET` | JWT signing secret | `your-jwt-secret-here` |
| `N8N_ENCRYPTION_KEY` | n8n credential encryption key (must be secure) | `your-secure-n8n-encryption-key-here` |

## Optional Variables

These variables have sensible defaults but can be customized:

| Variable | Description | Default |
|----------|-------------|---------|
| `AUTH_USERNAME` | Default login username | `admin` |
| `AUTH_PASSWORD` | Default login password | `password123` |
| `NODE_ENV` | Application environment | `development` |
| `ANALYZE` | Enable webpack bundle analyzer | `false` |
| `TEST_AUTH_USERNAME` | Test authentication username | `admin` |
| `TEST_AUTH_PASSWORD` | Test authentication password | `password123` |

## Auto-configured Variables

These variables are automatically set by Docker Compose and typically don't need manual configuration:

| Variable | Description | Default (Docker) |
|----------|-------------|------------------|
| `N8N_WEBHOOK_URL` | Initial webhook endpoint | `http://n8n:5678/webhook/d8f43068-431e-405b-bdbb-e7dba6862299` |
| `N8N_WEBHOOK_URL_RESPONSE` | Response polling endpoint | `http://n8n:5678/webhook/3d871efe-423d-422d-b431-33a1f8888e2c` |
| `N8N_API_KEY` | Internal API key for webhook access | Same as `WEBHOOK_API_KEY` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://n8n:n8n_password@localhost:5432/n8n` |

## Security Notes

- **API Keys**: Store securely and never commit to version control
- **JWT_SECRET**: Use a long, random string for production
- **N8N_ENCRYPTION_KEY**: Must be a securely generated random string
- **WEBHOOK_API_KEY**: Used to secure webhook endpoints between services

## Example .env File

```env
# API Keys - Required for automated setup
OPENAI_API_KEY=your-openai-api-key-here
OPENROUTER_API_KEY=your-openrouter-api-key-here
WEBHOOK_API_KEY=your-secure-webhook-api-key-here

# N8N Configuration  
N8N_WEBHOOK_URL=http://localhost:5678/webhook/d8f43068-431e-405b-bdbb-e7dba6862299
N8N_WEBHOOK_URL_RESPONSE=http://localhost:5678/webhook/3d871efe-423d-422d-b431-33a1f8888e2c
N8N_API_KEY=your-api-key-here

# JWT Configuration
JWT_SECRET=your-jwt-secret-here

# N8N Encryption Key - MUST be a securely generated random string
N8N_ENCRYPTION_KEY=your-secure-n8n-encryption-key-here

# Database Configuration (for session storage if needed)
DATABASE_URL=postgresql://n8n:n8n_password@localhost:5432/n8n

# App Configuration
NODE_ENV=development

# Authentication
AUTH_USERNAME=admin
AUTH_PASSWORD=password123
```
