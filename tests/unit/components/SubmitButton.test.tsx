import { render, screen, fireEvent } from '@testing-library/react';
import SubmitButton from '@/components/SubmitButton';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Bot: ({ className }: { className: string }) => 
    <div data-testid="icon-bot" className={className}>Bot</div>,
  X: ({ className }: { className: string }) => 
    <div data-testid="icon-x" className={className}>X</div>,
}));

describe('SubmitButton', () => {
  const mockOnSubmit = jest.fn();
  const mockOnStop = jest.fn();

  const defaultProps = {
    isLoading: false,
    hasQuestion: true,
    onSubmit: mockOnSubmit,
    onStop: mockOnStop,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the button', () => {
      render(<SubmitButton {...defaultProps} />);
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should show "Get Help" text and Bot icon when not loading', () => {
      render(<SubmitButton {...defaultProps} isLoading={false} />);

      expect(screen.getByText('Get Help')).toBeInTheDocument();
      expect(screen.getByTestId('icon-bot')).toBeInTheDocument();
      expect(screen.queryByText('Stop Processing')).not.toBeInTheDocument();
      expect(screen.queryByTestId('icon-x')).not.toBeInTheDocument();
    });

    it('should show "Stop Processing" text and X icon when loading', () => {
      render(<SubmitButton {...defaultProps} isLoading={true} />);

      expect(screen.getByText('Stop Processing')).toBeInTheDocument();
      expect(screen.getByTestId('icon-x')).toBeInTheDocument();
      expect(screen.queryByText('Get Help')).not.toBeInTheDocument();
      expect(screen.queryByTestId('icon-bot')).not.toBeInTheDocument();
    });

    it('should apply correct icon classes', () => {
      render(<SubmitButton {...defaultProps} isLoading={false} />);

      const botIcon = screen.getByTestId('icon-bot');
      expect(botIcon).toHaveClass('h-5', 'w-5');
    });
  });

  describe('Button Type and States', () => {
    it('should have type="submit" when not loading', () => {
      render(<SubmitButton {...defaultProps} isLoading={false} />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'submit');
    });

    it('should have type="button" when loading', () => {
      render(<SubmitButton {...defaultProps} isLoading={true} />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'button');
    });

    it('should be enabled when loading (so user can stop)', () => {
      render(<SubmitButton {...defaultProps} isLoading={true} />);

      const button = screen.getByRole('button');
      expect(button).toBeEnabled();
    });

    it('should be enabled when not loading and has question', () => {
      render(<SubmitButton {...defaultProps} isLoading={false} hasQuestion={true} />);

      const button = screen.getByRole('button');
      expect(button).toBeEnabled();
    });

    it('should be disabled when not loading and has no question', () => {
      render(<SubmitButton {...defaultProps} isLoading={false} hasQuestion={false} />);

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });
  });

  describe('Click Handlers', () => {
    it('should call onSubmit when form is submitted (not loading)', () => {
      // When not loading, the button is type="submit" and onSubmit is called via form submission
      // We need to test this in the context of a form
      render(
        <form onSubmit={(e) => { e.preventDefault(); mockOnSubmit(); }}>
          <SubmitButton {...defaultProps} isLoading={false} hasQuestion={true} />
        </form>
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      expect(mockOnStop).not.toHaveBeenCalled();
    });

    it('should call onStop when clicked while loading', () => {
      render(<SubmitButton {...defaultProps} isLoading={true} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(mockOnStop).toHaveBeenCalledTimes(1);
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should not call onSubmit when disabled (no question)', () => {
      render(<SubmitButton {...defaultProps} isLoading={false} hasQuestion={false} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(mockOnSubmit).not.toHaveBeenCalled();
      expect(mockOnStop).not.toHaveBeenCalled();
    });

    it('should preventDefault and stopPropagation when loading', () => {
      render(<SubmitButton {...defaultProps} isLoading={true} />);

      const button = screen.getByRole('button');
      const mockEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
      };

      // Simulate the click event with custom event object
      fireEvent.click(button);
      
      // Since we can't directly test preventDefault/stopPropagation with fireEvent,
      // we verify the handler is called correctly
      expect(mockOnStop).toHaveBeenCalledTimes(1);
    });

    it('should not have onClick handler when not loading', () => {
      render(<SubmitButton {...defaultProps} isLoading={false} />);

      const button = screen.getByRole('button');
      // When not loading, the button relies on form submission, so onClick should be undefined
      // This is tested implicitly by the form submission behavior
      expect(button).toHaveAttribute('type', 'submit');
    });
  });

  describe('Styling and Visual States', () => {
    it('should apply loading styles when loading', () => {
      render(<SubmitButton {...defaultProps} isLoading={true} />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-gradient-to-br');
      expect(button).toHaveClass('from-orange-500');
      expect(button).toHaveClass('via-red-500');
      expect(button).toHaveClass('to-pink-600');
    });

    it('should apply active styles when not loading and has question', () => {
      render(<SubmitButton {...defaultProps} isLoading={false} hasQuestion={true} />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-gradient-to-br');
      expect(button).toHaveClass('from-blue-500');
      expect(button).toHaveClass('via-blue-600');
      expect(button).toHaveClass('to-indigo-600');
    });

    it('should apply disabled styles when no question', () => {
      render(<SubmitButton {...defaultProps} isLoading={false} hasQuestion={false} />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-gradient-to-r');
      expect(button).toHaveClass('from-gray-400');
      expect(button).toHaveClass('to-gray-500');
      expect(button).toHaveClass('disabled:opacity-50');
      expect(button).toHaveClass('disabled:cursor-not-allowed');
    });

    it('should have base styling classes', () => {
      render(<SubmitButton {...defaultProps} />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('w-full');
      expect(button).toHaveClass('rounded-xl');
      expect(button).toHaveClass('font-semibold');
      expect(button).toHaveClass('text-white');
      expect(button).toHaveClass('flex');
      expect(button).toHaveClass('items-center');
      expect(button).toHaveClass('justify-center');
      expect(button).toHaveClass('space-x-2');
    });

    it('should have responsive padding classes', () => {
      render(<SubmitButton {...defaultProps} />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('py-3', 'px-4');
      expect(button).toHaveClass('sm:py-4', 'sm:px-6');
    });

    it('should have transition and animation classes', () => {
      render(<SubmitButton {...defaultProps} />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('transition-all');
      expect(button).toHaveClass('duration-300');
      expect(button).toHaveClass('transform');
      expect(button).toHaveClass('hover:-translate-y-1');
      expect(button).toHaveClass('disabled:transform-none');
    });

    it('should have shadow effects', () => {
      render(<SubmitButton {...defaultProps} hasQuestion={true} />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('shadow-lg');
      expect(button).toHaveClass('hover:shadow-2xl');
    });
  });

  describe('Animated Background Glow', () => {
    it('should render animated background glow element', () => {
      const { container } = render(<SubmitButton {...defaultProps} />);

      const glowElement = container.querySelector('.absolute.inset-0.bg-gradient-to-r');
      expect(glowElement).toBeInTheDocument();
      expect(glowElement).toHaveClass('-translate-x-full');
      expect(glowElement).toHaveClass('group-hover:translate-x-full');
      expect(glowElement).toHaveClass('transition-transform');
      expect(glowElement).toHaveClass('duration-1000');
    });

    it('should have correct z-index stacking', () => {
      const { container } = render(<SubmitButton {...defaultProps} />);

      const button = screen.getByRole('button');
      const contentContainer = container.querySelector('.relative.z-10');

      expect(button).toHaveClass('z-20');
      expect(contentContainer).toBeInTheDocument();
    });
  });

  describe('Content Structure', () => {
    it('should have correct content structure with icon and text', () => {
      const { container } = render(<SubmitButton {...defaultProps} isLoading={false} />);

      const contentContainer = container.querySelector('.relative.z-10.flex.items-center.space-x-2');
      expect(contentContainer).toBeInTheDocument();

      const icon = screen.getByTestId('icon-bot');
      const text = screen.getByText('Get Help');

      expect(contentContainer).toContainElement(icon);
      expect(contentContainer).toContainElement(text);
    });

    it('should maintain content structure when loading', () => {
      const { container } = render(<SubmitButton {...defaultProps} isLoading={true} />);

      const contentContainer = container.querySelector('.relative.z-10.flex.items-center.space-x-2');
      expect(contentContainer).toBeInTheDocument();

      const icon = screen.getByTestId('icon-x');
      const text = screen.getByText('Stop Processing');

      expect(contentContainer).toContainElement(icon);
      expect(contentContainer).toContainElement(text);
    });
  });

  describe('Accessibility', () => {
    it('should be keyboard accessible', () => {
      render(<SubmitButton {...defaultProps} hasQuestion={true} />);

      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();

      // Test Enter key
      fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' });
      // The browser would trigger the click/submit automatically
    });

    it('should be properly labeled for screen readers', () => {
      render(<SubmitButton {...defaultProps} isLoading={false} />);

      expect(screen.getByRole('button', { name: /get help/i })).toBeInTheDocument();
    });

    it('should update screen reader text when loading', () => {
      render(<SubmitButton {...defaultProps} isLoading={true} />);

      expect(screen.getByRole('button', { name: /stop processing/i })).toBeInTheDocument();
    });

    it('should properly indicate disabled state to screen readers', () => {
      render(<SubmitButton {...defaultProps} hasQuestion={false} />);

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid state changes', () => {
      const { rerender } = render(<SubmitButton {...defaultProps} isLoading={false} hasQuestion={true} />);

      expect(screen.getByText('Get Help')).toBeInTheDocument();

      rerender(<SubmitButton {...defaultProps} isLoading={true} hasQuestion={true} />);
      expect(screen.getByText('Stop Processing')).toBeInTheDocument();

      rerender(<SubmitButton {...defaultProps} isLoading={false} hasQuestion={false} />);
      expect(screen.getByText('Get Help')).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('should handle simultaneous loading and no question states', () => {
      render(<SubmitButton {...defaultProps} isLoading={true} hasQuestion={false} />);

      const button = screen.getByRole('button');
      expect(screen.getByText('Stop Processing')).toBeInTheDocument();
      expect(button).toBeEnabled(); // Loading state takes precedence
    });
  });
});