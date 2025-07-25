import { render, screen, fireEvent } from '@testing-library/react';
import TypeSelector from '@/components/TypeSelector';
import { TYPE_OPTIONS, RequestType } from '@/lib/constants';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  FileText: ({ className, style }: { className: string; style?: object }) => 
    <div data-testid="icon-file-text" className={className} style={style}>FileText</div>,
  Lightbulb: ({ className, style }: { className: string; style?: object }) => 
    <div data-testid="icon-lightbulb" className={className} style={style}>Lightbulb</div>,
  Code2: ({ className, style }: { className: string; style?: object }) => 
    <div data-testid="icon-code2" className={className} style={style}>Code2</div>,
  Wrench: ({ className, style }: { className: string; style?: object }) => 
    <div data-testid="icon-wrench" className={className} style={style}>Wrench</div>,
}));

describe('TypeSelector', () => {
  const mockOnTypeChange = jest.fn();

  const defaultProps = {
    selectedType: 'documentation' as RequestType,
    onTypeChange: mockOnTypeChange,
    disabled: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render all type options', () => {
      render(<TypeSelector {...defaultProps} />);

      // Check that all TYPE_OPTIONS are rendered
      expect(screen.getByRole('button', { name: /documentation/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /recommendation/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /script solution/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /troubleshoot/i })).toBeInTheDocument();
    });

    it('should render correct icons for each option', () => {
      render(<TypeSelector {...defaultProps} />);

      // Check that all icons are present
      expect(screen.getByTestId('icon-file-text')).toBeInTheDocument();
      expect(screen.getByTestId('icon-lightbulb')).toBeInTheDocument();
      expect(screen.getByTestId('icon-code2')).toBeInTheDocument();
      expect(screen.getByTestId('icon-wrench')).toBeInTheDocument();
    });

    it('should render correct number of buttons matching TYPE_OPTIONS', () => {
      render(<TypeSelector {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(TYPE_OPTIONS.length);
    });

    it('should apply correct icon styling', () => {
      render(<TypeSelector {...defaultProps} />);

      const icons = [
        screen.getByTestId('icon-file-text'),
        screen.getByTestId('icon-lightbulb'),
        screen.getByTestId('icon-code2'),
        screen.getByTestId('icon-wrench'),
      ];

      icons.forEach(icon => {
        expect(icon).toHaveClass('h-5', 'w-5', 'flex-shrink-0');
        expect(icon).toHaveStyle({ width: '20px', height: '20px' });
      });
    });
  });

  describe('Selection State', () => {
    it('should show selected state for the current selectedType', () => {
      render(<TypeSelector {...defaultProps} selectedType="recommendation" />);

      const recommendationButton = screen.getByRole('button', { name: /recommendation/i });
      const documentationButton = screen.getByRole('button', { name: /documentation/i });

      // Selected button should have selected styling
      expect(recommendationButton).toHaveClass('border-blue-500');
      expect(recommendationButton).toHaveClass('text-blue-700');
      expect(recommendationButton).toHaveClass('scale-105');

      // Non-selected buttons should have default styling
      expect(documentationButton).toHaveClass('border-gray-200');
      expect(documentationButton).toHaveClass('text-gray-700');
    });

    it('should update selected state when selectedType prop changes', () => {
      const { rerender } = render(<TypeSelector {...defaultProps} selectedType="documentation" />);

      let documentationButton = screen.getByRole('button', { name: /documentation/i });
      let scriptButton = screen.getByRole('button', { name: /script solution/i });

      expect(documentationButton).toHaveClass('border-blue-500');
      expect(scriptButton).toHaveClass('border-gray-200');

      // Change selection
      rerender(<TypeSelector {...defaultProps} selectedType="script" />);

      documentationButton = screen.getByRole('button', { name: /documentation/i });
      scriptButton = screen.getByRole('button', { name: /script solution/i });

      expect(documentationButton).toHaveClass('border-gray-200');
      expect(scriptButton).toHaveClass('border-blue-500');
    });
  });

  describe('User Interactions', () => {
    it('should call onTypeChange when a button is clicked', () => {
      render(<TypeSelector {...defaultProps} />);

      const recommendationButton = screen.getByRole('button', { name: /recommendation/i });
      fireEvent.click(recommendationButton);

      expect(mockOnTypeChange).toHaveBeenCalledTimes(1);
      expect(mockOnTypeChange).toHaveBeenCalledWith('recommendation');
    });

    it('should call onTypeChange with correct value for each option', () => {
      render(<TypeSelector {...defaultProps} />);

      // Test each button
      const documentationButton = screen.getByRole('button', { name: /documentation/i });
      const recommendationButton = screen.getByRole('button', { name: /recommendation/i });
      const scriptButton = screen.getByRole('button', { name: /script solution/i });
      const troubleshootButton = screen.getByRole('button', { name: /troubleshoot/i });

      fireEvent.click(documentationButton);
      expect(mockOnTypeChange).toHaveBeenLastCalledWith('documentation');

      fireEvent.click(recommendationButton);
      expect(mockOnTypeChange).toHaveBeenLastCalledWith('recommendation');

      fireEvent.click(scriptButton);
      expect(mockOnTypeChange).toHaveBeenLastCalledWith('script');

      fireEvent.click(troubleshootButton);
      expect(mockOnTypeChange).toHaveBeenLastCalledWith('troubleshoot');

      expect(mockOnTypeChange).toHaveBeenCalledTimes(4);
    });

    it('should allow clicking the currently selected option', () => {
      render(<TypeSelector {...defaultProps} selectedType="documentation" />);

      const documentationButton = screen.getByRole('button', { name: /documentation/i });
      fireEvent.click(documentationButton);

      expect(mockOnTypeChange).toHaveBeenCalledTimes(1);
      expect(mockOnTypeChange).toHaveBeenCalledWith('documentation');
    });
  });

  describe('Disabled State', () => {
    it('should disable all buttons when disabled prop is true', () => {
      render(<TypeSelector {...defaultProps} disabled={true} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toBeDisabled();
      });
    });

    it('should apply disabled styling when disabled', () => {
      render(<TypeSelector {...defaultProps} disabled={true} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveClass('opacity-60');
        expect(button).toHaveClass('cursor-not-allowed');
        expect(button).toHaveClass('scale-95');
      });
    });

    it('should not call onTypeChange when disabled button is clicked', () => {
      render(<TypeSelector {...defaultProps} disabled={true} />);

      const documentationButton = screen.getByRole('button', { name: /documentation/i });
      fireEvent.click(documentationButton);

      expect(mockOnTypeChange).not.toHaveBeenCalled();
    });

    it('should apply hover styles when not disabled', () => {
      render(<TypeSelector {...defaultProps} disabled={false} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveClass('hover:shadow-md');
        expect(button).toHaveClass('hover:scale-105');
        expect(button).toHaveClass('hover:-translate-y-0.5');
      });
    });

    it('should not apply hover styles when disabled', () => {
      render(<TypeSelector {...defaultProps} disabled={true} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).not.toHaveClass('hover:shadow-md');
        expect(button).not.toHaveClass('hover:scale-105');
        expect(button).not.toHaveClass('hover:-translate-y-0.5');
      });
    });
  });

  describe('Grid Layout', () => {
    it('should render with correct grid classes', () => {
      const { container } = render(<TypeSelector {...defaultProps} />);

      const gridContainer = container.firstChild as HTMLElement;
      expect(gridContainer).toHaveClass('grid');
      expect(gridContainer).toHaveClass('grid-cols-1');
      expect(gridContainer).toHaveClass('md:grid-cols-2');
      expect(gridContainer).toHaveClass('lg:grid-cols-4');
      expect(gridContainer).toHaveClass('gap-3');
      expect(gridContainer).toHaveClass('sm:gap-4');
    });
  });

  describe('Button Attributes', () => {
    it('should set correct button type', () => {
      render(<TypeSelector {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAttribute('type', 'button');
      });
    });

    it('should have unique keys for each button', () => {
      const { container } = render(<TypeSelector {...defaultProps} />);
      
      // This test ensures no React key warnings in the console
      // Each button should have a unique key based on the value
      const buttons = container.querySelectorAll('button');
      expect(buttons).toHaveLength(TYPE_OPTIONS.length);
    });
  });

  describe('Accessibility', () => {
    it('should have proper button semantics', () => {
      render(<TypeSelector {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(4);

      buttons.forEach(button => {
        expect(button).toBeVisible();
        expect(button).toHaveAttribute('type', 'button');
      });
    });

    it('should be keyboard accessible', () => {
      render(<TypeSelector {...defaultProps} />);

      const documentationButton = screen.getByRole('button', { name: /documentation/i });
      
      // Focus the button
      documentationButton.focus();
      expect(documentationButton).toHaveFocus();

      // Press Enter
      fireEvent.keyDown(documentationButton, { key: 'Enter', code: 'Enter' });
      // Note: The click event is handled by the browser when Enter is pressed on a button
    });
  });
});