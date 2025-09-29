import { parseStream, N8nChunk } from '@/lib/stream-parser';
import { N8NStreamingClient } from '@/lib/n8n-streaming-client';
import { StreamingRequest } from '@/types';

export class StreamingResponseHandler {
  public static createStreamingResponse(body: StreamingRequest, providerId?: number): ReadableStream {
    return new ReadableStream({
      async start(controller) {
        let completionSent = false;

        const closeController = () => {
            if (controller.desiredSize === null) return;
            try {
                controller.close();
            } catch {
                // Ignore errors from trying to close an already closed controller
            }
        };

        const sendEvent = (type: string, content: string | object | null) => {
            controller.enqueue(`data: ${JSON.stringify({ type, content, timestamp: new Date().toISOString() })}\n\n`);
        };

        try {
          sendEvent('connecting', '');

          const streamData = await N8NStreamingClient.createStreamingConnection(body, providerId);

          for await (const n8nChunk of parseStream<N8nChunk>(streamData)) {
            // Validate chunk structure
            if (!n8nChunk || typeof n8nChunk !== 'object' || !n8nChunk.type) {
              console.error('Invalid N8N chunk received:', n8nChunk);
              continue;
            }

            if (n8nChunk.type === 'begin') {
              console.log("N8N stream began.");
              sendEvent('begin', '');
            } else if (n8nChunk.type === 'end' || n8nChunk.type === 'complete') {
              console.log('N8N stream completed');
              if (!completionSent) {
                sendEvent('complete', '');
                completionSent = true;
              }
            } else if ((n8nChunk.type === 'chunk' || n8nChunk.type === 'item') && n8nChunk.content !== undefined) {
              const content = typeof n8nChunk.content === 'object' ? JSON.stringify(n8nChunk.content) : String(n8nChunk.content);
              sendEvent('chunk', content);
            } else if (n8nChunk.type === 'error') {
              console.log('N8N error:', n8nChunk.content);
              sendEvent('error', n8nChunk.content || 'Unknown error occurred');
            }
          }

        } catch (error) {
          console.error('Streaming error:', error);
          const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
          sendEvent('error', errorMessage);
        } finally {
            if (!completionSent) {
                sendEvent('complete', '');
                completionSent = true;
            }
            // Use a small delay to ensure the client receives the last message
            setTimeout(closeController, 50);
        }
      },
    });
  }

  public static getStreamingHeaders(): Record<string, string> {
    return {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
  }
}