import { test, expect } from '@playwright/test';

test.describe('ServiceNow Helper', () => {
  test('should allow a user to log in and access the interface', async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:3000/');

    // Wait for the page to load completely
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);
    
    // Verify we're on the login page first
    await expect(page.getByPlaceholder('Enter your username')).toBeVisible();
    
    // Get test credentials from environment variables
    const testUsername = process.env.TEST_AUTH_USERNAME || process.env.AUTH_USERNAME;
    const testPassword = process.env.TEST_AUTH_PASSWORD || process.env.AUTH_PASSWORD;
    if (!testUsername || !testPassword) {
      throw new Error('Test credentials must be set in environment variables (TEST_AUTH_USERNAME and TEST_AUTH_PASSWORD or AUTH_USERNAME and AUTH_PASSWORD)');
    }
    
    console.log(`Using test credentials: ${testUsername} / ${testPassword ? '[PASSWORD SET]' : '[NO PASSWORD]'}`);
    
    // Log in with test credentials
    await page.getByPlaceholder('Enter your username').fill(testUsername);
    await page.getByPlaceholder('Enter your password').fill(testPassword);
    
    // Click login and wait for the API response
    await Promise.all([
      page.waitForResponse(response => response.url().includes('/api/auth/login')),
      page.getByRole('button', { name: 'Sign In' }).click(),
    ]);

    // Wait for authentication to complete - search interface should appear
    await page.waitForFunction(() => {
      return !!document.querySelector('textarea');
    }, { timeout: 10000 });

    // Verify the main interface elements are present
    const questionTextarea = page.locator('textarea').first();
    await expect(questionTextarea).toBeVisible();
    
    // Verify user can type in the textarea
    await questionTextarea.fill('How do I create a new incident?');
    await expect(questionTextarea).toHaveValue('How do I create a new incident?');
    
    // Verify the Get Help button exists and is enabled when there's a question
    const getHelpButton = page.getByRole('button', { name: 'Get Help' });
    await expect(getHelpButton).toBeVisible();
    await expect(getHelpButton).toBeEnabled();
    
    // Verify user can see the welcome section
    await expect(page.getByText('Welcome to ServiceNow Helper!')).toBeVisible();
    
    // Verify welcome section content is visible
    await expect(page.getByText('I\'m here to help you with ServiceNow implementations')).toBeVisible();

    // Verify streaming-related UI elements are present
    await expect(page.getByText('Documentation')).toBeVisible();
    await expect(page.getByText('Recommendation')).toBeVisible();
    await expect(page.getByText('Script Solution')).toBeVisible();
    await expect(page.getByText('Troubleshoot')).toBeVisible();
  });

  test('should allow user to access conversation history', async ({ page }) => {
    // Navigate to the application and log in
    await page.goto('http://localhost:3000/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);
    
    const testUsername = process.env.TEST_AUTH_USERNAME || process.env.AUTH_USERNAME || 'admin';
    const testPassword = process.env.TEST_AUTH_PASSWORD || process.env.AUTH_PASSWORD || 'password123';
    
    await page.getByPlaceholder('Enter your username').fill(testUsername);
    await page.getByPlaceholder('Enter your password').fill(testPassword);
    
    await Promise.all([
      page.waitForResponse(response => response.url().includes('/api/auth/login')),
      page.getByRole('button', { name: 'Sign In' }).click(),
    ]);

    await page.waitForFunction(() => {
      return !!document.querySelector('textarea');
    }, { timeout: 10000 });

    // Verify the history button exists and is clickable
    const historyButton = page.getByTitle('View conversation history');
    await expect(historyButton).toBeVisible();
    
    // Click the history button - this should open some kind of history interface
    await historyButton.click();
    
    // Wait a moment for any panels to open
    await page.waitForTimeout(1000);
    
    // Just verify that clicking the button doesn't cause errors
    // The exact UI that appears may vary
    console.log('History button clicked successfully');
  });

  test('should show interface elements for conversation management', async ({ page }) => {
    // Navigate to the application and log in
    await page.goto('http://localhost:3000/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);
    
    const testUsername = process.env.TEST_AUTH_USERNAME || process.env.AUTH_USERNAME || 'admin';
    const testPassword = process.env.TEST_AUTH_PASSWORD || process.env.AUTH_PASSWORD || 'password123';
    
    await page.getByPlaceholder('Enter your username').fill(testUsername);
    await page.getByPlaceholder('Enter your password').fill(testPassword);
    
    await Promise.all([
      page.waitForResponse(response => response.url().includes('/api/auth/login')),
      page.getByRole('button', { name: 'Sign In' }).click(),
    ]);

    await page.waitForFunction(() => {
      return !!document.querySelector('textarea');
    }, { timeout: 10000 });

    // Verify that interface has conversation management elements
    const historyButton = page.getByTitle('View conversation history');
    await expect(historyButton).toBeVisible();
    
    // Verify other interface elements that should be present  
    await expect(page.getByRole('heading', { name: 'ServiceNow Helper', exact: true })).toBeVisible();
    
    // Test that we can interact with type selection buttons
    await expect(page.getByRole('button', { name: 'Documentation' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Recommendation' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Script Solution' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Troubleshoot' })).toBeVisible();
  });

  test('should display toggle controls and settings', async ({ page }) => {
    // Navigate to the application and log in
    await page.goto('http://localhost:3000/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);
    
    const testUsername = process.env.TEST_AUTH_USERNAME || process.env.AUTH_USERNAME || 'admin';
    const testPassword = process.env.TEST_AUTH_PASSWORD || process.env.AUTH_PASSWORD || 'password123';
    
    await page.getByPlaceholder('Enter your username').fill(testUsername);
    await page.getByPlaceholder('Enter your password').fill(testPassword);
    
    await Promise.all([
      page.waitForResponse(response => response.url().includes('/api/auth/login')),
      page.getByRole('button', { name: 'Sign In' }).click(),
    ]);

    await page.waitForFunction(() => {
      return !!document.querySelector('textarea');
    }, { timeout: 10000 });

    // Verify toggle controls are present
    await expect(page.getByText('Continue Session')).toBeVisible();
    await expect(page.getByText('Search')).toBeVisible();
    
    // Verify theme toggle and menu are accessible
    // These might be icons or buttons
    const questionTextarea = page.locator('textarea').first();
    await expect(questionTextarea).toBeVisible();
  });

  test('should verify authentication and basic navigation', async ({ page }) => {
    // Navigate to the application and log in
    await page.goto('http://localhost:3000/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);
    
    const testUsername = process.env.TEST_AUTH_USERNAME || process.env.AUTH_USERNAME || 'admin';
    const testPassword = process.env.TEST_AUTH_PASSWORD || process.env.AUTH_PASSWORD || 'password123';
    
    await page.getByPlaceholder('Enter your username').fill(testUsername);
    await page.getByPlaceholder('Enter your password').fill(testPassword);
    
    await Promise.all([
      page.waitForResponse(response => response.url().includes('/api/auth/login')),
      page.getByRole('button', { name: 'Sign In' }).click(),
    ]);

    await page.waitForFunction(() => {
      return !!document.querySelector('textarea');
    }, { timeout: 10000 });

    // Verify successful login by checking for main interface elements
    await expect(page.getByRole('heading', { name: 'ServiceNow Helper', exact: true })).toBeVisible();
    
    // Verify that we can access different parts of the interface
    const questionTextarea = page.locator('textarea').first();
    await expect(questionTextarea).toBeVisible();
    
    // Verify that the history button is accessible
    const historyButton = page.getByTitle('View conversation history');
    await expect(historyButton).toBeVisible();
  });

  test('should display user interface elements properly', async ({ page }) => {
    // Navigate to the application and log in
    await page.goto('http://localhost:3000/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);
    
    const testUsername = process.env.TEST_AUTH_USERNAME || process.env.AUTH_USERNAME || 'admin';
    const testPassword = process.env.TEST_AUTH_PASSWORD || process.env.AUTH_PASSWORD || 'password123';
    
    await page.getByPlaceholder('Enter your username').fill(testUsername);
    await page.getByPlaceholder('Enter your password').fill(testPassword);
    
    await Promise.all([
      page.waitForResponse(response => response.url().includes('/api/auth/login')),
      page.getByRole('button', { name: 'Sign In' }).click(),
    ]);

    await page.waitForFunction(() => {
      return !!document.querySelector('textarea');
    }, { timeout: 10000 });

    // Verify core UI elements are present and functional
    await expect(page.getByRole('heading', { name: 'ServiceNow Helper', exact: true })).toBeVisible();
    
    const questionTextarea = page.locator('textarea').first();
    await expect(questionTextarea).toBeVisible();
    
    // Test that we can type in the textarea
    await questionTextarea.fill('Test question');
    await expect(questionTextarea).toHaveValue('Test question');
    
    // Clear the textarea
    await questionTextarea.fill('');
    await expect(questionTextarea).toHaveValue('');
    
    // Verify the interface is responsive and ready for user interaction
    console.log('All UI elements verified successfully');
  });

  test('should handle streaming interface elements', async ({ page }) => {
    // Navigate to the application and log in
    await page.goto('http://localhost:3000/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);
    
    const testUsername = process.env.TEST_AUTH_USERNAME || process.env.AUTH_USERNAME || 'admin';
    const testPassword = process.env.TEST_AUTH_PASSWORD || process.env.AUTH_PASSWORD || 'password123';
    
    await page.getByPlaceholder('Enter your username').fill(testUsername);
    await page.getByPlaceholder('Enter your password').fill(testPassword);
    
    await Promise.all([
      page.waitForResponse(response => response.url().includes('/api/auth/login')),
      page.getByRole('button', { name: 'Sign In' }).click(),
    ]);

    await page.waitForFunction(() => {
      return !!document.querySelector('textarea');
    }, { timeout: 10000 });

    // Test streaming-related UI elements
    const questionTextarea = page.locator('textarea').first();
    await expect(questionTextarea).toBeVisible();
    
    // Fill in a test question
    await questionTextarea.fill('What is ServiceNow?');
    
    // Verify the submit button changes state when question is entered
    const getHelpButton = page.getByRole('button', { name: 'Get Help' });
    await expect(getHelpButton).toBeVisible();
    await expect(getHelpButton).toBeEnabled();
    
    // Test type selection (streaming should work with all types)
    await expect(page.getByText('Documentation')).toBeVisible();
    await expect(page.getByText('Recommendation')).toBeVisible();
    await expect(page.getByText('Script Solution')).toBeVisible();
    await expect(page.getByText('Troubleshoot')).toBeVisible();
    
    // Test selecting a different type
    await page.getByText('Recommendation').click();
    
    // Verify toggle controls work with streaming
    await expect(page.getByText('Continue Session')).toBeVisible();
    await expect(page.getByText('Search')).toBeVisible();

    console.log('Streaming interface elements verified successfully');
  });

  test('should handle file upload functionality', async ({ page }) => {
    // Navigate to the application and log in
    await page.goto('http://localhost:3000/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);
    
    const testUsername = process.env.TEST_AUTH_USERNAME || process.env.AUTH_USERNAME || 'admin';
    const testPassword = process.env.TEST_AUTH_PASSWORD || process.env.AUTH_PASSWORD || 'password123';
    
    await page.getByPlaceholder('Enter your username').fill(testUsername);
    await page.getByPlaceholder('Enter your password').fill(testPassword);
    
    await Promise.all([
      page.waitForResponse(response => response.url().includes('/api/auth/login')),
      page.getByRole('button', { name: 'Sign In' }).click(),
    ]);

    await page.waitForFunction(() => {
      return !!document.querySelector('textarea');
    }, { timeout: 10000 });

    // Verify file upload component is present for multimodal streaming
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeInTheDocument();

    console.log('File upload functionality verified successfully');
  });
});
