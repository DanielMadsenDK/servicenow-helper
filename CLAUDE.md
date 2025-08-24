# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a multi-service application called "ServiceNow Helper" that provides an AI-powered interface for ServiceNow assistance featuring **multi-agent AI architecture**. The entire system is containerized using Docker Compose.

The core components are:
- **Next.js 15.4.4 Frontend**: A web application for user interaction, authentication, and displaying results with agent model configuration, knowledge store management, and multimodal capabilities.
- **n8n Workflow Engine**: Handles the backend AI processing with multi-agent support, integrating with services like Anthropic Claude.
- **PostgreSQL Database**: Provides data storage for n8n, session storage, agent model configurations, and knowledge store for the Next.js app.
- **ServiceNow Helper Companion App**: A ServiceNow application that facilitates integration using staging table architecture for secure data synchronization.

## Development Commands

- `docker compose up -d` - **Recommended method.** Starts all services.
- `docker compose --profile setup up -d` - **First time setup.** Starts all services and runs initial setup.
- `./scripts/setup-n8n.sh` - Manual setup script (only needed if automatic setup fails).
- `npm run dev` - Start the Next.js development server (requires separate n8n/Postgres instances).
- `npm run build` - Build production application.
- `npm run start` - Start production server.
- `npm run lint` - Run ESLint checks.
- `npm test` - Run Jest unit tests (non-interactive mode).
- `npm run test:ci` - Run Jest unit tests for CI/CD environments.
- `npm run test:e2e` - Run Playwright integration tests.
- `npm run test:e2e:ui` - Run Playwright tests with UI mode.
- `npm run test:e2e:headed` - Run Playwright tests in headed mode.
- `npm run test:e2e:debug` - Run Playwright tests in debug mode.

## Architecture

The application follows a containerized, multi-service architecture orchestrated by Docker Compose.

### Authentication System
- JWT-based authentication using httpOnly cookies.
- Auth middleware in `src/lib/auth-middleware.ts` verifies tokens server-side.
- `AuthContext` provides client-side authentication state management.

### API Integration & Data Flow (Multi-Agent Streaming Architecture)
1.  User submits a question via the `SearchInterface` in the Next.js app.
2.  The request is sent to `/api/submit-question-stream`, which is protected by JWT authentication and includes agent model configurations.
3.  The Next.js API establishes a **Server-Sent Events (SSE) streaming connection** to the n8n webhook with agent-specific model settings.
4.  **Real-time streaming**: Response chunks are streamed back immediately as n8n generates them using configured agent models (Orchestration, Business Rule, Client Script).
5.  The UI updates in real-time, displaying content as it streams, similar to ChatGPT/Claude interfaces.
6.  Enhanced cancellation system allows users to stop streaming requests at any time.

### Settings System
- **User Settings Management**: Persistent user preferences stored in PostgreSQL database
- **Agent Model Configuration**: Individual AI model selection per specialized agent with expandable UI cards
- **AI Model Management**: Comprehensive AI model management with capabilities tracking (text, image, audio)
- **Settings Context**: React context providing settings state management and API integration
- **AgentModelContext**: Dedicated React context for multi-agent model state management
- **AIModelContext**: React context for AI model state and configuration management
- **ThemeContext**: Dark/light theme management with persistent user preferences
- **Authentication-Aware**: Settings are user-specific and require authentication to save
- **Real-time Sync**: Settings changes immediately reflect across the application
- **Default Fallbacks**: Works gracefully when unauthenticated with sensible defaults

### Multi-Agent AI Architecture
- **Orchestration Agent**: Coordinates overall response and routing between different specialized agents
- **Business Rule Agent**: Specialized for ServiceNow business logic and rule configuration
- **Client Script Agent**: Optimized for client-side scripting and UI component development
- **Scalable Design**: Architecture supports unlimited agents without code changes
- **Individual Model Configuration**: Each agent can use a different AI model optimized for its tasks
- **Database Migration**: Comprehensive migration system from single-model to multi-agent configuration
- **Backward Compatibility**: Preserves existing user settings during migration

### Streaming System Architecture
- **Real-time Responses**: Server-Sent Events (SSE) provide immediate AI response streaming
- **Enhanced UX**: Chat-like interface with typing indicators, streaming cursors, and status updates
- **Robust Cancellation**: Multi-layer cancellation system with `StreamingCancellationManager`
- **Connection Management**: Automatic retry with exponential backoff and error classification
- **Network Resilience**: Network status monitoring and connection recovery
- **Performance Optimized**: Efficient chunk handling with incremental markdown rendering

