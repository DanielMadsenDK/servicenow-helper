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
    if (!body.question || !body.type) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: question and type are required' 
        }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Check that we have either legacy aiModel or new agentModels with valid configurations
    if (!body.aiModel && (!body.agentModels || body.agentModels.length === 0)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Either aiModel or agentModels with at least one agent configuration must be provided' 
        }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate agentModels array if provided
    if (body.agentModels && body.agentModels.length > 0) {
      for (const agentModel of body.agentModels) {
        if (!agentModel.agent || !agentModel.model) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'Each agent configuration must have both agent and model properties' 
            }),
            { 
              status: 400, 
              headers: { 'Content-Type': 'application/json' }
            }
          );
        }
        
        // Validate agent names against allowed values
        const allowedAgents = ['orchestration', 'business_rule', 'client_script'];
        if (!allowedAgents.includes(agentModel.agent)) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: `Invalid agent name: ${agentModel.agent}. Allowed agents: ${allowedAgents.join(', ')}` 
            }),
            { 
              status: 400, 
              headers: { 'Content-Type': 'application/json' }
            }
          );
        }
      }
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
        // Controller state tracking to prevent duplicate closes (fixes premature stream termination)
        let controllerClosed = false;
        
        // Safe controller closing wrapper to prevent "Controller is already closed" errors
        const safeCloseController = (reason?: string) => {
          if (!controllerClosed) {
            try {
              controller.close();
              controllerClosed = true;
              console.log(`Stream controller safely closed${reason ? ` (${reason})` : ''}`);
            } catch (closeError) {
              // Only log as error if it's not the expected "already closed" error
              const errorMessage = closeError instanceof Error ? closeError.message : String(closeError);
              if (!errorMessage.includes('Controller is already closed')) {
                console.error('Unexpected error closing stream controller:', {
                  error: errorMessage,
                  stack: closeError instanceof Error ? closeError.stack : undefined,
                  reason: reason || 'unknown'
                });
              } else {
                console.log('Controller was already closed (race condition handled safely)');
                controllerClosed = true; // Ensure state is consistent
              }
            }
          } else {
            console.log(`Controller close skipped - already closed${reason ? ` (${reason})` : ''}`);
          }
        };

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
            sessionId: body.sessionkey || generateSessionId(),
            chatInput: body.question,
            metadata: {
              type: body.type,
              aiModel: body.aiModel, // Legacy field for backward compatibility
              agentModels: body.agentModels, // New field for multi-agent support
              file: body.file,
              searching: body.searching,
              userId: 'streaming_user'
            }
          };

          // Mobile-specific buffer limits to prevent performance issues and connection timeouts
          const userAgent = request.headers.get('user-agent') || '';
          const isMobileClient = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);

          // Mobile-specific timeout adjustments to prevent connection drops
          const timeoutMs = isMobileClient ? 480000 : 330000; // 8 min for mobile, 5.5 min for desktop
          
          const response = await axios.post(API_BASE_URL, n8nStreamingRequest, {
            headers: {
              ...headers,
              'X-Client-Type': isMobileClient ? 'mobile' : 'desktop',
            },
            responseType: 'stream',
            timeout: timeoutMs,
          });

          // Handle streaming response from n8n with optimized buffer accumulation
          const textDecoder = new TextDecoder('utf-8');
          let partialJsonBuffer = '';
          
          // Proper buffer size limits: convert to actual memory usage estimation
          // UTF-8 can use 1-4 bytes per character, so we use a 4x safety multiplier
          const maxBufferChars = isMobileClient ? 256 * 1024 : 512 * 1024; // 256K chars for mobile (≈1MB), 512K chars for desktop (≈2MB)
          let bufferOverflowCount = 0;
          
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
                safeCloseController('stream end signal from n8n'); // Use safe closing to prevent duplicate close errors
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
              // Enhanced buffer management - process chunks incrementally to prevent overflow
              // Only trigger overflow handling when we have a very large buffer with no progress
              if (partialJsonBuffer.length > maxBufferChars) {
                bufferOverflowCount++;
                console.warn(`Large buffer detected (${partialJsonBuffer.length} chars), processing incrementally to prevent memory issues`);
                
                // Find complete lines to process and keep partial content
                const lastLineBreak = partialJsonBuffer.lastIndexOf('\n');
                if (lastLineBreak > 0) {
                  // Process all complete lines
                  const completeLines = partialJsonBuffer.substring(0, lastLineBreak);
                  const remainingPartial = partialJsonBuffer.substring(lastLineBreak + 1);
                  
                  // Process complete lines incrementally
                  const lines = completeLines.split('\n');
                  for (const line of lines) {
                    const trimmedLine = line.trim();
                    if (trimmedLine) {
                      try {
                        processJsonLine(trimmedLine);
                      } catch (lineError) {
                        console.error('Error processing line from buffer:', {
                          error: lineError instanceof Error ? lineError.message : String(lineError)
                        });
                        // Continue processing other lines instead of failing
                      }
                    }
                  }
                  
                  // Keep only the incomplete line for next iteration
                  partialJsonBuffer = remainingPartial;
                  console.log(`Processed ${lines.length} lines, buffer reduced to ${partialJsonBuffer.length} chars`);
                } else {
                  // No complete lines found - this is unusual but handle gracefully
                  console.warn('Large buffer with no complete lines - keeping buffer intact to avoid data loss');
                  
                  // Only in extreme cases (>1M chars) should we consider any trimming
                  if (partialJsonBuffer.length > 1000000) {
                    console.warn('Extremely large buffer detected, keeping most recent portion');
                    partialJsonBuffer = partialJsonBuffer.substring(partialJsonBuffer.length - maxBufferChars);
                  }
                }
              }
              
              // Properly decode the buffer to UTF-8 text with optimized chunk processing
              const chunkText = textDecoder.decode(chunk, { stream: true });
              
              // Efficient buffer accumulation with size monitoring
              partialJsonBuffer += chunkText;
              
              // Optimized line splitting - avoid repeated splits on large buffers
              let lineStart = 0;
              let lineEnd = partialJsonBuffer.indexOf('\n', lineStart);
              
              // Process complete lines efficiently
              while (lineEnd !== -1) {
                const line = partialJsonBuffer.slice(lineStart, lineEnd).trim();
                if (line) {
                  processJsonLine(line);
                }
                lineStart = lineEnd + 1;
                lineEnd = partialJsonBuffer.indexOf('\n', lineStart);
              }
              
              // Keep remaining partial line in buffer
              partialJsonBuffer = lineStart < partialJsonBuffer.length 
                ? partialJsonBuffer.slice(lineStart) 
                : '';
              
            } catch (bufferError) {
              console.error('Buffer processing error in streaming:', {
                error: bufferError instanceof Error ? bufferError.message : String(bufferError),
                stack: bufferError instanceof Error ? bufferError.stack : undefined,
                bufferLength: partialJsonBuffer.length,
                overflowCount: bufferOverflowCount
              });
              
              // Handle critical errors gracefully without terminating the stream
              if (bufferError instanceof Error && bufferError.message.includes('Maximum call stack')) {
                partialJsonBuffer = '';
                console.warn('Buffer reset due to stack overflow');
              } else if (bufferError instanceof Error && bufferError.message.includes('out of memory')) {
                // Clear partial buffer in extreme memory situations
                partialJsonBuffer = '';
                console.warn('Buffer cleared due to memory pressure');
              }
              
              // Don't close the stream here - let it continue processing
              // The error might be temporary and related to a specific chunk
            }
          });

          response.data.on('end', () => {
            
            // Process any remaining partial JSON in buffer
            const remainingBuffer = partialJsonBuffer.trim();
            if (remainingBuffer) {
              console.log(`Processing final buffer: ${remainingBuffer.length} characters`);
              
              // Process remaining buffer as complete lines if possible
              const lines = remainingBuffer.split('\n');
              let processedLines = 0;
              
              for (const line of lines) {
                const trimmedLine = line.trim();
                if (trimmedLine) {
                  try {
                    processJsonLine(trimmedLine);
                    processedLines++;
                  } catch (lineError) {
                    console.error('Error processing final buffer line:', {
                      error: lineError instanceof Error ? lineError.message : String(lineError),
                      lineLength: trimmedLine.length
                    });
                    // Continue processing other lines instead of failing completely
                  }
                }
              }
              
              console.log(`Final buffer processing completed: ${processedLines}/${lines.length} lines processed successfully`);
            }
            
            // Log buffer performance stats
            if (bufferOverflowCount > 0) {
              console.log(`Stream processing completed with ${bufferOverflowCount} buffer overflows handled`);
            }
            
            // Only send completion if we haven't already sent it via n8n 'end' signal
            // The completion should be handled by the explicit 'end' message from n8n
            // This prevents duplicate completion signals that cause premature content display
            if (!controllerClosed) {
              console.log('Stream ended without explicit n8n completion signal, sending fallback completion');
              controller.enqueue(
                `data: ${JSON.stringify({
                  content: '',
                  type: 'complete',
                  timestamp: new Date().toISOString()
                })}\n\n`
              );
            }
            
            // Use safe close to prevent duplicate controller close errors
            safeCloseController('stream end event');
          });

          response.data.on('error', (error: Error) => {
            console.error('Stream data error:', {
              message: error.message,
              stack: error.stack,
              bufferLength: partialJsonBuffer.length,
              overflowCount: bufferOverflowCount
            });
            
            if (!controllerClosed) {
              controller.enqueue(
                `data: ${JSON.stringify({
                  content: error.message,
                  type: 'error',
                  timestamp: new Date().toISOString()
                })}\n\n`
              );
            }
            
            // Use safe close to prevent duplicate controller close errors
            safeCloseController('stream data error');
          });

        } catch (error) {
          console.error('Streaming initialization error:', {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
          });
          
          if (!controllerClosed) {
            controller.enqueue(
              `data: ${JSON.stringify({
                content: error instanceof Error ? error.message : 'An error occurred',
                type: 'error',
                timestamp: new Date().toISOString()
              })}\n\n`
            );
          }
          
          // Use safe close to prevent duplicate controller close errors
          safeCloseController('streaming initialization error');
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