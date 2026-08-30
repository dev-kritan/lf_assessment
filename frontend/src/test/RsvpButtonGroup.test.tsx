import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter, MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { RsvpButtonGroup } from '../components/RsvpButtonGroup';
import { AuthContext } from '../contexts/AuthContext';
import { ToastProvider } from '../contexts/ToastContext';

// Mock canvas-confetti
vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

const mockStats = {
  yes: 12,
  maybe: 4,
  no: 2,
  total: 18,
};

const mockAuthValue = {
  user: { id: 1, name: 'Alice', email: 'alice@example.com', isEmailVerified: true, twoFactorEnabled: false },
  isAuthenticated: true,
  isLoading: false,
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  refreshProfile: vi.fn(),
  setUser: vi.fn(),
};

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <ToastProvider>
        <AuthContext.Provider value={mockAuthValue}>{ui}</AuthContext.Provider>
      </ToastProvider>
    </BrowserRouter>
  );
};

describe('RsvpButtonGroup Component', () => {
  it('renders RSVP action buttons and counts properly in card mode', () => {
    renderWithProviders(
      <RsvpButtonGroup
        eventId={1}
        stats={mockStats}
        capacity={50}
        initialStatus="yes"
      />
    );

    expect(screen.getByText('RSVP')).toBeInTheDocument();
    expect(screen.getByText('12 / 50 spots')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /going/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /maybe/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /no/i })).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('renders compact mode without card headers', () => {
    renderWithProviders(
      <RsvpButtonGroup
        eventId={1}
        stats={mockStats}
        variant="compact"
      />
    );

    expect(screen.queryByText('RSVP for this Event')).not.toBeInTheDocument();
    expect(screen.getByText('Going')).toBeInTheDocument();
    expect(screen.getByText('Maybe')).toBeInTheDocument();
    expect(screen.getByText('No')).toBeInTheDocument();
  });

  it('displays full capacity indicator when event is at capacity', () => {
    renderWithProviders(
      <RsvpButtonGroup
        eventId={1}
        stats={{ yes: 50, maybe: 10, no: 5, total: 65 }}
        capacity={50}
        initialStatus={null}
      />
    );

    expect(screen.getByText(/Capacity reached/i)).toBeInTheDocument();
  });

  it('redirects unverified user to /profile with highlightEmailVerification state when clicking RSVP button', async () => {
    let locationState: any = null;
    const LocationWatcher = () => {
      const location = useLocation();
      locationState = location.state;
      return <div>Profile Page Watcher</div>;
    };

    const unverifiedAuth = {
      ...mockAuthValue,
      user: { id: 2, name: 'Bob', email: 'bob@example.com', isEmailVerified: false, twoFactorEnabled: false },
    };

    render(
      <MemoryRouter initialEntries={['/events/1']}>
        <ToastProvider>
          <AuthContext.Provider value={unverifiedAuth}>
            <Routes>
              <Route
                path="/events/:id"
                element={
                  <RsvpButtonGroup
                    eventId={1}
                    stats={mockStats}
                    capacity={50}
                    initialStatus={null}
                  />
                }
              />
              <Route path="/profile" element={<LocationWatcher />} />
            </Routes>
          </AuthContext.Provider>
        </ToastProvider>
      </MemoryRouter>
    );

    const goingBtn = screen.getByRole('button', { name: /going/i });
    fireEvent.click(goingBtn);

    await waitFor(() => {
      expect(screen.getByText('Profile Page Watcher')).toBeInTheDocument();
      expect(locationState).toEqual({ highlightEmailVerification: true });
      expect(screen.getByText(/Please verify your email address in your profile to RSVP/i)).toBeInTheDocument();
    });
  });

  it('redirects unverified user to /profile with highlightEmailVerification state when clicking Verify in Profile', async () => {
    let locationState: any = null;
    const LocationWatcher = () => {
      const location = useLocation();
      locationState = location.state;
      return <div>Profile Page Watcher</div>;
    };

    const unverifiedAuth = {
      ...mockAuthValue,
      user: { id: 2, name: 'Bob', email: 'bob@example.com', isEmailVerified: false, twoFactorEnabled: false },
    };

    render(
      <MemoryRouter initialEntries={['/events/1']}>
        <ToastProvider>
          <AuthContext.Provider value={unverifiedAuth}>
            <Routes>
              <Route
                path="/events/:id"
                element={
                  <RsvpButtonGroup
                    eventId={1}
                    stats={mockStats}
                    capacity={50}
                    initialStatus={null}
                  />
                }
              />
              <Route path="/profile" element={<LocationWatcher />} />
            </Routes>
          </AuthContext.Provider>
        </ToastProvider>
      </MemoryRouter>
    );

    const verifyBtn = screen.getByRole('button', { name: /Verify in Profile/i });
    fireEvent.click(verifyBtn);

    await waitFor(() => {
      expect(screen.getByText('Profile Page Watcher')).toBeInTheDocument();
      expect(locationState).toEqual({ highlightEmailVerification: true });
    });
  });
});

