import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthState } from '@/lib/server-auth';
import { UserSettingsManager } from '@/lib/database';
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
    const settings = await settingsManager.getAllSettings(authResult.user.username);

    return NextResponse.json({
      success: true,
      data: settings
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
    
    // Validate the settings object structure
    const validKeys = ['welcome_section_visible', 'default_search_mode', 'default_request_type', 'servicenow_instance_url', 'default_ai_model'];
    const settings: Partial<UserSettings> = {};
    
    for (const [key, value] of Object.entries(body)) {
      if (validKeys.includes(key)) {
        if (key === 'default_request_type') {
          if (!['documentation', 'recommendation', 'script', 'troubleshoot'].includes(value as string)) {
            return NextResponse.json(
              { success: false, error: `Invalid value for ${key}` },
              { status: 400 }
            );
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
        (settings as Record<string, unknown>)[key] = value;
      }
    }

    await settingsManager.updateSettings(authResult.user.username, settings);
    
    // Return the updated settings
    const updatedSettings = await settingsManager.getAllSettings(authResult.user.username);

    return NextResponse.json({
      success: true,
      data: updatedSettings
    });
  } catch (error) {
    console.error('Settings PUT error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
