# ServiceNow Helper

<div align="center">

![ServiceNow Helper](https://github.com/user-attachments/assets/cc464f72-58f4-42b0-93fe-dac9daed6973)

**AI-Powered ServiceNow Assistance Tool**

*Built with Next.js 15.5.2 • AI-Powered by OpenRouter • Security-First Design*

[![Next.js](https://img.shields.io/badge/Next.js-15.5.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
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

### **Knowledge Store Management**
Comprehensive Knowledge Store management with dedicated interface for viewing, searching, and organizing saved Q&A pairs. Features bulk operations, quality metrics tracking, and metadata management for curated knowledge content.

### **Modern Experience**
Enjoy a responsive design built with TailwindCSS, progressive web app support for mobile devices, dark/light theme toggle for user preference, real-time streaming responses with automatic scrolling, and full accessibility optimization for inclusive usage.

### **Core Capabilities**

| Feature | Description | Technology |
|---------|-------------|------------|
| **Multi-Agent AI Architecture** | Specialized agents with configurable models | Agent-Specific Model Selection |
| **Question Types** | Documentation, Scripts, Troubleshooting | Intelligent Categorization |
| **Real-time Streaming** | Live AI response streaming with performance optimizations | n8n Workflow Engine + SSE |
| **Session Management** | Unique keys & continuation | PostgreSQL Backend |
| **Search Enhancement** | ServiceNow KB integration | API Connections |
| **Agent Model Configuration** | Individual model selection per AI agent | Persistent Agent Settings |
| **Knowledge Store Management** | Comprehensive Q&A management interface | React Components + PostgreSQL |
| **Script Deployment** | Send generated scripts directly to ServiceNow | N8N Client + ServiceNow API |
| **Performance Monitoring** | Core Web Vitals & streaming analytics | Performance Monitor + Bundle Analysis |
| **Progressive Web App** | Offline support & native app experience | Service Worker + PWA Manifest |
| **Advanced Testing** | Comprehensive test suite with 347 passing tests | Jest + Playwright + Quality Gates |
| **Bundle Analysis** | Webpack bundle analyzer integration | Performance Insights |
| **Code Quality** | Enhanced ESLint rules & pre-commit hooks | Automated Quality Assurance |
| **Streaming Optimizations** | Virtual scrolling, React.memo, smart batching | Phase 1 Performance Enhancements |

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
        L --> SI[Script Include Agent]
        M --> P[Claude/GPT/Gemini]
        N --> Q[Claude/GPT/Gemini]
        O --> R[Claude/GPT/Gemini]
        SI --> S[Claude/GPT/Gemini]
    end
    
    subgraph "ServiceNow Integration"
        S[ServiceNow Helper Companion App] --> T[Staging Tables]
        T --> U[ServiceNow Instance]
        I --> S
    end
    
    A --> E
    H --> L
    J --> K
    I --> S
```

### ServiceNow Helper Companion App

The ServiceNow Helper includes a companion application (`848250f153632210030191e0a0490ed5/`) that facilitates seamless integration between the external ServiceNow Helper tool and your ServiceNow instance. This companion app serves as a bridge, implementing a staging table approach for secure and reliable data synchronization.

**Key Features:**
- **Staging Table Architecture**: When data needs to be synchronized to ServiceNow, the integration creates records in staging tables within the companion app
- **Asynchronous Processing**: The companion app processes staged records and synchronizes data with the ServiceNow instance
- **Security & Compliance**: Maintains ServiceNow security policies and audit trails
- **Role-Based Access**: Includes predefined roles for administration and user access:
  - `servicenow helper admin` - Administrates the ServiceNow Helper application and configurations
  - `servicenow helper user` - Able to view data in the ServiceNow Helper application

**Installation:**
The companion app can be installed directly into your ServiceNow instance using the provided XML files in the `848250f153632210030191e0a0490ed5/` directory. The folder name corresponds to the sys_id assigned by ServiceNow upon app creation.

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
    participant SI as Script Include Agent

    U->>B: Enter question
    B->>N: POST /api/submit-question-stream (JWT + agent models)
    N->>W: Trigger streaming webhook with agent configuration
    
    W->>O: Route to Orchestration Agent (configured model)
    O->>BR: Delegate to Business Rule Agent (if needed)
    O->>CS: Delegate to Client Script Agent (if needed)
    O->>SI: Delegate to Script Include Agent (if needed)
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
✅ Node.js 22+
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
![Next.js](https://img.shields.io/badge/Next.js-15.5.2-000000?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-3178C6?style=flat-square&logo=typescript)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.1.11-06B6D4?style=flat-square&logo=tailwindcss)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)

### Backend
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15.4-336791?style=flat-square&logo=postgresql)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker)
![n8n](https://img.shields.io/badge/n8n-Workflows-FF6D5A?style=flat-square&logo=n8n)

### Performance & Quality
![Jest](https://img.shields.io/badge/Jest-30.1.1-C21325?style=flat-square&logo=jest)
![Playwright](https://img.shields.io/badge/Playwright-1.55.0-2EAD33?style=flat-square&logo=playwright)
![ESLint](https://img.shields.io/badge/ESLint-9.34.0-4B32C3?style=flat-square&logo=eslint)
![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8?style=flat-square&logo=pwa)

### AI & Security
![OpenRouter](https://img.shields.io/badge/OpenRouter-Multi--Model-FF4B4B?style=flat-square)
![JWT](https://img.shields.io/badge/JWT-Authentication-000000?style=flat-square&logo=jsonwebtokens)
![Axios](https://img.shields.io/badge/Axios-1.11.0-5A29E4?style=flat-square&logo=axios)
![pgvector](https://img.shields.io/badge/pgvector-0.8.0-4169E1?style=flat-square)

</div>

## Usage Guide

### **Getting Started**
1. **Login** with your credentials to access the secure dashboard
2. **Configure** your preferences in the settings panel
3. **Customize** default search modes and request types
4. **Manage** your knowledge store entries via the dedicated management interface

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
| **Script Include Agent** | Specializes in reusable server-side JavaScript libraries | Claude, GPT, Gemini, and more |

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
5. **Deploy Scripts** directly to ServiceNow using the "Send to ServiceNow" button on script code blocks
6. **Access History** through the conversation panel with advanced filtering
7. **Save to Knowledge Store** by clicking the "Add to Knowledge Store" button on helpful responses
8. **Manage Knowledge Store** through the dedicated management interface accessible via the hamburger menu

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

### **Script Deployment to ServiceNow**

Deploy AI-generated scripts directly to your ServiceNow instance with seamless integration:

| Feature | Description | Script Types |
|---------|-------------|--------------|
| **One-Click Deployment** | Send scripts directly from code blocks | Business Rules, Script Includes, Client Scripts |
| **Type Selection Modal** | Choose the correct ServiceNow script type | Automated table targeting |
| **Real-time Feedback** | Instant success/failure notifications | User-friendly error messages |
| **Secure Integration** | Authentication-protected API endpoints | N8N workflow processing |

**How to deploy scripts:**
1. **Generate Scripts** by asking AI for ServiceNow code solutions
2. **Identify Code Blocks** with syntax highlighting in responses
3. **Click Send Button** located next to Copy and Fullscreen buttons on code blocks
4. **Select Script Type** from the modal (Business Rule, Script Include, Client Script)
5. **Confirm Deployment** and receive success confirmation with sys_id
6. **View in ServiceNow** - scripts are created directly in your ServiceNow instance

**Supported Script Types:**
- **Business Rules** → `sys_script` table
- **Script Includes** → `sys_script_include` table  
- **Client Scripts** → `sys_script_client` table

**Integration Benefits:**
- **Seamless Workflow**: No copy-paste needed between ServiceNow Helper and ServiceNow
- **Error Prevention**: Automated table targeting prevents deployment mistakes
- **Audit Trail**: All deployments tracked through ServiceNow's standard audit system
- **Security**: Authentication required and processed through secure N8N workflows

### **Knowledge Store Management**

Efficiently manage your curated Q&A Knowledge Store with comprehensive management features:

| Feature | Description | Access |
|---------|-------------|--------|
| **Browse All Entries** | View complete list of saved Q&A pairs | Hamburger Menu → Knowledge Store |
| **Search & Filter** | Find entries by keywords in questions/answers | Search bar in management interface |
| **Bulk Operations** | Select and delete multiple entries simultaneously | Checkbox selection + bulk actions |
| **Quality Metrics** | View usage counts and quality scores | Displayed on each entry |
| **Metadata Display** | See creation dates, categories, and tags | Entry details view |
| **Individual Deletion** | Remove specific entries with confirmation | Delete button on each entry |

**How to manage your knowledge store:**
1. **Access Management Interface** via Hamburger Menu → Knowledge Store
2. **Browse Entries** to see all saved Q&A pairs with metadata
3. **Search Content** using the search bar to find specific entries
4. **View Details** by clicking entries to see full answers and metadata
5. **Delete Entries** individually or select multiple for bulk deletion
6. **Navigate Back** using the close button to return to main interface

**Knowledge Store Benefits:**
- **Automated Integration**: AI automatically uses knowledge store content for enhanced responses
- **Quality Tracking**: Monitor which entries are most valuable with usage metrics
- **Organized Content**: Categories and tags help organize and find relevant information
- **Bulk Management**: Efficiently manage large collections of saved Q&A pairs

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
| `agent_name` | VARCHAR(100) | Agent identifier (orchestration, business_rule, client_script, script_include) |
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

![Jest](https://img.shields.io/badge/Jest-30.1.1-C21325?style=flat-square&logo=jest)
![Playwright](https://img.shields.io/badge/Playwright-1.55.0-2EAD33?style=flat-square&logo=playwright)

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
├── 848250f153632210030191e0a0490ed5/    # ServiceNow Helper Companion App
│   ├── README.md                        # Companion app documentation
│   ├── checksum.txt                     # File integrity verification
│   ├── sys_app_848250f153632210030191e0a0490ed5.xml  # Main app definition
│   └── update/                          # ServiceNow update sets
│       ├── sys_embedded_help_role_*.xml # Help role assignments
│       └── sys_user_role_*.xml         # User roles (admin/user)
├── docs/                                # Detailed documentation
├── n8n/                                 # Workflow templates
├── public/                              # Static assets & PWA
├── scripts/                             # Utility scripts
│   └── migrate-to-agent-models.sql     # Agent models database migration
├── src/                                 # Application source
│   ├── app/                             # Next.js App Router
│   │   ├── api/agent-models/           # Agent model configuration API
│   │   ├── api/knowledge-store/        # Knowledge store management API
│   │   ├── api/send-script/            # Script deployment API
│   │   ├── api/settings/               # Settings API
│   │   ├── api/submit-question-stream/ # Streaming API
│   │   ├── knowledge-store/            # Knowledge store management page
│   │   └── settings/                   # Settings page
│   ├── components/                      # React components
│   │   ├── CodeBlock.tsx                  # Enhanced code blocks with send functionality
│   │   ├── KnowledgeStorePanel.tsx        # Knowledge store management interface
│   │   ├── KnowledgeStoreItem.tsx         # Individual knowledge store entry display
│   │   ├── SendScriptButton.tsx           # Script deployment button component
│   │   ├── SendScriptModal.tsx            # Script type selection modal
│   │   ├── Settings.tsx                   # Settings component
│   │   └── SearchInterface.tsx            # Main interface (streaming)
│   ├── contexts/                        # React contexts
│   │   ├── AgentModelContext.tsx          # Agent model state management
│   │   └── SettingsContext.tsx            # Settings state
│   ├── lib/                             # Utilities
│   │   ├── n8n-client.ts                  # N8N client with knowledge store methods
│   │   ├── streaming-client.ts            # Streaming client
│   │   └── database.ts                    # Database layer (with AgentModelManager)
│   └── types/                           # TypeScript definitions (with knowledge store types)
└── tests/                               # Test files and mocks
```

## Available Commands

<div align="center">

| Command | Description | Usage |
|---------|-------------|-------|
| `npm run dev` | Development server | Local development |
| `npm run build` | Production build with PWA | Deployment prep |
| `npm run build:analyze` | Build with bundle analyzer | Performance insights |
| `npm run start` | Production server | Live deployment |
| `npm run lint` | Enhanced ESLint checks | Code quality |
| `npm run type-check` | TypeScript validation | Type safety |
| `npm test` | Jest unit tests (watch mode) | Component testing |
| `npm run test:watch` | Jest tests in watch mode | Development testing |
| `npm run test:coverage` | Jest with coverage reports | Test coverage |
| `npm run test:ci` | Jest for CI/CD | Automated testing |
| `npm run test:performance` | Performance-specific tests | Performance validation |
| `npm run test:e2e` | Playwright integration tests | Full app testing |
| `npm run test:e2e:ui` | Playwright with UI mode | Interactive testing |
| `npm run test:e2e:headed` | Playwright headed mode | Visual testing |
| `npm run test:e2e:debug` | Playwright debug mode | Test debugging |

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
