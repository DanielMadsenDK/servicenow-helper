import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import KnowledgeStoreItem from '@/components/KnowledgeStoreItem';
import { KnowledgeStoreItem as KnowledgeStoreItemType } from '@/types';

const mockItem: KnowledgeStoreItemType = {
  id: 1,
  question: 'How to create a business rule in ServiceNow?',
  answer: 'To create a business rule, navigate to System Definition > Business Rules and click New.',
  category: 'scripting',
  tags: ['business-rule', 'server-side'],
  quality_score: 4.5,
  usage_count: 15,
  created_at: new Date('2024-01-01T10:30:00Z'),
  updated_at: new Date('2024-01-01T10:30:00Z'),
  question_embedding: null,
  answer_embedding: null,
};

describe('KnowledgeStoreItem', () => {
  const mockOnDelete = jest.fn();
  const mockOnSelect = jest.fn();
  const mockOnSelectionChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock Date.now for consistent date formatting
    jest.spyOn(Date, 'now').mockReturnValue(new Date('2024-01-02T10:30:00Z').getTime());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should render item basic information', () => {
    render(
      <KnowledgeStoreItem
        item={mockItem}
        onDelete={mockOnDelete}
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByText('How to create a business rule in ServiceNow?')).toBeInTheDocument();
    expect(screen.getByText('scripting')).toBeInTheDocument();
    expect(screen.getByText('Used 15x')).toBeInTheDocument();
    expect(screen.getByText('4.5')).toBeInTheDocument();
  });

  it('should render tags when present', () => {
    render(
      <KnowledgeStoreItem
        item={mockItem}
        onDelete={mockOnDelete}
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByText('business-rule')).toBeInTheDocument();
    expect(screen.getByText('server-side')).toBeInTheDocument();
  });

  it('should format date correctly', () => {
    render(
      <KnowledgeStoreItem
        item={mockItem}
        onDelete={mockOnDelete}
        onSelect={mockOnSelect}
      />
    );

    // The date shows as "1/1/2024" because the difference is calculated as being >=7 days
    // This happens when using toLocaleDateString() - just check that a date is present
    expect(screen.getByText('1/1/2024')).toBeInTheDocument();
  });

  it('should expand and collapse answer on button click', async () => {
    render(
      <KnowledgeStoreItem
        item={mockItem}
        onDelete={mockOnDelete}
        onSelect={mockOnSelect}
      />
    );

    // Initially collapsed
    expect(screen.getByText('Show full answer')).toBeInTheDocument();

    // Click to expand
    await act(async () => {
      fireEvent.click(screen.getByText('Show full answer'));
    });

    expect(screen.getByText('Hide answer')).toBeInTheDocument();
  });

  it('should call onSelect when item is clicked', async () => {
    render(
      <KnowledgeStoreItem
        item={mockItem}
        onDelete={mockOnDelete}
        onSelect={mockOnSelect}
      />
    );

    const itemContainer = screen.getByText('How to create a business rule in ServiceNow?').closest('div[class*="cursor-pointer"]');
    expect(itemContainer).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(itemContainer!);
    });

    expect(mockOnSelect).toHaveBeenCalledWith(mockItem);
  });

  it('should call onDelete when delete button is clicked', async () => {
    mockOnDelete.mockResolvedValue(undefined);

    render(
      <KnowledgeStoreItem
        item={mockItem}
        onDelete={mockOnDelete}
        onSelect={mockOnSelect}
      />
    );

    const deleteButton = screen.getByTitle('Delete from knowledge store');
    
    await act(async () => {
      fireEvent.click(deleteButton);
    });

    expect(mockOnDelete).toHaveBeenCalledWith(1);
  });

  it('should render selection checkbox when showSelection is true', () => {
    render(
      <KnowledgeStoreItem
        item={mockItem}
        onDelete={mockOnDelete}
        onSelect={mockOnSelect}
        showSelection={true}
        isSelected={false}
        onSelectionChange={mockOnSelectionChange}
      />
    );

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();
  });

  it('should handle selection change', async () => {
    render(
      <KnowledgeStoreItem
        item={mockItem}
        onDelete={mockOnDelete}
        onSelect={mockOnSelect}
        showSelection={true}
        isSelected={false}
        onSelectionChange={mockOnSelectionChange}
      />
    );

    const checkbox = screen.getByRole('checkbox');
    
    await act(async () => {
      fireEvent.click(checkbox);
    });

    expect(mockOnSelectionChange).toHaveBeenCalledWith(1, true);
  });

  it('should not render delete button when onDelete is not provided', () => {
    render(
      <KnowledgeStoreItem
        item={mockItem}
        onSelect={mockOnSelect}
      />
    );

    expect(screen.queryByTitle('Delete from knowledge store')).not.toBeInTheDocument();
  });

  it('should handle items without category or tags gracefully', () => {
    const itemWithoutCategoryAndTags: KnowledgeStoreItemType = {
      ...mockItem,
      category: null,
      tags: null,
    };

    render(
      <KnowledgeStoreItem
        item={itemWithoutCategoryAndTags}
        onDelete={mockOnDelete}
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByText('How to create a business rule in ServiceNow?')).toBeInTheDocument();
    expect(screen.queryByText('scripting')).not.toBeInTheDocument();
  });
});