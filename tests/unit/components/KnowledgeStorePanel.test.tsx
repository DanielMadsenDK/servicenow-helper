import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import KnowledgeStorePanel from '@/components/KnowledgeStorePanel';
import { KnowledgeStoreItem } from '@/types';

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

const mockItems: KnowledgeStoreItem[] = [
  {
    id: 1,
    question: 'How to create a business rule?',
    answer: 'To create a business rule, navigate to System Definition > Business Rules',
    category: 'scripting',
    tags: ['business-rule', 'server-side'],
    quality_score: 4.5,
    usage_count: 10,
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01'),
    question_embedding: null,
    answer_embedding: null,
  },
  {
    id: 2,
    question: 'How to configure incident forms?',
    answer: 'Configure incident forms in Form Design > Incident',
    category: 'configuration',
    tags: ['forms', 'incident'],
    quality_score: 3.8,
    usage_count: 5,
    created_at: new Date('2024-01-02'),
    updated_at: new Date('2024-01-02'),
    question_embedding: null,
    answer_embedding: null,
  },
];

const mockFetchSuccess = (data: any) => {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ success: true, data }),
  });
};

const mockFetchError = (error: string) => {
  mockFetch.mockResolvedValueOnce({
    ok: false,
    json: async () => ({ success: false, error }),
  });
};

describe('KnowledgeStorePanel', () => {
  const mockOnClose = jest.fn();
  const mockOnSelectItem = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not render when isOpen is false', () => {
    render(
      <KnowledgeStorePanel
        isOpen={false}
        onClose={mockOnClose}
        onSelectItem={mockOnSelectItem}
      />
    );

    expect(screen.queryByText('Knowledge Store')).not.toBeInTheDocument();
  });

  it('should render and fetch items when opened', async () => {
    mockFetchSuccess({ items: mockItems, total: 2, hasMore: false });

    await act(async () => {
      render(
        <KnowledgeStorePanel
          isOpen={true}
          onClose={mockOnClose}
          onSelectItem={mockOnSelectItem}
        />
      );
    });

    expect(screen.getByText('Knowledge Store')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('How to create a business rule?')).toBeInTheDocument();
      expect(screen.getByText('How to configure incident forms?')).toBeInTheDocument();
    });

    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/api/knowledge-store'));
  });

  it('should display loading state', async () => {
    // Mock a slow response
    mockFetch.mockImplementationOnce(() => 
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: async () => ({ success: true, data: { items: [], total: 0, hasMore: false } }),
      }), 100))
    );

    await act(async () => {
      render(
        <KnowledgeStorePanel
          isOpen={true}
          onClose={mockOnClose}
          onSelectItem={mockOnSelectItem}
        />
      );
    });

    expect(screen.getByText('Loading knowledge store items...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText('Loading knowledge store items...')).not.toBeInTheDocument();
    }, { timeout: 200 });
  });

  it('should display error state', async () => {
    mockFetchError('Failed to fetch items');

    await act(async () => {
      render(
        <KnowledgeStorePanel
          isOpen={true}
          onClose={mockOnClose}
          onSelectItem={mockOnSelectItem}
        />
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch items')).toBeInTheDocument();
    });
  });

  it('should handle search functionality', async () => {
    mockFetchSuccess({ items: mockItems, total: 2, hasMore: false });

    await act(async () => {
      render(
        <KnowledgeStorePanel
          isOpen={true}
          onClose={mockOnClose}
          onSelectItem={mockOnSelectItem}
        />
      );
    });

    const searchInput = screen.getByPlaceholderText('Search questions and answers...');
    
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: 'business rule' } });
    });

    // Wait for debounced search - URL encoding can be either %20 or + for spaces
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringMatching(/search=business[+%].*rule/)
      );
    }, { timeout: 1000 });
  });

  it('should call onClose when close button is clicked', async () => {
    mockFetchSuccess({ items: [], total: 0, hasMore: false });

    await act(async () => {
      render(
        <KnowledgeStorePanel
          isOpen={true}
          onClose={mockOnClose}
          onSelectItem={mockOnSelectItem}
        />
      );
    });

    const closeButton = screen.getByTitle('Close');
    
    await act(async () => {
      fireEvent.click(closeButton);
    });

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should display empty state when no items', async () => {
    mockFetchSuccess({ items: [], total: 0, hasMore: false });

    await act(async () => {
      render(
        <KnowledgeStorePanel
          isOpen={true}
          onClose={mockOnClose}
          onSelectItem={mockOnSelectItem}
        />
      );
    });

    await waitFor(() => {
      expect(screen.getByText('No knowledge store items found')).toBeInTheDocument();
    });
  });
});