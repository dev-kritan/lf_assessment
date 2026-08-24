import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { ToastProvider } from '../contexts/ToastContext';
import { AuthContext } from '../contexts/AuthContext';

const mockLogin = vi.fn();
const mockRegister = vi.fn();
const mockLogout = vi.fn();
const mockRefreshProfile = vi.fn();
const mockSetUser = vi.fn();

const renderLoginPage = () => {
  return render(
    <BrowserRouter>
      <ToastProvider>
        <AuthContext.Provider
          value={{
            user: null,
            isAuthenticated: false,
            isLoading: false,
            login: mockLogin,
            register: mockRegister,
            logout: mockLogout,
            refreshProfile: mockRefreshProfile,
            setUser: mockSetUser,
          }}
        >
          <LoginPage />
        </AuthContext.Provider>
      </ToastProvider>
    </BrowserRouter>
  );
};

const renderRegisterPage = () => {
  return render(
    <BrowserRouter>
      <ToastProvider>
        <AuthContext.Provider
          value={{
            user: null,
            isAuthenticated: false,
            isLoading: false,
            login: mockLogin,
            register: mockRegister,
            logout: mockLogout,
            refreshProfile: mockRefreshProfile,
            setUser: mockSetUser,
          }}
        >
          <RegisterPage />
        </AuthContext.Provider>
      </ToastProvider>
    </BrowserRouter>
  );
};

describe('Auth Pages Auto-Focus Behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('automatically focuses the Email Address input on LoginPage load', async () => {
    renderLoginPage();

    const emailInput = screen.getByPlaceholderText('you@example.com');
    expect(emailInput).toBeInTheDocument();

    await waitFor(() => {
      expect(document.activeElement).toBe(emailInput);
    });
  });

  it('automatically focuses the Full Name input on RegisterPage load', async () => {
    renderRegisterPage();

    const nameInput = screen.getByPlaceholderText('e.g. Alice Johnson');
    expect(nameInput).toBeInTheDocument();

    await waitFor(() => {
      expect(document.activeElement).toBe(nameInput);
    });
  });

  it('allows filling demo account on LoginPage', async () => {
    renderLoginPage();

    const demoBtn = screen.getByRole('button', { name: /Alice \(Organizer\)/i });
    fireEvent.click(demoBtn);

    const emailInput = screen.getByPlaceholderText('you@example.com') as HTMLInputElement;
    expect(emailInput.value).toBe('alice@example.com');
  });

  it('submits registration form on RegisterPage with valid inputs', async () => {
    mockRegister.mockResolvedValueOnce({ id: 1, name: 'Alice Smith', email: 'alice@example.com' });
    renderRegisterPage();

    const nameInput = screen.getByPlaceholderText('e.g. Alice Johnson');
    const emailInput = screen.getByPlaceholderText('alice@example.com');
    const passwordInputs = screen.getAllByPlaceholderText('••••••••');

    fireEvent.change(nameInput, { target: { value: 'Alice Smith' } });
    fireEvent.change(emailInput, { target: { value: 'alice@example.com' } });
    fireEvent.change(passwordInputs[0], { target: { value: 'Secret123!' } });
    fireEvent.change(passwordInputs[1], { target: { value: 'Secret123!' } });

    const submitBtn = screen.getByRole('button', { name: /Sign Up/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith('Alice Smith', 'alice@example.com', 'Secret123!');
    });
  });
});
