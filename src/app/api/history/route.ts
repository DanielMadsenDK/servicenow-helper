import { NextRequest, NextResponse } from 'next/server';

import { getServerAuthState } from '@/lib/server-auth';
import ConversationHistory from '@/lib/database';
import { HistoryQueryOptions, HistoryApiResponse } from '@/types';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const { isAuthenticated } = await getServerAuthState();
    if (!isAuthenticated) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const state = searchParams.get('state') || 'done';

    // Validate pagination parameters
    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        { success: false, error: 'Invalid limit parameter (must be between 1 and 100)' },
        { status: 400 }
      );
    }

    if (offset < 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid offset parameter (must be non-negative)' },
        { status: 400 }
      );
    }

    // Build query options
    const queryOptions: HistoryQueryOptions = {
      limit,
      offset,
      state,
    };

    // Parse date parameters
    if (startDate) {
      const parsedStartDate = new Date(startDate);
      if (isNaN(parsedStartDate.getTime())) {
        return NextResponse.json(
          { success: false, error: 'Invalid startDate parameter' },
          { status: 400 }
        );
      }
      queryOptions.startDate = parsedStartDate;
    }

    if (endDate) {
      const parsedEndDate = new Date(endDate);
      if (isNaN(parsedEndDate.getTime())) {
        return NextResponse.json(
          { success: false, error: 'Invalid endDate parameter' },
          { status: 400 }
        );
      }
      queryOptions.endDate = parsedEndDate;
    }

    // Initialize database connection
    const conversationHistory = new ConversationHistory();

    // Get conversations
    let result;
    if (search && search.trim()) {
      result = await conversationHistory.searchConversations(search.trim(), queryOptions);
    } else {
      result = await conversationHistory.getConversations(queryOptions);
    }

    const response: HistoryApiResponse = {
      success: true,
      data: result,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('History API Error:', error);
    
    const response: HistoryApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    };

    return NextResponse.json(response, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Verify authentication
    const { isAuthenticated } = await getServerAuthState();
    if (!isAuthenticated) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const idParam = searchParams.get('id');

    if (!idParam) {
      return NextResponse.json(
        { success: false, error: 'Missing id parameter' },
        { status: 400 }
      );
    }

    const id = parseInt(idParam);
    if (isNaN(id) || id <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid id parameter' },
        { status: 400 }
      );
    }

    // Initialize database connection
    const conversationHistory = new ConversationHistory();

    // Delete conversation
    const deleted = await conversationHistory.deleteConversation(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Conversation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Conversation deleted successfully',
    });
  } catch (error) {
    console.error('History Delete API Error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'An unexpected error occurred' 
      },
      { status: 500 }
    );
  }
}
