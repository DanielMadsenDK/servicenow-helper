import { NextRequest, NextResponse } from 'next/server';

import { getServerAuthState } from '@/lib/server-auth';
import { ProviderManager } from '@/lib/providers';
import type { ProvidersApiResponse, ProviderApiResponse } from '@/types/index';

// GET /api/providers - Get active providers
export async function GET(): Promise<NextResponse<ProvidersApiResponse>> {
  try {
    const authResult = await getServerAuthState();

    if (!authResult.isAuthenticated || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        {
          status: 401,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          }
        }
      );
    }

    const providerManager = new ProviderManager();
    const providers = await providerManager.getActiveProviders();

    return NextResponse.json({
      success: true,
      data: providers
    }, {
      headers: {
        // Cache for 5 minutes to reduce database load
        'Cache-Control': 'private, max-age=300, stale-while-revalidate=60',
        'Content-Type': 'application/json',
      }
    });
  } catch (error) {
    console.error('Providers GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        }
      }
    );
  }
}

// POST /api/providers - Add new provider (Admin only - future enhancement)
export async function POST(request: NextRequest): Promise<NextResponse<ProviderApiResponse>> {
  try {
    const authResult = await getServerAuthState();

    if (!authResult.isAuthenticated || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // For now, return method not allowed - this would be admin-only in future
    return NextResponse.json(
      { success: false, error: 'Method not allowed - provider management requires admin privileges' },
      { status: 405 }
    );

    // Future implementation for admin users:
    /*
    const body = await request.json();

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const providerInput: ProviderInput = {
      name: body.name,
      display_name: body.display_name,
      endpoint: body.endpoint,
      is_active: body.is_active,
      priority: body.priority,
      rate_limit_per_minute: body.rate_limit_per_minute
    };

    // Validate input
    if (!providerInput.name || typeof providerInput.name !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Provider name is required and must be a string' },
        { status: 400 }
      );
    }

    if (!providerInput.display_name || typeof providerInput.display_name !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Display name is required and must be a string' },
        { status: 400 }
      );
    }

    if (!providerInput.endpoint || typeof providerInput.endpoint !== 'string' || providerInput.endpoint.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Endpoint is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    const providerManager = new ProviderManager();
    const provider = await providerManager.addProvider(providerInput);

    return NextResponse.json({
      success: true,
      data: provider
    });
    */
  } catch (error) {
    console.error('Providers POST error:', error);

    // Handle unique constraint violation
    if (error instanceof Error && error.message.includes('unique constraint')) {
      return NextResponse.json(
        { success: false, error: 'Provider with this name already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// OPTIONS /api/providers - CORS preflight
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400', // 24 hours
    },
  });
}