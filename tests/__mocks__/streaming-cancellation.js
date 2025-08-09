// Mock for streaming-cancellation.js
class MockStreamingCancellationManager {
  constructor() {
    this.clients = new Map();
  }

  register(sessionKey, client) {
    this.clients.set(sessionKey, client);
  }

  cancel(sessionKey) {
    const client = this.clients.get(sessionKey);
    if (client) {
      try {
        client.cancel();
        this.clients.delete(sessionKey);
        return true;
      } catch (error) {
        // Handle cancel errors gracefully
        return true;
      }
    }
    return false;
  }

  cancelAll() {
    let cancelled = 0;
    for (const [sessionKey, client] of this.clients.entries()) {
      try {
        client.cancel();
        cancelled++;
      } catch (error) {
        // Handle cancel errors gracefully but still count as cancelled
        cancelled++;
      }
    }
    this.clients.clear();
    return cancelled;
  }

  cleanup(sessionKey) {
    this.clients.delete(sessionKey);
  }

  getActiveSessionCount() {
    return this.clients.size;
  }

  hasActiveSession(sessionKey) {
    return this.clients.has(sessionKey);
  }
}

const mockStreamingCancellation = new MockStreamingCancellationManager();

module.exports = {
  StreamingCancellationManager: MockStreamingCancellationManager,
  streamingCancellation: mockStreamingCancellation,
};