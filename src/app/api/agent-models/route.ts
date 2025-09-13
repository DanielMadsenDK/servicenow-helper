import { NextRequest, NextResponse } from 'next/server';

import { getServerAuthState } from '@/lib/server-auth';
import { AgentModelManager } from '@/lib/database';
import type { AgentModelsApiResponse, AgentModelInput } from '@/types/index';

export async function GET(): Promise<NextResponse<AgentModelsApiResponse>> {
  try {
    const authResult = await getServerAuthState();
    
    if (!authResult.isAuthenticated || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const agentModelManager = new AgentModelManager();
    const agentModels = await agentModelManager.getUserAgentModels(authResult.user.username);

    return NextResponse.json({
      success: true,
      data: agentModels
    });
  } catch (error) {
    console.error('Agent Models GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest): Promise<NextResponse<AgentModelsApiResponse>> {
  try {
    const authResult = await getServerAuthState();
    
    if (!authResult.isAuthenticated || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }

    // Validate agent models format
    const agentModels: Record<string, string> = {};
    for (const [agentName, modelName] of Object.entries(body)) {
      if (typeof agentName !== 'string' || typeof modelName !== 'string') {
        return NextResponse.json(
          { success: false, error: 'Invalid agent model format. Expected { agent_name: model_name }' },
          { status: 400 }
        );
      }
      
      if (agentName.trim() === '' || modelName.trim() === '') {
        return NextResponse.json(
          { success: false, error: 'Agent name and model name cannot be empty' },
          { status: 400 }
        );
      }
      
      agentModels[agentName.trim()] = modelName.trim();
    }

    const agentModelManager = new AgentModelManager();
    await agentModelManager.updateUserAgentModels(authResult.user.username, agentModels);
    
    // Return the updated agent models
    const updatedAgentModels = await agentModelManager.getUserAgentModels(authResult.user.username);

    return NextResponse.json({
      success: true,
      data: updatedAgentModels
    });
  } catch (error) {
    console.error('Agent Models PUT error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<AgentModelsApiResponse>> {
  try {
    const authResult = await getServerAuthState();
    
    if (!authResult.isAuthenticated || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: AgentModelInput = await request.json();
    
    if (!body || !body.agent_name || !body.model_name) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: agent_name and model_name are required' },
        { status: 400 }
      );
    }

    if (typeof body.agent_name !== 'string' || typeof body.model_name !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Agent name and model name must be strings' },
        { status: 400 }
      );
    }

    const agentModelManager = new AgentModelManager();
    await agentModelManager.setAgentModel(
      authResult.user.username, 
      body.agent_name.trim(), 
      body.model_name.trim()
    );
    
    // Return the updated agent models
    const updatedAgentModels = await agentModelManager.getUserAgentModels(authResult.user.username);

    return NextResponse.json({
      success: true,
      data: updatedAgentModels
    });
  } catch (error) {
    console.error('Agent Models POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}