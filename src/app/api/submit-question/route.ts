import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { ServiceNowRequest, ServiceNowResponse } from '@/types';
import { getServerAuthState } from '@/lib/server-auth';
import { registerPollingOperation, cleanupPollingOperation, isPollingOperationActive } from '@/lib/polling-manager';
import { isSessionCancelled, cleanupSession } from '@/lib/polling-store';

const API_BASE_URL = process.env.N8N_WEBHOOK_URL!;
const API_RESPONSE_URL = process.env.N8N_WEBHOOK_URL_RESPONSE!;
const API_KEY = process.env.N8N_API_KEY!;

const sleep = (ms: number, signal?: AbortSignal) => new Promise<void>((resolve, reject) => {
  if (signal?.aborted) {
    reject(new Error('Request was cancelled'));
    return;
  }
  
  const timeoutId = setTimeout(resolve, ms);
  
  const abortHandler = () => {
    clearTimeout(timeoutId);
    reject(new Error('Request was cancelled'));
  };
  
  signal?.addEventListener('abort', abortHandler);
  
  // Clean up the event listener when the promise resolves
  setTimeout(() => {
    signal?.removeEventListener('abort', abortHandler);
  }, ms);
});

const pollForResponse = async (key: string, type: string, sessionKey: string, signal?: AbortSignal): Promise<ServiceNowResponse> => {
  const timeout = 5 * 60 * 1000; // 5 minutes
  const pollInterval = 2000; // 2 seconds
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    // Check for cancellation via multiple methods
    if (signal?.aborted) {
      throw new Error('Request was cancelled');
    }
    
    if (!isPollingOperationActive(sessionKey)) {
      throw new Error('Request was cancelled');
    }
    
    if (isSessionCancelled(sessionKey)) {
      throw new Error('Request was cancelled');
    }

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'apikey': API_KEY,
      };

      const response = await axios.post(API_RESPONSE_URL, { key }, {
        headers,
        timeout: 10000,
        signal,
      });

      if (response.status === 200) {
        if (response.data.state === 'processing') {
          // Still processing, continue polling
          await sleep(pollInterval, signal);
          continue;
        }
        return {
          message: response.data.message,
          type: type,
          timestamp: new Date().toISOString(),
        };
      }
      
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ERR_CANCELED') {
          throw new Error('Request was cancelled');
        }
        throw error;
      }
    }

    await sleep(pollInterval, signal);
  }

  throw new Error('Timeout: No response received within 5 minutes');
};

export async function POST(request: NextRequest) {
  const controller = new AbortController();
  const { signal } = controller;

  try {
    const { isAuthenticated } = await getServerAuthState();
    if (!isAuthenticated) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: ServiceNowRequest = await request.json();

    // Validate request body
    if (!body.question || !body.type || !body.aiModel) {
      console.error('Missing required fields:', body);
      return NextResponse.json(
        { success: false, error: 'Missing required fields: question, type, and aiModel are required' },
        { status: 400 }
      );
    }

    // Validate file if provided
    if (body.file && typeof body.file !== 'string') {
      return NextResponse.json(
        { success: false, error: 'File must be a base64 encoded string' },
        { status: 400 }
      );
    }

    // Basic file size validation (base64 encoded, roughly 1.33x larger than original)
    if (body.file && body.file.length > 10 * 1024 * 1024 * 1.33) { // ~10MB limit
      return NextResponse.json(
        { success: false, error: 'File too large (max 10MB)' },
        { status: 400 }
      );
    }

    // Validate environment variables
    if (!API_BASE_URL || !API_RESPONSE_URL || !API_KEY) {
      console.error('Missing environment variables:', {
        API_BASE_URL: !!API_BASE_URL,
        API_RESPONSE_URL: !!API_RESPONSE_URL,
        API_KEY: !!API_KEY
      });
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'apikey': API_KEY,
    };

    // Initial webhook call
    const initialResponse = await axios.post(API_BASE_URL, body, {
      headers,
      timeout: 30000,
      signal,
    });

    if (initialResponse.status !== 200) {
      return NextResponse.json(
        { success: false, error: 'Failed to initiate request processing' },
        { status: 500 }
      );
    }

    const { key } = initialResponse.data;
    if (!key) {
      return NextResponse.json(
        { success: false, error: 'No key received from initial request' },
        { status: 500 }
      );
    }

    // Register this polling operation so it can be cancelled
    registerPollingOperation(body.sessionkey, controller);

    try {
      // Poll for response
      const responseData = await pollForResponse(key, body.type, body.sessionkey, signal);
      cleanupPollingOperation(body.sessionkey);
      cleanupSession(body.sessionkey);
      return NextResponse.json({
        success: true,
        data: responseData,
      });
    } catch (error) {
      cleanupPollingOperation(body.sessionkey);
      cleanupSession(body.sessionkey);
      throw error;
    }
  } catch (error) {
    console.error('API Error:', error);
    
    if (axios.isAxiosError(error)) {
      if (error.code === 'ERR_CANCELED') {
        return NextResponse.json(
          { success: false, error: 'Request was cancelled' },
          { status: 499 }
        );
      }
      return NextResponse.json(
        { 
          success: false, 
          error: error.response?.data?.message || error.message || 'Network error occurred' 
        },
        { status: error.response?.status || 500 }
      );
    }
    
    if (error instanceof Error && error.message === 'Request was cancelled') {
      return NextResponse.json(
        { success: false, error: 'Request was cancelled' },
        { status: 499 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'An unexpected error occurred' 
      },
      { status: 500 }
    );
  }
}
