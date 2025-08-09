// Mock for streaming-client.js
const StreamingStatus = {
  CONNECTING: 'connecting',
  STREAMING: 'streaming',
  COMPLETE: 'complete',
  ERROR: 'error',
  CANCELLED: 'cancelled'
};

class MockStreamingClient {
  constructor(callbacks) {
    this.callbacks = callbacks || {
      onChunk: jest.fn(),
      onComplete: jest.fn(),
      onError: jest.fn(),
      onStatusChange: jest.fn(),
    };
    this.status = StreamingStatus.CONNECTING;
    this.abortController = null;
  }

  async startStreaming(request) {
    this.callbacks.onStatusChange(StreamingStatus.CONNECTING);
    this.status = StreamingStatus.STREAMING;
    this.callbacks.onStatusChange(StreamingStatus.STREAMING);

    // Simulate streaming chunks
    setTimeout(() => {
      this.callbacks.onChunk({
        content: 'Mock streaming response',
        type: 'chunk',
        timestamp: new Date().toISOString(),
      });
    }, 100);

    setTimeout(() => {
      this.status = StreamingStatus.COMPLETE;
      this.callbacks.onStatusChange(StreamingStatus.COMPLETE);
      this.callbacks.onComplete('Mock streaming response');
    }, 200);
  }

  cancel() {
    if (this.abortController) {
      this.abortController.abort();
    }
    this.status = StreamingStatus.CANCELLED;
    this.callbacks.onStatusChange(StreamingStatus.CANCELLED);
  }

  getStatus() {
    return this.status;
  }
}

const createStreamingClient = jest.fn().mockImplementation((request, callbacks, options) => {
  return Promise.resolve(new MockStreamingClient(callbacks));
});

module.exports = {
  StreamingClient: MockStreamingClient,
  createStreamingClient,
  StreamingStatus,
};