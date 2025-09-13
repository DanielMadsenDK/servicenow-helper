import { NextResponse } from 'next/server';

import { AIModelManager } from '@/lib/ai-models';
import type { CapabilitiesApiResponse } from '@/types/index';

// GET /api/capabilities - Get all available capabilities
export async function GET(): Promise<NextResponse<CapabilitiesApiResponse>> {
  try {
    const aiModelManager = new AIModelManager();
    const capabilities = await aiModelManager.getAllCapabilities();

    return NextResponse.json({
      success: true,
      data: capabilities
    });
  } catch (error) {
    console.error('Capabilities GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}