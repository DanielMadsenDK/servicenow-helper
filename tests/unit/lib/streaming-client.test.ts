import { StreamingClient, StreamingCallbacks, createStreamingClient } from '@/lib/streaming-client';
import { StreamingRequest, StreamingStatus } from '@/types';

// Mock global fetch
global.fetch = jest.fn();
global.EventSource = jest.fn();

const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe('StreamingClient', () => {
  let callbacks: StreamingCallbacks;
  let mockRequest: StreamingRequest;
  let client: StreamingClient;

  beforeEach(() => {
    jest.clearAllMocks();
    
    callbacks = {
      onChunk: jest.fn(),
      onComplete: jest.fn(),
      onError: jest.fn(),
      onStatusChange: jest.fn(),
    };

    mockRequest = {
      question: 'How do I create an incident?',
      type: 'documentation',
      sessionkey: 'test-session-123',
      searching: false,
      aiModel: 'claude-3',
      agentModels: [
        { agent: 'orchestration', model: 'claude-3' },
        { agent: 'business_rule', model: 'claude-3' },
        { agent: 'client_script', model: 'claude-3' }
      ],
    };

    client = new StreamingClient(callbacks);
  });

  describe('Constructor', () => {
    it('should initialize with callbacks', () => {
      expect(client).toBeInstanceOf(StreamingClient);
    });
  });

  describe('startStreaming', () => {
    it('should make POST request to streaming endpoint', async () => {
      const mockResponse = {
        ok: true,
        headers: new Map([['content-type', 'text/event-stream']]),
        body: {
          getReader: jest.fn(() => ({
            read: jest.fn()
              .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode('data: {"content": "Hello"}\n\n') })
              .mockResolvedValueOnce({ done: true }),
            releaseLock: jest.fn(),
          })),
        },
      };

      mockFetch.mockResolvedValueOnce(mockResponse as any);

      await client.startStreaming(mockRequest);

      expect(mockFetch).toHaveBeenCalledWith('/api/submit-question-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mockRequest),
        signal: expect.objectContaining({
          aborted: false,
          addEventListener: expect.any(Function),
          removeEventListener: expect.any(Function),
          dispatchEvent: expect.any(Function),
        }),
      });
    });

    it('should handle successful streaming response', async () => {
      const mockChunkData = { content: 'Hello world', type: 'chunk', timestamp: '2024-01-01T00:00:00Z' };
      const mockResponseData = `data: ${JSON.stringify(mockChunkData)}\n\n`;
      
      const mockResponse = {
        ok: true,
        headers: new Map([['content-type', 'text/event-stream']]),
        body: {
          getReader: jest.fn(() => ({
            read: jest.fn()
              .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode(mockResponseData) })
              .mockResolvedValueOnce({ done: true }),
            releaseLock: jest.fn(),
          })),
        },
      };

      mockFetch.mockResolvedValueOnce(mockResponse as any);

      await client.startStreaming(mockRequest);

      expect(callbacks.onStatusChange).toHaveBeenCalledWith(StreamingStatus.CONNECTING);
      expect(callbacks.onChunk).toHaveBeenCalledWith(mockChunkData);
    });

    it('should handle HTTP errors', async () => {
      const mockErrorResponse = {
        ok: false,
        status: 500,
        json: jest.fn().mockResolvedValue({ error: 'Internal server error' }),
      };

      mockFetch.mockResolvedValueOnce(mockErrorResponse as any);

      await client.startStreaming(mockRequest);

      expect(callbacks.onStatusChange).toHaveBeenCalledWith(StreamingStatus.ERROR);
      expect(callbacks.onError).toHaveBeenCalledWith('Internal server error');
    });

    it('should handle non-event-stream responses', async () => {
      const mockResponse = {
        ok: true,
        headers: new Map([['content-type', 'application/json']]),
      };

      mockFetch.mockResolvedValueOnce(mockResponse as any);

      await client.startStreaming(mockRequest);

      expect(callbacks.onStatusChange).toHaveBeenCalledWith(StreamingStatus.ERROR);
      expect(callbacks.onError).toHaveBeenCalledWith('Response is not an event stream');
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network error');
      mockFetch.mockRejectedValueOnce(networkError);

      await client.startStreaming(mockRequest);

      expect(callbacks.onStatusChange).toHaveBeenCalledWith(StreamingStatus.ERROR);
      expect(callbacks.onError).toHaveBeenCalledWith('Network error');
    });

    it('should handle cancellation', async () => {
      const abortError = new Error('Request cancelled');
      abortError.name = 'AbortError';
      mockFetch.mockRejectedValueOnce(abortError);

      await client.startStreaming(mockRequest);

      expect(callbacks.onStatusChange).toHaveBeenCalledWith(StreamingStatus.CANCELLED);
    });
  });

  describe('cancel', () => {
    it('should cancel ongoing request', async () => {
      // Test basic cancel functionality
      client.cancel();
      
      const status = client.getStatus();
      expect([StreamingStatus.CANCELLED, StreamingStatus.CONNECTING]).toContain(status);
    });
  });

  describe('SSE Chunk Processing', () => {
    it('should process multiple SSE chunks', async () => {
      const chunk1 = { content: 'Hello ', type: 'chunk', timestamp: '2024-01-01T00:00:00Z' };
      const chunk2 = { content: 'world!', type: 'chunk', timestamp: '2024-01-01T00:00:01Z' };
      
      const sseData = `data: ${JSON.stringify(chunk1)}\n\ndata: ${JSON.stringify(chunk2)}\n\n`;
      
      const mockResponse = {
        ok: true,
        headers: new Map([['content-type', 'text/event-stream']]),
        body: {
          getReader: jest.fn(() => ({
            read: jest.fn()
              .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode(sseData) })
              .mockResolvedValueOnce({ done: true }),
            releaseLock: jest.fn(),
          })),
        },
      };

      mockFetch.mockResolvedValueOnce(mockResponse as any);

      await client.startStreaming(mockRequest);

      expect(callbacks.onChunk).toHaveBeenCalledTimes(2);
      expect(callbacks.onChunk).toHaveBeenNthCalledWith(1, chunk1);
      expect(callbacks.onChunk).toHaveBeenNthCalledWith(2, chunk2);
    });

    it('should handle malformed JSON in SSE chunks', async () => {
      const malformedData = 'data: {invalid json}\n\n';
      
      const mockResponse = {
        ok: true,
        headers: new Map([['content-type', 'text/event-stream']]),
        body: {
          getReader: jest.fn(() => ({
            read: jest.fn()
              .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode(malformedData) })
              .mockResolvedValueOnce({ done: true }),
            releaseLock: jest.fn(),
          })),
        },
      };

      mockFetch.mockResolvedValueOnce(mockResponse as any);

      await client.startStreaming(mockRequest);

      // Should not call onChunk for malformed data, but should not crash
      expect(callbacks.onChunk).not.toHaveBeenCalled();
    });

    it('should handle completion chunks', async () => {
      const contentChunk = { content: 'Some content', type: 'chunk', timestamp: '2024-01-01T00:00:00Z' };
      const completionChunk = { content: '', type: 'complete', timestamp: '2024-01-01T00:00:01Z' };
      const sseData = `data: ${JSON.stringify(contentChunk)}\n\ndata: ${JSON.stringify(completionChunk)}\n\n`;
      
      const mockResponse = {
        ok: true,
        headers: new Map([['content-type', 'text/event-stream']]),
        body: {
          getReader: jest.fn(() => ({
            read: jest.fn()
              .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode(sseData) })
              .mockResolvedValueOnce({ done: true }),
            releaseLock: jest.fn(),
          })),
        },
      };

      mockFetch.mockResolvedValueOnce(mockResponse as any);

      await client.startStreaming(mockRequest);

      expect(callbacks.onChunk).toHaveBeenCalledWith(contentChunk);
      expect(callbacks.onChunk).toHaveBeenCalledTimes(1); // Only called for content chunks, not completion
      expect(callbacks.onComplete).toHaveBeenCalledWith('Some content');
      expect(callbacks.onStatusChange).toHaveBeenCalledWith(StreamingStatus.COMPLETE);
    });
  });

  describe('createStreamingClient', () => {
    it('should create and return StreamingClient instance', async () => {
      const mockResponse = {
        ok: true,
        headers: new Map([['content-type', 'text/event-stream']]),
        body: {
          getReader: jest.fn(() => ({
            read: jest.fn().mockResolvedValueOnce({ done: true }),
            releaseLock: jest.fn(),
          })),
        },
      };

      mockFetch.mockResolvedValueOnce(mockResponse as any);

      const client = await createStreamingClient(mockRequest, callbacks);

      expect(client).toBeInstanceOf(StreamingClient);
    });

    it('should handle basic error scenarios', async () => {
      const networkError = new Error('Network error');
      mockFetch.mockRejectedValueOnce(networkError);

      const client = await createStreamingClient(mockRequest, callbacks, {
        maxRetries: 0,
        baseRetryDelay: 10,
      });

      expect(client).toBeInstanceOf(StreamingClient);
      expect(client.getStatus()).toBe(StreamingStatus.ERROR);
      expect(callbacks.onError).toHaveBeenCalledWith(
        expect.stringContaining('Network error')
      );
    });
  });

  describe('Status Management', () => {
    it('should track status correctly throughout lifecycle', async () => {
      const mockChunk = { content: 'Test', type: 'chunk', timestamp: '2024-01-01T00:00:00Z' };
      const completionChunk = { content: '', type: 'complete', timestamp: '2024-01-01T00:00:01Z' };
      
      const sseData = `data: ${JSON.stringify(mockChunk)}\n\ndata: ${JSON.stringify(completionChunk)}\n\n`;
      
      const mockResponse = {
        ok: true,
        headers: new Map([['content-type', 'text/event-stream']]),
        body: {
          getReader: jest.fn(() => ({
            read: jest.fn()
              .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode(sseData) })
              .mockResolvedValueOnce({ done: true }),
            releaseLock: jest.fn(),
          })),
        },
      };

      mockFetch.mockResolvedValueOnce(mockResponse as any);

      await client.startStreaming(mockRequest);

      expect(callbacks.onStatusChange).toHaveBeenCalledWith(StreamingStatus.CONNECTING);
      expect(callbacks.onStatusChange).toHaveBeenCalledWith(StreamingStatus.STREAMING);
      expect(callbacks.onStatusChange).toHaveBeenCalledWith(StreamingStatus.COMPLETE);
    });

    it('should provide current status', () => {
      const status = client.getStatus();
      expect(typeof status).toBe('string');
      expect(Object.values(StreamingStatus)).toContain(status);
    });
  });
});