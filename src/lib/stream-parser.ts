export interface N8nChunk {
  type: 'begin' | 'chunk' | 'item' | 'end' | 'complete' | 'error';
  content?: string | object | null;
  timestamp?: string;
}

// Detect stream format and return appropriate parser
export async function* parseStream<T>(stream: NodeJS.ReadableStream): AsyncGenerator<T> {
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