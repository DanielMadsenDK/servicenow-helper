import { StreamingClient } from './streaming-client';

interface StreamingSession {
  client: StreamingClient;
  sessionKey: string;
  abortController?: AbortController;
  timestamp: number;
}

export class StreamingCancellationManager {
  private static instance: StreamingCancellationManager;
  private sessions = new Map<string, StreamingSession>();
  
  private constructor() {}

  public static getInstance(): StreamingCancellationManager {
    if (!StreamingCancellationManager.instance) {
      StreamingCancellationManager.instance = new StreamingCancellationManager();
    }
    return StreamingCancellationManager.instance;
  }

  public registerSession(
    sessionKey: string, 
    client: StreamingClient, 
    abortController?: AbortController
  ): void {
    this.sessions.set(sessionKey, {
      client,
      sessionKey,
      abortController,
      timestamp: Date.now()
    });
  }

  public cancelSession(sessionKey: string): boolean {
    const session = this.sessions.get(sessionKey);
    if (!session) {
      console.warn(`No streaming session found for key: ${sessionKey}`);
      return false;
    }

    try {
      // Cancel the streaming client
      session.client.cancel();
      
      // Cancel the abort controller if present
      if (session.abortController) {
        session.abortController.abort();
      }

      // Remove from active sessions
      this.sessions.delete(sessionKey);
      
      console.log(`Successfully cancelled streaming session: ${sessionKey}`);
      return true;
    } catch (error) {
      console.error(`Error cancelling streaming session ${sessionKey}:`, error);
      return false;
    }
  }

  public isSessionActive(sessionKey: string): boolean {
    const session = this.sessions.get(sessionKey);
    return session ? session.client.isActive() : false;
  }

  public cleanupSession(sessionKey: string): void {
    const session = this.sessions.get(sessionKey);
    if (session) {
      session.client.dispose();
      this.sessions.delete(sessionKey);
    }
  }

  public cancelAllActiveSessions(): void {
    for (const [sessionKey, session] of this.sessions) {
      if (session.client.isActive()) {
        this.cancelSession(sessionKey);
      }
    }
  }

  public getActiveSessions(): string[] {
    return Array.from(this.sessions.keys()).filter(key => 
      this.isSessionActive(key)
    );
  }

  public getSessionCount(): number {
    return this.sessions.size;
  }

  // Cleanup old completed sessions (called periodically)
  public cleanupOldSessions(maxAgeMs: number = 5 * 60 * 1000): void {
    const now = Date.now();
    for (const [sessionKey, session] of this.sessions) {
      if (!session.client.isActive() && (now - session.timestamp) > maxAgeMs) {
        this.cleanupSession(sessionKey);
      }
    }
  }

  // Emergency cancel all - for window unload or critical errors
  public emergencyShutdown(): void {
    for (const [sessionKey, session] of this.sessions) {
      try {
        session.client.dispose();
        if (session.abortController) {
          session.abortController.abort();
        }
      } catch (error) {
        console.error(`Error during emergency shutdown of session ${sessionKey}:`, error);
      }
    }
    this.sessions.clear();
  }
}

// Create singleton instance
export const streamingCancellation = StreamingCancellationManager.getInstance();

// Setup automatic cleanup on window unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    streamingCancellation.emergencyShutdown();
  });

  // Periodic cleanup of old sessions
  setInterval(() => {
    streamingCancellation.cleanupOldSessions();
  }, 60000); // Every minute
}