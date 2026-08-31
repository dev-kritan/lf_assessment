import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { EventDetailPage } from '../pages/EventDetailPage';
import { eventsApi } from '../api/events.api';
import { ToastProvider } from '../contexts/ToastContext';
import { AuthContext } from '../contexts/AuthContext';
import { EventItem } from '../types';

vi.mock('../api/events.api', () => ({
  eventsApi: {
    getEventById: vi.fn(),
    deleteEvent: vi.fn(),
  },
}));

const mockEvent: EventItem = {
  id: 1,
  title: 'AI Robotics Expo 2026',
  description: 'Exploring modern robotics and AI agents',
  location: 'Innovation Hub Silicon Valley',
  eventType: 'public',
  startTime: new Date(Date.now() + 86400000).toISOString(),
  endTime: null,
  capacity: 200,
  bannerUrl: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  isPast: false,
  creator: { id: 1, name: 'Alice Johnson', email: 'alice@example.com' },
  tags: [{ id: 1, name: 'AI', colorHex: '#6366f1' }],
  rsvpStats: { yes: 15, maybe: 4, no: 0, total: 19 },
  userRsvp: 'yes',
  isCreator: true,
};

const renderWithRouter = (initialEntries: any[]) => {
  return render(
    <AuthContext.Provider
      value={{
        user: { id: 1, name: 'Alice', email: 'alice@example.com', isEmailVerified: true },
        token: 'token',
        refreshToken: 'refresh',
        isAuthenticated: true,
        isLoading: false,
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        verifyEmail: vi.fn(),
        resendVerification: vi.fn(),
        refreshProfile: vi.fn(),
      }}
    >
      <ToastProvider>
        <MemoryRouter initialEntries={initialEntries}>
          <Routes>
            <Route path="/events/:id" element={<EventDetailPage />} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </AuthContext.Provider>
  );
};

describe('EventDetailPage Origin-Aware Navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(eventsApi.getEventById).mockResolvedValue({
      success: true,
      data: mockEvent,
    });
  });

  it('renders "Back to My RSVPs" when navigating from My RSVPs tab', async () => {
    renderWithRouter([
      {
        pathname: '/events/1',
        search: '?tab=rsvps',
        state: { from: '/my-events?tab=rsvps', fromTitle: 'My RSVPs' },
      },
    ]);

    await waitFor(() => {
      expect(screen.getByText('AI Robotics Expo 2026')).toBeInTheDocument();
      expect(screen.getByText(/Back to My RSVPs/i)).toBeInTheDocument();
    });
  });

  it('renders "Back to My Events" when navigating from Created Events tab', async () => {
    renderWithRouter([
      {
        pathname: '/events/1',
        search: '?tab=created',
        state: { from: '/my-events?tab=created', fromTitle: 'My Events' },
      },
    ]);

    await waitFor(() => {
      expect(screen.getByText('AI Robotics Expo 2026')).toBeInTheDocument();
      expect(screen.getByText(/Back to My Events/i)).toBeInTheDocument();
    });
  });

  it('renders "Back to Events" when navigating from Browse Events', async () => {
    renderWithRouter(['/events/1']);

    await waitFor(() => {
      expect(screen.getByText('AI Robotics Expo 2026')).toBeInTheDocument();
      expect(screen.getByText(/Back to Events/i)).toBeInTheDocument();
    });
  });
});
