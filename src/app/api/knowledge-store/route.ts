import { NextRequest, NextResponse } from 'next/server';

import { getServerAuthState } from '@/lib/server-auth';
import { N8NClient } from '@/lib/n8n-client';
import { KnowledgeStoreQueryResult } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { isAuthenticated } = await getServerAuthState();
    if (!isAuthenticated) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';

    const n8nClient = N8NClient.getInstance();
    
    // For now, we'll fetch a larger set and implement proper server-side filtering
    // TODO: Implement server-side filtering in N8N webhooks for better performance
    const fetchLimit = search || category ? 1000 : limit + 20; // Fetch extra to determine hasMore
    const allItems = await n8nClient.getAllQAPairs(fetchLimit, 0);

    // Apply filtering
    let filteredItems = allItems;
    
    if (search) {
      const searchLower = search.toLowerCase();
      filteredItems = filteredItems.filter(item => 
        item.question.toLowerCase().includes(searchLower) ||
        item.answer.toLowerCase().includes(searchLower)
      );
    }
    
    if (category && category !== 'all') {
      filteredItems = filteredItems.filter(item => 
        item.category === category
      );
    }

    // Apply pagination after filtering
    const paginatedItems = filteredItems.slice(offset, offset + limit);
    const hasMore = filteredItems.length > offset + limit;

    // Convert string dates to Date objects
    const itemsWithDates = paginatedItems.map(item => ({
      ...item,
      created_at: new Date(item.created_at),
      updated_at: new Date(item.updated_at)
    }));

    const result: KnowledgeStoreQueryResult = {
      items: itemsWithDates,
      total: filteredItems.length,
      hasMore
    };

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Knowledge store API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch knowledge store items' 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { isAuthenticated } = await getServerAuthState();
    if (!isAuthenticated) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid ids array' },
        { status: 400 }
      );
    }

    const n8nClient = N8NClient.getInstance();
    const success = await n8nClient.deleteMultipleQAPairs(ids);

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete knowledge store items' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${ids.length} items from knowledge store`
    });

  } catch (error) {
    console.error('Knowledge store bulk delete API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to delete knowledge store items' 
      },
      { status: 500 }
    );
  }
}