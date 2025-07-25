# ServiceNow AI Support Tool

<img width="1774" height="1835" alt="ServiceNow Helper screenshot" src="https://github.com/user-attachments/assets/fbe95080-9045-4e17-95ef-227cba5e71fc" />


An AI-powered ServiceNow assistance tool built with Next.js 15. This application provides intelligent support for ServiceNow-related questions through an intuitive web interface with JWT-based authentication and real-time AI responses via n8n workflow automation. The application uses OpenRouter to provide access to a wide variety of AI models, allowing users to choose the best model for their specific needs.

## Features

- **AI-Powered Assistance**: Get intelligent answers to ServiceNow questions across multiple categories using OpenRouter's extensive model selection.
- **Secure Authentication**: Server-side JWT-based authentication with httpOnly cookies and Next.js middleware protection.
- **Conversation History**: Full conversation tracking with search, filtering, and management capabilities.
- **Multiple Question Types**: Support for documentation, recommendations, scripts, and troubleshooting.
- **Real-time Responses**: Async webhook polling for AI service integration.
- **Responsive Design**: Modern UI built with TailwindCSS.
- **Session Management**: Unique session keys and continue session functionality.
- **PWA Support**: Progressive Web App capabilities for mobile usage.
- **Search Enhancement**: ServiceNow knowledge base and developer portal integration.
- **User Settings**: Persistent user preferences with real-time synchronization.
- **Customizable Interface**: Control welcome section visibility and default settings.
- **Docker Support**: Complete containerized deployment with PostgreSQL and n8n.
- **Next.js 15 Best Practices**: Implements modern React patterns with performance optimizations.
- **Enhanced Security**: Comprehensive security headers and protection against common vulnerabilities.
- **Accessibility**: ARIA attributes, keyboard navigation, and screen reader support.
- **Error Handling**: Robust error boundaries and user-friendly error messages.
- **Performance Optimization**: Lazy loading, code splitting, and React.memo for optimal performance.

## Tech Stack

- **Frontend**: Next.js 15.3.5 with App Router, TypeScript, TailwindCSS 4.1.11
- **Authentication**: Server-side JWT with httpOnly cookies and Next.js middleware
- **Styling**: TailwindCSS 4.1.11 with Lucide React 0.525.0 icons
- **HTTP Client**: Axios 1.10.0 for API requests
- **Content Rendering**: ReactMarkdown 10.1.0 with syntax highlighting
- **Workflow Engine**: n8n for AI processing and external integrations
- **Database**: PostgreSQL 15-alpine for conversation history, user settings, session storage, and n8n data
- **AI Models**: OpenRouter integration providing access to multiple AI models including Claude (Anthropic), GPT models (OpenAI), and many others
- **Testing**: Jest 30.0.4 (unit tests) and Playwright 1.53.2 (integration tests)
- **Deployment**: Docker and Docker Compose (Dockerfile and docker-compose.yml in root)
- **Performance**: Dynamic imports, lazy loading, React.memo, and code splitting for optimal performance
- **Security**: Comprehensive security headers, XSS protection, and CSRF prevention
- **Accessibility**: ARIA attributes, keyboard navigation, and screen reader optimization

## Visual Architecture

### 1. Request/Response Sequence Diagram

```mermaid
sequenceDiagram
    participant U as User
    participant B as Web Browser
    participant N as Nextjs App
    participant W as n8n Workflow
    participant D as PostgreSQL
    participant A as AI API

    U->>B: Enter question
    B->>N: POST /api/submit-question (JWT)
    N->>W: Trigger webhook
    W->>A: Call AI API
    A-->>W: AI answer
    W->>D: Store response
    W-->>N: Respond (answer ready)
    N->>B: Polling: answer ready?
    B->>N: GET /api/poll-response
    N->>D: Query for response
    D-->>N: Return answer if ready
    N-->>B: Render answer in UI
```

## Getting Started

### Prerequisites

- Node.js 18+ (for local development, TypeScript 5.x)
- Docker and Docker Compose (recommended)
- Git

