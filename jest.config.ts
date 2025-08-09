import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
});

// Add any custom config to be passed to Jest
const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  // Add more setup options before each test is run
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testMatch: ['<rootDir>/tests/unit/**/*.test.{ts,tsx}'],
  testPathIgnorePatterns: [
    '<rootDir>/tests/integration.spec.ts',
    '<rootDir>/.next/',
    '<rootDir>/node_modules/'
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(@testing-library/react|@testing-library/jest-dom)/)'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    // Mock problematic dependencies
    '^react-markdown$': '<rootDir>/tests/__mocks__/react-markdown.tsx',
    '^remark-gfm$': '<rootDir>/tests/__mocks__/remark-gfm.js',
    '^rehype-highlight$': '<rootDir>/tests/__mocks__/rehype-highlight.js',
    '^pg$': '<rootDir>/tests/__mocks__/pg.js',
    // Mock streaming modules
    '^@/lib/streaming-client$': '<rootDir>/tests/__mocks__/streaming-client.js',
    '^@/lib/streaming-cancellation$': '<rootDir>/tests/__mocks__/streaming-cancellation.js',
    '^@/hooks/useNetworkStatus$': '<rootDir>/tests/__mocks__/useNetworkStatus.js',
  },
  clearMocks: true,
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.tsx',
  ],
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default createJestConfig(config);