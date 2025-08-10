import { NextRequest } from 'next/server';
import axios from 'axios';
import { StreamingRequest } from '@/types';
import { getServerAuthState } from '@/lib/server-auth';
import { generateSessionId } from '@/lib/session-utils';

const API_BASE_URL = process.env.N8N_WEBHOOK_URL!;
const API_KEY = process.env.N8N_API_KEY!;

export async function POST(request: NextRequest) {
  try {
    const { isAuthenticated } = await getServerAuthState();
    if (!isAuthenticated) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const body: StreamingRequest = await request.json();

    // Validate request body
    if (!body.question || !body.type || !body.aiModel) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: question, type, and aiModel are required' 
        }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate file if provided
    if (body.file && typeof body.file !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: 'File must be a base64 encoded string' }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Basic file size validation (base64 encoded, roughly 1.33x larger than original)
    if (body.file && body.file.length > 10 * 1024 * 1024 * 1.33) { // ~10MB limit
      return new Response(
        JSON.stringify({ success: false, error: 'File too large (max 10MB)' }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate environment variables
    if (!API_BASE_URL || !API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: 'Server configuration error' }),
        { 
          status: 500, 
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Create streaming response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send initial connecting message
          controller.enqueue(
            `data: ${JSON.stringify({
              content: '',
              type: 'connecting',
              timestamp: new Date().toISOString()
            })}\n\n`
          );

          // Call n8n webhook with streaming enabled
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'apikey': API_KEY,
            'Accept': 'text/event-stream',
          };

          // Transform request to n8n's expected streaming format
          const n8nStreamingRequest = {
            action: 'sendMessage',
            sessionId: generateSessionId(),
            chatInput: body.question,
            metadata: {
              type: body.type,
              aiModel: body.aiModel,
              file: body.file,
              userId: 'streaming_user'
            }
          };

          const response = await axios.post(API_BASE_URL, n8nStreamingRequest, {
            headers,
            responseType: 'stream',
            timeout: 330000, // 5.5 minutes
          });

          // Handle streaming response from n8n with proper buffer accumulation
          const textDecoder = new TextDecoder('utf-8');
          let partialJsonBuffer = '';
          
          const processJsonLine = (jsonLine: string) => {
            try {
              const n8nChunk = JSON.parse(jsonLine);
              
              // Simple processing based on N8N's actual format
              if (n8nChunk.type === 'begin') {
                controller.enqueue(
                  `data: ${JSON.stringify({
                    content: '',
                    type: 'connecting',
                    timestamp: new Date().toISOString()
                  })}\n\n`
                );
              } else if (n8nChunk.type === 'end') {
                controller.enqueue(
                  `data: ${JSON.stringify({
                    content: '',
                    type: 'complete',
                    timestamp: new Date().toISOString()
                  })}\n\n`
                );
                controller.close();
                return;
              } else if (n8nChunk.content !== undefined) {
                // SIMPLE: Just extract the content property directly
                
                // Validate content type and handle appropriately
                let contentToSend: string;
                
                if (typeof n8nChunk.content === 'string') {
                  contentToSend = n8nChunk.content;
                } else if (n8nChunk.content === null) {
                  return;
                } else if (typeof n8nChunk.content === 'object') {
                  // If content is an object, serialize it properly
                  contentToSend = JSON.stringify(n8nChunk.content);
                } else {
                  // For numbers, booleans, etc., convert safely
                  contentToSend = String(n8nChunk.content);
                }
                
                // Send the validated content
                controller.enqueue(
                  `data: ${JSON.stringify({
                    content: contentToSend,
                    type: 'chunk',
                    timestamp: new Date().toISOString()
                  })}\n\n`
                );
              } else {
              }
            } catch (parseError) {
              console.error('JSON parsing error for streaming line:', {
                line: jsonLine,
                error: parseError instanceof Error ? parseError.message : String(parseError),
                stack: parseError instanceof Error ? parseError.stack : undefined
              });
              // Continue processing other lines instead of failing completely
            }
          };

          response.data.on('data', (chunk: Buffer) => {
            try {
              // Properly decode the buffer to UTF-8 text
              const chunkText = textDecoder.decode(chunk, { stream: true });
              
              // Add to our partial buffer
              partialJsonBuffer += chunkText;
              
              // Extract complete JSON lines from buffer
              const lines = partialJsonBuffer.split('\n');
              
              // Keep the last line in buffer (it might be partial)
              partialJsonBuffer = lines.pop() || '';
              
              // Process all complete lines
              for (const line of lines) {
                const trimmedLine = line.trim();
                if (trimmedLine) {
                  processJsonLine(trimmedLine);
                }
              }
              
            } catch (bufferError) {
              console.error('Buffer processing error in streaming:', {
                error: bufferError instanceof Error ? bufferError.message : String(bufferError),
                stack: bufferError instanceof Error ? bufferError.stack : undefined,
                bufferLength: partialJsonBuffer.length
              });
              // Continue processing instead of crashing
            }
          });

          response.data.on('end', () => {
            
            // Process any remaining partial JSON in buffer
            if (partialJsonBuffer.trim()) {
              processJsonLine(partialJsonBuffer.trim());
            }
            
            // Send completion if controller is still open
            try {
              controller.enqueue(
                `data: ${JSON.stringify({
                  content: '',
                  type: 'complete',
                  timestamp: new Date().toISOString()
                })}\n\n`
              );
              controller.close();
            } catch (closeError) {
              console.error('Error closing stream controller on completion:', {
                error: closeError instanceof Error ? closeError.message : String(closeError),
                stack: closeError instanceof Error ? closeError.stack : undefined
              });
            }
          });

          response.data.on('error', (error: Error) => {
            try {
              controller.enqueue(
                `data: ${JSON.stringify({
                  content: error.message,
                  type: 'error',
                  timestamp: new Date().toISOString()
                })}\n\n`
              );
              controller.close();
            } catch (errorCloseError) {
              console.error('Error closing stream controller on error:', {
                error: errorCloseError instanceof Error ? errorCloseError.message : String(errorCloseError),
                stack: errorCloseError instanceof Error ? errorCloseError.stack : undefined,
                originalError: error.message
              });
            }
          });

        } catch (error) {
          console.error('Streaming error:', error);
          controller.enqueue(
            `data: ${JSON.stringify({
              content: error instanceof Error ? error.message : 'An error occurred',
              type: 'error',
              timestamp: new Date().toISOString()
            })}\n\n`
          );
          controller.close();
        }
      },

      cancel() {
        // Handle client disconnect
      }
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
    
    if (axios.isAxiosError(error)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: error.response?.data?.message || error.message || 'Network error occurred' 
        }),
        { 
          status: error.response?.status || 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'An unexpected error occurred' 
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
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