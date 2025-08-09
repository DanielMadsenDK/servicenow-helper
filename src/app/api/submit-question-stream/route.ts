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

          // Handle streaming response from n8n - SIMPLIFIED APPROACH
          response.data.on('data', (chunk: Buffer) => {
            try {
              const chunkStr = chunk.toString();
              console.log('[STREAMING DEBUG] Raw chunk from N8N:', chunkStr);
              
              // Split by newlines to handle multiple JSON objects in one buffer
              const lines = chunkStr.split('\n');
              
              for (const line of lines) {
                if (!line.trim()) {
                  continue; // Skip empty lines
                }
                
                try {
                  const n8nChunk = JSON.parse(line);
                  console.log('[STREAMING DEBUG] Parsed N8N chunk:', JSON.stringify(n8nChunk, null, 2));
                  
                  // Simple processing based on N8N's actual format
                  if (n8nChunk.type === 'begin') {
                    console.log('[STREAMING DEBUG] Stream beginning');
                    controller.enqueue(
                      `data: ${JSON.stringify({
                        content: '',
                        type: 'connecting',
                        timestamp: new Date().toISOString()
                      })}\n\n`
                    );
                  } else if (n8nChunk.type === 'end') {
                    console.log('[STREAMING DEBUG] Stream ending');
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
                    console.log('[STREAMING DEBUG] Extracted content:', JSON.stringify(n8nChunk.content));
                    
                    // Send the content as-is (including empty strings and whitespace)
                    controller.enqueue(
                      `data: ${JSON.stringify({
                        content: String(n8nChunk.content),
                        type: 'chunk',
                        timestamp: new Date().toISOString()
                      })}\n\n`
                    );
                  } else {
                    console.log('[STREAMING DEBUG] Chunk has no content property, skipping');
                  }
                } catch (parseError) {
                  console.error('[STREAMING DEBUG] JSON parsing failed for line:', line);
                  console.error('[STREAMING DEBUG] Parse error:', parseError);
                }
              }
            } catch (error) {
              console.error('[STREAMING DEBUG] Error processing chunk buffer:', error);
            }
          });

          response.data.on('end', () => {
            console.log('[STREAMING DEBUG] N8N stream ended');
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