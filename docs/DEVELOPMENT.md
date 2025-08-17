# Development Guide

## Development Commands

- `docker compose up -d` - **Recommended method.** Starts all services.
- `docker compose --profile setup up -d` - **First time setup.** Starts all services and runs initial setup.
- `./scripts/setup-n8n.sh` - Manual setup script (only needed if automatic setup fails).
- `npm run dev` - Start the Next.js development server (requires separate n8n/Postgres instances).
- `npm run build` - Build production application.
- `npm run start` - Start production server.
- `npm run lint` - Run ESLint checks.
- `npm test` - Run Jest unit tests (non-interactive mode).
- `npm run test:watch` - Run Jest unit tests in watch mode (interactive).
- `npm run test:e2e` - Run Playwright integration tests.
- `npm run test:e2e:ui` - Run Playwright tests with UI mode.
- `npm run test:e2e:headed` - Run Playwright tests in headed mode.
- `npm run test:e2e:debug` - Run Playwright tests in debug mode.

## Architecture Overview

The application follows a containerized, multi-service architecture orchestrated by Docker Compose.

### Core Components
- **Next.js 15.4.4 Frontend**: A web application for user interaction, authentication, and displaying results.
- **n8n Workflow Engine**: Handles the backend AI processing with **multi-agent architecture**, integrating with OpenRouter to provide access to multiple AI models for specialized agents.
- **PostgreSQL Database**: Provides data storage for n8n and session storage for the Next.js app.

### Authentication System
- JWT-based authentication using httpOnly cookies.
- Auth middleware in `src/lib/auth-middleware.ts` verifies tokens server-side.
- `AuthContext` provides client-side authentication state management.

### API Integration & Data Flow (Multi-Agent Streaming Architecture)
1. User submits a question via the `SearchInterface` in the Next.js app.
2. The request is sent to `/api/submit-question-stream`, which is protected by JWT authentication and includes agent model configurations.
3. The Next.js API establishes a **Server-Sent Events (SSE) streaming connection** to the n8n webhook.
4. **Real-time streaming**: Response chunks are streamed back immediately as n8n generates them using the configured agent models.
5. The UI updates in real-time, displaying content as it streams, similar to ChatGPT/Claude interfaces.
6. Enhanced cancellation system allows users to stop streaming requests at any time.

### Settings System
- **User Settings Management**: Persistent user preferences stored in PostgreSQL database
- **Agent Model Configuration**: Individual AI model selection per specialized agent
- **Settings Context**: React context providing settings state management and API integration
- **AgentModelContext**: Dedicated React context for multi-agent model state management
- **Authentication-Aware**: Settings are user-specific and require authentication to save
- **Real-time Sync**: Settings changes immediately reflect across the application
- **Default Fallbacks**: Works gracefully when unauthenticated with sensible defaults

### Multi-Agent Architecture
- **Orchestration Agent**: Coordinates overall response and routing between different specialized agents
- **Business Rule Agent**: Specialized for ServiceNow business logic and rule configuration
- **Client Script Agent**: Optimized for client-side scripting and UI component development
- **Scalable Design**: Architecture supports unlimited agents without code changes
- **Individual Model Configuration**: Each agent can use a different AI model optimized for its tasks

## Technical Stack

- **Frontend**: Next.js 15.4.4 (App Router), React 19.0.0, TypeScript 5.9.2, TailwindCSS 4.1.11
- **Backend/Workflow**: n8n
- **Database**: PostgreSQL (with tables: `ServiceNowSupportTool` for conversations, `user_settings` for user preferences, `agent_models` for agent model configurations)
- **Containerization**: Docker, Docker Compose (Dockerfile and docker-compose.yml in root)
- **Libraries**: Axios 1.11.0, ReactMarkdown 10.1.0, Lucide React 0.539.0, JWT 9.0.2
- **Performance**: Dynamic imports, lazy loading, React.memo, and code splitting
- **Security**: Comprehensive security headers, XSS protection, and CSRF prevention
- **Accessibility**: ARIA attributes, keyboard navigation, and screen reader support

## Key Development Files

### Authentication & Core
-   `src/lib/auth-middleware.ts` - Authentication middleware
-   `src/contexts/AuthContext.tsx` - Authentication state management
-   `src/components/SearchInterface.tsx` - Main application interface with streaming support

### Multi-Agent System
-   `src/contexts/AgentModelContext.tsx` - Agent model state management
-   `src/app/api/agent-models/route.ts` - Agent model configuration API
-   `src/lib/database.ts` - Database layer with AgentModelManager
-   `scripts/migrate-to-agent-models.sql` - Database migration for agent models

### Streaming Architecture
-   `src/app/api/submit-question-stream/route.ts` - Streaming question submission API
-   `src/lib/streaming-client.ts` - Core streaming connection management
-   `src/lib/streaming-cancellation.ts` - Enhanced cancellation system
-   `src/hooks/useNetworkStatus.ts` - Network monitoring and connection health

### Configuration & Setup
-   `n8n/init/workflow-template.json` - N8N workflow template for AI processing
-   `scripts/setup-n8n.sh` - Automated setup script for N8N configuration
-   `docker-compose.yml` - Multi-service container orchestration
-   `Dockerfile` - Next.js application container definition

## Best Practices Implementation

### Performance Optimizations
- **Dynamic Imports**: Heavy components (`HistoryPanel`, `ReactMarkdown`) are lazy-loaded
- **React.memo**: Expensive components (`HistoryItem`, `ThemeToggle`, `StepGuide`) are memoized
- **Code Splitting**: Automatic code splitting with Suspense boundaries
- **Bundle Optimization**: Selective imports for optimal tree-shaking

### Error Handling & UX
- **Error Boundaries**: Route-level error handling with `src/app/error.tsx`
- **Loading States**: Global loading UI with `src/app/loading.tsx`
- **Fallback Components**: Suspense fallbacks for lazy-loaded components

### Security Enhancements
- **Security Headers**: Comprehensive headers in `next.config.ts`
- **API Protection**: Enhanced API route security with JWT authentication

### Accessibility Improvements
- **ARIA Attributes**: Proper ARIA labels, roles, and states
- **Keyboard Navigation**: Full keyboard support (Escape, Enter, Space)
- **Skip Links**: Skip-to-content links for screen readers
- **Focus Management**: Proper focus handling for modals and dropdowns