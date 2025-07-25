## Testing

This project includes comprehensive testing with both unit tests (Jest) and end-to-end tests (Playwright).

### Test Types

#### 1. Unit Tests (Jest)
**Purpose**: Test individual components and functions in isolation with mocked dependencies.

- **Location**: `tests/unit/`
- **Command**: `npm test` (non-interactive mode)
- **Watch Mode**: Available by default in development
- **Benefits**: Fast feedback, component behavior validation, utility function testing

#### 2. Integration Tests (Playwright)  
**Purpose**: Test complete user workflows against a real running application.

- **Location**: `tests/`
- **Command**: `npm run test:e2e`
- **Headed Mode**: `npm run test:e2e:headed` (see browser)
- **Single Browser**: `npm run test:e2e -- --project=chromium`
- **Benefits**: End-to-end validation, real browser testing, full user journey coverage

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
- `tests/unit/components/SearchInterface.test.tsx` - Main interface rendering and component structure
- `tests/unit/lib/utils.test.ts` - Utility functions and helper methods

#### Playwright Tests:
- `tests/integration.spec.ts` - Complete user flow validating:
  1. **Authentication Flow**: Login functionality and session management
  2. **Interface Elements**: UI component visibility and accessibility
  3. **User Interactions**: Form inputs, button clicks, navigation
  4. **Feature Access**: History panel, settings, and conversation management
  5. **Responsive Design**: Cross-browser compatibility (Chromium, Firefox)

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
- **Core Workflows**: Authentication, question submission, history management
- **Interface Reliability**: Ensuring UI elements are accessible and functional
- **Cross-Browser Support**: Validating functionality across different browsers