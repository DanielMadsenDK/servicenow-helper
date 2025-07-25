import { render, screen } from '@testing-library/react';
import SearchInterface from '@/components/SearchInterface';
import { submitQuestion, cancelRequest } from '@/lib/api';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { ThemeProvider } from '@/contexts/ThemeContext';

// Mock the API functions
jest.mock('@/lib/api', () => ({
  submitQuestion: jest.fn(),
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
    
    // Mock fetch to return successful settings response
    (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          welcome_section_visible: true,
          default_search_mode: false,
          default_request_type: 'documentation',
          servicenow_instance_url: '',
        },
      }),
    } as Response);
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <ThemeProvider>
        <SettingsProvider>
          {component}
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
