import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { jest } from '@jest/globals';

// Mock the fetch function
global.fetch = jest.fn();

// Mock the HistoryItem component to avoid react-markdown issues
jest.mock('../../../src/components/HistoryItem', () => {
  return function MockHistoryItem({ conversation, onDelete, onSelect }: any) {
    return (
      <div data-testid={`history-item-${conversation.id}`}>
        <span>{conversation.question || conversation.prompt}</span>
        <button onClick={() => onSelect?.(conversation)}>Select</button>
        <button onClick={() => onDelete?.(conversation.id)}>Delete</button>
      </div>
    );
  };
});

import HistoryPanel from '../../../src/components/HistoryPanel';

const mockConversation = {
  id: 1,
  created_at: new Date('2023-01-01T00:00:00Z'),
  prompt: 'Test question',
  response: 'Test response',
  model: 'test-model',
  state: 'done',
  key: 'test-key',
  question: 'Test user question',
};

describe('HistoryPanel - Basic Functionality', () => {
  const mockOnClose = jest.fn();
  const mockOnSelectConversation = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: {
          conversations: [mockConversation],
          total: 1,
          hasMore: false,
        },
      }),
    });
  });

  describe('when panel is closed', () => {
    it('should not render when isOpen is false', () => {
      render(
        <HistoryPanel
          isOpen={false}
          onClose={mockOnClose}
          onSelectConversation={mockOnSelectConversation}
        />
      );

      expect(screen.queryByText('History')).not.toBeInTheDocument();
    });
  });

  describe('when panel is open', () => {
    it('should render history panel when isOpen is true', () => {
      render(
        <HistoryPanel
          isOpen={true}
          onClose={mockOnClose}
          onSelectConversation={mockOnSelectConversation}
        />
      );

      expect(screen.getByText('History')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Search conversations...')).toBeInTheDocument();
    });

    it('should call onClose when close button is clicked', () => {
      render(
        <HistoryPanel
          isOpen={true}
          onClose={mockOnClose}
          onSelectConversation={mockOnSelectConversation}
        />
      );

      const closeButton = screen.getByTitle('Close');
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should show loading state initially', () => {
      render(
        <HistoryPanel
          isOpen={true}
          onClose={mockOnClose}
          onSelectConversation={mockOnSelectConversation}
        />
      );

      expect(screen.getByText('Loading conversations...')).toBeInTheDocument();
    });

    it('should handle search input changes', () => {
      render(
        <HistoryPanel
          isOpen={true}
          onClose={mockOnClose}
          onSelectConversation={mockOnSelectConversation}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search conversations...');
      fireEvent.change(searchInput, { target: { value: 'test search' } });

      expect(searchInput).toHaveValue('test search');
    });

    it('should have refresh and filters buttons', () => {
      render(
        <HistoryPanel
          isOpen={true}
          onClose={mockOnClose}
          onSelectConversation={mockOnSelectConversation}
        />
      );

      expect(screen.getByTitle('Refresh')).toBeInTheDocument();
      expect(screen.getByTitle('Filters')).toBeInTheDocument();
    });
  });
});