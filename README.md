# ServiceNow Helper

<div align="center">

![ServiceNow Helper](https://github.com/user-attachments/assets/cc464f72-58f4-42b0-93fe-dac9daed6973)

**AI-Powered ServiceNow Assistance Tool**

*Built with Next.js 15 • AI-Powered by OpenRouter • Security-First Design*

[![Next.js](https://img.shields.io/badge/Next.js-15.4.4-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker)](https://www.docker.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)

---

*An intelligent ServiceNow assistance tool featuring **multi-agent AI architecture** that provides real-time streaming AI responses through an intuitive web interface and n8n workflow automation. Configure specialized agents with individual AI models for optimized performance.*

</div>

## Features

### **AI-Powered Intelligence**
Leverage cutting-edge artificial intelligence with **multi-agent AI architecture** and access to multiple text-based AI models through OpenRouter integration. Configure specialized AI agents for different tasks (Orchestration, Business Rules, Client Scripts), get smart ServiceNow question categorization, real-time streaming response generation, and context-aware assistance that understands your specific needs.

### **Robust Security**
Built with security-first principles featuring server-side JWT authentication, Next.js middleware security layers, and comprehensive security headers to protect your data and sessions.

### **Conversation Management** 
Complete conversation lifecycle management with full history tracking, advanced search and filtering capabilities, session continuity across interactions, and export functionality for documentation purposes.

### **Modern Experience**
Enjoy a responsive design built with TailwindCSS, progressive web app support for mobile devices, dark/light theme toggle for user preference, real-time streaming responses with automatic scrolling, and full accessibility optimization for inclusive usage.

### **Core Capabilities**

| Feature | Description | Technology |
|---------|-------------|------------|
| **Multi-Agent AI Architecture** | Specialized agents with configurable models | Agent-Specific Model Selection |
| **Question Types** | Documentation, Scripts, Troubleshooting | Intelligent Categorization |
| **Real-time Streaming** | Live AI response streaming | n8n Workflow Engine + SSE |
| **Session Management** | Unique keys & continuation | PostgreSQL Backend |
| **Search Enhancement** | ServiceNow KB integration | API Connections |
| **Agent Model Configuration** | Individual model selection per AI agent | Persistent Agent Settings |

## Architecture

### System Overview

```mermaid
graph TB
    subgraph "Frontend Layer"
        A[Next.js 15 App] --> B[React Components]
        B --> C[TailwindCSS]
        B --> D[TypeScript]
    end
    
    subgraph "Authentication Layer"
        E[JWT Middleware] --> F[Session Management]
    end
    
    subgraph "Backend Services"
        H[API Routes] --> I[n8n Workflows]
        H --> G[Streaming SSE]
        I --> J[AI Processing]
        G --> I
        H --> K[PostgreSQL]
    end
    
    subgraph "Multi-Agent AI Layer"
        L[OpenRouter] --> M[Orchestration Agent]
        L --> N[Business Rule Agent]
        L --> O[Client Script Agent]
        M --> P[Claude/GPT/Gemini]
        N --> Q[Claude/GPT/Gemini]
        O --> R[Claude/GPT/Gemini]
    end
    
    A --> E
    H --> L
    J --> K
```

### Request Flow Sequence

```mermaid
sequenceDiagram
    participant U as User
    participant B as Browser
    participant N as Next.js App
    participant W as n8n Workflow
    participant D as PostgreSQL
    participant A as Multi-Agent AI
    participant O as Orchestration Agent
    participant BR as Business Rule Agent
    participant CS as Client Script Agent

    U->>B: Enter question
    B->>N: POST /api/submit-question-stream (JWT + agent models)
    N->>W: Trigger streaming webhook with agent configuration
    
    W->>O: Route to Orchestration Agent (configured model)
    O->>BR: Delegate to Business Rule Agent (if needed)
    O->>CS: Delegate to Client Script Agent (if needed)
    O->>A: Coordinate multi-agent response (streaming)
    
    loop Real-time Streaming
        A-->>W: AI response chunk
        W-->>N: Stream chunk (SSE)
        N-->>B: Display incremental response
        B-->>U: Live UI updates
    end
    
    A-->>W: Final response
    W->>D: Store complete response
    W-->>N: Stream complete
    N-->>B: Final UI state
```

## Quick Start

### Prerequisites

```bash
# Required software
✅ Node.js 18+
✅ Docker & Docker Compose
✅ Git
```

### One-Click Setup with Docker

> **Pro Tip:** Use Docker for the fastest setup experience!

**Step 1:** Clone the repository
```bash
git clone https://github.com/your-username/servicenow-helper.git
cd servicenow-helper
```

**Step 2:** Configure environment
```bash
cp .env.example .env
# Edit .env with your API keys
```

**Required Environment Variables:**
```env
OPENAI_API_KEY=your_openai_api_key
OPENROUTER_API_KEY=your_openrouter_api_key
WEBHOOK_API_KEY=secure_random_string
JWT_SECRET=secure_jwt_secret
N8N_ENCRYPTION_KEY=secure_n8n_key
```

**Step 3:** Launch everything
```bash
# First time setup (includes configuration)
docker compose --profile setup up -d

# Subsequent runs
docker compose up -d
```

### Access Points

| Service | URL | Credentials |
|---------|-----|-------------|
| **ServiceNow Helper** | `http://localhost:3000` | `admin` / `password123` |
| **n8n Workflow Manager** | `http://localhost:5678` | `admin@servicenow-helper.local` / `Admin123` |

> **New:** Real-time streaming responses are now enabled by default, providing ChatGPT-like live response generation!

## Tech Stack

<div align="center">

### Frontend
![Next.js](https://img.shields.io/badge/Next.js-15.4.4-000000?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-3178C6?style=flat-square&logo=typescript)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.1.11-06B6D4?style=flat-square&logo=tailwindcss)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)

### Backend
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?style=flat-square&logo=postgresql)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker)
![n8n](https://img.shields.io/badge/n8n-Workflows-FF6D5A?style=flat-square&logo=n8n)

### AI & Security
![OpenRouter](https://img.shields.io/badge/OpenRouter-Multi--Model-FF4B4B?style=flat-square)
![JWT](https://img.shields.io/badge/JWT-Authentication-000000?style=flat-square&logo=jsonwebtokens)
![Axios](https://img.shields.io/badge/Axios-1.11.0-5A29E4?style=flat-square&logo=axios)

</div>

## Usage Guide

### **Getting Started**
1. **Login** with your credentials to access the secure dashboard
2. **Configure** your preferences in the settings panel
3. **Customize** default search modes and request types

### **Settings Configuration**

Access the settings via the hamburger menu to personalize your experience:

| Setting | Description | Options |
|---------|-------------|---------|
| **Welcome Section** | Toggle info box visibility | Show/Hide |
| **Default Search Mode** | Set preferred search behavior | On/Off |
| **Default Request Type** | Choose default category | Documentation, Recommendation, Script, Troubleshoot |
| **Agent Model Configuration** | Configure AI models for specialized agents | Individual model selection per agent |

#### **Multi-Agent AI Configuration**

Configure different AI models for specialized agents to optimize performance:

| Agent | Purpose | Configurable Models |
|-------|---------|--------------------|
| **Orchestration Agent** | Coordinates overall response and routing | Claude, GPT, Gemini, and more |
| **Business Rule Agent** | Specialized for ServiceNow business logic | Claude, GPT, Gemini, and more |
| **Client Script Agent** | Optimized for client-side scripting | Claude, GPT, Gemini, and more |

**How to configure agent models:**
1. Navigate to **Settings** via the hamburger menu
2. Expand individual agent cards to view configuration options
3. Select the optimal AI model for each agent's specialized tasks
4. Models are automatically saved and persisted across sessions

### **Asking Questions**

1. **Select Question Type:**
   - **Documentation** - Get comprehensive guides
   - **Recommendation** - Receive best practice advice
   - **Script** - Generate code solutions
   - **Troubleshoot** - Debug and resolve issues

2. **Submit Query** using the intuitive search interface
3. **Watch Live Responses** stream in real-time as the AI generates answers
4. **Enjoy Enhanced UX** with automatic scrolling to responses when streaming starts
5. **Access History** through the conversation panel with advanced filtering

### **File Attachments (Multimodal Support)**

Enhance your questions with file attachments when using multimodal AI models:

| Feature | Description | Requirements |
|---------|-------------|--------------|
| **File Upload** | Attach images, documents, and other files | Multimodal model selected |
| **Supported Types** | Images (PNG, JPG, GIF), PDFs, text files | Model with image/text capabilities |
| **Audio Support** | Audio file analysis and transcription | Model with audio capabilities |

**How to enable attachments:**
1. Navigate to **Settings** → **AI Models**
2. Define or select a model with multimodal capabilities:
   - ✅ **Text** - Basic text processing
   - ✅ **Image** - Visual content analysis  
   - ✅ **Audio** - Audio file processing
3. The attachment button will appear automatically in the search interface

> **Note:** File attachment functionality is only visible when a multimodal AI model is selected. Models become multimodal when you configure them with image, text, or audio capabilities in the settings menu.

## Database Configuration

### **Agent Models Migration**

The application includes a comprehensive database migration system for agent model configuration:

```bash
# Manual migration (if needed)
docker exec -i servicenow-helper-postgres-1 psql -U n8n -d n8n < scripts/migrate-to-agent-models.sql

# Automatic migration (included in setup)
docker compose --profile setup up -d
```

### **Database Schema**

The `agent_models` table stores individual model configurations per user:

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `user_id` | VARCHAR(255) | User identifier |
| `agent_name` | VARCHAR(100) | Agent identifier (orchestration, business_rule, client_script) |
| `model_name` | VARCHAR(500) | Selected AI model for the agent |
| `created_at` | TIMESTAMP | Record creation time |
| `updated_at` | TIMESTAMP | Last modification time |

**Key Features:**
- **Unique Constraints**: One model per agent per user
- **Backward Compatibility**: Preserves existing single-model configurations
- **Default Values**: Three default agents automatically created for new users
- **Migration Safety**: Comprehensive error handling and rollback capabilities

## Testing Suite

<div align="center">

![Jest](https://img.shields.io/badge/Jest-30.0.4-C21325?style=flat-square&logo=jest)
![Playwright](https://img.shields.io/badge/Playwright-1.54.0-2EAD33?style=flat-square&logo=playwright)

</div>

### **Unit Testing with Jest**
```bash
npm test              # Watch mode (development)
npm run test:ci       # Single run (CI/CD)
```

### **Integration Testing with Playwright**
```bash
npm run test:e2e            # Headless execution
npm run test:e2e:ui         # Interactive UI mode
npm run test:e2e:headed     # Visible browser mode
npm run test:e2e:debug      # Debug with dev tools
```

### **Test Coverage**
- Authentication flows and session management
- UI component visibility and interactions
- Cross-browser compatibility (Chromium, Firefox)
- Feature access and conversation management
- Responsive design validation

## Project Structure

```
servicenow-helper/
├── README.md, CLAUDE.md, GEMINI.md      # Documentation
├── package.json, package-lock.json      # Dependencies
├── Configuration files                   # ESLint, Jest, Next.js
├── Dockerfile, docker-compose.yml       # Containerization
├── docs/                                # Detailed documentation
├── n8n/                                 # Workflow templates
├── public/                              # Static assets & PWA
├── scripts/                             # Utility scripts
│   └── migrate-to-agent-models.sql     # Agent models database migration
├── src/                                 # Application source
│   ├── app/                             # Next.js App Router
│   │   ├── api/agent-models/           # Agent model configuration API
│   │   ├── api/settings/               # Settings API
│   │   ├── api/submit-question-stream/ # Streaming API
│   │   └── settings/                   # Settings page
│   ├── components/                      # React components
│   │   ├── Settings.tsx                   # Settings component
│   │   └── SearchInterface.tsx            # Main interface (streaming)
│   ├── contexts/                        # React contexts
│   │   ├── AgentModelContext.tsx          # Agent model state management
│   │   └── SettingsContext.tsx            # Settings state
│   ├── lib/                             # Utilities
│   │   ├── streaming-client.ts            # Streaming client
│   │   └── database.ts                    # Database layer (with AgentModelManager)
│   └── types/                           # TypeScript definitions (streaming)
└── tests/                               # Test files and mocks
```

## Available Commands

<div align="center">

| Command | Description | Usage |
|---------|-------------|-------|
| `npm run dev` | Development server | Local development |
| `npm run build` | Production build | Deployment prep |
| `npm run start` | Production server | Live deployment |
| `npm run lint` | Code quality check | Code review |
| `npm test` | Unit testing | Component testing |
| `npm run test:e2e` | Integration testing | Full app testing |

</div>

### Docker Commands

```bash
# First time setup
docker compose --profile setup up -d

# Regular operations
docker compose up -d                    # Start services
docker compose down                     # Stop services
docker compose logs -f                  # View logs
docker compose up -d --build           # Rebuild & start
```

## Documentation

<div align="center">

| Guide | Focus | Link |
|----------|----------|---------|
| **Setup** | Installation & Configuration | [Getting Started](./docs/SETUP.md) |
| **PWA** | Progressive Web App Features | [PWA Guide](./docs/PWA.md) |
| **Environment** | Variable Configuration | [Environment](./docs/ENVIRONMENT_VARIABLES.md) |
| **Development** | Contributing & Development | [Dev Guide](./docs/DEVELOPMENT.md) |
| **Testing** | Testing Strategies | [Testing](./docs/TESTING.md) |
| **Contributing** | Contribution Guidelines | [Contributing](./docs/CONTRIBUTING.md) |

</div>

## Contributing

We welcome contributions! Please see our [Contributing Guide](./docs/CONTRIBUTING.md) for details on:

- Bug reports and feature requests
- Code contributions and pull requests  
- Documentation improvements
- Testing and quality assurance

## License

<div align="center">

**MIT License**

*This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.*

---
</div>