### Quick Start with Docker (Recommended)

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd servicenow-aisupporttool
    ```

2.  **Set up environment variables**:
    ```bash
    cp .env.example .env
    # Edit .env file with your API keys and secrets
    ```
    Required environment variables:
    - `OPENAI_API_KEY`: Your OpenAI API key
    - `OPENROUTER_API_KEY`: Your OpenRouter API key (provides access to multiple AI models)
    - `WEBHOOK_API_KEY`: A secure random string for webhook authentication
    - `JWT_SECRET`: A secure random string for JWT token signing
    - `N8N_ENCRYPTION_KEY`: A secure random string for n8n credential encryption.

3.  **Start all services**:
    
    **First time installation**:
    ```bash
    docker compose --profile setup up -d
    ```
    
    **Subsequent runs**:
    ```bash
    docker compose up -d
    ```
    
    The first time setup command will:
    - Start the Next.js app, n8n, and PostgreSQL database
    - Automatically run the setup script to configure N8N
    - Create admin user and API credentials 
    - Import and activate the AI workflow
    - Create the required database tables (conversation history and user settings)
    - Register webhook endpoints
    
    After initial setup, the standard `docker compose up -d` command will start all services without running the setup again.

4.  **Access the applications**:
    -   **ServiceNow Helper**: `http://localhost:3000`
    -   **N8N Workflow Manager**: `http://localhost:5678` (Login: `admin@servicenow-helper.local` / `Admin123`)

### Detailed Setup Guide

#### Manual Setup

If the automatic setup (`docker compose --profile setup up -d`) fails or encounters networking issues, you can perform a manual setup:

1.  **Stop and remove existing containers**:
    ```bash
    docker compose down
    ```
2.  **Run the setup script manually**:
    ```bash
    ./scripts/setup-n8n.sh
    ```

#### Re-initialization

If you need to completely reset and re-initialize:
```bash
# Remove initialization flag
docker exec servicenow-aisupporttool-n8n-1 rm /home/node/.n8n/.initialized

# Run setup again
./scripts/setup-n8n.sh
```

#### Access Information

- **ServiceNow Helper**: http://localhost:3000
  - Username: admin
  - Password: password123

- **n8n Workflow Editor**: http://localhost:5678
  - Email: admin@servicenow-helper.local
  - Password: Admin123

### Local Development Setup

1.  Clone and install dependencies:
    ```bash
    git clone <repository-url>
    cd servicenow-aisupporttool
    npm install
    ```

2.  Set up environment variables by creating a `.env.local` file:
    ```env
    N8N_WEBHOOK_URL=your_n8n_webhook_url
    N8N_WEBHOOK_URL_RESPONSE=your_n8n_response_polling_url
    N8N_API_KEY=your_n8n_api_key
    JWT_SECRET=your_jwt_secret_key
    DATABASE_URL=postgresql://user:password@localhost:5432/dbname
    ```

3.  Run the development server:
    ```bash
    npm run dev
    ```

4.  Open `http://localhost:3000` in your browser.

### Available Scripts

-   `npm run dev` - Start development server
-   `npm run build` - Build production application
-   `npm run start` - Start production server
-   `npm run lint` - Run ESLint checks
-   `npm test` - Run Jest unit tests
-   `npm run test:e2e` - Run Playwright integration tests
-   `npm run test:e2e:ui` - Run Playwright tests with interactive UI mode
-   `npm run test:e2e:headed` - Run Playwright tests in headed browser mode
-   `npm run test:e2e:debug` - Run Playwright tests in debug mode

### Docker Commands

-   `docker compose --profile setup up -d` - First time setup (starts all services + runs setup)
-   `docker compose up -d` - Start all services in background (regular use)
-   `docker compose down` - Stop all services
-   `docker compose logs -f` - View logs from all services
-   `docker compose up -d --build` - Rebuild and start services

**Note**: Use `--profile setup` only for first-time installation. The setup script will automatically skip initialization if already completed.

## Usage

