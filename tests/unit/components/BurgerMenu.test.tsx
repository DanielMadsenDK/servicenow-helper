import { render, screen, fireEvent, act } from '@testing-library/react';
import { useAuth } from '@/contexts/AuthContext';
import BurgerMenu from '@/components/BurgerMenu';

// Mock the entire AuthContext module
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Type assertion for the mocked useAuth
const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('BurgerMenu', () => {
  const mockLogout = jest.fn();
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseAuth.mockReturnValue({
      login: jest.fn(),
      logout: mockLogout,
    });

    // Mock useRouter
    const { useRouter } = require('next/navigation');
    useRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    });
  });

  it('should render the burger menu button', () => {
    render(<BurgerMenu />);
    
    const burgerMenuButton = screen.getByRole('button');
    expect(burgerMenuButton).toBeInTheDocument();
  });

  it('should toggle menu when burger button is clicked', () => {
    render(<BurgerMenu />);
    
    const burgerMenuButton = screen.getByRole('button');
    
    // Menu should be closed initially
    expect(screen.queryByText('Sign Out')).not.toBeInTheDocument();
    
    // Click to open menu
    act(() => {
      fireEvent.click(burgerMenuButton);
    });
    expect(screen.getByText('Sign Out')).toBeInTheDocument();
    
    // Click to close menu
    act(() => {
      fireEvent.click(burgerMenuButton);
    });
    expect(screen.queryByText('Sign Out')).not.toBeInTheDocument();
  });

  it('should call logout function when Sign Out is clicked', async () => {
    render(<BurgerMenu />);
    
    const burgerMenuButton = screen.getByRole('button');
    
    // Open menu
    act(() => {
      fireEvent.click(burgerMenuButton);
    });
    
    // Click Sign Out
    const signOutButton = screen.getByText('Sign Out');
    await act(async () => {
      fireEvent.click(signOutButton);
    });
    
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it('should show burger menu elements', () => {
    render(<BurgerMenu />);
    
    const burgerMenuButton = screen.getByRole('button');
    const burgerLines = burgerMenuButton.querySelectorAll('.space-y-1 > div');
    
    // Should have 3 lines for the burger menu
    expect(burgerLines).toHaveLength(3);
  });

  it('should apply correct classes for menu transitions', () => {
    render(<BurgerMenu />);
    
    const burgerMenuButton = screen.getByRole('button');
    
    // Open menu
    act(() => {
      fireEvent.click(burgerMenuButton);
    });
    
    const menu = screen.getByText('Sign Out').closest('div');
    expect(menu).toHaveClass('absolute', 'right-0', 'mt-2', 'w-48');
  });
});