### Component Structure
- `SearchInterface` - Main application interface with streaming support and settings integration
- `ResultsSection` - Real-time response display with incremental markdown rendering and streaming indicators
- `ProcessingOverlay` - Dynamic status display for connection and streaming states
- `Settings` - User settings page with expandable agent model configuration cards and preferences
- `LoginForm` - User authentication form
- `BurgerMenu` - Navigation menu with settings access
- `KnowledgeStorePanel` - Knowledge store management interface
- `KnowledgeStoreItem` - Individual knowledge store entry display
- `AIModelModal` - AI model configuration modal
- `FileUpload` - Multimodal file attachment component
- `StreamingMarkdownRenderer` - Real-time markdown rendering with streaming support
- `UserManual` - User manual and documentation component
- `ThemeToggle` - Dark/light theme switching component

### Streaming Infrastructure
- `StreamingClient` (`src/lib/streaming-client.ts`) - Core streaming connection management
- `StreamingCancellationManager` (`src/lib/streaming-cancellation.ts`) - Enhanced cancellation system
- `useNetworkStatus` (`src/hooks/useNetworkStatus.ts`) - Network monitoring and connection health
- `/api/submit-question-stream` - Server-Sent Events API endpoint with agent model support
- `/api/agent-models` - Agent model configuration API endpoints
- `/api/ai-models` - AI model management API endpoints
- `/api/capabilities` - AI model capabilities API
- `/api/knowledge-store` - Knowledge store management API
- `/api/cancel-request` - Request cancellation API
- Custom streaming animations and CSS in `src/styles/streaming-animations.css`

### Agent Model Management
- `AgentModelContext` (`src/contexts/AgentModelContext.tsx`) - Agent model state management
- `AIModelContext` (`src/contexts/AIModelContext.tsx`) - AI model state management
- `AgentModelManager` (`src/lib/database.ts`) - Database operations for agent models
- `ai-models.ts` (`src/lib/`) - AI model utilities and management
- Database migration scripts in `scripts/`:
  - `migrate-to-agent-models.sql` - Agent model migration
  - `add-multimodal-capabilities.sql` - Multimodal capabilities
  - `create-agent-prompts-table.sql` - Agent prompt management
  - `seed-agent-prompts.sql` - Default agent prompts
  - `seed-ai-models.sql` - Default AI models

## Technical Stack

- **Frontend**: Next.js 15.4.4 (App Router), React 19.0.0, TypeScript 5.9.2, TailwindCSS 4.1.11
- **Backend/Workflow**: n8n
- **Database**: PostgreSQL (with tables: `ServiceNowSupportTool` for conversations, `user_settings` for user preferences, `agent_models` for agent model configurations)
- **Containerization**: Docker, Docker Compose (Dockerfile and docker-compose.yml in root)
- **Libraries**: Axios 1.11.0, ReactMarkdown 10.1.0, Lucide React 0.539.0, JWT 9.0.2, highlight.js 11.11.1
- **Performance**: Dynamic imports, lazy loading, React.memo, code splitting, and streaming optimizations
- **Streaming**: Server-Sent Events (SSE), real-time UI updates, connection pooling, and retry logic
- **Security**: Comprehensive security headers, XSS protection, CSRF prevention, and streaming validation
- **Accessibility**: ARIA attributes, keyboard navigation, screen reader support, and streaming status announcements
- **PWA Support**: Progressive Web App capabilities with next-pwa 5.6.0
- **Testing**: Jest 30.0.4, Playwright 1.54.0, Testing Library

## Project Structure

Key directories:
- `src/` - Application source code
  - `app/` - Next.js App Router with API routes and pages
  - `components/` - React components for UI and functionality
  - `contexts/` - React contexts (Auth, Settings, Agent Models, AI Models, Theme)
  - `hooks/` - Custom React hooks (Network status, Session management, etc.)
  - `lib/` - Utilities and business logic
  - `styles/` - Custom CSS including streaming animations
  - `types/` - TypeScript type definitions
