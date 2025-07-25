import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';

// Mock react-markdown to avoid ES module issues
jest.mock('react-markdown', () => {
  return function MockMarkdown({ children }: { children: string }) {
    return <div data-testid="react-markdown">{children}</div>;
  };
});

import HistoryItem from '../../../src/components/HistoryItem';

const mockConversation = {
  id: 1,
  created_at: new Date('2023-01-01T12:00:00Z'),
  prompt: 'This is a test question about ServiceNow',
  response: 'This is a test response with markdown formatting.',
  model: 'claude-sonnet-4-20250514',
  state: 'done',
  key: 'test-key',
  question: 'This is a test question about ServiceNow',
};

describe('HistoryItem - Basic Functionality', () => {
  const mockOnDelete = jest.fn();
  const mockOnSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock the current date for consistent testing
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2023-01-02T12:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('basic rendering', () => {
    it('should render conversation details correctly', () => {
      render(
        <HistoryItem
          conversation={mockConversation}
          onDelete={mockOnDelete}
          onSelect={mockOnSelect}
        />
      );

      expect(screen.getByText('This is a test question about ServiceNow')).toBeInTheDocument();
      expect(screen.getByText('claude-sonnet-4-20250514')).toBeInTheDocument();
      expect(screen.getByText('1d ago')).toBeInTheDocument();
    });

    it('should show delete button when onDelete is provided', () => {
      render(
        <HistoryItem
          conversation={mockConversation}
          onDelete={mockOnDelete}
          onSelect={mockOnSelect}
        />
      );

      expect(screen.getByTitle('Delete conversation')).toBeInTheDocument();
    });

    it('should not show delete button when onDelete is not provided', () => {
      render(
        <HistoryItem
          conversation={mockConversation}
          onSelect={mockOnSelect}
        />
      );

      expect(screen.queryByTitle('Delete conversation')).not.toBeInTheDocument();
    });
  });

  describe('response expansion', () => {
    it('should show "Show response" button when response exists', () => {
      render(
        <HistoryItem
          conversation={mockConversation}
          onDelete={mockOnDelete}
          onSelect={mockOnSelect}
        />
      );

      expect(screen.getByText('Show preview')).toBeInTheDocument();
    });

    it('should expand response when "Show preview" is clicked', async () => {
      render(
        <HistoryItem
          conversation={mockConversation}
          onDelete={mockOnDelete}
          onSelect={mockOnSelect}
        />
      );

      const showButton = screen.getByText('Show preview');
      fireEvent.click(showButton);

      expect(screen.getByText('Hide preview')).toBeInTheDocument();
      
      // Wait for the lazy-loaded ReactMarkdown component to render
      await waitFor(() => {
        expect(screen.getByTestId('react-markdown')).toBeInTheDocument();
      });
    });
  });

  describe('conversation selection', () => {
    it('should call onSelect when conversation prompt is clicked', () => {
      render(
        <HistoryItem
          conversation={mockConversation}
          onDelete={mockOnDelete}
          onSelect={mockOnSelect}
        />
      );

      const promptButton = screen.getByText('This is a test question about ServiceNow');
      fireEvent.click(promptButton);

      expect(mockOnSelect).toHaveBeenCalledWith(mockConversation);
    });
  });

  describe('conversation deletion', () => {
    it('should call onDelete when delete button is clicked', () => {
      render(
        <HistoryItem
          conversation={mockConversation}
          onDelete={mockOnDelete}
          onSelect={mockOnSelect}
        />
      );

      const deleteButton = screen.getByTitle('Delete conversation');
      fireEvent.click(deleteButton);

      expect(mockOnDelete).toHaveBeenCalledWith(mockConversation.id);
    });
  });

  describe('conversation state', () => {
    it('should not show status for completed conversations', () => {
      render(
        <HistoryItem
          conversation={mockConversation}
          onDelete={mockOnDelete}
          onSelect={mockOnSelect}
        />
      );

      expect(screen.queryByText('Status:')).not.toBeInTheDocument();
    });

    it('should show status for non-completed conversations', () => {
      const processingConversation = {
        ...mockConversation,
        state: 'processing',
        response: null,
      };

      render(
        <HistoryItem
          conversation={processingConversation}
          onDelete={mockOnDelete}
          onSelect={mockOnSelect}
        />
      );

      expect(screen.getByText('Status: processing')).toBeInTheDocument();
    });
  });
});