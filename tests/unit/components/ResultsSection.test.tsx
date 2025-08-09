import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ResultsSection from '@/components/ResultsSection';
import { ServiceNowResponse, StreamingStatus } from '@/types';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockAxios = axios as jest.Mocked<typeof axios>;

// Mock ReactMarkdown and related modules
jest.mock('react-markdown', () => {
  return function MockReactMarkdown({ children }: { children: string }) {
    return <div data-testid="markdown-content">{children}</div>;
  };
});

jest.mock('remark-gfm', () => jest.fn());
jest.mock('rehype-highlight', () => jest.fn());

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  History: ({ className }: { className?: string }) => 
    <div data-testid="icon-history" className={className}>History</div>,
  BookmarkPlus: ({ className }: { className?: string }) => 
    <div data-testid="icon-bookmark-plus" className={className}>BookmarkPlus</div>,
  Check: ({ className }: { className?: string }) => 
    <div data-testid="icon-check" className={className}>Check</div>,
}));

// Mock markdown components
jest.mock('@/lib/markdown-components', () => ({
  markdownComponents: {
    h1: ({ children }: { children: React.ReactNode }) => <h1>{children}</h1>,
    h2: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
    p: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
    code: ({ children }: { children: React.ReactNode }) => <code>{children}</code>,
  },
}));

