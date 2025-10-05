import { NextRequest, NextResponse } from 'next/server';

import { getServerAuthState } from '@/lib/server-auth';
import { AIModelManager } from '@/lib/ai-models';
import type { AIModelsApiResponse, AIModelApiResponse, AIModelInput } from '@/types/index';

// GET /api/ai-models - Get user's AI models with optional provider filtering
export async function GET(request: NextRequest): Promise<NextResponse<AIModelsApiResponse>> {
  try {
    const authResult = await getServerAuthState();

    if (!authResult.isAuthenticated || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse query parameters for provider filtering
    const url = new URL(request.url);
    const providerIdParam = url.searchParams.get('provider_id');

    let providerId: number | undefined;
    if (providerIdParam) {
      const parsed = parseInt(providerIdParam, 10);
      if (isNaN(parsed) || parsed <= 0) {
        return NextResponse.json(
          { success: false, error: 'Invalid provider_id parameter' },
          { status: 400 }
        );
      }
      providerId = parsed;
    }

    const aiModelManager = new AIModelManager();
    const models = await aiModelManager.getUserModels(authResult.user.username, providerId);

    return NextResponse.json({
      success: true,
      data: models
    });
  } catch (error) {
    console.error('AI Models GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/ai-models - Add new AI model
export async function POST(request: NextRequest): Promise<NextResponse<AIModelApiResponse>> {
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

    const modelInput: AIModelInput = {
      model_name: body.model_name,
      display_name: body.display_name,
      is_free: body.is_free,
      is_default: body.is_default || false,
      provider_id: body.provider_id,
      capability_ids: body.capability_ids || []
    };

    // Validate input
    if (!modelInput.model_name || typeof modelInput.model_name !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Model name is required and must be a string' },
        { status: 400 }
      );
    }

    if (typeof modelInput.is_free !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'is_free must be a boolean' },
        { status: 400 }
      );
    }

    if (modelInput.model_name.length > 500) {
      return NextResponse.json(
        { success: false, error: 'Model name is too long (max 500 characters)' },
        { status: 400 }
      );
    }

    if (modelInput.display_name && typeof modelInput.display_name !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Display name must be a string' },
        { status: 400 }
      );
    }

    if (modelInput.display_name && modelInput.display_name.length > 500) {
      return NextResponse.json(
        { success: false, error: 'Display name is too long (max 500 characters)' },
        { status: 400 }
      );
    }

    if (modelInput.capability_ids && !Array.isArray(modelInput.capability_ids)) {
      return NextResponse.json(
        { success: false, error: 'capability_ids must be an array' },
        { status: 400 }
      );
    }

    if (modelInput.capability_ids && modelInput.capability_ids.some(id => typeof id !== 'number' || id <= 0)) {
      return NextResponse.json(
        { success: false, error: 'All capability IDs must be positive numbers' },
        { status: 400 }
      );
    }

    if (!modelInput.provider_id || typeof modelInput.provider_id !== 'number' || modelInput.provider_id <= 0) {
      return NextResponse.json(
        { success: false, error: 'provider_id is required and must be a positive number' },
        { status: 400 }
      );
    }

    const aiModelManager = new AIModelManager();
    const model = await aiModelManager.addModel(authResult.user.username, modelInput);

    return NextResponse.json({
      success: true,
      data: model
    });
  } catch (error) {
    console.error('AI Models POST error:', error);
    
    // Handle unique constraint violation
    if (error instanceof Error && error.message.includes('unique constraint')) {
      return NextResponse.json(
        { success: false, error: 'Model already exists' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}