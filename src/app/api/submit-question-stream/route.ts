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
          // Mobile-specific buffer limits to prevent performance issues and connection timeouts
          const userAgent = request.headers.get('user-agent') || '';
          const isMobileClient = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
          
          // Controller state tracking to prevent duplicate closes (fixes premature stream termination)
          let controllerClosed = false;
          
          // Safe controller closing wrapper to prevent "Controller is already closed" errors
          const safeCloseController = () => {
            if (!controllerClosed) {
              try {
                controller.close();
                controllerClosed = true;
                console.log('Stream controller safely closed');
              } catch (error) {
                console.error('Error closing stream controller:', {
                  error: error instanceof Error ? error.message : String(error),
                  stack: error instanceof Error ? error.stack : undefined
                });
              }
            } else {
              console.log('Controller close skipped - already closed');
            }
          };
          
          // Reduced buffer size for mobile devices - prevents memory issues and connection timeouts
          const maxBufferSize = isMobileClient ? 512 * 1024 : 1024 * 1024; // 512KB for mobile, 1MB for desktop
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
                safeCloseController(); // Use safe closing to prevent duplicate close errors
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
              // Check for buffer overflow (mobile safety) - but continue streaming instead of truncating
              if (partialJsonBuffer.length > maxBufferSize) {
                bufferOverflowCount++;
                console.warn(`Buffer overflow detected (${bufferOverflowCount}), processing safe portion while preserving content`);
                
                // Find the last complete line boundary to avoid breaking JSON
                const lastLineBreak = partialJsonBuffer.lastIndexOf('\n');
                if (lastLineBreak > 0) {
                  const safeBuffer = partialJsonBuffer.substring(0, lastLineBreak);
                  const remainingPartial = partialJsonBuffer.substring(lastLineBreak + 1);
                  
                  // Process complete lines from safe buffer
                  const lines = safeBuffer.split('\n');
                  for (const line of lines) {
                    const trimmedLine = line.trim();
                    if (trimmedLine) {
                      try {
                        processJsonLine(trimmedLine);
                      } catch (overflowError) {
                        console.error('Error processing line from overflow buffer:', {
                          line: trimmedLine.substring(0, 100) + '...', // Log first 100 chars for debugging
                          error: overflowError instanceof Error ? overflowError.message : String(overflowError)
                        });
                      }
                    }
                  }
                  
                  // Keep only the remaining partial line - don't lose content
                  partialJsonBuffer = remainingPartial;
                } else {
                  // If no line breaks, we need to process what we can without losing content
                  // This is a critical fix: don't reset the buffer completely
                  console.warn('No complete lines in overflow buffer, attempting to preserve partial content');
                  
                  // Try to find a safe processing point within the buffer
                  let safeProcessingPoint = -1;
                  const safeSearchLimit = Math.floor(maxBufferSize * 0.8); // Use 80% of buffer for safety
                  
                  // Look for JSON object boundaries
                  for (let i = safeSearchLimit; i >= maxBufferSize * 0.5; i--) {
                    if (partialJsonBuffer[i] === '}' || partialJsonBuffer[i] === ']') {
                      safeProcessingPoint = i + 1;
                      break;
                    }
                  }
                  
                  if (safeProcessingPoint > 0) {
                    const safeBuffer = partialJsonBuffer.substring(0, safeProcessingPoint);
                    const remainingBuffer = partialJsonBuffer.substring(safeProcessingPoint);
                    
                    // Try to process the safe portion
                    const lines = safeBuffer.split('\n');
                    for (const line of lines) {
                      const trimmedLine = line.trim();
                      if (trimmedLine) {
                        try {
                          processJsonLine(trimmedLine);
                        } catch (safeBufferError) {
                          console.error('Error processing safe buffer portion:', {
                            error: safeBufferError instanceof Error ? safeBufferError.message : String(safeBufferError)
                          });
                        }
                      }
                    }
                    
                    partialJsonBuffer = remainingBuffer;
                  } else {
                    // As a last resort, keep a reasonable portion of the buffer
                    const keepSize = Math.floor(maxBufferSize * 0.5);
                    const discardedSize = partialJsonBuffer.length - keepSize;
                    partialJsonBuffer = partialJsonBuffer.substring(partialJsonBuffer.length - keepSize);
                    console.warn(`Emergency buffer management: discarded ${discardedSize} characters, kept ${keepSize}`);
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
              // Emergency buffer reset on critical errors
              if (bufferError instanceof Error && bufferError.message.includes('Maximum call stack')) {
                partialJsonBuffer = '';
                console.warn('Buffer reset due to stack overflow');
              }
            }
          });

          response.data.on('end', () => {
            
            // Process any remaining partial JSON in buffer with safety checks
            const remainingBuffer = partialJsonBuffer.trim();
            if (remainingBuffer) {
              // Safety check for buffer size before final processing
              if (remainingBuffer.length > maxBufferSize) {
                console.warn('Final buffer exceeds size limit, finding safe truncation point');
                
                // Find the last complete line boundary within the buffer limit
                const truncationPoint = maxBufferSize;
                let lastLineBreak = remainingBuffer.lastIndexOf('\n', truncationPoint);
                
                // If no line break found within limit, try to find a reasonable JSON boundary
                if (lastLineBreak === -1) {
                  // Look for common JSON delimiters as fallback
                  const jsonDelimiters = ['}', ']', '"'];
                  for (const delimiter of jsonDelimiters) {
                    const delimiterIndex = remainingBuffer.lastIndexOf(delimiter, truncationPoint);
                    if (delimiterIndex > truncationPoint * 0.5) { // Only use if reasonably close to limit
                      lastLineBreak = delimiterIndex + 1;
                      break;
                    }
                  }
                }
                
                if (lastLineBreak > 0) {
                  const safeBuffer = remainingBuffer.substring(0, lastLineBreak);
                  console.log(`Processing remaining buffer: ${safeBuffer.length} characters at safe boundary`);
                  
                  // Process each complete line in the safe buffer
                  const lines = safeBuffer.split('\n');
                  for (const line of lines) {
                    const trimmedLine = line.trim();
                    if (trimmedLine) {
                      try {
                        processJsonLine(trimmedLine);
                      } catch (lineError) {
                        console.error('Error processing line from remaining buffer:', {
                          line: trimmedLine.substring(0, 100) + '...', // Log first 100 chars for debugging
                          error: lineError instanceof Error ? lineError.message : String(lineError)
                        });
                      }
                    }
                  }
                } else {
                  console.warn('Could not find safe processing point for oversized final buffer');
                }
              } else {
                try {
                  processJsonLine(remainingBuffer);
                } catch (finalBufferError) {
                  console.error('Error processing final buffer on stream end:', {
                    error: finalBufferError instanceof Error ? finalBufferError.message : String(finalBufferError),
                    stack: finalBufferError instanceof Error ? finalBufferError.stack : undefined,
                    remainingBufferLength: remainingBuffer.length,
                    overflowCount: bufferOverflowCount
                  });
                  // Continue processing instead of failing
                }
              }
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
            safeCloseController();
          });

          response.data.on('error', (error: Error) => {
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
            safeCloseController();
          });

        } catch (error) {
          console.error('Streaming error:', error);
          
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
          safeCloseController();
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