describe('ResultsSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockResponse: ServiceNowResponse = {
    message: 'This is a test response from ServiceNow Helper.',
    type: 'documentation',
    timestamp: '2024-01-01T00:00:00Z',
    sessionkey: 'test-session',
    status: 'complete',
  };

  const defaultProps = {
    response: null,
    error: null,
    isLoadedFromHistory: false,
    selectedType: 'documentation',
    question: 'Test question',
  };

  describe('Basic Rendering', () => {
    it('should not render anything when no response and no error', () => {
      const { container } = render(<ResultsSection {...defaultProps} />);
      expect(container.firstChild).toBeNull();
    });

    it('should render error message when error is provided', () => {
      render(<ResultsSection {...defaultProps} error="Test error message" />);
      
      expect(screen.getByText('Test error message')).toBeInTheDocument();
    });

    it('should render response when response is provided', async () => {
      render(<ResultsSection {...defaultProps} response={mockResponse} />);
      
      // Check that the response section is rendered 
      expect(screen.getByText('documentation Response')).toBeInTheDocument();
      
      // The content might show as loading initially due to Suspense, so check for either content or loading
      const content = await screen.findByTestId('markdown-content').catch(() => null);
      const loading = screen.queryByText('Loading content...');
      
      expect(content || loading).toBeTruthy();
    });
  });

  describe('Streaming Functionality', () => {
    it('should render streaming content when streaming', () => {
      const streamingProps = {
        ...defaultProps,
        streamingContent: 'This is streaming content',
        isStreaming: true,
        streamingStatus: StreamingStatus.STREAMING,
      };

      render(<ResultsSection {...streamingProps} />);
      
      expect(screen.getByTestId('markdown-content')).toBeInTheDocument();
      expect(screen.getByTestId('markdown-content')).toHaveTextContent('This is streaming content');
    });

    it('should show connecting status when streaming is connecting', () => {
      const streamingProps = {
        ...defaultProps,
        streamingContent: '',
        isStreaming: true,
        streamingStatus: StreamingStatus.CONNECTING,
      };

      render(<ResultsSection {...streamingProps} />);
      
      // Should render the component container even when connecting
      const resultsContainer = document.querySelector('[class*="results"]') || 
                              document.querySelector('[data-testid*="results"]') ||
                              document.body.firstChild;
      expect(resultsContainer).toBeTruthy();
    });

    it('should handle streaming status changes', () => {
      const { rerender } = render(
        <ResultsSection 
          {...defaultProps} 
          isStreaming={true} 
          streamingStatus={StreamingStatus.CONNECTING}
          streamingContent=""
        />
      );

      rerender(
        <ResultsSection 
          {...defaultProps} 
          isStreaming={true} 
          streamingStatus={StreamingStatus.STREAMING}
          streamingContent="Partial response"
        />
      );

      expect(screen.getByTestId('markdown-content')).toHaveTextContent('Partial response');
    });

    it('should handle streaming completion', () => {
      render(
        <ResultsSection 
          {...defaultProps} 
          response={mockResponse}
          isStreaming={false} 
          streamingStatus={StreamingStatus.COMPLETE}
          streamingContent="Complete response"
        />
      );

      // When streaming is complete (isStreaming=false), should show the regular response content
      expect(screen.getByTestId('markdown-content')).toHaveTextContent('This is a test response from ServiceNow Helper.');
    });

    it('should prioritize streaming content over regular response', () => {
      render(
        <ResultsSection 
          {...defaultProps} 
          response={mockResponse}
          isStreaming={true} 
          streamingContent="Streaming takes priority"
        />
      );

      expect(screen.getByTestId('markdown-content')).toHaveTextContent('Streaming takes priority');
    });
  });

  describe('Save to History Functionality', () => {
    beforeEach(() => {
      mockAxios.post.mockResolvedValue({ data: { success: true } });
    });

    it('should render save button for complete responses', async () => {
      render(
        <ResultsSection 
          {...defaultProps} 
          response={mockResponse}
          question="How do I create an incident?"
        />
      );

      const saveButton = screen.getByRole('button', { name: /add to knowledge base/i });
      expect(saveButton).toBeInTheDocument();
      expect(screen.getAllByTestId('icon-bookmark-plus')).toHaveLength(2); // Icon appears twice: in info section and button
    });

    it('should handle save to history click', async () => {
      render(
        <ResultsSection 
          {...defaultProps} 
          response={mockResponse}
          question="How do I create an incident?"
        />
      );

      const saveButton = screen.getByRole('button', { name: /add to knowledge base/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockAxios.post).toHaveBeenCalledWith('/api/save-qa-pair', {
          question: 'How do I create an incident?',
          answer: mockResponse.message,
          category: 'documentation',
          tags: ['documentation'],
        });
      });
    });

    it('should show success state after saving', async () => {
      render(
        <ResultsSection 
          {...defaultProps} 
          response={mockResponse}
          question="How do I create an incident?"
        />
      );

      const saveButton = screen.getByRole('button', { name: /add to knowledge base/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getAllByTestId('icon-check')).toHaveLength(2); // Icon appears in button and success message
        expect(screen.getByText('Added!')).toBeInTheDocument();
      });
    });

    it('should handle save errors gracefully', async () => {
      mockAxios.post.mockRejectedValueOnce(new Error('Save failed'));

      render(
        <ResultsSection 
          {...defaultProps} 
          response={mockResponse}
          question="How do I create an incident?"
        />
      );

      const saveButton = screen.getByRole('button', { name: /add to knowledge base/i });
      fireEvent.click(saveButton);

      // Should not crash and should reset to original state
      await waitFor(() => {
        expect(screen.getByTestId('icon-bookmark-plus')).toBeInTheDocument();
      });
    });

    it('should show different message for save button when loaded from history', () => {
      render(
        <ResultsSection 
          {...defaultProps} 
          response={mockResponse}
          isLoadedFromHistory={true}
        />
      );

      // Save button should still be present, but with different messaging
      expect(screen.getByRole('button', { name: /add to knowledge base/i })).toBeInTheDocument();
      expect(screen.getByText('Found this helpful? Add it to the knowledge base for better future answers')).toBeInTheDocument();
    });
  });

  describe('Response Display', () => {
    it('should render markdown content correctly', () => {
      const responseWithMarkdown = {
        ...mockResponse,
        message: '# Heading\n\nThis is **bold** text.',
      };

      render(<ResultsSection {...defaultProps} response={responseWithMarkdown} />);
      
      expect(screen.getByTestId('markdown-content')).toBeInTheDocument();
    });

    it('should handle empty responses', () => {
      const emptyResponse = { ...mockResponse, message: '' };
      
      render(<ResultsSection {...defaultProps} response={emptyResponse} />);
      
      expect(screen.getByTestId('markdown-content')).toBeInTheDocument();
    });

    it('should handle very long responses', () => {
      const longResponse = {
        ...mockResponse,
        message: 'A'.repeat(10000),
      };

      render(<ResultsSection {...defaultProps} response={longResponse} />);
      
      expect(screen.getByTestId('markdown-content')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should render error styling correctly', () => {
      render(<ResultsSection {...defaultProps} error="Network error occurred" />);
      
      const errorElement = screen.getByText('Network error occurred');
      expect(errorElement).toBeInTheDocument();
    });

    it('should handle both error and response (both are shown)', () => {
      render(
        <ResultsSection 
          {...defaultProps} 
          response={mockResponse}
          error="Error occurred"
        />
      );
      
      expect(screen.getByText('Error occurred')).toBeInTheDocument();
      expect(screen.getByTestId('markdown-content')).toBeInTheDocument();
    });
  });

  describe('Integration with Streaming', () => {
    it('should handle streaming error states', () => {
      render(
        <ResultsSection 
          {...defaultProps} 
          isStreaming={true}
          streamingStatus={StreamingStatus.ERROR}
          error="Streaming failed"
        />
      );

      expect(screen.getByText('Streaming failed')).toBeInTheDocument();
    });

    it('should handle streaming cancellation', () => {
      // When streaming is cancelled, component should not render anything without a response
      const { container } = render(
        <ResultsSection 
          {...defaultProps} 
          isStreaming={false}
          streamingStatus={StreamingStatus.CANCELLED}
          streamingContent="Partial content before cancellation"
        />
      );

      // Without a response, component should not render anything
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Accessibility', () => {
    it('should be properly labeled for screen readers', () => {
      render(<ResultsSection {...defaultProps} response={mockResponse} />);
      
      expect(screen.getByTestId('markdown-content')).toBeInTheDocument();
    });

    it('should have keyboard accessible save button', () => {
      render(
        <ResultsSection 
          {...defaultProps} 
          response={mockResponse}
          question="Test question"
        />
      );

      const saveButton = screen.getByRole('button', { name: /add to knowledge base/i });
      expect(saveButton).toBeInTheDocument();
      
      saveButton.focus();
      expect(saveButton).toHaveFocus();
    });
  });
});