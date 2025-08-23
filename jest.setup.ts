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

// Mock window.matchMedia for theme switching tests (only in jsdom environment)
if (typeof window !== 'undefined') {
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
}

// Mock EventSource for streaming tests
const MockEventSource = jest.fn().mockImplementation((url) => ({
  url,
  readyState: 1, // OPEN
  onopen: null,
  onmessage: null,
  onerror: null,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  close: jest.fn(),
})) as any;

// Add static properties to the constructor
MockEventSource.CONNECTING = 0;
MockEventSource.OPEN = 1;
MockEventSource.CLOSED = 2;

global.EventSource = MockEventSource;

// Mock AbortController for streaming cancellation tests
global.AbortController = jest.fn().mockImplementation(() => ({
  signal: {
    aborted: false,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  },
  abort: jest.fn(),
}));

// Mock ReadableStream for streaming response tests
global.ReadableStream = jest.fn().mockImplementation(() => ({
  getReader: jest.fn(() => ({
    read: jest.fn(() => Promise.resolve({ done: true })),
    releaseLock: jest.fn(),
  })),
  pipeTo: jest.fn(),
  pipeThrough: jest.fn(),
  tee: jest.fn(),
}));

// Mock TextEncoder/TextDecoder for streaming chunk processing tests
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = class TextEncoder {
    encode(str: string) {
      return new Uint8Array(Buffer.from(str, 'utf8'));
    }
  } as any;
}

if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = class TextDecoder {
    decode(bytes: any) {
      return Buffer.from(bytes).toString('utf8');
    }
  } as any;
}

// Enhanced fetch mock for streaming endpoints
const originalFetch = global.fetch;
global.fetch = jest.fn((url, options) => {
  // Handle streaming endpoints
  if (typeof url === 'string' && url.includes('/api/submit-question-stream')) {
    const mockReadableStream = new ReadableStream();
    return Promise.resolve({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Map([['content-type', 'text/event-stream']]),
      body: mockReadableStream,
      json: () => Promise.resolve({}),
      text: () => Promise.resolve(''),
    } as unknown as Response);
  }
  
  // Handle cancel endpoints
  if (typeof url === 'string' && url.includes('/api/cancel-request')) {
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ success: true }),
    } as unknown as Response);
  }
  
  // Fall back to original implementation for other URLs
  if (originalFetch) {
    return originalFetch(url, options);
  }
  
  return Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
  } as unknown as Response);
});
