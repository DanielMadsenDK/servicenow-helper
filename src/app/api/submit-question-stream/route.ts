import { NextRequest } from 'next/server';
import axios from 'axios';
import { StreamingRequest } from '@/types';
import { getServerAuthState } from '@/lib/server-auth';
import { validateRequest } from '@/lib/request-validation';
import { StreamingResponseHandler } from '@/lib/streaming-response-handler';



export async function POST(request: NextRequest) {
  try {
    const { isAuthenticated } = await getServerAuthState();
    if (!isAuthenticated) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    const body: StreamingRequest = await request.json();

    const validationError = validateRequest(body);
    if (validationError) {
        return new Response(JSON.stringify({ success: false, error: validationError }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const stream = StreamingResponseHandler.createStreamingResponse(body);

    return new Response(stream, {
      headers: StreamingResponseHandler.getStreamingHeaders(),
    });

  } catch (error) {
    console.error('Streaming API Error:', error);
    const status = axios.isAxiosError(error) ? error.response?.status || 500 : 500;
    const message = axios.isAxiosError(error) ? error.response?.data?.message || error.message : (error instanceof Error ? error.message : 'An unexpected error occurred');
    return new Response(JSON.stringify({ success: false, error: message }), { status, headers: { 'Content-Type': 'application/json' } });
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