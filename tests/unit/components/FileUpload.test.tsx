import { render, screen } from '@testing-library/react';
import FileUpload from '@/components/FileUpload';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Paperclip: ({ className }: { className?: string }) => 
    <div data-testid="icon-paperclip" className={className}>Paperclip</div>,
  X: ({ className }: { className?: string }) => 
    <div data-testid="icon-x" className={className}>X</div>,
  FileText: ({ className }: { className?: string }) => 
    <div data-testid="icon-file-text" className={className}>FileText</div>,
  Image: ({ className }: { className?: string }) => 
    <div data-testid="icon-image" className={className}>Image</div>,
  Headphones: ({ className }: { className?: string }) => 
    <div data-testid="icon-headphones" className={className}>Headphones</div>,
  AlertCircle: ({ className }: { className?: string }) => 
    <div data-testid="icon-alert-circle" className={className}>AlertCircle</div>,
}));

describe('FileUpload', () => {
  const mockOnFileSelect = jest.fn();

  const mockCapabilities = [
    {
      id: 1,
      name: 'vision',
      display_name: 'Vision',
      description: 'Image processing capabilities',
      created_at: new Date(),
    },
    {
      id: 2,
      name: 'document_vision',
      display_name: 'Document Vision',
      description: 'Document processing capabilities',
      created_at: new Date(),
    },
  ];

  const defaultProps = {
    onFileSelect: mockOnFileSelect,
    capabilities: mockCapabilities,
    disabled: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render file upload component', () => {
      render(<FileUpload {...defaultProps} />);
      
      expect(screen.getByTestId('icon-paperclip')).toBeInTheDocument();
    });

    it('should render with empty capabilities', () => {
      const { container } = render(<FileUpload {...defaultProps} capabilities={[]} />);
      
      // Component should return null with empty capabilities
      expect(container.firstChild).toBeNull();
    });

    it('should handle disabled state', () => {
      render(<FileUpload {...defaultProps} disabled={true} />);
      
      expect(screen.getByTestId('icon-paperclip')).toBeInTheDocument();
    });

    it('should render with multiple capabilities', () => {
      render(<FileUpload {...defaultProps} />);
      
      // Component should render with provided capabilities
      expect(screen.getByTestId('icon-paperclip')).toBeInTheDocument();
    });
  });

  describe('Component Interface', () => {
    it('should accept onFileSelect prop', () => {
      const customCallback = jest.fn();
      render(<FileUpload {...defaultProps} onFileSelect={customCallback} />);
      
      expect(screen.getByTestId('icon-paperclip')).toBeInTheDocument();
    });

    it('should handle vision capability', () => {
      const visionCapabilities = [
        {
          id: 1,
          name: 'vision',
          display_name: 'Vision',
          description: 'Image processing',
          created_at: new Date(),
        },
      ];

      render(<FileUpload {...defaultProps} capabilities={visionCapabilities} />);
      
      expect(screen.getByTestId('icon-paperclip')).toBeInTheDocument();
    });

    it('should handle document_vision capability', () => {
      const docCapabilities = [
        {
          id: 1,
          name: 'document_vision',
          display_name: 'Document Vision',
          description: 'Document processing',
          created_at: new Date(),
        },
      ];

      render(<FileUpload {...defaultProps} capabilities={docCapabilities} />);
      
      expect(screen.getByTestId('icon-paperclip')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle component render without errors', () => {
      expect(() => {
        render(<FileUpload {...defaultProps} />);
      }).not.toThrow();
    });

    it('should handle null capabilities gracefully', () => {
      expect(() => {
        render(<FileUpload {...defaultProps} capabilities={[]} />);
      }).not.toThrow();
    });
  });
});