import { render, screen, fireEvent } from '@testing-library/react';
import ToggleControls from '@/components/ToggleControls';

describe('ToggleControls', () => {
  const mockOnContinueModeChange = jest.fn();
  const mockOnSearchModeChange = jest.fn();

  const defaultProps = {
    continueMode: false,
    onContinueModeChange: mockOnContinueModeChange,
    searchMode: false,
    onSearchModeChange: mockOnSearchModeChange,
    disabled: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render all two toggle controls', () => {
      render(<ToggleControls {...defaultProps} />);

      expect(screen.getByRole('button', { name: /continue session/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
    });

    it('should render correct titles for each toggle', () => {
      render(<ToggleControls {...defaultProps} />);

      expect(screen.getByTitle(/continue session maintains context between multiple questions/i)).toBeInTheDocument();
      expect(screen.getByTitle(/search mode enables web searches/i)).toBeInTheDocument();
    });

    it('should render with correct grid layout classes', () => {
      const { container } = render(<ToggleControls {...defaultProps} />);

      const gridContainer = container.firstChild as HTMLElement;
      expect(gridContainer).toHaveClass('grid');
      expect(gridContainer).toHaveClass('grid-cols-1');
      expect(gridContainer).toHaveClass('sm:grid-cols-2');
      expect(gridContainer).toHaveClass('gap-3');
      expect(gridContainer).toHaveClass('sm:gap-4');
    });
  });

  describe('Toggle States', () => {
    it('should show correct visual state when toggles are off', () => {
      render(<ToggleControls {...defaultProps} />);

      const continueToggle = screen.getByRole('button', { name: /continue session/i });
      const searchToggle = screen.getByRole('button', { name: /search/i });

      // Check that toggle switches show "off" state (gray background)
      expect(continueToggle.querySelector('.bg-gray-300')).toBeInTheDocument();
      expect(searchToggle.querySelector('.bg-gray-300')).toBeInTheDocument();

      // Check that the switch circles are in the left position
      expect(continueToggle.querySelector('.translate-x-1')).toBeInTheDocument();
      expect(searchToggle.querySelector('.translate-x-1')).toBeInTheDocument();
    });

    it('should show correct visual state when toggles are on', () => {
      render(<ToggleControls 
        {...defaultProps} 
        continueMode={true}
        searchMode={true}
      />);

      const continueToggle = screen.getByRole('button', { name: /continue session/i });
      const searchToggle = screen.getByRole('button', { name: /search/i });

      // Check that toggle switches show "on" state with colored backgrounds
      expect(continueToggle.querySelector('.bg-green-500')).toBeInTheDocument();
      expect(searchToggle.querySelector('.bg-blue-500')).toBeInTheDocument();

      // Check that the switch circles are in the right position
      expect(continueToggle.querySelector('.translate-x-6')).toBeInTheDocument();
      expect(searchToggle.querySelector('.translate-x-6')).toBeInTheDocument();
    });

    it('should apply correct color classes for each toggle type when active', () => {
      render(<ToggleControls 
        {...defaultProps} 
        continueMode={true}
        searchMode={true}
      />);

      const continueToggle = screen.getByRole('button', { name: /continue session/i });
      const searchToggle = screen.getByRole('button', { name: /search/i });

      // Check that toggle switches show "on" state with colored backgrounds
      expect(continueToggle.querySelector('.bg-green-500')).toBeInTheDocument();
      expect(searchToggle.querySelector('.bg-blue-500')).toBeInTheDocument();

      // Check that the text spans have the correct active color classes
      // The text span is the one with the label text (second span in the button)
      const continueText = continueToggle.querySelector('span.font-medium');
      const searchText = searchToggle.querySelector('span.font-medium');

      expect(continueText).toHaveClass('text-green-700');
      expect(searchText).toHaveClass('text-blue-700');
    });
  });

  describe('User Interactions', () => {

    it('should call onContinueModeChange when Continue Session toggle is clicked', () => {
      render(<ToggleControls {...defaultProps} continueMode={false} />);

      const continueToggle = screen.getByRole('button', { name: /continue session/i });
      fireEvent.click(continueToggle);

      expect(mockOnContinueModeChange).toHaveBeenCalledTimes(1);
      expect(mockOnContinueModeChange).toHaveBeenCalledWith(true);
    });

    it('should call onSearchModeChange when Search toggle is clicked', () => {
      render(<ToggleControls {...defaultProps} searchMode={false} />);

      const searchToggle = screen.getByRole('button', { name: /search/i });
      fireEvent.click(searchToggle);

      expect(mockOnSearchModeChange).toHaveBeenCalledTimes(1);
      expect(mockOnSearchModeChange).toHaveBeenCalledWith(true);
    });


    it('should handle multiple toggles being clicked', () => {
      render(<ToggleControls {...defaultProps} />);

      const continueToggle = screen.getByRole('button', { name: /continue session/i });
      const searchToggle = screen.getByRole('button', { name: /search/i });

      fireEvent.click(continueToggle);
      fireEvent.click(searchToggle);

      expect(mockOnContinueModeChange).toHaveBeenCalledWith(true);
      expect(mockOnSearchModeChange).toHaveBeenCalledWith(true);

      expect(mockOnContinueModeChange).toHaveBeenCalledTimes(1);
      expect(mockOnSearchModeChange).toHaveBeenCalledTimes(1);
    });
  });

  describe('Disabled State', () => {
    it('should disable all toggles when disabled prop is true', () => {
      render(<ToggleControls {...defaultProps} disabled={true} />);

      const continueToggle = screen.getByRole('button', { name: /continue session/i });
      const searchToggle = screen.getByRole('button', { name: /search/i });

      expect(continueToggle).toBeDisabled();
      expect(searchToggle).toBeDisabled();
    });

    it('should apply disabled styling when disabled', () => {
      render(<ToggleControls {...defaultProps} disabled={true} />);

      const toggles = screen.getAllByRole('button');
      toggles.forEach(toggle => {
        expect(toggle).toHaveClass('opacity-60');
        expect(toggle).toHaveClass('cursor-not-allowed');
        expect(toggle).toHaveClass('scale-95');
      });
    });

    it('should not call change handlers when disabled toggles are clicked', () => {
      render(<ToggleControls {...defaultProps} disabled={true} />);

      const continueToggle = screen.getByRole('button', { name: /continue session/i });
      const searchToggle = screen.getByRole('button', { name: /search/i });

      fireEvent.click(continueToggle);
      fireEvent.click(searchToggle);

      expect(mockOnContinueModeChange).not.toHaveBeenCalled();
      expect(mockOnSearchModeChange).not.toHaveBeenCalled();
    });

    it('should apply hover styles when not disabled', () => {
      render(<ToggleControls {...defaultProps} disabled={false} />);

      const toggles = screen.getAllByRole('button');
      toggles.forEach(toggle => {
        expect(toggle).toHaveClass('hover:bg-gray-50');
        expect(toggle).toHaveClass('hover:shadow-md');
        expect(toggle).toHaveClass('hover:scale-102');
        expect(toggle).toHaveClass('hover:-translate-y-0.5');
      });
    });
  });

  describe('Animation and Styling', () => {
    it('should have correct transition classes for smooth animations', () => {
      render(<ToggleControls {...defaultProps} />);

      const toggles = screen.getAllByRole('button');
      toggles.forEach(toggle => {
        expect(toggle).toHaveClass('transition-all');
        expect(toggle).toHaveClass('duration-200');
      });

      // Check toggle switch background animations
      const toggleSwitches = document.querySelectorAll('.inline-flex');
      toggleSwitches.forEach(toggleSwitch => {
        expect(toggleSwitch).toHaveClass('transition-colors');
        expect(toggleSwitch).toHaveClass('duration-200');
      });

      // Check toggle circle animations
      const toggleCircles = document.querySelectorAll('.inline-block');
      toggleCircles.forEach(toggleCircle => {
        expect(toggleCircle).toHaveClass('transition-transform');
        expect(toggleCircle).toHaveClass('duration-200');
      });
    });

    it('should have proper button structure and styling', () => {
      render(<ToggleControls {...defaultProps} />);

      const toggles = screen.getAllByRole('button');
      toggles.forEach(toggle => {
        expect(toggle).toHaveAttribute('type', 'button');
        expect(toggle).toHaveClass('flex', 'items-center');
        expect(toggle).toHaveClass('rounded-xl');
        expect(toggle).toHaveClass('border-2');
        expect(toggle).toHaveClass('shadow-sm');
        expect(toggle).toHaveClass('w-full');
      });
    });

    it('should have correct responsive padding classes', () => {
      render(<ToggleControls {...defaultProps} />);

      const toggles = screen.getAllByRole('button');
      toggles.forEach(toggle => {
        expect(toggle).toHaveClass('px-4', 'py-2');
        expect(toggle).toHaveClass('sm:px-6', 'sm:py-3');
      });
    });
  });

  describe('Toggle Switch Visual Elements', () => {
    it('should render toggle switch with correct dimensions', () => {
      render(<ToggleControls {...defaultProps} />);

      const toggleSwitches = document.querySelectorAll('.h-6.w-11');
      expect(toggleSwitches).toHaveLength(2);

      toggleSwitches.forEach(toggleSwitch => {
        expect(toggleSwitch).toHaveClass('h-6', 'w-11');
        expect(toggleSwitch).toHaveClass('rounded-full');
        expect(toggleSwitch).toHaveClass('items-center');
      });
    });

    it('should render toggle circles with correct dimensions', () => {
      render(<ToggleControls {...defaultProps} />);

      const toggleCircles = document.querySelectorAll('.h-4.w-4');
      expect(toggleCircles).toHaveLength(2);

      toggleCircles.forEach(toggleCircle => {
        expect(toggleCircle).toHaveClass('h-4', 'w-4');
        expect(toggleCircle).toHaveClass('rounded-full');
        expect(toggleCircle).toHaveClass('bg-white');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper button semantics', () => {
      render(<ToggleControls {...defaultProps} />);

      const toggles = screen.getAllByRole('button');
      expect(toggles).toHaveLength(2);

      toggles.forEach(toggle => {
        expect(toggle).toBeVisible();
        expect(toggle).toHaveAttribute('type', 'button');
      });
    });

    it('should be keyboard accessible', () => {
      render(<ToggleControls {...defaultProps} />);

      const continueToggle = screen.getByRole('button', { name: /continue session/i });
      
      continueToggle.focus();
      expect(continueToggle).toHaveFocus();

      // Simulate Enter key press (browsers handle this automatically for buttons)
      fireEvent.keyDown(continueToggle, { key: 'Enter', code: 'Enter' });
      // The click event would be triggered by the browser
    });

    it('should provide meaningful titles for screen readers', () => {
      render(<ToggleControls {...defaultProps} />);

      expect(screen.getByTitle(/continue session maintains context/i)).toBeInTheDocument();
      expect(screen.getByTitle(/search mode enables web searches/i)).toBeInTheDocument();
    });
  });

  describe('Color Variations', () => {
    it('should apply correct hover colors for each toggle type', () => {
      render(<ToggleControls {...defaultProps} />);

      const continueToggle = screen.getByRole('button', { name: /continue session/i });
      const searchToggle = screen.getByRole('button', { name: /search/i });

      expect(continueToggle).toHaveClass('hover:border-green-300');
      expect(searchToggle).toHaveClass('hover:border-blue-300');
    });

    it('should show correct text colors when toggles are off', () => {
      render(<ToggleControls {...defaultProps} />);

      const toggles = screen.getAllByRole('button');
      toggles.forEach(toggle => {
        expect(toggle).toHaveClass('text-gray-700');
      });
    });
  });
});