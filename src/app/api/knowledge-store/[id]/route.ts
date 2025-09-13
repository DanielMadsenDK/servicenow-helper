import { NextRequest, NextResponse } from 'next/server';

import { getServerAuthState } from '@/lib/server-auth';
import { N8NClient } from '@/lib/n8n-client';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { isAuthenticated } = await getServerAuthState();
    if (!isAuthenticated) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: idParam } = await params;
    const id = parseInt(idParam);
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid ID parameter' },
        { status: 400 }
      );
    }

    const n8nClient = N8NClient.getInstance();
    const success = await n8nClient.deleteQAPair(id);

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete knowledge store item' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Knowledge store item deleted successfully'
    });

  } catch (error) {
    console.error('Knowledge store delete API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to delete knowledge store item' 
      },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { isAuthenticated } = await getServerAuthState();
    if (!isAuthenticated) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: idParam } = await params;
    const id = parseInt(idParam);
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid ID parameter' },
        { status: 400 }
      );
    }

    const n8nClient = N8NClient.getInstance();
    const item = await n8nClient.getQAById(id);

    if (!item) {
      return NextResponse.json(
        { success: false, error: 'Knowledge store item not found' },
        { status: 404 }
      );
    }

    // Convert string dates to Date objects
    const itemWithDates = {
      ...item,
      created_at: new Date(item.created_at),
      updated_at: new Date(item.updated_at)
    };

    return NextResponse.json({
      success: true,
      data: itemWithDates
    });

  } catch (error) {
    console.error('Knowledge store get by ID API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch knowledge store item' 
      },
      { status: 500 }
    );
  }
}