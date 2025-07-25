// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Polyfills for Node.js environment
global.TextEncoder = require('util').TextEncoder;
global.TextDecoder = require('util').TextDecoder;

// Mock Request and Response for Next.js API routes
// Using Next.js provided mocks instead of node-fetch
global.Request = jest.fn().mockImplementation((url, options) => ({
  url,
  method: options?.method || 'GET',
  headers: new Map(Object.entries(options?.headers || {})),
  json: () => Promise.resolve(options?.body ? JSON.parse(options.body) : {}),
  text: () => Promise.resolve(options?.body || ''),
  cookies: {
    get: jest.fn().mockReturnValue({ value: 'mock-token' }),
  },
}));

// Mock Response constructor with static methods
const MockResponse = jest.fn().mockImplementation((body?: BodyInit | null, init?: ResponseInit) => ({
  ok: true,
  status: init?.status || 200,
  statusText: init?.statusText || 'OK',
  headers: new Headers(init?.headers),
  redirected: false,
  url: '',
  json: () => Promise.resolve(body ? JSON.parse(body as string) : {}),
  text: () => Promise.resolve(body?.toString() || ''),
  blob: () => Promise.resolve(new Blob()),
  arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
  formData: () => Promise.resolve(new FormData()),
  bytes: () => Promise.resolve(new Uint8Array()),
  clone: function() { return this; },
  body: null,
  bodyUsed: false,
  type: 'default' as ResponseType,
}));

// Add static methods to the mock
(MockResponse as any).error = jest.fn(() => new MockResponse(null, { status: 500 }));
(MockResponse as any).json = jest.fn((data: any, init?: ResponseInit) => 
  new MockResponse(JSON.stringify(data), { 
    ...init, 
    headers: { 'Content-Type': 'application/json', ...init?.headers } 
  })
);
(MockResponse as any).redirect = jest.fn((url: string | URL, status?: number) => 
  new MockResponse(null, { status: status || 302, headers: { Location: url.toString() } })
);

global.Response = MockResponse as any;

global.fetch = jest.fn((url, options) => {
  if (url === '/api/auth/verify') {
    return Promise.resolve({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Headers(),
      redirected: false,
      url: url as string,
      json: () => Promise.resolve({ success: true }),
      text: () => Promise.resolve('{"success": true}'),
      blob: () => Promise.resolve(new Blob()),
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
      formData: () => Promise.resolve(new FormData()),
      bytes: () => Promise.resolve(new Uint8Array()),
      clone: () => global.fetch(url, options),
      body: null,
      bodyUsed: false,
      type: 'default' as ResponseType,
    } as unknown as Response);
  } else if (url === '/api/auth/login') {
    return Promise.resolve({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Headers(),
      redirected: false,
      url: url as string,
      json: () => Promise.resolve({ success: true }),
      text: () => Promise.resolve('{"success": true}'),
      blob: () => Promise.resolve(new Blob()),
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
      formData: () => Promise.resolve(new FormData()),
      bytes: () => Promise.resolve(new Uint8Array()),
      clone: () => global.fetch(url, options),
      body: null,
      bodyUsed: false,
      type: 'default' as ResponseType,
    } as unknown as Response);
  }
  return Promise.reject(new Error(`Unhandled fetch request for ${url}`));
}) as jest.Mock;

// Mock window.matchMedia for theme switching tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});
