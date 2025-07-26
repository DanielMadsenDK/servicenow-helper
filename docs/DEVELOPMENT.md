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
- **n8n Workflow Engine**: Handles the backend AI processing, integrating with OpenRouter to provide access to multiple AI models.
- **PostgreSQL Database**: Provides data storage for n8n and session storage for the Next.js app.

### Authentication System
- JWT-based authentication using httpOnly cookies.
- Auth middleware in `src/lib/auth-middleware.ts` verifies tokens server-side.
- `AuthContext` provides client-side authentication state management.

### API Integration & Data Flow
1. User submits a question via the `SearchInterface` in the Next.js app.
2. The request is sent to `/api/submit-question`, which is protected by JWT authentication.
3. The Next.js API calls an **n8n webhook** to trigger the AI processing workflow.
4. The client polls a response endpoint until the n8n workflow completes.
5. The final response is rendered in the UI with ReactMarkdown.

### Settings System
- **User Settings Management**: Persistent user preferences stored in PostgreSQL database
- **Settings Context**: React context providing settings state management and API integration
- **Authentication-Aware**: Settings are user-specific and require authentication to save
- **Real-time Sync**: Settings changes immediately reflect across the application
- **Default Fallbacks**: Works gracefully when unauthenticated with sensible defaults

## Technical Stack

- **Frontend**: Next.js 15.4.4 (App Router), React 19.0.0, TypeScript 5.x, TailwindCSS 4.1.11
- **Backend/Workflow**: n8n
- **Database**: PostgreSQL (with tables: `ServiceNowSupportTool` for conversations, `user_settings` for user preferences)
- **Containerization**: Docker, Docker Compose (Dockerfile and docker-compose.yml in root)
- **Libraries**: Axios 1.10.0, ReactMarkdown 10.1.0, Lucide React 0.526.0, JWT 9.0.2
- **Performance**: Dynamic imports, lazy loading, React.memo, and code splitting
- **Security**: Comprehensive security headers, XSS protection, and CSRF prevention
- **Accessibility**: ARIA attributes, keyboard navigation, and screen reader support

## Key Development Files

-   `src/lib/auth-middleware.ts` - Authentication middleware
-   `src/contexts/AuthContext.tsx` - Authentication state management
-   `src/components/SearchInterface.tsx` - Main application interface
-   `src/app/api/submit-question/route.ts` - Question submission API
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