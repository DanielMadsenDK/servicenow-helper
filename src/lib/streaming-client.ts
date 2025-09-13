import { StreamingChunk, StreamingRequest, StreamingStatus } from '@/types';
import { getPerformanceMonitor } from '@/lib/performance-monitor';

export interface StreamingCallbacks {
  onChunk: (chunk: StreamingChunk) => void;
  onComplete: (totalContent: string) => void;
  onError: (error: string) => void;
  onStatusChange: (status: StreamingStatus) => void;
}

export class StreamingClient {
  private eventSource: EventSource | null = null;
  private abortController: AbortController | null = null;
  private chunks: StreamingChunk[] = [];
  private totalContent: string = '';
  private status: StreamingStatus = StreamingStatus.CONNECTING;
  private callbacks: StreamingCallbacks;
  private completionReceived: boolean = false;

  constructor(callbacks: StreamingCallbacks) {
    this.callbacks = callbacks;
  }

  async startStreaming(request: StreamingRequest): Promise<void> {
    try {
      this.reset();
      this.updateStatus(StreamingStatus.CONNECTING);

      // Create abort controller for cancellation
      this.abortController = new AbortController();

      // Make POST request to start streaming
      const response = await fetch('/api/submit-question-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        signal: this.abortController.signal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      // Check if response is SSE stream
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('text/event-stream')) {
        throw new Error('Response is not an event stream');
      }

      // Handle streaming response
      await this.handleStreamingResponse(response);

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        this.updateStatus(StreamingStatus.CANCELLED);
        return;
      }
      
      console.error('Streaming error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      this.updateStatus(StreamingStatus.ERROR);
      this.callbacks.onError(errorMessage);
    }
  }

  private async handleStreamingResponse(response: Response): Promise<void> {
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body reader available');
    }

    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          // Stream ended - check if we received proper completion
          await this.handleStreamEnd();
          break;
        }

        // Decode chunk and process SSE data
        const chunk = decoder.decode(value, { stream: true });
        await this.processSSEChunk(chunk);
      }
    } finally {
      reader.releaseLock();
    }
  }

  private async handleStreamEnd(): Promise<void> {
    if (!this.completionReceived) {
      // Stream ended without proper completion signal
      console.warn('Stream ended without completion signal');
      
      if (this.totalContent.trim().length > 0) {
        // We have content, so complete the stream gracefully
        console.log(`Auto-completing stream with ${this.totalContent.length} characters of content`);
        this.updateStatus(StreamingStatus.COMPLETE);
        this.callbacks.onComplete(this.totalContent);
      } else {
        // No content received - treat as error
        console.error('Stream ended with no content and no completion signal');
        this.updateStatus(StreamingStatus.ERROR);
        this.callbacks.onError('Connection closed without receiving content');
      }
    }
  }

  private async processSSEChunk(rawChunk: string): Promise<void> {
    const lines = rawChunk.split('\n');
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6).trim();
        
        if (data) {
          try {
            // Validate JSON before processing
            const chunk: StreamingChunk = JSON.parse(data);
            await this.handleChunk(chunk);
          } catch (error) {
            console.log('Skipping invalid JSON chunk in SSE stream:', {
              data: data.substring(0, 100) + '...', // First 100 chars for debugging
              error: error instanceof Error ? error.message : String(error)
            });
            // Continue processing other chunks instead of failing
          }
        }
      }
    }
  }

  private async handleChunk(chunk: StreamingChunk): Promise<void> {
    this.chunks.push(chunk);

    switch (chunk.type) {
      case 'connecting':
        this.updateStatus(StreamingStatus.CONNECTING);
        break;

      case 'chunk':
        if (this.status !== StreamingStatus.STREAMING) {
          this.updateStatus(StreamingStatus.STREAMING);
        }
        
        this.totalContent += chunk.content;
        this.callbacks.onChunk(chunk);
        break;

      case 'complete':
        this.completionReceived = true;
        this.updateStatus(StreamingStatus.COMPLETE);
        this.callbacks.onComplete(this.totalContent);
        break;

      case 'error':
        this.updateStatus(StreamingStatus.ERROR);
        this.callbacks.onError(chunk.content);
        break;
    }
  }

  private updateStatus(status: StreamingStatus): void {
    this.status = status;
    this.callbacks.onStatusChange(status);
  }

  private reset(): void {
    this.chunks = [];
    this.totalContent = '';
    this.status = StreamingStatus.CONNECTING;
    this.completionReceived = false;
  }

  public cancel(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
    
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    
    this.updateStatus(StreamingStatus.CANCELLED);
  }

  public getStatus(): StreamingStatus {
    return this.status;
  }

  public getTotalContent(): string {
    return this.totalContent;
  }

  public getChunks(): StreamingChunk[] {
    return [...this.chunks];
  }

  public isActive(): boolean {
    return this.status === StreamingStatus.CONNECTING || 
           this.status === StreamingStatus.STREAMING;
  }

  public dispose(): void {
    this.cancel();
    this.reset();
  }
}

