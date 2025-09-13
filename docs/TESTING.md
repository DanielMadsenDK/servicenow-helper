## Testing

This project includes comprehensive testing with both unit tests (Jest) and end-to-end tests (Playwright), enhanced with performance testing, code quality gates, and automated testing infrastructure.

### Test Types

#### 1. Unit Tests (Jest)
**Purpose**: Test individual components and functions in isolation with mocked dependencies.

- **Location**: `tests/unit/`
- **Command**: `npm test` (non-interactive mode)
- **Watch Mode**: `npm run test:watch` (interactive development)
- **Coverage**: `npm run test:coverage` (detailed coverage reports)
- **CI Mode**: `npm run test:ci` (optimized for CI/CD)
- **Benefits**: Fast feedback, component behavior validation, utility function testing

#### 2. Integration Tests (Playwright)
**Purpose**: Test complete user workflows against a real running application.

- **Location**: `tests/`
- **Command**: `npm run test:e2e`
- **Headed Mode**: `npm run test:e2e:headed` (see browser)
- **UI Mode**: `npm run test:e2e:ui` (interactive test runner)
- **Debug Mode**: `npm run test:e2e:debug` (step-through debugging)
- **Single Browser**: `npm run test:e2e -- --project=chromium`
- **Benefits**: End-to-end validation, real browser testing, full user journey coverage

#### 3. Performance Tests (Jest)
**Purpose**: Validate Core Web Vitals and performance metrics.

- **Location**: `tests/performance/`
- **Command**: `npm run test:performance`
- **Metrics**: FCP, LCP, FID, CLS tracking and validation
- **Bundle Analysis**: Automated bundle size validation
- **Benefits**: Performance regression detection, Core Web Vitals compliance

### Environment Setup for Testing

#### Jest Tests
Jest tests use mocked APIs and don't require special environment setup.

#### Playwright Tests
Playwright tests run against a real server instance and require proper authentication credentials.

**Environment Variable Priority (highest to lowest):**
1. **`.env.test.local`** - Local test overrides (not committed)
2. **`.env.test`** - Test defaults (committed to repo)

**Setting Up Test Credentials:**

For Local Development:
1. If your local server uses custom credentials, create `.env.test.local`:
   ```bash
   # .env.test.local (not committed)
   TEST_AUTH_USERNAME=your_username
   TEST_AUTH_PASSWORD=your_password
   ```

For CI/CD:
Set environment variables:
```bash
export TEST_AUTH_USERNAME=admin
export TEST_AUTH_PASSWORD=password123
```

**Default Test Credentials:**
- Username: `admin`
- Password: `password123` (from `.env.test`)

### Current Test Coverage

#### Jest Tests:
- `tests/unit/components/BurgerMenu.test.tsx` - Menu component interactions and toggles
- `tests/unit/components/LoginForm.test.tsx` - Login form validation, submission, and UI interactions
- `tests/unit/components/ProtectedRoute.test.tsx` - Authentication routing and conditional rendering
- `tests/unit/components/SearchInterface.test.tsx` - Main interface rendering with agent model support
- `tests/unit/components/ResultsSection.test.tsx` - Results display with React.memo optimizations
- `tests/unit/components/StreamingMarkdownRenderer.test.tsx` - Streaming markdown with virtual scrolling
- `tests/unit/components/OptimizedImage.test.tsx` - Image optimization with lazy loading
- `tests/unit/components/ImageGallery.test.tsx` - Gallery component with modal navigation
- `tests/unit/lib/streaming-client.test.ts` - Streaming client functionality and agent model handling
- `tests/unit/lib/streaming-buffer.test.ts` - Streaming buffer with incremental updates
- `tests/unit/lib/performance-monitor.test.ts` - Performance monitoring and analytics
- `tests/unit/lib/utils.test.ts` - Utility functions and helper methods
- `tests/unit/hooks/useLazyImage.test.ts` - Lazy loading hooks and intersection observer

#### Playwright Tests:
- `tests/integration.spec.ts` - Complete user flow validating:
  1. **Authentication Flow**: Login functionality and session management
  2. **Interface Elements**: UI component visibility and accessibility
  3. **User Interactions**: Form inputs, button clicks, navigation
  4. **Feature Access**: History panel, settings with agent model configuration, and conversation management
  5. **Agent Model Configuration**: Settings page agent model selection and persistence
  6. **Streaming Interface**: Real-time response streaming and cancellation
  7. **File Upload**: Multimodal file attachment functionality
  8. **Continue Session**: Toggle behavior and state persistence
  9. **Cross-browser Compatibility**: Consistent behavior across Chromium and Firefox

### Running Tests

**All Tests:**
```bash
npm test                    # Run Jest unit tests (non-interactive mode)
npm run test:e2e            # Run all Playwright integration tests
npm run test:e2e:ui         # Run Playwright tests with UI mode
npm run test:e2e:headed     # Run Playwright tests in headed mode
npm run test:e2e:debug      # Run Playwright tests in debug mode
```

**Specific Test Suites:**
```bash
# Jest - Run specific test files
npm test -- --testNamePattern="LoginForm"
npm test -- BurgerMenu

# Playwright - Run specific test files  
npm run test:e2e -- tests/integration.spec.ts
npm run test:e2e -- --project=chromium
```

**Development & Debug Mode:**
```bash
# Jest
npm test                   # Non-interactive mode (default)
npm test -- --verbose      # Detailed test output

# Playwright  
npm run test:e2e:headed    # See browser actions
npm run test:e2e:debug     # Debug mode with DevTools
npm run test:e2e:ui        # Interactive UI mode
```

**CI/CD Mode:**
```bash
npm run test:ci                           # Jest for CI environments
npm run test:e2e -- --reporter=html       # Generate HTML report
```

### Troubleshooting

#### Playwright Login Issues
If you see login failures:
1. Check that your development server is running on `http://localhost:3000`
2. Verify credentials in `.env.test.local` match your server's `.env.local`
3. Check server logs for authentication errors

#### Environment Variable Issues
If tests can't find environment variables:
1. Ensure `dotenv` is installed: `npm install --save-dev dotenv`
2. Check that Playwright config loads environment files
3. Verify file names (`.env.test`, `.env.test.local`)

#### Server Not Starting
If Playwright complains about server not being available:
1. Make sure `npm run dev` works independently
2. Check if port 3000 is already in use
3. Verify `webServer` configuration in `playwright.config.ts`

### Playwright Best Practices Applied

The tests follow Playwright documentation best practices:

- **Web-First Assertions**: Using `await expect().toBeVisible()` for automatic waiting
- **User-Facing Selectors**: Prioritizing `getByRole()`, `getByText()` over CSS selectors
- **Strict Mode Handling**: Specific selectors to avoid multiple element matches
- **React Considerations**: Proper handling of state updates and component interactions

### Test Configuration

- **Global Timeout**: 60 seconds for complex React application interactions
- **WebServer Timeout**: 120 seconds for Next.js development server startup
- **Browser Support**: Chromium and Firefox (WebKit disabled for WSL compatibility)
- **Retry Logic**: Automatic retries on CI environments

### Advanced Test Commands

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
- **Core Workflows**: Authentication, question submission with agent models, history management, agent configuration
- **Interface Reliability**: Ensuring UI elements are accessible and functional
- **Cross-Browser Support**: Validating functionality across different browsers
