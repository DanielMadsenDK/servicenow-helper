import { render, screen, fireEvent, act } from '@testing-library/react';
import { useAuth } from '@/contexts/AuthContext';
import LoginForm from '@/components/LoginForm';

// Mock the entire AuthContext module
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Type assertion for the mocked useAuth
const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('LoginForm', () => {
  const mockLogin = jest.fn();

  beforeEach(() => {
    // Reset mocks before each test
    mockLogin.mockClear();
    // Mock the useAuth hook
    mockedUseAuth.mockReturnValue({
      isAuthenticated: false,
      login: mockLogin,
      logout: jest.fn(),
      isLoading: false,
    });
  });

  it('should render the login form', async () => {
    await act(async () => {
      render(<LoginForm />);
    });
    const emailInput = screen.getByPlaceholderText('Enter your username');
    const passwordInput = screen.getByPlaceholderText('Enter your password');
    const loginButton = screen.getByRole('button', { name: /sign in/i });

    expect(emailInput).toBeInTheDocument();
    expect(passwordInput).toBeInTheDocument();
    expect(loginButton).toBeInTheDocument();
  });

  it('should call the login function on form submit', async () => {
    await act(async () => {
      render(<LoginForm />);
    });

    const emailInput = screen.getByPlaceholderText('Enter your username');
    const passwordInput = screen.getByPlaceholderText('Enter your password');
    const loginButton = screen.getByRole('button', { name: /sign in/i });

    await act(async () => {
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password' } });
      fireEvent.click(loginButton);
    });

    expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password');
  });

  it('should show loading state during login', async () => {
    // Mock login to return a promise that doesn't resolve immediately
    const mockLoginPromise = new Promise(resolve => setTimeout(resolve, 100));
    mockLogin.mockReturnValue(mockLoginPromise);

    await act(async () => {
      render(<LoginForm />);
    });

    const emailInput = screen.getByPlaceholderText('Enter your username');
    const passwordInput = screen.getByPlaceholderText('Enter your password');
    const loginButton = screen.getByRole('button', { name: /sign in/i });

    // Fill form and submit
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password' } });
    
    await act(async () => {
      fireEvent.click(loginButton);
    });

    // During loading, button should be disabled
    expect(loginButton).toBeDisabled();
  });

  it('should toggle password visibility when eye icon is clicked', async () => {
    await act(async () => {
      render(<LoginForm />);
    });

    const passwordInput = screen.getByPlaceholderText('Enter your password');
    const toggleButton = screen.getByRole('button', { name: '' }); // Eye icon button

    // Initially password should be hidden
    expect(passwordInput).toHaveAttribute('type', 'password');

    // Click to show password
    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');

    // Click to hide password again
    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });


  it('should prevent form submission with empty fields', async () => {
    await act(async () => {
      render(<LoginForm />);
    });

    const loginButton = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(loginButton);

    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('should render username and password inputs', async () => {
    await act(async () => {
      render(<LoginForm />);
    });

    const emailInput = screen.getByPlaceholderText('Enter your username');
    const passwordInput = screen.getByPlaceholderText('Enter your password');
    
    expect(emailInput).toBeInTheDocument();
    expect(passwordInput).toBeInTheDocument();
  });
});