1.  **Authentication**: Log in with your credentials to access the application.
2.  **Configure Settings**: Access the settings page via the burger menu to customize your experience:
    - **Welcome Section**: Toggle the visibility of the welcome info box on the main page
    - **Default Search Mode**: Set your preferred search mode setting for new sessions  
    - **Default Request Type**: Choose your preferred default between documentation/recommendation/script/troubleshoot
3.  **Ask Questions**: Use the search interface to submit ServiceNow-related questions.
4.  **Select Question Type**: Choose from documentation, recommendation, script, or troubleshoot.
5.  **Toggle Features**: Enable continue session as needed.
6.  **View Responses**: Receive AI-generated responses with markdown formatting and code highlighting.
7.  **Conversation History**: Access your previous conversations through the history panel with search and filtering capabilities.

## Settings System

The application includes a comprehensive user settings management system that allows users to customize their experience:

### Available Settings

- **Welcome Section Visibility**: Control whether the welcome info box appears on the main page
- **Default Search Mode**: Set the default state for search mode in new sessions
- **Default Request Type**: Choose the default request type (documentation/recommendation/script/troubleshoot)

### Technical Implementation

- **Database Storage**: Settings are stored in the `user_settings` PostgreSQL table with user-specific persistence
- **Real-time Sync**: Changes are immediately reflected across the application without requiring a page refresh
- **Authentication-Aware**: Settings are tied to authenticated users and gracefully handle unauthenticated states
- **API Endpoints**: RESTful API at `/api/settings` with GET and PUT methods for settings management
- **React Context**: Settings are managed through a React context (`SettingsContext`) for global state management
- **Type Safety**: Full TypeScript support with defined interfaces for all settings

## Next.js 15 Best Practices Implementation

This application implements comprehensive Next.js 15 best practices for optimal performance, security, and user experience:

### Performance Optimizations

- **Dynamic Imports**: Heavy components like `HistoryPanel` and `ReactMarkdown` are lazy-loaded to reduce initial bundle size
- **Code Splitting**: Automatic code splitting with Suspense boundaries for better loading performance
- **React.memo**: Expensive components (`HistoryItem`, `ThemeToggle`, `StepGuide`) are memoized to prevent unnecessary re-renders
- **Bundle Optimization**: Selective imports for icon libraries and optimized component loading

### Error Handling & User Experience

- **Error Boundaries**: Route-level error handling with `src/app/error.tsx` for graceful error recovery
- **Loading States**: Global loading UI with `src/app/loading.tsx` for better page transitions
- **Fallback Components**: Suspense fallbacks for lazy-loaded components with loading indicators

### Security Enhancements

