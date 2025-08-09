import { render, screen } from '@testing-library/react';
import ProcessingOverlay from '@/components/ProcessingOverlay';
import { StreamingStatus } from '@/types';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Bot: ({ className }: { className: string }) => 
    <div data-testid="icon-bot" className={className}>Bot</div>,
}));

describe('ProcessingOverlay', () => {
  describe('Visibility', () => {
    it('should render overlay when isVisible is true', () => {
      render(<ProcessingOverlay isVisible={true} />);

      // Check for main overlay container
      const overlay = document.querySelector('.absolute.inset-0.z-10');
      expect(overlay).toBeInTheDocument();
    });

    it('should not render anything when isVisible is false', () => {
      const { container } = render(<ProcessingOverlay isVisible={false} />);

      expect(container.firstChild).toBeNull();
    });

    it('should show processing text when visible', () => {
      render(<ProcessingOverlay isVisible={true} />);

      expect(screen.getByText('Processing Request')).toBeInTheDocument();
      expect(screen.getByText('Working on your question')).toBeInTheDocument();
    });

    it('should hide processing text when not visible', () => {
      render(<ProcessingOverlay isVisible={false} />);

      expect(screen.queryByText('Processing Request')).not.toBeInTheDocument();
      expect(screen.queryByText('Working on your question')).not.toBeInTheDocument();
    });

    it('should show streaming status text when streaming', () => {
      render(<ProcessingOverlay isVisible={true} isStreaming={true} streamingStatus={StreamingStatus.CONNECTING} />);

      expect(screen.getByText('Establishing Connection')).toBeInTheDocument();
      expect(screen.getByText('Connecting to AI service')).toBeInTheDocument();
    });

    it('should show correct status for streaming', () => {
      render(<ProcessingOverlay isVisible={true} isStreaming={true} streamingStatus={StreamingStatus.STREAMING} />);

      expect(screen.getByText('Streaming Response')).toBeInTheDocument();
      expect(screen.getByText('AI is responding')).toBeInTheDocument();
    });

    it('should show default processing message when not streaming', () => {
      render(<ProcessingOverlay isVisible={true} isStreaming={false} />);

      expect(screen.getByText('Working on your question')).toBeInTheDocument();
    });
  });

  describe('Visual Elements', () => {
    beforeEach(() => {
      render(<ProcessingOverlay isVisible={true} />);
    });

    it('should render the bot icon', () => {
      const botIcon = screen.getByTestId('icon-bot');
      expect(botIcon).toBeInTheDocument();
      expect(botIcon).toHaveClass('w-8', 'h-8', 'text-white');
    });

    it('should render the main processing indicator container', () => {
      const indicator = document.querySelector('.bg-white\\/95');
      expect(indicator).toBeInTheDocument();
      expect(indicator).toHaveClass('rounded-2xl');
      expect(indicator).toHaveClass('shadow-2xl');
      expect(indicator).toHaveClass('p-8');
      expect(indicator).toHaveClass('max-w-sm');
    });

    it('should render the backdrop blur overlay', () => {
      const backdrop = document.querySelector('.backdrop-blur-md');
      expect(backdrop).toBeInTheDocument();
      expect(backdrop).toHaveClass('absolute', 'inset-0');
      expect(backdrop).toHaveClass('bg-gradient-to-br');
      expect(backdrop).toHaveClass('rounded-3xl');
    });

    it('should render activity indicators', () => {
      // Green ping indicator
      const greenIndicator = document.querySelector('.bg-green-400.animate-ping');
      expect(greenIndicator).toBeInTheDocument();
      expect(greenIndicator).toHaveClass('w-4', 'h-4');
      expect(greenIndicator).toHaveClass('rounded-full');
      expect(greenIndicator).toHaveClass('opacity-75');

      // Blue pulse indicator
      const blueIndicator = document.querySelector('.bg-blue-400.animate-pulse');
      expect(blueIndicator).toBeInTheDocument();
      expect(blueIndicator).toHaveClass('w-3', 'h-3');
      expect(blueIndicator).toHaveClass('rounded-full');
      expect(blueIndicator).toHaveClass('opacity-60');
    });

    it('should render animated dots', () => {
      const dots = document.querySelectorAll('.w-1.h-1.bg-blue-500.rounded-full.animate-bounce');
      expect(dots).toHaveLength(3);

      // Check animation delays
      expect(dots[0]).toHaveStyle({ animationDelay: '0ms' });
      expect(dots[1]).toHaveStyle({ animationDelay: '150ms' });
      expect(dots[2]).toHaveStyle({ animationDelay: '300ms' });
    });

    it('should render progress wave animation', () => {
      const progressContainer = document.querySelector('.relative.h-1.bg-gray-200');
      expect(progressContainer).toBeInTheDocument();
      expect(progressContainer).toHaveClass('rounded-full', 'overflow-hidden');

      const progressBar = document.querySelector('.bg-gradient-to-r.from-blue-500.via-indigo-500.to-purple-500');
      expect(progressBar).toBeInTheDocument();
      expect(progressBar).toHaveClass('animate-pulse');

      const progressWave = document.querySelector('.animate-slide-right');
      expect(progressWave).toBeInTheDocument();
      expect(progressWave).toHaveClass('w-1/3');
      expect(progressWave).toHaveClass('-skew-x-12');
    });
  });

  describe('Layout and Positioning', () => {
    beforeEach(() => {
      render(<ProcessingOverlay isVisible={true} />);
    });

    it('should have correct overlay positioning', () => {
      const mainOverlay = document.querySelector('.absolute.inset-0.z-10');
      expect(mainOverlay).toHaveClass('rounded-3xl');
    });

    it('should center the processing indicator', () => {
      const centerContainer = document.querySelector('.absolute.inset-0.flex.items-center.justify-center');
      expect(centerContainer).toBeInTheDocument();
    });

    it('should position activity indicators correctly', () => {
      const topRightIndicator = document.querySelector('.absolute.-top-1.-right-1');
      expect(topRightIndicator).toBeInTheDocument();

      const bottomLeftIndicator = document.querySelector('.absolute.-bottom-1.-left-1');
      expect(bottomLeftIndicator).toBeInTheDocument();
    });

    it('should have correct z-index stacking', () => {
      const mainOverlay = document.querySelector('.absolute.inset-0.z-10');
      expect(mainOverlay).toBeInTheDocument();
    });
  });

  describe('Typography and Text Styling', () => {
    beforeEach(() => {
      render(<ProcessingOverlay isVisible={true} />);
    });

    it('should style the main heading correctly', () => {
      const heading = screen.getByText('Processing Request');
      expect(heading.tagName).toBe('H3');
      expect(heading).toHaveClass('text-lg');
      expect(heading).toHaveClass('font-semibold');
      expect(heading).toHaveClass('bg-gradient-to-r');
      expect(heading).toHaveClass('bg-clip-text');
      expect(heading).toHaveClass('text-transparent');
      expect(heading).toHaveClass('mb-2');
    });

    it('should style the description text correctly', () => {
      const description = screen.getByText('Working on your question');
      expect(description).toHaveClass('text-sm');
    });

    it('should apply text center alignment', () => {
      const textContainer = document.querySelector('.text-center.space-y-6');
      expect(textContainer).toBeInTheDocument();
    });
  });

  describe('Animation Classes', () => {
    beforeEach(() => {
      render(<ProcessingOverlay isVisible={true} />);
    });

    it('should have fade-in animation on main overlay', () => {
      const mainOverlay = document.querySelector('.animate-in.fade-in-0.duration-500');
      expect(mainOverlay).toBeInTheDocument();
    });

    it('should have slide-in animation on processing indicator', () => {
      const indicator = document.querySelector('.animate-in.slide-in-from-bottom-4.duration-700');
      expect(indicator).toBeInTheDocument();
    });

    it('should have breathing animation on bot icon container', () => {
      const botContainer = document.querySelector('.animate-breathing');
      expect(botContainer).toBeInTheDocument();
      expect(botContainer).toHaveClass('w-16', 'h-16');
      expect(botContainer).toHaveClass('bg-gradient-to-br');
      expect(botContainer).toHaveClass('from-blue-500', 'to-indigo-600');
    });

    it('should have correct animation classes on indicators', () => {
      const pingIndicator = document.querySelector('.animate-ping');
      expect(pingIndicator).toBeInTheDocument();

      const pulseIndicator = document.querySelector('.animate-pulse');
      expect(pulseIndicator).toBeInTheDocument();

      const bounceIndicators = document.querySelectorAll('.animate-bounce');
      expect(bounceIndicators.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Responsive Design', () => {
    beforeEach(() => {
      render(<ProcessingOverlay isVisible={true} />);
    });

    it('should have responsive margin classes', () => {
      const indicator = document.querySelector('.mx-4');
      expect(indicator).toBeInTheDocument();
    });

    it('should have max-width constraint', () => {
      const indicator = document.querySelector('.max-w-sm');
      expect(indicator).toBeInTheDocument();
    });
  });

  describe('Dark Mode Support', () => {
    beforeEach(() => {
      render(<ProcessingOverlay isVisible={true} />);
    });

    it('should have dark mode classes for backdrop', () => {
      const backdrop = document.querySelector('.backdrop-blur-md');
      expect(backdrop).toHaveClass('dark:from-gray-900/80');
      expect(backdrop).toHaveClass('dark:via-blue-900/70');
      expect(backdrop).toHaveClass('dark:to-indigo-900/70');
    });

    it('should have dark mode classes for indicator background', () => {
      const indicator = document.querySelector('.bg-white\\/95');
      expect(indicator).toHaveClass('dark:bg-gray-800/95');
    });

    it('should have dark mode classes for border', () => {
      const indicator = document.querySelector('.border-white\\/30');
      expect(indicator).toHaveClass('dark:border-gray-700/50');
    });

    it('should have dark mode classes for text', () => {
      const textContainer = document.querySelector('.text-gray-600');
      expect(textContainer).toHaveClass('dark:text-gray-400');
    });

    it('should have dark mode classes for progress bar', () => {
      const progressContainer = document.querySelector('.bg-gray-200');
      expect(progressContainer).toHaveClass('dark:bg-gray-700');
    });

    it('should have dark mode classes for heading gradient', () => {
      const heading = screen.getByText('Processing Request');
      expect(heading).toHaveClass('dark:from-blue-400');
      expect(heading).toHaveClass('dark:via-indigo-400');
      expect(heading).toHaveClass('dark:to-purple-400');
    });
  });

  describe('Component Structure', () => {
    it('should maintain proper component hierarchy when visible', () => {
      const { container } = render(<ProcessingOverlay isVisible={true} />);

      // Main overlay container
      const mainOverlay = container.querySelector('.absolute.inset-0.z-10');
      expect(mainOverlay).toBeInTheDocument();

      // Backdrop
      const backdrop = mainOverlay?.querySelector('.absolute.inset-0.backdrop-blur-md');
      expect(backdrop).toBeInTheDocument();

      // Center container
      const centerContainer = mainOverlay?.querySelector('.absolute.inset-0.flex.items-center.justify-center');
      expect(centerContainer).toBeInTheDocument();

      // Processing indicator
      const indicator = centerContainer?.querySelector('.bg-white\\/95');
      expect(indicator).toBeInTheDocument();

      // Content container
      const content = indicator?.querySelector('.text-center.space-y-6');
      expect(content).toBeInTheDocument();
    });

    it('should return null when not visible', () => {
      const { container } = render(<ProcessingOverlay isVisible={false} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Streaming Status Integration', () => {
    it('should handle all streaming statuses correctly', () => {
      const { rerender } = render(<ProcessingOverlay isVisible={true} isStreaming={true} streamingStatus={StreamingStatus.CONNECTING} />);
      expect(screen.getByText('Establishing Connection')).toBeInTheDocument();
      expect(screen.getByText('Connecting to AI service')).toBeInTheDocument();

      rerender(<ProcessingOverlay isVisible={true} isStreaming={true} streamingStatus={StreamingStatus.STREAMING} />);
      expect(screen.getByText('Streaming Response')).toBeInTheDocument();
      expect(screen.getByText('AI is responding')).toBeInTheDocument();

      rerender(<ProcessingOverlay isVisible={true} isStreaming={true} streamingStatus={StreamingStatus.COMPLETE} />);
      expect(screen.getByText('Processing Request')).toBeInTheDocument();
      expect(screen.getByText('Processing your request')).toBeInTheDocument();
    });

    it('should handle streaming prop changes', () => {
      const { rerender } = render(<ProcessingOverlay isVisible={true} isStreaming={false} />);
      expect(screen.getByText('Processing Request')).toBeInTheDocument();
      expect(screen.getByText('Working on your question')).toBeInTheDocument();

      rerender(<ProcessingOverlay isVisible={true} isStreaming={true} streamingStatus={StreamingStatus.STREAMING} />);
      expect(screen.getByText('Streaming Response')).toBeInTheDocument();
      expect(screen.getByText('AI is responding')).toBeInTheDocument();
    });

    it('should default to connecting status when streaming', () => {
      render(<ProcessingOverlay isVisible={true} isStreaming={true} />);
      expect(screen.getByText('Establishing Connection')).toBeInTheDocument();
      expect(screen.getByText('Connecting to AI service')).toBeInTheDocument();
    });

    it('should ignore streaming status when not streaming', () => {
      render(<ProcessingOverlay isVisible={true} isStreaming={false} streamingStatus={StreamingStatus.STREAMING} />);
      expect(screen.getByText('Processing Request')).toBeInTheDocument();
      expect(screen.getByText('Working on your question')).toBeInTheDocument();
      expect(screen.queryByText('AI is responding')).not.toBeInTheDocument();
    });
  });
});