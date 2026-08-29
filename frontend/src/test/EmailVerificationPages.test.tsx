import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { VerifyEmailPage } from '../pages/VerifyEmailPage';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { ProfilePage } from '../pages/ProfilePage';
import { EventDetailPage } from '../pages/EventDetailPage';
import { EventCard } from '../components/EventCard';
import { Navbar } from '../components/Navbar';
import { ToastProvider } from '../contexts/ToastContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { AuthContext } from '../contexts/AuthContext';
import { authApi } from '../api/auth.api';
import { eventsApi } from '../api/events.api';
import { EventItem } from '../types';

vi.mock('../api/auth.api', () => ({
  authApi: {
    verifyEmail: vi.fn(),
    resendVerification: vi.fn(),
    requestVerificationLink: vi.fn(),
    getProfile: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  },
}));

vi.mock('../api/events.api', () => ({
  eventsApi: {
    getEventById: vi.fn(),
    getEvents: vi.fn(),
  },
}));

// Mock scrollIntoView for JSDOM
window.HTMLElement.prototype.scrollIntoView = vi.fn();

describe('Email Verification Pages & Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders verifying state and shows success card when verification succeeds', async () => {
    vi.mocked(authApi.verifyEmail).mockResolvedValueOnce({
      success: true,
      data: { alreadyVerified: false, message: 'Email verified successfully!' },
      message: 'Email verified successfully!',
    });

    render(
      <MemoryRouter initialEntries={['/verify-email?token=valid-test-token&uid=1']}>
        <ToastProvider>
          <AuthContext.Provider
            value={{
              user: null,
              isAuthenticated: false,
              isLoading: false,
              login: vi.fn(),
              register: vi.fn(),
              logout: vi.fn(),
              refreshProfile: vi.fn(),
              setUser: vi.fn(),
            }}
          >
            <Routes>
              <Route path="/verify-email" element={<VerifyEmailPage />} />
            </Routes>
          </AuthContext.Provider>
        </ToastProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('Verifying Your Email...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Email Verified!')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Sign In Now/i })).toBeInTheDocument();
    });

    expect(authApi.verifyEmail).toHaveBeenCalledWith('valid-test-token', '1');
  });

  it('renders already-verified card gracefully when token belongs to verified user', async () => {
    vi.mocked(authApi.verifyEmail).mockResolvedValueOnce({
      success: true,
      data: { alreadyVerified: true, message: 'Your email address is already verified.' },
      message: 'Your email address is already verified.',
    });

    render(
      <MemoryRouter initialEntries={['/verify-email?token=used-token&uid=2']}>
        <ToastProvider>
          <AuthContext.Provider
            value={{
              user: null,
              isAuthenticated: false,
              isLoading: false,
              login: vi.fn(),
              register: vi.fn(),
              logout: vi.fn(),
              refreshProfile: vi.fn(),
              setUser: vi.fn(),
            }}
          >
            <Routes>
              <Route path="/verify-email" element={<VerifyEmailPage />} />
            </Routes>
          </AuthContext.Provider>
        </ToastProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Already Verified')).toBeInTheDocument();
      expect(screen.getByText(/Your email address is already verified/i)).toBeInTheDocument();
    });
  });

  it('renders error card and allows requesting a new link when token is invalid or expired', async () => {
    vi.mocked(authApi.verifyEmail).mockRejectedValueOnce({
      response: {
        data: {
          error: {
            code: 'VERIFICATION_TOKEN_EXPIRED',
            message: 'Verification link has expired. Please request a new verification link.',
          },
        },
      },
    });

    vi.mocked(authApi.resendVerification).mockResolvedValueOnce({
      success: true,
      data: { message: 'Verification link sent!' },
      message: 'Verification link sent!',
    });

    render(
      <MemoryRouter initialEntries={['/verify-email?token=expired-token&uid=3']}>
        <ToastProvider>
          <AuthContext.Provider
            value={{
              user: null,
              isAuthenticated: false,
              isLoading: false,
              login: vi.fn(),
              register: vi.fn(),
              logout: vi.fn(),
              refreshProfile: vi.fn(),
              setUser: vi.fn(),
            }}
          >
            <Routes>
              <Route path="/verify-email" element={<VerifyEmailPage />} />
            </Routes>
          </AuthContext.Provider>
        </ToastProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Verification Failed')).toBeInTheDocument();
      expect(screen.getByText(/Verification link has expired/i)).toBeInTheDocument();
    });

    // Enter email and request new link
    const resendInput = screen.getByPlaceholderText('you@example.com');
    fireEvent.change(resendInput, { target: { value: 'user3@example.com' } });

    const sendBtn = screen.getByRole('button', { name: /Send New Link/i });
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(authApi.resendVerification).toHaveBeenCalledWith('user3@example.com');
    });
  });

  it('shows unverified email alert and allows resend on LoginPage when login returns EMAIL_NOT_VERIFIED', async () => {
    const mockLogin = vi.fn().mockRejectedValueOnce({
      response: {
        data: {
          error: {
            code: 'EMAIL_NOT_VERIFIED',
            message: 'Please verify your email address before signing in.',
          },
        },
      },
    });

    vi.mocked(authApi.resendVerification).mockResolvedValueOnce({
      success: true,
      data: { message: 'Verification email sent!' },
      message: 'Verification email sent!',
    });

    render(
      <MemoryRouter initialEntries={['/login']}>
        <ToastProvider>
          <AuthContext.Provider
            value={{
              user: null,
              isAuthenticated: false,
              isLoading: false,
              login: mockLogin,
              register: vi.fn(),
              logout: vi.fn(),
              refreshProfile: vi.fn(),
              setUser: vi.fn(),
            }}
          >
            <Routes>
              <Route path="/login" element={<LoginPage />} />
            </Routes>
          </AuthContext.Provider>
        </ToastProvider>
      </MemoryRouter>
    );

    const emailInput = screen.getByPlaceholderText('you@example.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');

    fireEvent.change(emailInput, { target: { value: 'unverified@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Password123!' } });

    const signInBtn = screen.getByRole('button', { name: /^Sign In$/i });
    fireEvent.click(signInBtn);

    await waitFor(() => {
      expect(screen.getByText(/Your email address is not verified yet/i)).toBeInTheDocument();
    });

    const resendBtn = screen.getByRole('button', { name: /Resend Verification Email/i });
    fireEvent.click(resendBtn);

    await waitFor(() => {
      expect(authApi.resendVerification).toHaveBeenCalledWith('unverified@example.com');
    });
  });

  it('displays Check Your Inbox confirmation on RegisterPage upon successful registration', async () => {
    const mockRegister = vi.fn().mockResolvedValueOnce({
      user: { id: 10, name: 'New User', email: 'newuser@example.com', isEmailVerified: false },
      message: 'Registration successful. A verification email has been sent.',
    });

    render(
      <MemoryRouter initialEntries={['/register']}>
        <ToastProvider>
          <AuthContext.Provider
            value={{
              user: null,
              isAuthenticated: false,
              isLoading: false,
              login: vi.fn(),
              register: mockRegister,
              logout: vi.fn(),
              refreshProfile: vi.fn(),
              setUser: vi.fn(),
            }}
          >
            <Routes>
              <Route path="/register" element={<RegisterPage />} />
            </Routes>
          </AuthContext.Provider>
        </ToastProvider>
      </MemoryRouter>
    );

    const nameInput = screen.getByPlaceholderText('e.g. Alice Johnson');
    const emailInput = screen.getByPlaceholderText('alice@example.com');
    const passwordInputs = screen.getAllByPlaceholderText('••••••••');

    fireEvent.change(nameInput, { target: { value: 'New User' } });
    fireEvent.change(emailInput, { target: { value: 'newuser@example.com' } });
    fireEvent.change(passwordInputs[0], { target: { value: 'Secret123!' } });
    fireEvent.change(passwordInputs[1], { target: { value: 'Secret123!' } });

    const submitBtn = screen.getByRole('button', { name: /Sign Up/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Check Your Inbox')).toBeInTheDocument();
      expect(screen.getByText('newuser@example.com')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Go to Sign In/i })).toBeInTheDocument();
    });
  });

  it('unverified user clicking Create Event on Navbar triggers toast, prevents modal open, and navigates to Profile with state', async () => {
    const unverifiedUser = {
      id: 5,
      name: 'Unverified Carol',
      email: 'carol@example.com',
      isEmailVerified: false,
      twoFactorEnabled: false,
    };
    const onOpenCreateModal = vi.fn();

    render(
      <MemoryRouter initialEntries={['/']}>
        <ThemeProvider>
          <ToastProvider>
            <AuthContext.Provider
              value={{
                user: unverifiedUser,
                isAuthenticated: true,
                isLoading: false,
                login: vi.fn(),
                register: vi.fn(),
                logout: vi.fn(),
                refreshProfile: vi.fn(),
                setUser: vi.fn(),
              }}
            >
              <Navbar onOpenCreateModal={onOpenCreateModal} />
              <Routes>
                <Route path="/" element={<div>Home Page</div>} />
                <Route path="/profile" element={<div>Profile Page Route</div>} />
              </Routes>
            </AuthContext.Provider>
          </ToastProvider>
        </ThemeProvider>
      </MemoryRouter>
    );

    const createBtn = screen.getByRole('button', { name: /^Create Event$/i });
    fireEvent.click(createBtn);

    // Assert modal was NOT opened
    expect(onOpenCreateModal).not.toHaveBeenCalled();

    // Assert toast error message is rendered
    await waitFor(() => {
      expect(screen.getByText(/Please verify your email address to create events/i)).toBeInTheDocument();
      expect(screen.getByText('Profile Page Route')).toBeInTheDocument();
    });
  });

  it('highlights Email Verification card on ProfilePage when navigated with state and dismisses on Send Verification Link click', async () => {
    const unverifiedUser = {
      id: 5,
      name: 'Unverified Carol',
      email: 'carol@example.com',
      isEmailVerified: false,
      twoFactorEnabled: false,
    };

    vi.mocked(authApi.requestVerificationLink).mockResolvedValueOnce({
      success: true,
      data: {
        verificationUrl: 'http://localhost:5173/verify-email?token=xyz123&uid=5',
        verificationToken: 'xyz123',
      },
      message: 'Verification link sent!',
    });

    render(
      <MemoryRouter initialEntries={[{ pathname: '/profile', state: { highlightEmailVerification: true } }]}>
        <ToastProvider>
          <AuthContext.Provider
            value={{
              user: unverifiedUser,
              isAuthenticated: true,
              isLoading: false,
              login: vi.fn(),
              register: vi.fn(),
              logout: vi.fn(),
              refreshProfile: vi.fn(),
              setUser: vi.fn(),
            }}
          >
            <Routes>
              <Route path="/profile" element={<ProfilePage />} />
            </Routes>
          </AuthContext.Provider>
        </ToastProvider>
      </MemoryRouter>
    );

    // Check highlighted action badge
    expect(screen.getByText(/Action Required: Send verification link to enable event creation & RSVPs/i)).toBeInTheDocument();

    // Check highlighted card classes
    const emailCard = screen.getByTestId('email-verification-card');
    expect(emailCard.className).toContain('ring-4');

    // Click "Send Verification Link"
    const sendBtn = screen.getByRole('button', { name: /Send Verification Link/i });
    fireEvent.click(sendBtn);

    // Assert highlight badge is immediately dismissed and inbox check confirmation is displayed
    await waitFor(() => {
      expect(screen.queryByText(/Action Required: Send verification link/i)).not.toBeInTheDocument();
      expect(emailCard.className).not.toContain('ring-4');
      expect(screen.getByText('Verification Email Sent')).toBeInTheDocument();
      expect(screen.getAllByText('carol@example.com')).toHaveLength(2);
      expect(screen.queryByText(/Email Verification Link Sent & Ready/i)).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /Confirm Now/i })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Resend Verification Link/i })).toBeInTheDocument();
    });
  });

  it('profile popover in Navbar opens on click and automatically hides on outside click and Escape', async () => {
    const verifiedUser = {
      id: 8,
      name: 'Alice Wonder',
      email: 'alice@example.com',
      isEmailVerified: true,
      twoFactorEnabled: false,
    };

    render(
      <MemoryRouter initialEntries={['/']}>
        <ThemeProvider>
          <ToastProvider>
            <AuthContext.Provider
              value={{
                user: verifiedUser,
                isAuthenticated: true,
                isLoading: false,
                login: vi.fn(),
                register: vi.fn(),
                logout: vi.fn(),
                refreshProfile: vi.fn(),
                setUser: vi.fn(),
              }}
            >
              <div data-testid="outside-area">Outside Content</div>
              <Navbar />
            </AuthContext.Provider>
          </ToastProvider>
        </ThemeProvider>
      </MemoryRouter>
    );

    // Dropdown is initially closed
    expect(screen.queryByText('Profile & Security')).not.toBeInTheDocument();

    // Click profile button to open
    const profileBtn = screen.getByRole('button', { name: /User Profile Menu/i });
    fireEvent.click(profileBtn);

    // Popover is open
    expect(screen.getByText('Profile & Security')).toBeInTheDocument();
    expect(screen.getByText('Sign Out')).toBeInTheDocument();

    // 1. Test clicking outside closes popover
    const outsideArea = screen.getByTestId('outside-area');
    fireEvent.mouseDown(outsideArea);
    expect(screen.queryByText('Profile & Security')).not.toBeInTheDocument();

    // Reopen popover
    fireEvent.click(profileBtn);
    expect(screen.getByText('Profile & Security')).toBeInTheDocument();

    // 2. Test pressing Escape closes popover
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByText('Profile & Security')).not.toBeInTheDocument();
  });

  it('EventDetailPage displays locked placeholders for schedule, location, description, organizer, and attendees when visited by an unverified user', async () => {
    const unverifiedUser = {
      id: 9,
      name: 'Unverified Bob',
      email: 'bob@example.com',
      isEmailVerified: false,
      twoFactorEnabled: false,
    };

    const mockPrivateEvent: EventItem = {
      id: 101,
      title: 'Secret Strategy Meeting',
      description: '[Protected: Event details are visible to verified community members only]',
      location: '[Protected: Location visible to verified members only]',
      eventType: 'private',
      isTruePrivate: false,
      startTime: '2026-09-01T10:00:00.000Z',
      endTime: '2026-09-01T12:00:00.000Z',
      capacity: 20,
      bannerUrl: null,
      createdAt: '2026-08-29T10:00:00.000Z',
      updatedAt: '2026-08-29T10:00:00.000Z',
      isPast: false,
      isRestricted: true,
      creator: {
        id: 5,
        name: 'Private Organizer',
        email: '[hidden]',
        avatarUrl: undefined,
      },
      tags: [{ id: 1, name: 'Leadership', colorHex: '#4f46e5' }],
      rsvpStats: { yes: 0, maybe: 0, no: 0, total: 0 },
      attendees: [],
      userRsvp: null,
      isCreator: false,
    };

    vi.mocked(eventsApi.getEventById).mockResolvedValueOnce({
      success: true,
      data: mockPrivateEvent,
      message: 'Event retrieved successfully',
    });

    render(
      <MemoryRouter initialEntries={['/events/101']}>
        <ThemeProvider>
          <ToastProvider>
            <AuthContext.Provider
              value={{
                user: unverifiedUser,
                isAuthenticated: true,
                isLoading: false,
                login: vi.fn(),
                register: vi.fn(),
                logout: vi.fn(),
                refreshProfile: vi.fn(),
                setUser: vi.fn(),
              }}
            >
              <Routes>
                <Route path="/events/:id" element={<EventDetailPage />} />
              </Routes>
            </AuthContext.Provider>
          </ToastProvider>
        </ThemeProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Secret Strategy Meeting')).toBeInTheDocument();
    });

    // Check notice banner
    expect(screen.getByText('Email Verification Required')).toBeInTheDocument();
    expect(screen.getByText(/Please verify your email address to unlock event schedule/i)).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /Verify Email in Profile/i }).length).toBeGreaterThan(0);

    // Check locked schedule & location
    expect(screen.getByText('Private Schedule')).toBeInTheDocument();
    expect(screen.getByText('Private Location')).toBeInTheDocument();

    // Check locked description
    expect(screen.getByText('Protected Event Details')).toBeInTheDocument();

    // Check locked organizer
    expect(screen.getByText('Community Member')).toBeInTheDocument();
    expect(screen.getByText('Verified members only')).toBeInTheDocument();

    // Check locked RSVP attendance
    expect(screen.getByText('RSVP & Attendance are Private')).toBeInTheDocument();
  });

  it('EventCard masks schedule, location, description, creator, and RSVP badge for private events when user is unverified', () => {
    const unverifiedUser = {
      id: 9,
      name: 'Unverified Bob',
      email: 'bob@example.com',
      isEmailVerified: false,
      twoFactorEnabled: false,
    };

    const mockPrivateEvent: EventItem = {
      id: 102,
      title: 'Confidential Roundtable',
      description: 'Some internal description text',
      location: 'Secret Conference Room',
      eventType: 'private',
      isTruePrivate: false,
      startTime: '2026-09-01T14:00:00.000Z',
      endTime: '2026-09-01T16:00:00.000Z',
      capacity: 15,
      bannerUrl: null,
      createdAt: '2026-08-29T10:00:00.000Z',
      updatedAt: '2026-08-29T10:00:00.000Z',
      isPast: false,
      creator: {
        id: 3,
        name: 'Alice President',
        email: 'alice@example.com',
        avatarUrl: undefined,
      },
      tags: [{ id: 2, name: 'Executive', colorHex: '#9333ea' }],
      rsvpStats: { yes: 5, maybe: 2, no: 1, total: 8 },
      attendees: [],
      userRsvp: null,
      isCreator: false,
    };

    render(
      <MemoryRouter>
        <AuthContext.Provider
          value={{
            user: unverifiedUser,
            isAuthenticated: true,
            isLoading: false,
            login: vi.fn(),
            register: vi.fn(),
            logout: vi.fn(),
            refreshProfile: vi.fn(),
            setUser: vi.fn(),
          }}
        >
          <EventCard event={mockPrivateEvent} />
        </AuthContext.Provider>
      </MemoryRouter>
    );

    expect(screen.getByText('Confidential Roundtable')).toBeInTheDocument();
    expect(screen.getByText('Private event details restricted to verified members.')).toBeInTheDocument();
    expect(screen.getByText('Private Schedule • Verified Members Only')).toBeInTheDocument();
    expect(screen.getByText('Private Location • Verified Members Only')).toBeInTheDocument();
    expect(screen.getByText('Private Organizer')).toBeInTheDocument();
    expect(screen.getByText('Members Only')).toBeInTheDocument();
  });

  it('Back to Events button preserves page 2 and filters from location.state.from', async () => {
    const mockEvent: EventItem = {
      id: 202,
      title: 'Tech Summit Day 2',
      description: 'Conference day 2 on page 2',
      location: 'Hall A',
      eventType: 'public',
      isTruePrivate: false,
      startTime: '2026-09-02T10:00:00.000Z',
      endTime: '2026-09-02T18:00:00.000Z',
      capacity: 100,
      bannerUrl: null,
      createdAt: '2026-08-29T10:00:00.000Z',
      updatedAt: '2026-08-29T10:00:00.000Z',
      isPast: false,
      creator: {
        id: 1,
        name: 'Conference Lead',
        email: 'lead@example.com',
        avatarUrl: undefined,
      },
      tags: [],
      rsvpStats: { yes: 10, maybe: 2, no: 0, total: 12 },
      attendees: [],
      userRsvp: null,
      isCreator: false,
    };

    vi.mocked(eventsApi.getEventById).mockResolvedValueOnce({
      success: true,
      data: mockEvent,
      message: 'Event retrieved successfully',
    });

    render(
      <MemoryRouter initialEntries={['/events/202?page=2&timeframe=upcoming']}>
        <ThemeProvider>
          <ToastProvider>
            <AuthContext.Provider
              value={{
                user: null,
                isAuthenticated: false,
                isLoading: false,
                login: vi.fn(),
                register: vi.fn(),
                logout: vi.fn(),
                refreshProfile: vi.fn(),
                setUser: vi.fn(),
              }}
            >
              <Routes>
                <Route path="/events/:id" element={<EventDetailPage />} />
                <Route path="/" element={<div data-testid="event-list-root">Event List Page 2</div>} />
              </Routes>
            </AuthContext.Provider>
          </ToastProvider>
        </ThemeProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Tech Summit Day 2')).toBeInTheDocument();
    });

    const backButton = screen.getByRole('button', { name: /Back to Events/i });
    expect(backButton).toBeInTheDocument();
    fireEvent.click(backButton);

    await waitFor(() => {
      expect(screen.getByTestId('event-list-root')).toBeInTheDocument();
    });
  });
});
