# Development Guide

## Development Commands

- `docker compose up -d` - **Recommended method.** Starts all services.
- `docker compose --profile setup up -d` - **First time setup.** Starts all services and runs initial setup.
- `./scripts/setup-n8n.sh` - Manual setup script (only needed if automatic setup fails).
- `npm run dev` - Start the Next.js development server (requires separate n8n/Postgres instances).
- `npm run build` - Build production application with PWA optimization.
- `npm run build:analyze` - Build with webpack bundle analyzer for performance insights.
- `npm run start` - Start production server.
- `npm run lint` - Run ESLint checks with enhanced code quality rules.
- `npm run type-check` - Run TypeScript type checking.
- `npm test` - Run Jest unit tests (non-interactive mode).
- `npm run test:watch` - Run Jest tests in watch mode (interactive).
- `npm run test:coverage` - Run Jest tests with coverage reporting.
- `npm run test:ci` - Run Jest unit tests for CI/CD environments.
- `npm run test:performance` - Run performance-specific tests.
- `npm run test:e2e` - Run Playwright integration tests.
- `npm run test:e2e:ui` - Run Playwright tests with UI mode.
- `npm run test:e2e:headed` - Run Playwright tests in headed mode.
- `npm run test:e2e:debug` - Run Playwright tests in debug mode.

## Architecture Overview

The application follows a containerized, multi-service architecture orchestrated by Docker Compose.

### Core Components
- **Next.js 15.5.2 Frontend**: A web application for user interaction, authentication, and displaying results.
- **n8n Workflow Engine**: Handles the backend AI processing with **multi-agent architecture**, integrating with multiple AI providers (OpenRouter, Hugging Face) to provide access to diverse AI models for specialized agents.
- **PostgreSQL Database**: Provides data storage for n8n, session storage for the Next.js app, and provider management configurations.

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
- **Multi-Provider Configuration**: Support for multiple AI providers with individual configurations
- **Agent Model Configuration**: Individual AI model selection per specialized agent from multiple providers
- **Settings Context**: React context providing settings state management and API integration
- **AgentModelContext**: Dedicated React context for multi-agent model state management
- **ProviderContext**: React context for provider state management and selection
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

- **Frontend**: Next.js 15.5.2 (App Router), React 19.0.0, TypeScript 5.9.2, TailwindCSS 4.1.11
- **Backend/Workflow**: n8n
- **Database**: PostgreSQL 15.4 with pgvector 0.8.0 (with tables: `ServiceNowSupportTool` for conversations, `user_settings` for user preferences, `agent_models` for agent model configurations)
- **Containerization**: Docker, Docker Compose (Dockerfile and docker-compose.yml in root)
- **Libraries**: Axios 1.11.0, ReactMarkdown 10.1.0, Lucide React 0.542.0, JWT 9.0.2
- **Performance**: Dynamic imports, lazy loading, React.memo, code splitting, bundle analysis, and Core Web Vitals monitoring
- **Streaming**: Server-Sent Events (SSE), real-time UI updates, connection pooling, retry logic, and performance monitoring
- **Security**: Comprehensive security headers, XSS protection, CSRF prevention, streaming validation, and rate limiting
- **Accessibility**: ARIA attributes, keyboard navigation, screen reader support, and WCAG compliance
- **PWA Support**: Advanced Progressive Web App with offline support, install prompts, and app shortcuts
- **Testing**: Jest 30.1.1 with coverage reporting, Playwright 1.55.0 for E2E, enhanced ESLint rules, and pre-commit quality gates
- **Quality Assurance**: Husky pre-commit hooks, lint-staged, TypeScript strict mode, and automated testing

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

### Streaming Architecture & Performance
-   `src/app/api/submit-question-stream/route.ts` - Streaming question submission API
-   `src/lib/streaming-client.ts` - Core streaming connection management
-   `src/lib/streaming-cancellation.ts` - Enhanced cancellation system
-   `src/lib/streaming-buffer.ts` - Optimized streaming buffer with incremental updates
-   `src/lib/performance-monitor.ts` - Performance monitoring and analytics
-   `src/components/StreamingMarkdownRenderer.tsx` - Streaming markdown with virtual scrolling
-   `src/components/VirtualizedMarkdownRenderer.tsx` - Virtual scrolling for large content
-   `src/hooks/useNetworkStatus.ts` - Network monitoring and connection health

### Next.js 15 Stable Features (Latest Implementation)
-   **Turbopack**: 5-10x faster development builds with `npm run dev --turbopack`
-   **Enhanced Package Optimization**: Optimized imports for `lucide-react`, `react-markdown`, `highlight.js`, `axios`, `jsonwebtoken`
-   **Advanced Bundle Analysis**: Integrated webpack bundle analyzer with `npm run build:analyze`
-   **Improved Development DX**: Faster HMR and compilation with Turbopack

