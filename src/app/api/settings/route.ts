import { NextRequest, NextResponse } from 'next/server';

import { getServerAuthState } from '@/lib/server-auth';
import { UserSettingsManager, AgentModelManager } from '@/lib/database';
import type { UserSettings, SettingsApiResponse } from '@/types/index';

export async function GET(): Promise<NextResponse<SettingsApiResponse>> {
  try {
    const authResult = await getServerAuthState();
    
    if (!authResult.isAuthenticated || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const settingsManager = new UserSettingsManager();
    const agentModelManager = new AgentModelManager();
    
    const settings = await settingsManager.getAllSettings(authResult.user.username);
    const agentModels = await agentModelManager.getUserAgentModels(authResult.user.username);
    
    // Include agent models in the settings response
    const settingsWithAgents: UserSettings = {
      ...settings,
      agent_models: agentModels
    };

    return NextResponse.json({
      success: true,
      data: settingsWithAgents
    });
  } catch (error) {
    console.error('Settings GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest): Promise<NextResponse<SettingsApiResponse>> {
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

    const settingsManager = new UserSettingsManager();
    const agentModelManager = new AgentModelManager();
    
    // Validate the settings object structure
    const validKeys = ['welcome_section_visible', 'default_search_mode', 'default_request_type', 'servicenow_instance_url', 'default_ai_model', 'agent_models', 'visible_request_types'];
    const settings: Partial<UserSettings> = {};
    let agentModelsToUpdate: Record<string, string> | null = null;
    
    for (const [key, value] of Object.entries(body)) {
      if (validKeys.includes(key)) {
        if (key === 'agent_models') {
          if (typeof value !== 'object' || value === null) {
            return NextResponse.json(
              { success: false, error: 'Invalid agent_models format, expected object' },
              { status: 400 }
            );
          }
          // Validate agent models format
          for (const [agentName, modelName] of Object.entries(value as Record<string, unknown>)) {
            if (typeof agentName !== 'string' || typeof modelName !== 'string') {
              return NextResponse.json(
                { success: false, error: 'Invalid agent model format. Expected { agent_name: model_name }' },
                { status: 400 }
              );
            }
          }
          agentModelsToUpdate = value as Record<string, string>;
        } else if (key === 'default_request_type') {
          if (!['documentation', 'recommendation', 'script', 'troubleshoot', 'ai-agent', 'ai-skill'].includes(value as string)) {
            return NextResponse.json(
              { success: false, error: `Invalid value for ${key}` },
              { status: 400 }
            );
          }
        } else if (key === 'visible_request_types') {
          if (!Array.isArray(value) || value.length === 0) {
            return NextResponse.json(
              { success: false, error: 'visible_request_types must be a non-empty array' },
              { status: 400 }
            );
          }
          const validTypes = ['documentation', 'recommendation', 'script', 'troubleshoot', 'ai-agent', 'ai-skill'];
          for (const type of value) {
            if (typeof type !== 'string' || !validTypes.includes(type)) {
              return NextResponse.json(
                { success: false, error: `Invalid request type in visible_request_types: ${type}` },
                { status: 400 }
              );
            }
          }
        } else if (key === 'servicenow_instance_url' || key === 'default_ai_model') {
          if (typeof value !== 'string') {
            return NextResponse.json(
              { success: false, error: `Invalid value for ${key}, expected string` },
              { status: 400 }
            );
          }
        } else if (typeof value !== 'boolean') {
          return NextResponse.json(
            { success: false, error: `Invalid value for ${key}, expected boolean` },
            { status: 400 }
          );
        }
        
        if (key !== 'agent_models') {
          (settings as Record<string, unknown>)[key] = value;
        }
      }
    }

    // Update traditional settings
    if (Object.keys(settings).length > 0) {
      await settingsManager.updateSettings(authResult.user.username, settings);
    }
    
    // Update agent models if provided
    if (agentModelsToUpdate) {
      await agentModelManager.updateUserAgentModels(authResult.user.username, agentModelsToUpdate);
    }
    
    // Return the updated settings with agent models
    const updatedSettings = await settingsManager.getAllSettings(authResult.user.username);
    const updatedAgentModels = await agentModelManager.getUserAgentModels(authResult.user.username);
    
    const settingsWithAgents: UserSettings = {
      ...updatedSettings,
      agent_models: updatedAgentModels
    };

    return NextResponse.json({
      success: true,
      data: settingsWithAgents
    });
  } catch (error) {
    console.error('Settings PUT error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
