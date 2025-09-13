import axios from 'axios';

import { ApiResponse, StreamingRequest } from '@/types';

import { StreamingClient, StreamingCallbacks, createStreamingClient } from './streaming-client';

export const cancelRequest = async (sessionkey: string): Promise<ApiResponse> => {
  try {
    const response = await axios.post('/api/cancel-request', { sessionkey }, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    return response.data;
  } catch (error) {
    console.error('Cancel request error:', error);
    
    if (axios.isAxiosError(error)) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to cancel request',
      };
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
};

// Streaming API functions with enhanced error handling and retry logic
export const submitQuestionStreaming = async (
  request: StreamingRequest,
  callbacks: StreamingCallbacks,
  options: {
    maxRetries?: number;
    baseRetryDelay?: number;
    useExponentialBackoff?: boolean;
  } = {}
): Promise<StreamingClient> => {
  try {
    return await createStreamingClient(request, callbacks, options);
  } catch (error) {
    console.error('Streaming submission error:', error);
    throw error;
  }
};

export const createStreamingSubmission = (
  request: StreamingRequest,
  callbacks: StreamingCallbacks,
  options: {
    maxRetries?: number;
    baseRetryDelay?: number;
    useExponentialBackoff?: boolean;
    retryableErrorCodes?: string[];
  } = {}
): Promise<StreamingClient> => {
  return createStreamingClient(request, callbacks, {
    maxRetries: 3,
    baseRetryDelay: 1000,
    useExponentialBackoff: true,
    ...options
  });
};