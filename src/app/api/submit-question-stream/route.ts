import { NextRequest } from 'next/server';
import axios from 'axios';
import { StreamingRequest } from '@/types';
import { getServerAuthState } from '@/lib/server-auth';

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
            sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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

          // Handle streaming response from n8n
          response.data.on('data', (chunk: Buffer) => {
            try {
              const chunkStr = chunk.toString();
              
              // N8N sends direct JSON chunks, not SSE format
              // Split by newlines to handle multiple chunks in one buffer
              const lines = chunkStr.split('\n').filter(line => line.trim());
              
              for (const line of lines) {
                try {
                  const n8nChunk = JSON.parse(line);
                  
                  // Transform n8n chunk format to client-expected format
                  if (n8nChunk.type === 'begin') {
                    // N8N streaming started
                    controller.enqueue(
                      `data: ${JSON.stringify({
                        content: '',
                        type: 'connecting',
                        timestamp: new Date().toISOString()
                      })}\n\n`
                    );
                  } else if (n8nChunk.type === 'item' || n8nChunk.type === 'progress') {
                    // N8N sent content chunk - extract only the actual content
                    const content = n8nChunk.output || n8nChunk.content || n8nChunk.message || '';
                    // Only send non-empty content to avoid empty chunks
                    if (content && content.trim()) {
                      controller.enqueue(
                        `data: ${JSON.stringify({
                          content,
                          type: 'chunk',
                          timestamp: new Date().toISOString()
                        })}\n\n`
                      );
                    }
                  } else if (n8nChunk.type === 'end') {
                    // N8N streaming completed
                    controller.enqueue(
                      `data: ${JSON.stringify({
                        content: '',
                        type: 'complete',
                        timestamp: new Date().toISOString()
                      })}\n\n`
                    );
                    controller.close();
                    return;
                  } else {
                    // For unknown chunk types, only extract content if it exists and is not metadata
                    const content = n8nChunk.output || n8nChunk.content || n8nChunk.message || '';
                    if (content && content.trim() && typeof content === 'string') {
                      controller.enqueue(
                        `data: ${JSON.stringify({
                          content,
                          type: 'chunk',
                          timestamp: new Date().toISOString()
                        })}\n\n`
                      );
                    }
                    // Ignore chunks without valid content (don't fallback to JSON.stringify)
                  }
                } catch {
                  // Don't send anything if JSON parsing fails
                  // This completely prevents any malformed JSON from reaching the UI
                }
              }
            } catch (error) {
              console.error('Error processing chunk:', error);
            }
          });

          response.data.on('end', () => {
            controller.enqueue(
              `data: ${JSON.stringify({
                content: '',
                type: 'complete',
                timestamp: new Date().toISOString()
              })}\n\n`
            );
            controller.close();
          });

          response.data.on('error', (error: Error) => {
            controller.enqueue(
              `data: ${JSON.stringify({
                content: error.message,
                type: 'error',
                timestamp: new Date().toISOString()
              })}\n\n`
            );
            controller.close();
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
        console.log('Stream cancelled by client');
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