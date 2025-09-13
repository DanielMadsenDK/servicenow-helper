import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

import { getServerAuthState } from '@/lib/server-auth';

interface SaveQAPairRequest {
  question: string;
  answer: string;
  category?: string;
  tags?: string[];
}

interface SaveQAPairResponse {
  success: boolean;
  message: string;
  id?: number;
  error?: string;
}

const N8N_ADD_QA_PAIR_URL = process.env.N8N_WEBHOOK_URL ? 
  process.env.N8N_WEBHOOK_URL.replace('/d8f43068-431e-405b-bdbb-e7dba6862299', '/snhelper-add-qa-pair') : 
  'http://n8n:5678/webhook/snhelper-add-qa-pair';
const API_KEY = process.env.N8N_API_KEY!;

export async function POST(request: NextRequest) {
  try {
    const { isAuthenticated } = await getServerAuthState();
    if (!isAuthenticated) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: SaveQAPairRequest = await request.json();

    // Validate request body
    if (!body.question || !body.answer) {
      console.error('Missing required fields:', body);
      return NextResponse.json(
        { success: false, error: 'Missing required fields: question and answer' },
        { status: 400 }
      );
    }

    // Validate environment variables
    if (!N8N_ADD_QA_PAIR_URL || !API_KEY) {
      console.error('Missing environment variables:', {
        N8N_ADD_QA_PAIR_URL: !!N8N_ADD_QA_PAIR_URL,
        API_KEY: !!API_KEY
      });
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Prepare data for N8N webhook
    const webhookData = {
      question: body.question.trim(),
      answer: body.answer.trim(),
      category: body.category || 'general',
      tags: body.tags || []
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'apikey': API_KEY,
    };

    console.log('Sending QA pair to N8N webhook:', N8N_ADD_QA_PAIR_URL);
    
    // Call N8N webhook
    const response = await axios.post(N8N_ADD_QA_PAIR_URL, webhookData, {
      headers,
      timeout: 30000, // 30 second timeout
    });

    if (response.status !== 200) {
      console.error('N8N webhook responded with error:', response.status, response.data);
      return NextResponse.json(
        { success: false, error: 'Failed to save QA pair' },
        { status: 500 }
      );
    }

    const responseData: SaveQAPairResponse = response.data;
    
    if (!responseData.success) {
      console.error('N8N workflow failed:', responseData.error);
      return NextResponse.json(
        { success: false, error: responseData.error || 'Failed to save QA pair' },
        { status: 500 }
      );
    }

    console.log('QA pair saved successfully:', responseData.id);
    
    return NextResponse.json({
      success: true,
      message: 'QA pair saved successfully',
      id: responseData.id,
    });

  } catch (error) {
    console.error('API Error:', error);
    
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message || 
                          'Network error occurred';
      
      return NextResponse.json(
        { 
          success: false, 
          error: errorMessage
        },
        { status: error.response?.status || 500 }
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