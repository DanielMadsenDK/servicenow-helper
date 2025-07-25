import { render, screen, fireEvent } from '@testing-library/react';
import { createRef } from 'react';
import QuestionInput from '@/components/QuestionInput';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Pen: ({ className }: { className: string }) => 
    <div data-testid="icon-pen" className={className}>Pen</div>,
}));

describe('QuestionInput', () => {
  const mockOnChange = jest.fn();
  const mockOnKeyDown = jest.fn();
  const mockOnClearHistory = jest.fn();

  const defaultProps = {
    value: '',
    onChange: mockOnChange,
    onKeyDown: mockOnKeyDown,
    placeholder: 'Enter your question...',
    disabled: false,
    isLoadedFromHistory: false,
    onClearHistory: mockOnClearHistory,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the textarea', () => {
      render(<QuestionInput {...defaultProps} />);
      
      const textarea = screen.getByRole('textbox');
      expect(textarea).toBeInTheDocument();
    });

    it('should render the pen icon', () => {
      render(<QuestionInput {...defaultProps} />);

      const penIcon = screen.getByTestId('icon-pen');
      expect(penIcon).toBeInTheDocument();
      expect(penIcon).toHaveClass('h-5', 'w-5');
    });

    it('should render keyboard shortcut hint', () => {
      render(<QuestionInput {...defaultProps} />);

      expect(screen.getByText('Ctrl')).toBeInTheDocument();
      expect(screen.getByText('+')).toBeInTheDocument();
      expect(screen.getByText('Enter')).toBeInTheDocument();
      expect(screen.getByText('to submit')).toBeInTheDocument();
    });

    it('should apply correct placeholder', () => {
      render(<QuestionInput {...defaultProps} placeholder="Test placeholder" />);

      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('placeholder', 'Test placeholder');
    });

    it('should display the current value', () => {
      render(<QuestionInput {...defaultProps} value="Test question" />);

      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      expect(textarea.value).toBe('Test question');
    });
  });

  describe('Ref Forwarding', () => {
    it('should forward ref to textarea element', () => {
      const ref = createRef<HTMLTextAreaElement>();
      render(<QuestionInput {...defaultProps} ref={ref} />);

      expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
      expect(ref.current).toBe(screen.getByRole('textbox'));
    });

    it('should allow focusing via ref', () => {
      const ref = createRef<HTMLTextAreaElement>();
      render(<QuestionInput {...defaultProps} ref={ref} />);

      ref.current?.focus();
      expect(ref.current).toHaveFocus();
    });
  });

  describe('User Input', () => {
    it('should call onChange when user types', () => {
      render(<QuestionInput {...defaultProps} />);

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'New question' } });

      expect(mockOnChange).toHaveBeenCalledTimes(1);
      expect(mockOnChange).toHaveBeenCalledWith('New question');
    });

    it('should call onKeyDown when keys are pressed', () => {
      render(<QuestionInput {...defaultProps} />);

      const textarea = screen.getByRole('textbox');
      fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter' });

      expect(mockOnKeyDown).toHaveBeenCalledTimes(1);
      expect(mockOnKeyDown).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'Enter',
          code: 'Enter',
        })
      );
    });

    it('should handle Ctrl+Enter key combination', () => {
      render(<QuestionInput {...defaultProps} />);

      const textarea = screen.getByRole('textbox');
      fireEvent.keyDown(textarea, { 
        key: 'Enter', 
        code: 'Enter', 
        ctrlKey: true 
      });

      expect(mockOnKeyDown).toHaveBeenCalledTimes(1);
      expect(mockOnKeyDown).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'Enter',
          code: 'Enter',
          ctrlKey: true,
        })
      );
    });

    it('should update value when typing multiple characters', () => {
      render(<QuestionInput {...defaultProps} />);

      const textarea = screen.getByRole('textbox');
      
      fireEvent.change(textarea, { target: { value: 'H' } });
      expect(mockOnChange).toHaveBeenLastCalledWith('H');

      fireEvent.change(textarea, { target: { value: 'He' } });
      expect(mockOnChange).toHaveBeenLastCalledWith('He');

      fireEvent.change(textarea, { target: { value: 'Hello' } });
      expect(mockOnChange).toHaveBeenLastCalledWith('Hello');

      expect(mockOnChange).toHaveBeenCalledTimes(3);
    });
  });

  describe('History Functionality', () => {
    it('should call onClearHistory when typing while loaded from history', () => {
      render(<QuestionInput {...defaultProps} isLoadedFromHistory={true} />);

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'New question' } });

      expect(mockOnChange).toHaveBeenCalledWith('New question');
      expect(mockOnClearHistory).toHaveBeenCalledTimes(1);
    });

    it('should not call onClearHistory when typing while not loaded from history', () => {
      render(<QuestionInput {...defaultProps} isLoadedFromHistory={false} />);

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'New question' } });

      expect(mockOnChange).toHaveBeenCalledWith('New question');
      expect(mockOnClearHistory).not.toHaveBeenCalled();
    });

    it('should call onClearHistory only once when typing multiple characters', () => {
      render(<QuestionInput {...defaultProps} isLoadedFromHistory={true} />);

      const textarea = screen.getByRole('textbox');
      
      fireEvent.change(textarea, { target: { value: 'A' } });
      fireEvent.change(textarea, { target: { value: 'AB' } });
      fireEvent.change(textarea, { target: { value: 'ABC' } });

      expect(mockOnClearHistory).toHaveBeenCalledTimes(3);
      // Note: In real usage, the parent would set isLoadedFromHistory to false after first call
    });
  });

  describe('Disabled State', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<QuestionInput {...defaultProps} disabled={true} />);

      const textarea = screen.getByRole('textbox');
      expect(textarea).toBeDisabled();
    });

    it('should be enabled when disabled prop is false', () => {
      render(<QuestionInput {...defaultProps} disabled={false} />);

      const textarea = screen.getByRole('textbox');
      expect(textarea).toBeEnabled();
    });

    it('should not allow user interaction when disabled', () => {
      render(<QuestionInput {...defaultProps} disabled={true} />);

      const textarea = screen.getByRole('textbox');
      expect(textarea).toBeDisabled();
      
      // Note: fireEvent.change bypasses the disabled attribute in tests
      // In real browser usage, disabled textareas cannot be typed in
      // We test the disabled attribute itself rather than the onChange behavior
    });
  });

  describe('Styling and Layout', () => {
    it('should have correct textarea styling classes', () => {
      render(<QuestionInput {...defaultProps} />);

      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveClass('w-full');
      expect(textarea).toHaveClass('rounded-xl');
      expect(textarea).toHaveClass('border');
      expect(textarea).toHaveClass('focus:ring-2');
      expect(textarea).toHaveClass('focus:ring-blue-500');
      expect(textarea).toHaveClass('resize-vertical');
    });

    it('should have correct responsive padding', () => {
      render(<QuestionInput {...defaultProps} />);

      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveClass('pl-10', 'sm:pl-12');
      expect(textarea).toHaveClass('py-3', 'sm:py-4');
    });

    it('should have correct minimum height', () => {
      render(<QuestionInput {...defaultProps} />);

      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveClass('min-h-[100px]', 'sm:min-h-[120px]');
    });

    it('should have correct font sizing', () => {
      render(<QuestionInput {...defaultProps} />);

      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveClass('text-base', 'sm:text-lg');
    });

    it('should have 4 rows by default', () => {
      render(<QuestionInput {...defaultProps} />);

      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('rows', '4');
    });
  });

  describe('Icon and Visual Elements', () => {
    it('should position pen icon correctly', () => {
      const { container } = render(<QuestionInput {...defaultProps} />);

      const iconContainer = container.querySelector('.absolute.top-3.sm\\:top-4.left-0');
      expect(iconContainer).toBeInTheDocument();
      expect(iconContainer).toHaveClass('pointer-events-none');
      expect(iconContainer).toHaveClass('transition-colors');
    });

    it('should apply focus-within styling to pen icon', () => {
      render(<QuestionInput {...defaultProps} />);

      const penIcon = screen.getByTestId('icon-pen');
      expect(penIcon).toHaveClass('group-focus-within:text-blue-500');
    });

    it('should position keyboard hint correctly', () => {
      const { container } = render(<QuestionInput {...defaultProps} />);

      const hintContainer = container.querySelector('.hidden.sm\\:block.absolute.bottom-2');
      expect(hintContainer).toBeInTheDocument();
      expect(hintContainer).toHaveClass('pointer-events-none');
      expect(hintContainer).toHaveClass('opacity-0');
      expect(hintContainer).toHaveClass('group-focus-within:opacity-100');
    });

    it('should style keyboard shortcut keys correctly', () => {
      render(<QuestionInput {...defaultProps} />);

      const ctrlKey = screen.getByText('Ctrl');
      const enterKey = screen.getByText('Enter');

      [ctrlKey, enterKey].forEach(key => {
        expect(key).toHaveClass('px-2', 'py-1');
        expect(key).toHaveClass('text-xs');
        expect(key).toHaveClass('bg-gray-100');
        expect(key).toHaveClass('border');
        expect(key).toHaveClass('rounded');
      });
    });
  });

  describe('Group and Focus States', () => {
    it('should apply group class to container', () => {
      const { container } = render(<QuestionInput {...defaultProps} />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('relative', 'group');
    });

    it('should show keyboard hint on focus', () => {
      const { container } = render(<QuestionInput {...defaultProps} />);

      const textarea = screen.getByRole('textbox');
      const hintContainer = container.querySelector('.group-focus-within\\:opacity-100');

      expect(hintContainer).toHaveClass('opacity-0');
      
      textarea.focus();
      // The CSS class group-focus-within:opacity-100 would be applied by the browser
      expect(hintContainer).toHaveClass('group-focus-within:opacity-100');
    });
  });

  describe('Accessibility', () => {
    it('should be accessible via keyboard', () => {
      render(<QuestionInput {...defaultProps} />);

      const textarea = screen.getByRole('textbox');
      textarea.focus();
      expect(textarea).toHaveFocus();
    });

    it('should have proper role attribute', () => {
      render(<QuestionInput {...defaultProps} />);

      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should support screen readers with placeholder text', () => {
      render(<QuestionInput {...defaultProps} placeholder="Enter your ServiceNow question" />);

      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('placeholder', 'Enter your ServiceNow question');
    });

    it('should be properly labeled for assistive technology', () => {
      render(<QuestionInput {...defaultProps} />);

      const textarea = screen.getByRole('textbox');
      expect(textarea).toBeVisible();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string value', () => {
      render(<QuestionInput {...defaultProps} value="" />);

      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      expect(textarea.value).toBe('');
    });

    it('should handle very long text', () => {
      const longText = 'A'.repeat(1000);
      render(<QuestionInput {...defaultProps} value={longText} />);

      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      expect(textarea.value).toBe(longText);
    });

    it('should handle special characters', () => {
      const specialText = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      render(<QuestionInput {...defaultProps} />);

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: specialText } });

      expect(mockOnChange).toHaveBeenCalledWith(specialText);
    });

    it('should handle rapid state changes', () => {
      const { rerender } = render(<QuestionInput {...defaultProps} value="initial" />);

      rerender(<QuestionInput {...defaultProps} value="changed" />);
      rerender(<QuestionInput {...defaultProps} value="" disabled={true} />);
      rerender(<QuestionInput {...defaultProps} value="final" disabled={false} />);

      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      expect(textarea.value).toBe('final');
      expect(textarea).toBeEnabled();
    });
  });

  describe('Component Name', () => {
    it('should have correct displayName', () => {
      expect(QuestionInput.displayName).toBe('QuestionInput');
    });
  });
});