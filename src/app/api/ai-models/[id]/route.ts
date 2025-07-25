import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthState } from '@/lib/server-auth';
import { AIModelManager } from '@/lib/ai-models';
import type { AIModelApiResponse } from '@/types/index';

// DELETE /api/ai-models/[id] - Delete AI model
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<AIModelApiResponse>> {
  try {
    const authResult = await getServerAuthState();
    
    if (!authResult.isAuthenticated || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const modelId = parseInt(resolvedParams.id);
    
    if (isNaN(modelId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid model ID' },
        { status: 400 }
      );
    }

    const aiModelManager = new AIModelManager();
    const deleted = await aiModelManager.deleteModel(authResult.user.username, modelId);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Model not found or not authorized' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: undefined
    });
  } catch (error) {
    console.error('AI Models DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/ai-models/[id] - Update AI model (e.g., set as default)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<AIModelApiResponse>> {
  try {
    const authResult = await getServerAuthState();
    
    if (!authResult.isAuthenticated || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const modelId = parseInt(resolvedParams.id);
    
    if (isNaN(modelId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid model ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const aiModelManager = new AIModelManager();
    
    // Handle setting as default
    if (body.is_default === true) {
      const success = await aiModelManager.setDefaultModel(authResult.user.username, modelId);
      
      if (!success) {
        return NextResponse.json(
          { success: false, error: 'Model not found or not authorized' },
          { status: 404 }
        );
      }
      
      // Get the updated model
      const models = await aiModelManager.getUserModels(authResult.user.username);
      const updatedModel = models.find(m => m.id === modelId);
      
      return NextResponse.json({
        success: true,
        data: updatedModel
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid operation' },
      { status: 400 }
    );
  } catch (error) {
    console.error('AI Models PUT error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}