- **Security Headers**: Comprehensive security headers including:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `X-XSS-Protection: 1; mode=block`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy` for privacy protection
- **API Protection**: Enhanced API route security with cache-control headers

### Accessibility Improvements

- **ARIA Attributes**: Proper ARIA labels, roles, and states for screen reader compatibility
- **Keyboard Navigation**: Full keyboard support with Escape, Enter, and Space key handlers
- **Skip Links**: Skip-to-content links for better navigation accessibility
- **Focus Management**: Proper focus handling for modals and dropdown menus
- **Click Outside**: Intuitive UX with click-outside-to-close functionality

### Architecture Benefits

- **App Router**: Full utilization of Next.js 15 App Router features
- **Server Components**: Optimal mix of server and client components
- **Modern React**: Latest React 19 patterns with concurrent features
- **Type Safety**: Enhanced TypeScript configuration with strict mode compliance

### Performance Metrics

The implemented optimizations result in:
- Reduced initial JavaScript bundle size through code splitting
- Faster page load times with lazy loading
- Improved Core Web Vitals scores
- Better user experience with proper loading states

## Testing

The project includes comprehensive testing with both unit tests (Jest) and integration tests (Playwright).

### Unit Tests (Jest)

Run unit tests for components, utilities, and API functions:

```bash
npm test              # Run tests in watch mode (development)
npm run test:ci       # Run tests once (CI/CD)
```

### Integration Tests (Playwright)

End-to-end testing that validates the complete user experience:

```bash
npm run test:e2e            # Run all Playwright tests headlessly
npm run test:e2e:ui         # Interactive UI mode with test runner interface
npm run test:e2e:headed     # Run tests in visible browser windows
npm run test:e2e:debug      # Debug mode with browser developer tools
```

#### Test Environment Setup

Playwright tests use separate environment configuration:

- **Environment Files**: `.env.test` and `.env.test.local` (for local overrides)
- **Test Credentials**: Default test username/password in environment files
- **Automatic Setup**: Tests automatically start the dev server via `playwright.config.ts`

#### Playwright Test Coverage

Current integration tests validate:

1. **Authentication Flow**: Login functionality and session management
2. **Interface Elements**: UI component visibility and accessibility
3. **User Interactions**: Form inputs, button clicks, navigation
4. **Feature Access**: History panel, settings, and conversation management
5. **Responsive Design**: Cross-browser compatibility (Chromium, Firefox)

#### Playwright Best Practices Applied

The tests follow Playwright documentation best practices:

- **Web-First Assertions**: Using `await expect().toBeVisible()` for automatic waiting
- **User-Facing Selectors**: Prioritizing `getByRole()`, `getByText()` over CSS selectors
- **Strict Mode Handling**: Specific selectors to avoid multiple element matches
- **React Considerations**: Proper handling of state updates and component interactions

#### Test Configuration

- **Global Timeout**: 60 seconds for complex React application interactions
- **WebServer Timeout**: 120 seconds for Next.js development server startup
- **Browser Support**: Chromium and Firefox (WebKit disabled for WSL compatibility)
- **Retry Logic**: Automatic retries on CI environments

#### Running Tests in Different Modes

```bash
# Quick validation
npm run test:e2e -- --project=chromium

# Specific test pattern
npm run test:e2e -- --grep="should allow user to log in"

# Generate test report
npm run test:e2e
npx playwright show-report

# Update snapshots
npm run test:e2e -- --update-snapshots
```

### Testing Strategy

The testing approach focuses on:

- **User Behavior**: Testing what users see and do, not implementation details
- **Core Workflows**: Authentication, question submission, history management
- **Interface Reliability**: Ensuring UI elements are accessible and functional
- **Cross-Browser Support**: Validating functionality across different browsers

For detailed testing guidelines and troubleshooting, see the [Testing Documentation](./docs/TESTING.md).

---

## Project Structure

The project follows an organized directory structure:

```
/
├── README.md, CLAUDE.md, GEMINI.md, LICENSE  # Core documentation
├── package.json, package-lock.json           # Dependencies
├── Configuration files                       # ESLint, Jest, Next.js, etc.
├── Dockerfile                               # Application container
├── docker-compose.yml                       # Multi-service orchestration
├── docs/                                     # Detailed documentation
├── n8n/                                      # N8N workflow templates
├── public/                                   # Static assets and PWA files
├── scripts/                                  # Utility scripts
├── src/                                      # Application source code
│   ├── app/                                 # Next.js App Router pages & API
│   │   ├── api/settings/                   # Settings API endpoints
│   │   └── settings/                       # Settings page
│   ├── components/                          # React components
│   │   ├── Settings.tsx                    # Settings page component
│   │   └── SearchInterface.tsx             # Main interface (settings-aware)
│   ├── contexts/                            # React contexts
│   │   └── SettingsContext.tsx             # Settings state management
│   ├── lib/                                 # Utility libraries
│   │   └── database.ts                     # Database layer (includes UserSettingsManager)
│   └── types/                               # TypeScript definitions
│       └── index.ts                        # Settings interfaces and types
└── tests/                                    # Test files and mocks
```

## Detailed Documentation

*   [Getting Started & Setup](./docs/SETUP.md)
*   [Progressive Web App (PWA)](./docs/PWA.md)
*   [Environment Variables](./docs/ENVIRONMENT_VARIABLES.md)
*   [Development Guide](./docs/DEVELOPMENT.md)
*   [Testing](./docs/TESTING.md)
*   [Contributing](./docs/CONTRIBUTING.md)

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.
