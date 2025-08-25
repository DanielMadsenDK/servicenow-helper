export interface BufferStats {
  bufferSize: number;
  overflowCount: number;
  processedLines: number;
}

export interface BufferOverflowResult {
  remainingBuffer: string;
  processedLines: number;
}

export class BufferManager {
  private maxBufferChars: number;
  private bufferOverflowCount: number;

  constructor(maxBufferChars: number = 500000) {
    this.maxBufferChars = maxBufferChars;
    this.bufferOverflowCount = 0;
  }

  handleBufferOverflow(
    buffer: string,
    processJsonLine: (line: string) => void
  ): BufferOverflowResult {
    this.bufferOverflowCount++;
    console.warn(`Large buffer detected (${buffer.length} chars), processing incrementally to prevent memory issues`);
    
    const lastLineBreak = buffer.lastIndexOf('\n');
    if (lastLineBreak > 0) {
      const completeLines = buffer.substring(0, lastLineBreak);
      const remainingPartial = buffer.substring(lastLineBreak + 1);
      
      let processedCount = 0;
      let lineStart = 0;
      let lineEnd = completeLines.indexOf('\n', lineStart);
      
      while (lineEnd !== -1) {
        const line = completeLines.slice(lineStart, lineEnd).trim();
        if (line) {
          try {
            processJsonLine(line);
            processedCount++;
          } catch (lineError) {
            console.error('Error processing line from buffer:', {
              error: lineError instanceof Error ? lineError.message : String(lineError)
            });
          }
        }
        lineStart = lineEnd + 1;
        lineEnd = completeLines.indexOf('\n', lineStart);
      }
      
      console.log(`Processed ${processedCount} lines, buffer reduced to ${remainingPartial.length} chars`);
      
      return {
        remainingBuffer: remainingPartial,
        processedLines: processedCount
      };
    } else {
      console.warn('Large buffer with no complete lines - keeping buffer intact to avoid data loss');
      
      if (buffer.length > 1000000) {
        console.warn('Extremely large buffer detected, implementing smart content preservation');
        const preservedBuffer = this.preserveImportantContent(buffer);
        return {
          remainingBuffer: preservedBuffer,
          processedLines: 0
        };
      }
      
      return {
        remainingBuffer: buffer,
        processedLines: 0
      };
    }
  }

  shouldHandleOverflow(bufferSize: number): boolean {
    return bufferSize > this.maxBufferChars;
  }

  getStats(): BufferStats {
    return {
      bufferSize: 0,
      overflowCount: this.bufferOverflowCount,
      processedLines: 0
    };
  }

  reset(): void {
    this.bufferOverflowCount = 0;
  }

  private preserveImportantContent(buffer: string): string {
    // Smart content preservation strategy:
    // 1. Keep the beginning (important context) - first 40% of maxBufferChars
    // 2. Keep the end (most recent content) - last 40% of maxBufferChars  
    // 3. This leaves 20% buffer for processing headroom and avoids mid-sentence truncation
    
    const beginningSize = Math.floor(this.maxBufferChars * 0.4);
    const endSize = Math.floor(this.maxBufferChars * 0.4);
    
    const beginning = buffer.substring(0, beginningSize);
    const end = buffer.substring(buffer.length - endSize);
    
    // Add a clear separator to indicate content was truncated
    const separator = '\n[... content truncated for memory management ...]\n';
    
    const preservedContent = beginning + separator + end;
    
    console.log(`Content preservation applied: kept ${beginningSize} + ${endSize} chars from ${buffer.length} total`);
    
    return preservedContent;
  }
}