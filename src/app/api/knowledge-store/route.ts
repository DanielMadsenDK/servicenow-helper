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

    // ARCHITECTURAL LIMITATION: N8N API does not support server-side filtering with pagination
    // We must fetch all items when filtering, then apply pagination client-side
    // This is acceptable for moderately-sized knowledge stores (<10k items)
    // For larger datasets, consider implementing server-side filtering in N8N workflows

    let allItems;

    if (search || category) {
      // When filtering: fetch all items (up to 1000) to apply filters client-side
      // This ensures accurate pagination and "hasMore" calculation
      allItems = await n8nClient.getAllQAPairs(1000, 0);
    } else {
      // When not filtering: fetch only what we need plus some extra to check if there's more
      // This optimizes performance for non-filtered queries
      allItems = await n8nClient.getAllQAPairs(limit + 20, offset);
    }

    // Apply client-side filtering
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

    // Apply pagination AFTER filtering (critical for correct results)
    // When filtering: offset and limit apply to filtered results
    // When not filtering: offset was already applied in the N8N fetch, so start from 0
    const startIndex = (search || category) ? offset : 0;
    const paginatedItems = filteredItems.slice(startIndex, startIndex + limit);
    const hasMore = filteredItems.length > startIndex + limit;

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