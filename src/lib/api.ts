import axios from 'axios';
import { ServiceNowRequest, ApiResponse } from '@/types';

export const submitQuestion = async (request: ServiceNowRequest, signal?: AbortSignal): Promise<ApiResponse> => {
  try {
    const response = await axios.post('/api/submit-question', request, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 330000, // 5.5 minutes to account for polling timeout
      signal,
    });

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.code === 'ERR_CANCELED') {
        // Don't log cancelled requests as errors - this is expected behavior
        return {
          success: false,
          error: 'Request was cancelled',
        };
      }
      console.error('API Error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Network error occurred',
      };
    }
    
    console.error('API Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
};

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