import { render, screen } from '@testing-library/react';
import SearchInterface from '@/components/SearchInterface';
import { submitQuestionStreaming, cancelRequest } from '@/lib/api';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AIModelProvider } from '@/contexts/AIModelContext';

// Mock the API functions
jest.mock('@/lib/api', () => ({
  submitQuestionStreaming: jest.fn(),
  cancelRequest: jest.fn(),
}));

// Mock BurgerMenu component
jest.mock('@/components/BurgerMenu', () => {
  return function MockBurgerMenu() {
    return <div data-testid="burger-menu">Burger Menu</div>;
  };
});

// Mock ReactMarkdown and related modules
jest.mock('react-markdown', () => {
  return function MockReactMarkdown({ children }: { children: string }) {
    return <div data-testid="markdown-content">{children}</div>;
  };
});

jest.mock('remark-gfm', () => jest.fn());
jest.mock('rehype-highlight', () => jest.fn());

// Mock fetch for settings API
global.fetch = jest.fn();

describe('SearchInterface', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock fetch to return successful responses for both settings and AI models
    (global.fetch as jest.MockedFunction<typeof fetch>).mockImplementation((url) => {
      if (typeof url === 'string' && url.includes('/api/settings')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            data: {
              welcome_section_visible: true,
              default_search_mode: false,
              default_request_type: 'documentation',
              servicenow_instance_url: '',
              default_ai_model: 'test-model',
            },
          }),
        } as Response);
      } else if (typeof url === 'string' && url.includes('/api/ai-models')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            data: [
              {
                id: 1,
                user_id: 'test-user',
                model_name: 'test-model',
                display_name: 'Test Model',
                is_free: true,
                is_default: true,
                created_at: new Date(),
                updated_at: new Date(),
                capabilities: [],
              },
            ],
          }),
        } as Response);
      }
      
      return Promise.resolve({
        ok: true,
        json: async () => ({ success: true, data: {} }),
      } as Response);
    });
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <ThemeProvider>
        <SettingsProvider>
          <AIModelProvider>
            {component}
          </AIModelProvider>
        </SettingsProvider>
      </ThemeProvider>
    );
  };

  it('should render the search interface components', () => {
    renderWithProviders(<SearchInterface />);

    // Look for the textarea instead of placeholder text
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByText('Documentation')).toBeInTheDocument();
    expect(screen.getByText('Recommendation')).toBeInTheDocument();
    expect(screen.getByTestId('burger-menu')).toBeInTheDocument();
  });

  it('should render the main heading', () => {
    renderWithProviders(<SearchInterface />);

    // Be more specific to target the main heading (h1) and avoid the welcome heading (h3)
    expect(screen.getByRole('heading', { level: 1, name: /ServiceN.*o.*w Helper/i })).toBeInTheDocument();
  });
});