### Image Optimization (Phase 2)
-   `src/components/OptimizedImage.tsx` - Next.js Image with lazy loading and blur placeholders
-   `src/components/ImageGallery.tsx` - Modal gallery with keyboard navigation
-   `src/components/ImageExample.tsx` - Usage examples and documentation
-   `src/hooks/useLazyImage.ts` - Intersection Observer hooks for lazy loading
-   Enhanced `next.config.ts` - Advanced image configuration with WebP/AVIF support

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

## Performance Monitoring & Core Web Vitals

The application includes comprehensive performance monitoring and Core Web Vitals tracking:

### Performance Monitoring System
- **PerformanceMonitor** (`src/lib/performance-monitor.ts`) - Singleton class for tracking Core Web Vitals
- **Real-time Metrics**: FCP (First Contentful Paint), LCP (Largest Contentful Paint), FID (First Input Delay), CLS (Cumulative Layout Shift)
- **Streaming Performance**: Tracks connection times, chunk sizes, and streaming efficiency
- **Memory Management**: Monitors for memory leaks and cleanup tracking

### Bundle Analysis & Optimization
- **Webpack Bundle Analyzer**: Integrated with `npm run build:analyze` for detailed bundle insights
- **Code Splitting**: Automatic vendor and React chunk separation
- **Package Import Optimization**: Selective imports for `lucide-react`, `react-markdown`, `highlight.js`
- **CSS Optimization**: TailwindCSS optimization with tree-shaking

### Caching Strategy
- **Multi-tier Service Worker**: Advanced caching with different strategies per resource type
- **API Caching**: Network-first strategy with 5-minute cache for API responses
- **Static Asset Caching**: Cache-first strategy with 1-year expiration for immutable assets
- **Image Optimization**: WebP/AVIF support with responsive sizing

## Testing & Quality Assurance

### Enhanced Testing Suite
- **Jest Configuration**: Coverage thresholds (70% branches, 75% functions, 80% lines/statements)
- **Performance Tests**: Dedicated performance test suite with Core Web Vitals validation
- **Unit Tests**: Comprehensive unit tests for performance monitor and utilities
- **Test Utilities**: Enhanced test helpers with all React contexts and mocking

### Code Quality Gates
- **ESLint Rules**: Enhanced rules for performance, accessibility, and code quality
- **Pre-commit Hooks**: Husky with lint-staged for automated quality checks
- **TypeScript Strict Mode**: Enhanced type checking with `npm run type-check`
- **Import Organization**: Automatic import sorting and validation

### Testing Commands
- `npm run test:coverage` - Generate coverage reports
- `npm run test:performance` - Run performance-specific tests
- `npm run type-check` - TypeScript validation
- `npm run lint` - ESLint with auto-fix capabilities

## Progressive Web App (PWA) Features

### Advanced PWA Manifest
- **App Shortcuts**: Quick access to New Question, Knowledge Store, and Settings
- **Display Modes**: Support for window-controls-overlay, standalone, and minimal-ui
- **File Handling**: Support for text, JSON, PDF files with drag-and-drop
- **Share Target**: Receive shared content from other applications
- **Protocol Handlers**: Custom URL scheme support (`web+servicenow://`)

### Service Worker & Offline Support
- **Offline Fallback**: Dedicated offline page with available features
- **Advanced Caching**: Multi-strategy caching for different resource types
- **Background Sync**: Service worker handles updates and sync operations
- **Network Resilience**: Automatic retry and connection recovery

### PWA Installation Experience
- **Smart Install Prompts**: Appears after user engagement with dismiss tracking
- **Cross-platform Support**: iOS, Android, and Desktop PWA compatibility
- **Install State Tracking**: Monitors installation success and app usage
- **Feature Highlights**: Showcases offline support and native app benefits

### PWA Commands
- `npm run build` - Production build with PWA optimization
- Service worker automatically registers and manages caching
- Offline page accessible at `/offline` when network unavailable

## Key Performance Features

### Real-time Monitoring
- **Core Web Vitals**: Continuous tracking of user experience metrics
- **Streaming Analytics**: Connection quality and response time monitoring
- **Bundle Size Tracking**: Automated bundle size validation
- **Memory Usage**: Leak detection and cleanup verification

### Optimization Features
- **Lazy Loading**: Components loaded on-demand for better initial load
- **Image Optimization**: Next.js Image component with WebP/AVIF support
- **Font Optimization**: Google Fonts caching and optimization
- **CSS Optimization**: TailwindCSS purging and minification

### Quality Assurance
- **Automated Testing**: Pre-commit test execution
- **Code Coverage**: Minimum coverage thresholds enforced
- **Performance Budgets**: Bundle size and performance metric validation
- **Accessibility Testing**: Automated accessibility rule validation
