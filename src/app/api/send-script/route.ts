import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthState } from '@/lib/server-auth';
import N8NClient from '@/lib/n8n-client';

interface SendScriptRequest {
  payload: string;
  type: 'business_rule' | 'script_include' | 'client_script';
  target_table: 'sys_script' | 'sys_script_include' | 'sys_script_client';
}

export async function POST(request: NextRequest) {
  try {
    const { isAuthenticated } = await getServerAuthState();
    if (!isAuthenticated) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: SendScriptRequest = await request.json();

    // Validate request body
    if (!body.payload || !body.type || !body.target_table) {
      console.error('Missing required fields:', body);
      return NextResponse.json(
        { success: false, error: 'Missing required fields: payload, type, and target_table' },
        { status: 400 }
      );
    }

    // Validate script type and target table combination
    const validCombinations = {
      'business_rule': 'sys_script',
      'script_include': 'sys_script_include',
      'client_script': 'sys_script_client'
    } as const;

    if (validCombinations[body.type] !== body.target_table) {
      return NextResponse.json(
        { success: false, error: 'Invalid type and target_table combination' },
        { status: 400 }
      );
    }

    console.log('Sending script to ServiceNow via N8N client');
    
    // Use N8NClient to send the script
    const n8nClient = N8NClient.getInstance();
    const result = await n8nClient.createTask({
      payload: body.payload.trim(),
      type: body.type,
      target_table: body.target_table
    });

    if (result.success) {
      console.log('Script sent to ServiceNow successfully');
      return NextResponse.json({
        success: true
      }, { status: 201 });
    } else {
      console.error('Failed to send script via N8N:', result.error);
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to send script to ServiceNow' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('API Error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'An unexpected error occurred' 
      },
      { status: 500 }
    );
  }
}