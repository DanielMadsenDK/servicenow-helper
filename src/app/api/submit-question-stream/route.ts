import { NextRequest } from 'next/server';
import axios from 'axios';
import { StreamingRequest } from '@/types';
import { getServerAuthState } from '@/lib/server-auth';
import { generateSessionId } from '@/lib/session-utils';

const API_BASE_URL = process.env.N8N_WEBHOOK_URL!;
const API_KEY = process.env.N8N_API_KEY!;

interface N8nChunk {
  type: 'begin' | 'chunk' | 'item' | 'end' | 'complete' | 'error';
  content?: string | object | null;
  timestamp?: string;
}


// Detect stream format and return appropriate parser
async function* parseStream<T>(stream: NodeJS.ReadableStream): AsyncGenerator<T> {
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let isFirstChunkProcessed = false;
  let useSSEParser = false;
  
  for await (const chunk of stream) {
    let uint8Array: Uint8Array;
    if (chunk instanceof Uint8Array) {
      uint8Array = chunk;
    } else if (typeof chunk === 'string') {
      uint8Array = new TextEncoder().encode(chunk);
    } else {
      uint8Array = new Uint8Array(chunk);
    }
    
    const chunkText = decoder.decode(uint8Array, { stream: true });
    buffer += chunkText;
    
    // Detect format from first chunk
    if (!isFirstChunkProcessed && buffer.trim().length > 0) {
      useSSEParser = buffer.trim().startsWith('data: ');
      console.log(`Stream format detected: ${useSSEParser ? 'SSE' : 'JSON'} (First chunk: ${buffer.substring(0, 100)}...)`);
      isFirstChunkProcessed = true;
    }
    
    // Process based on detected format
    if (useSSEParser) {
      // SSE format: split by double newlines
      const parts = buffer.split('\n\n');
      buffer = parts.pop() || '';
      
      for (const part of parts) {
        if (part.startsWith('data: ')) {
          const jsonString = part.substring(6);
          if (jsonString) {
            try {
              const parsed = JSON.parse(jsonString);
              yield parsed;
            } catch (error) {
              console.error('Failed to parse SSE JSON chunk:', error, 'Raw data:', jsonString);
            }
          }
        }
      }
    } else {
      // JSON format: split by newlines
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine) {
          try {
            const parsed = JSON.parse(trimmedLine);
            yield parsed;
          } catch (error) {
            console.error('Failed to parse JSON chunk:', error, 'Raw data:', trimmedLine);
          }
        }
      }
    }
  }
  
  // Process any remaining data in buffer
  if (buffer.trim()) {
    if (useSSEParser && buffer.startsWith('data: ')) {
      const jsonString = buffer.substring(6);
      try {
        const parsed = JSON.parse(jsonString);
        yield parsed;
      } catch (error) {
        console.error('Failed to parse final SSE JSON chunk:', error, 'Raw data:', jsonString);
      }
    } else if (!useSSEParser) {
      try {
        const parsed = JSON.parse(buffer.trim());
        yield parsed;
      } catch (error) {
        console.error('Failed to parse final JSON chunk:', error, 'Raw data:', buffer);
      }
    }
  }
}


export async function POST(request: NextRequest) {
  try {
    const { isAuthenticated } = await getServerAuthState();
    if (!isAuthenticated) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    const body: StreamingRequest = await request.json();

    // A single function for validation logic
    const validationError = validateRequest(body);
    if (validationError) {
        return new Response(JSON.stringify({ success: false, error: validationError }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (!API_BASE_URL || !API_KEY) {
      return new Response(JSON.stringify({ success: false, error: 'Server configuration error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    const stream = new ReadableStream({
      async start(controller) {
        let completionSent = false;

        const closeController = () => {
            if (controller.desiredSize === null || controller.desiredSize <= 0) return;
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

          const n8nStreamingRequest = {
            action: 'sendMessage',
            sessionId: body.sessionkey || generateSessionId(),
            chatInput: body.question,
            metadata: {
              type: body.type,
              aiModel: body.aiModel,
              agentModels: body.agentModels,
              file: body.file,
              searching: body.searching,
              userId: 'streaming_user'
            }
          };

          const response = await axios.post(API_BASE_URL, n8nStreamingRequest, {
            headers: {
              'Content-Type': 'application/json',
              'apikey': API_KEY,
              'Accept': 'text/event-stream',
              'X-Client-Type': 'streaming',
            },
            responseType: 'stream',
            timeout: 480000, // 8 minutes
          });

          for await (const n8nChunk of parseStream<N8nChunk>(response.data)) {
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

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });

  } catch (error) {
    console.error('Streaming API Error:', error);
    const status = axios.isAxiosError(error) ? error.response?.status || 500 : 500;
    const message = axios.isAxiosError(error) ? error.response?.data?.message || error.message : (error instanceof Error ? error.message : 'An unexpected error occurred');
    return new Response(JSON.stringify({ success: false, error: message }), { status, headers: { 'Content-Type': 'application/json' } });
  }
}

function validateRequest(body: StreamingRequest): string | null {
    if (!body.question || !body.type) {
        return 'Missing required fields: question and type are required';
    }
    if (!body.aiModel && (!body.agentModels || body.agentModels.length === 0)) {
        return 'Either aiModel or agentModels with at least one agent configuration must be provided';
    }
    if (body.agentModels) {
        const allowedAgents = ['orchestration', 'business_rule', 'client_script'];
        for (const agentModel of body.agentModels) {
            if (!agentModel.agent || !agentModel.model) {
                return 'Each agent configuration must have both agent and model properties';
            }
            if (!allowedAgents.includes(agentModel.agent)) {
                return `Invalid agent name: ${agentModel.agent}. Allowed agents: ${allowedAgents.join(', ')}`;
            }
        }
    }
    if (body.file) {
        if(typeof body.file !== 'string') {
            return 'File must be a base64 encoded string';
        }
        if (body.file.length > 10 * 1024 * 1024 * 1.33) { // ~10MB limit
            return 'File too large (max 10MB)';
        }
    }
    return null;
}


export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}