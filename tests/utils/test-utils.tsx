/**
 * Enhanced test utilities for ServiceNow Helper
 */

import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { AIModelProvider } from '@/contexts/AIModelContext';
import { AgentModelProvider } from '@/contexts/AgentModelContext';

// Mock implementations for testing
export const mockAuthContext = {
  login: jest.fn(),
  logout: jest.fn(),
};

export const mockSettingsContext = {
  settings: {
    welcome_section_visible: true,
    default_search_mode: false,
    default_request_type: 'recommendation',
    servicenow_instance_url: '',
    default_ai_model: 'anthropic/claude-sonnet-4',
  },
  updateSetting: jest.fn(),
};

export const mockAIModelsContext = {
  models: [
    {
      id: 'anthropic/claude-sonnet-4',
      name: 'Claude Sonnet 4',
      provider: 'anthropic',
      model_name: 'claude-sonnet-4',
      capabilities: ['text'],
      context_window: 200000,
      max_tokens: 4096,
      pricing: { input: 0.03, output: 0.15 },
      is_active: true,
    },
  ],
};

export const mockAgentModelsContext = {
  agentModels: {
    orchestration: 'anthropic/claude-sonnet-4',
    business_rule: 'anthropic/claude-sonnet-4',
    client_script: 'anthropic/claude-sonnet-4',
    script_include: 'anthropic/claude-sonnet-4',
  },
  updateAgentModels: jest.fn(),
};

// Custom render function that includes all providers
const AllTheProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SettingsProvider>
          <AIModelProvider>
            <AgentModelProvider>
              {children}
            </AgentModelProvider>
          </AIModelProvider>
        </SettingsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything
export * from '@testing-library/react';

// Override render method
export { customRender as render };

// Test data factories
export const createMockUser = (overrides = {}) => ({
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  ...overrides,
});

export const createMockConversation = (overrides = {}) => ({
  id: 1,
  created_at: new Date('2024-01-01T00:00:00Z'),
  prompt: 'Test question',
  response: 'Test response',
  model: 'claude-sonnet-4',
  state: 'done',
  key: 'session-123',
  question: 'Test question',
  ...overrides,
});

export const createMockStreamingChunk = (overrides = {}) => ({
  type: 'chunk',
  content: 'Test content',
  timestamp: new Date().toISOString(),
  ...overrides,
});

// Performance testing utilities
export const measureRenderTime = async (component: ReactElement): Promise<number> => {
  const start = performance.now();
  customRender(component);
  const end = performance.now();
  return end - start;
};

export const waitForPerformance = (callback: () => void, timeout = 100): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      callback();
      resolve();
    }, timeout);
  });
};

// Mock fetch for API testing
export const mockFetchResponse = (data: any, status = 200) => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(data),
      text: () => Promise.resolve(JSON.stringify(data)),
      headers: new Headers({ 'content-type': 'application/json' }),
    } as Response)
  );
};

export const mockFetchError = (error: Error) => {
  global.fetch = jest.fn(() => Promise.reject(error));
};

// Local storage mock
export const mockLocalStorage = () => {
  const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  };
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
  });
  return localStorageMock;
};

// Intersection Observer mock
export const mockIntersectionObserver = () => {
  global.IntersectionObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }));
};

// Resize Observer mock
export const mockResizeObserver = () => {
  global.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }));
};

// Performance API mock
export const mockPerformanceAPI = () => {
  Object.defineProperty(window, 'performance', {
    value: {
      now: jest.fn(() => Date.now()),
      mark: jest.fn(),
      measure: jest.fn(),
      getEntriesByName: jest.fn(() => []),
      getEntriesByType: jest.fn(() => []),
    },
    writable: true,
  });
};

// Setup all mocks at once
export const setupTestEnvironment = () => {
  mockLocalStorage();
  mockIntersectionObserver();
  mockResizeObserver();
  mockPerformanceAPI();

  // Mock console methods to reduce noise in tests
  const originalConsole = { ...console };
  console.warn = jest.fn();
  console.error = jest.fn();

  return {
    restoreConsole: () => {
      Object.assign(console, originalConsole);
    },
  };
};

// Custom matchers
export const customMatchers = {
  toBeVisibleInViewport: (element: Element) => {
    const rect = element.getBoundingClientRect();
    const isVisible = rect.top >= 0 &&
                     rect.left >= 0 &&
                     rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
                     rect.right <= (window.innerWidth || document.documentElement.clientWidth);

    return {
      pass: isVisible,
      message: () => `Expected element to be visible in viewport`,
    };
  },

  toHaveAccessibleName: (element: Element, expectedName: string) => {
    const accessibleName = element.getAttribute('aria-label') ||
                          element.getAttribute('aria-labelledby') ||
                          element.textContent?.trim();

    return {
      pass: accessibleName === expectedName,
      message: () => `Expected element to have accessible name "${expectedName}", but got "${accessibleName}"`,
    };
  },
};

// Test helper for async operations
export const flushPromises = () => new Promise(setImmediate);

// Test helper for waiting for state updates
export const waitForStateUpdate = (callback: () => boolean, timeout = 1000): Promise<void> => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const checkCondition = () => {
      if (callback()) {
        resolve();
      } else if (Date.now() - startTime > timeout) {
        reject(new Error('Timeout waiting for state update'));
      } else {
        setTimeout(checkCondition, 10);
      }
    };

    checkCondition();
  });
};
