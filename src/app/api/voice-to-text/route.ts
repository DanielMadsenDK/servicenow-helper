import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

import { getServerAuthState } from '@/lib/server-auth';
import type { VoiceToTextRequest, VoiceToTextResponse } from '@/types';

// Maximum file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Voice-to-Text API Route
 *
 * Accepts base64-encoded audio files and proxies them to the N8N voice-to-text webhook
 * for transcription using speech-to-text services.
 *
 * Security:
 * - Requires JWT authentication
 * - Validates file size
 * - Validates audio format
 * - Server-side proxy prevents N8N endpoint exposure
 *
 * @route POST /api/voice-to-text
 */
export async function POST(request: NextRequest): Promise<NextResponse<VoiceToTextResponse>> {
  try {
    // 1. Authenticate user
    const authResult = await getServerAuthState();

    if (!authResult.isAuthenticated || !authResult.user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized. Please log in to use voice input.',
        },
        { status: 401 }
      );
    }

    // 2. Parse request body
    let body: VoiceToTextRequest;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request format. Expected JSON with audio and format fields.',
        },
        { status: 400 }
      );
    }

    // 3. Validate request body
    const { audio, format } = body;

    if (!audio || typeof audio !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing or invalid audio data. Expected base64-encoded string.',
        },
        { status: 400 }
      );
    }

    if (!format || (format !== 'webm' && format !== 'mp4')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid audio format. Expected "webm" or "mp4".',
        },
        { status: 400 }
      );
    }

    // 4. Validate file size (estimate from base64 length)
    const estimatedSize = (audio.length * 3) / 4; // Base64 to bytes conversion
    if (estimatedSize > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: `Audio file too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`,
        },
        { status: 413 }
      );
    }

    // 5. Prepare N8N webhook request
    const n8nBaseUrl = process.env.N8N_WEBHOOK_BASE_URL || 'http://n8n:5678';
    const apiKey = process.env.N8N_API_KEY || process.env.WEBHOOK_API_KEY || '';

    console.log(`[Voice-to-Text] Processing ${format} audio for user: ${authResult.user.username}`);
    console.log(`[Voice-to-Text] Estimated audio size: ${(estimatedSize / 1024).toFixed(2)}KB`);

    // 6. Call N8N webhook
    try {
      const response = await axios.post(
        `${n8nBaseUrl}/webhook/voice-to-text`,
        {
          audio,
          format,
          userId: authResult.user.username,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'apikey': apiKey,
          },
          timeout: 60000, // 60 second timeout for transcription
        }
      );

      // 7. Validate N8N response
      if (response.data && response.data.text) {
        console.log(`[Voice-to-Text] Transcription successful: ${response.data.text.length} characters`);

        return NextResponse.json({
          success: true,
          text: response.data.text,
        });
      } else if (response.data && response.data.error) {
        console.error('[Voice-to-Text] N8N returned error:', response.data.error);

        return NextResponse.json({
          success: false,
          error: response.data.error || 'Transcription failed',
        });
      } else {
        console.error('[Voice-to-Text] Unexpected N8N response format:', response.data);

        return NextResponse.json({
          success: false,
          error: 'Unexpected response from transcription service',
        });
      }
    } catch (n8nError) {
      console.error('[Voice-to-Text] N8N webhook error:', n8nError);

      // Provide user-friendly error messages based on error type
      if (axios.isAxiosError(n8nError)) {
        if (n8nError.code === 'ECONNREFUSED') {
          return NextResponse.json({
            success: false,
            error: 'Transcription service unavailable. Please try again later.',
          }, { status: 503 });
        }

        if (n8nError.code === 'ETIMEDOUT' || n8nError.code === 'ECONNABORTED') {
          return NextResponse.json({
            success: false,
            error: 'Transcription timed out. Please try a shorter recording.',
          }, { status: 504 });
        }

        if (n8nError.response?.status === 400) {
          return NextResponse.json({
            success: false,
            error: 'Invalid audio format. Please try recording again.',
          }, { status: 400 });
        }

        if (n8nError.response?.status === 413) {
          return NextResponse.json({
            success: false,
            error: 'Audio file too large. Please try a shorter recording.',
          }, { status: 413 });
        }
      }

      return NextResponse.json({
        success: false,
        error: 'An error occurred during transcription. Please try again.',
      }, { status: 500 });
    }
  } catch (error) {
    console.error('[Voice-to-Text] Unexpected error:', error);

    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    }, { status: 500 });
  }
}

/**
 * Handle OPTIONS request for CORS preflight
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
