import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import {
  validateForm,
  mapApiErrors,
  loginSchema,
  registerSchema,
  eventFormSchema,
  tagFormSchema,
  twoFactorVerifySchema,
} from '../dto';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { ToastProvider } from '../contexts/ToastContext';
import { AuthContext } from '../contexts/AuthContext';

describe('Frontend Zod DTO & Validation Layer', () => {
  describe('DTO Schemas Validation', () => {
    it('validates loginSchema and catches invalid emails and missing passwords', () => {
      const invalidRes = validateForm(loginSchema, {
        email: 'invalid-email-format',
        password: '',
      });
      expect(invalidRes.isValid).toBe(false);
      expect(invalidRes.errors.email).toBe('Please enter a valid email address');
      expect(invalidRes.errors.password).toBe('Password is required');

      const validRes = validateForm(loginSchema, {
        email: 'test@example.com',
        password: 'Password123!',
      });
      expect(validRes.isValid).toBe(true);
      expect(validRes.errors).toEqual({});
    });

    it('validates registerSchema and catches password mismatch and short names', () => {
      const invalidRes = validateForm(registerSchema, {
        name: 'A',
        email: 'test@example.com',
        password: 'Password123!',
        confirmPassword: 'Password456!',
      });
      expect(invalidRes.isValid).toBe(false);
      expect(invalidRes.errors.name).toBe('Name must be at least 2 characters');
      expect(invalidRes.errors.confirmPassword).toBe('Passwords do not match');

      const validRes = validateForm(registerSchema, {
        name: 'Alice Johnson',
        email: 'alice@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
      });
      expect(validRes.isValid).toBe(true);
      expect(validRes.errors).toEqual({});
    });

    it('validates eventFormSchema and catches end_time before start_time and invalid capacity', () => {
      const invalidRes = validateForm(eventFormSchema, {
        title: 'Hi',
        description: 'Short',
        location: '',
        eventType: 'public',
        startTime: '2027-01-02T10:00',
        endTime: '2027-01-01T10:00',
        capacity: -5,
      });
      expect(invalidRes.isValid).toBe(false);
      expect(invalidRes.errors.title).toBe('Title must be at least 3 characters');
      expect(invalidRes.errors.description).toBe('Description must be at least 10 characters');
      expect(invalidRes.errors.location).toBe('Location must be at least 2 characters');
      expect(invalidRes.errors.endTime).toBe('End time must be after start time');

      const validRes = validateForm(eventFormSchema, {
        title: 'Global Developer Conference',
        description: 'An exciting annual conference bringing developers together worldwide.',
        location: 'San Francisco Convention Center',
        eventType: 'public',
        startTime: '2027-01-01T10:00',
        endTime: '2027-01-02T18:00',
        capacity: 500,
        bannerUrl: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4',
      });
      expect(validRes.isValid).toBe(true);
    });

    it('validates tagFormSchema and catches invalid hex colors and short names', () => {
      const invalidRes = validateForm(tagFormSchema, {
        name: 'T',
        colorHex: 'not-a-color',
      });
      expect(invalidRes.isValid).toBe(false);
      expect(invalidRes.errors.name).toBe('Tag name must be at least 2 characters');
      expect(invalidRes.errors.colorHex).toContain('valid hex color code');

      const validRes = validateForm(tagFormSchema, {
        name: 'TypeScript',
        colorHex: '#3178c6',
      });
      expect(validRes.isValid).toBe(true);
    });

    it('validates twoFactorVerifySchema and enforces 6-digit codes', () => {
      const invalidRes = validateForm(twoFactorVerifySchema, { token: '1234' });
      expect(invalidRes.isValid).toBe(false);
      expect(invalidRes.errors.token).toBe('2FA code must be exactly 6 digits');

      const validRes = validateForm(twoFactorVerifySchema, { token: '123456' });
      expect(validRes.isValid).toBe(true);
    });

    it('maps backend API error details into field record correctly', () => {
      const apiError = {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: [
          { field: 'email', message: 'Email is already taken' },
          { field: 'password', message: 'Password is too weak' },
        ],
      };
      const mapped = mapApiErrors(apiError);
      expect(mapped).toEqual({
        email: 'Email is already taken',
        password: 'Password is too weak',
      });
    });
  });

  describe('Form Components UI Field Error Integration', () => {
    const mockLogin = vi.fn();
    const mockRegister = vi.fn();

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('displays inline Zod error when submitting invalid email on LoginPage', async () => {
      render(
        <BrowserRouter>
          <ToastProvider>
            <AuthContext.Provider
              value={{
                user: null,
                isAuthenticated: false,
                isLoading: false,
                login: mockLogin,
                register: mockRegister,
                logout: vi.fn(),
                refreshProfile: vi.fn(),
                setUser: vi.fn(),
              }}
            >
              <LoginPage />
            </AuthContext.Provider>
          </ToastProvider>
        </BrowserRouter>
      );

      const emailInput = screen.getByPlaceholderText('you@example.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');
      const submitBtn = screen.getByRole('button', { name: /Sign In/i });

      fireEvent.change(emailInput, { target: { value: 'notanemail' } });
      fireEvent.change(passwordInput, { target: { value: 'secret' } });
      fireEvent.submit(emailInput.closest('form')!);

      await waitFor(() => {
        const errorElements = screen.getAllByText('Please enter a valid email address');
        expect(errorElements.length).toBeGreaterThanOrEqual(1);
        expect(mockLogin).not.toHaveBeenCalled();
      });
    });

    it('displays inline Zod error when submitting mismatched passwords on RegisterPage', async () => {
      render(
        <BrowserRouter>
          <ToastProvider>
            <AuthContext.Provider
              value={{
                user: null,
                isAuthenticated: false,
                isLoading: false,
                login: mockLogin,
                register: mockRegister,
                logout: vi.fn(),
                refreshProfile: vi.fn(),
                setUser: vi.fn(),
              }}
            >
              <RegisterPage />
            </AuthContext.Provider>
          </ToastProvider>
        </BrowserRouter>
      );

      const nameInput = screen.getByPlaceholderText('e.g. Alice Johnson');
      const emailInput = screen.getByPlaceholderText('alice@example.com');
      const passwordInputs = screen.getAllByPlaceholderText('••••••••');

      fireEvent.change(nameInput, { target: { value: 'Alice Johnson' } });
      fireEvent.change(emailInput, { target: { value: 'alice@example.com' } });
      fireEvent.change(passwordInputs[0], { target: { value: 'Password123!' } });
      fireEvent.change(passwordInputs[1], { target: { value: 'DifferentPassword456!' } });
      fireEvent.submit(nameInput.closest('form')!);

      await waitFor(() => {
        const errorElements = screen.getAllByText('Passwords do not match');
        expect(errorElements.length).toBeGreaterThanOrEqual(1);
        expect(mockRegister).not.toHaveBeenCalled();
      });
    });
  });
});