// Enhanced retry utility with exponential backoff and error classification
export async function createStreamingClient(
  request: StreamingRequest,
  callbacks: StreamingCallbacks,
  options: {
    maxRetries?: number;
    baseRetryDelay?: number;
    useExponentialBackoff?: boolean;
    retryableErrorCodes?: string[];
  } = {}
): Promise<StreamingClient> {
  const { 
    maxRetries = 3, 
    baseRetryDelay = 1000,
    useExponentialBackoff = true,
    retryableErrorCodes = ['NetworkError', 'TimeoutError', 'ConnectionError', 'ECONNREFUSED']
  } = options;
  
  let lastError: Error | null = null;
  
  const isRetryableError = (error: Error): boolean => {
    // Don't retry on authentication or permission errors
    if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
      return false;
    }
    
    // Don't retry on validation errors
    if (error.message.includes('validation') || error.message.includes('required fields')) {
      return false;
    }
    
    // Check if error code is in retryable list
    return retryableErrorCodes.some(code => 
      error.message.includes(code) || error.name.includes(code)
    );
  };
  
  const getRetryDelay = (attempt: number): number => {
    if (useExponentialBackoff) {
      // Exponential backoff with jitter
      const exponentialDelay = baseRetryDelay * Math.pow(2, attempt);
      const jitter = Math.random() * 0.1 * exponentialDelay;
      return Math.min(exponentialDelay + jitter, 10000); // Cap at 10 seconds
    }
    return baseRetryDelay;
  };

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const client = new StreamingClient({
        ...callbacks,
        // Enhance callbacks with retry information
        onStatusChange: (status) => {
          callbacks.onStatusChange(status);
          if (attempt > 0 && status === StreamingStatus.CONNECTING) {
            console.log(`Retry attempt ${attempt}/${maxRetries} - reconnecting...`);
          }
        },
        onError: (error) => {
          if (attempt === maxRetries) {
            // This is the final attempt, pass error to original callback
            callbacks.onError(`Connection failed after ${maxRetries + 1} attempts: ${error}`);
          } else if (!isRetryableError(new Error(error))) {
            // Non-retryable error, fail immediately
            callbacks.onError(error);
            throw new Error(error);
          }
          // Otherwise, let retry logic handle it
        }
      });
      
      await client.startStreaming(request);
      
      // Success - log retry success if this wasn't first attempt
      if (attempt > 0) {
        console.log(`Streaming connection established on retry attempt ${attempt}`);
      }
      
      return client;
      
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      // Check if this error is retryable
      if (!isRetryableError(lastError)) {
        console.error('Non-retryable error encountered:', lastError.message);
        throw lastError;
      }
      
      if (attempt < maxRetries) {
        const retryDelay = getRetryDelay(attempt);
        console.log(`Streaming attempt ${attempt + 1}/${maxRetries + 1} failed: ${lastError.message}`);
        console.log(`Retrying in ${retryDelay}ms...`);
        
        // Notify about retry attempt
        callbacks.onStatusChange(StreamingStatus.CONNECTING);
        
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      } else {
        console.error(`All ${maxRetries + 1} streaming attempts failed`);
      }
    }
  }
  
  throw lastError || new Error(`Failed to establish streaming connection after ${maxRetries + 1} attempts`);
}

// Health check utility for connection testing
export async function testStreamingConnection(): Promise<boolean> {
  try {
    const response = await fetch('/api/submit-question-stream', {
      method: 'OPTIONS',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.ok;
  } catch (error) {
    console.error('Streaming connection test failed:', error);
    return false;
  }
}