- `tests/` - Unit and integration tests with mocks
- `docs/` - Detailed documentation
- `n8n/` - Workflow templates
- `scripts/` - Database migrations and setup utilities
- `public/` - Static assets including PWA manifests and icons
- `848250f153632210030191e0a0490ed5/` - ServiceNow Helper Companion App (excluded from code review, linting, and testing)
- Configuration files: `Dockerfile`, `docker-compose.yml`, `package.json`, `tsconfig.json`, `jest.config.ts`, `playwright.config.ts`

### ServiceNow Companion App Exclusions

The `848250f153632210030191e0a0490ed5/` directory contains a ServiceNow application built using ServiceNow technologies and should be handled differently:

- **No Code Review**: This directory should not be included in code reviews as it's a ServiceNow application managed separately
- **No Linting**: ESLint and other JavaScript/TypeScript linting tools do not apply to ServiceNow XML files and scripts
- **No Testing**: Jest and Playwright tests are not applicable to ServiceNow applications
- **Manual Management**: This companion app follows ServiceNow development and deployment practices, not Node.js/React workflows

## Detailed Documentation

*   [Getting Started & Setup](./docs/SETUP.md)
*   [Progressive Web App (PWA)](./docs/PWA.md)
*   [Environment Variables](./docs/ENVIRONMENT_VARIABLES.md)
*   [Development Guide](./docs/DEVELOPMENT.md)
*   [Testing](./docs/TESTING.md)
*   [Contributing](./docs/CONTRIBUTING.md)

## Playwright Testing Best Practices

Based on Playwright documentation and successful test implementations:

### Key Principles
1. **Use Web-First Assertions**: Prefer `await expect(locator).toBeVisible()` over manual waits
2. **Prioritize User-Facing Selectors**: Use `getByRole()`, `getByText()`, and `getByPlaceholder()` over CSS selectors
3. **Handle Strict Mode**: When multiple elements match, use more specific selectors like `getByRole('button', { name: 'Text' })`
4. **Test User Behavior**: Focus on what users see and do, not implementation details

### React-Specific Considerations
- **State Updates**: React state may not update immediately with `fill()`. Use `dispatchEvent()` if needed
- **Form Submission**: Test actual user interactions (clicking buttons, pressing keys) rather than forcing form submission
- **Component Interactions**: Use semantic selectors that match how users interact with the interface

### Common Patterns
```javascript
// Good: Specific, user-facing selector
await expect(page.getByRole('button', { name: 'Get Help' })).toBeVisible();

// Good: Wait for authentication completion
await page.waitForFunction(() => !!document.querySelector('textarea'), { timeout: 10000 });

// Good: Web-first assertion with timeout
await expect(element).toBeEnabled({ timeout: 10000 });
```

### Testing Strategy
- Test authentication flows and basic UI interactions
- Verify interface elements are present and accessible
- Focus on user-visible behavior rather than internal state
- Use mocking for external API calls to ensure test reliability

## Next.js 15 Best Practices Implementation

This codebase implements comprehensive Next.js 15 best practices:

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
- **Security Headers**: Comprehensive headers in `next.config.ts`:
  - X-Content-Type-Options, X-Frame-Options, X-XSS-Protection
  - Referrer-Policy, Permissions-Policy
- **API Protection**: Enhanced API route security

### Accessibility Improvements
- **ARIA Attributes**: Proper ARIA labels, roles, and states
- **Keyboard Navigation**: Full keyboard support (Escape, Enter, Space)
- **Skip Links**: Skip-to-content links for screen readers
- **Focus Management**: Proper focus handling for modals and dropdowns

### Architecture Benefits
- **App Router**: Full utilization of Next.js 15 App Router features
- **Server Components**: Optimal mix of server and client components
- **Modern React**: Latest React 19 patterns with concurrent features
- **Type Safety**: Enhanced TypeScript with strict mode compliance

### Key Files for Best Practices
- `src/app/error.tsx` - Route-level error handling
- `src/app/loading.tsx` - Global loading states
- `next.config.ts` - Security headers configuration
- `src/middleware.ts` - Next.js middleware for authentication
- Components with `React.memo` - Performance optimization (HistoryItem, ThemeToggle, StepGuide)
- Dynamic imports with `Suspense` - Code splitting (HistoryPanel, ReactMarkdown)
- Custom hooks for performance and state management
- Streaming infrastructure for real-time responses
