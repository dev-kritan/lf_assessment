import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { MyEventsPage } from '../pages/MyEventsPage';
import { eventsApi } from '../api/events.api';
import { ToastProvider } from '../contexts/ToastContext';
import { AuthContext } from '../contexts/AuthContext';
import { EventItem } from '../types';

vi.mock('../api/events.api', () => ({
  eventsApi: {
    getEvents: vi.fn(),
    getTags: vi.fn().mockResolvedValue({
      success: true,
      data: [
        { id: 1, name: 'Tech', colorHex: '#6366f1' },
        { id: 2, name: 'Design', colorHex: '#10b981' },
      ],
    }),
    deleteEvent: vi.fn(),
  },
}));

vi.mock('../api/rsvp.api', () => ({
  rsvpApi: {
    getMyRsvps: vi.fn().mockResolvedValue({
      success: true,
      data: [
        { id: 1, user_rsvp_status: 'yes', start_time: new Date(Date.now() + 86400000).toISOString() },
        { id: 2, user_rsvp_status: 'yes', start_time: new Date(Date.now() + 172800000).toISOString() },
        { id: 3, user_rsvp_status: 'maybe', start_time: new Date(Date.now() - 86400000).toISOString() },
        { id: 4, user_rsvp_status: 'no', start_time: new Date(Date.now() - 172800000).toISOString() },
      ],
    }),
  },
}));

const mockUser = {
  id: 42,
  name: 'Test Creator',
  email: 'creator@example.com',
  isEmailVerified: true,
  twoFactorEnabled: false,
};

const mockEventItem: EventItem = {
  id: 101,
  title: 'My Custom Workshop',
  description: 'A detailed workshop created by test user',
  location: 'Hall A',
  eventType: 'public',
  startTime: new Date(Date.now() + 86400000).toISOString(),
  endTime: null,
  capacity: 50,
  bannerUrl: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  isPast: false,
  creator: { id: 42, name: 'Test Creator', email: 'creator@example.com' },
  tags: [{ id: 1, name: 'Tech', colorHex: '#6366f1' }],
  rsvpStats: { yes: 5, maybe: 2, no: 0, total: 7 },
  userRsvp: 'yes',
  isCreator: true,
};

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider
        value={{
          user: mockUser,
          isAuthenticated: true,
          isLoading: false,
          login: vi.fn(),
          register: vi.fn(),
          logout: vi.fn(),
          refreshProfile: vi.fn(),
          setUser: vi.fn(),
        }}
      >
        <ToastProvider>{ui}</ToastProvider>
      </AuthContext.Provider>
    </BrowserRouter>
  );
};

describe('MyEventsPage Component', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/');
    vi.clearAllMocks();
  });

  it('renders created events tab with pagination and total count', async () => {
    vi.mocked(eventsApi.getEvents).mockImplementation(async (params: any) => {
      if (params.creator_id === 42) {
        return {
          success: true,
          data: [mockEventItem],
          meta: {
            page: 1,
            limit: 6,
            total: 15,
            totalPages: 3,
            hasNextPage: true,
            hasPrevPage: false,
          },
        };
      }
      return {
        success: true,
        data: [],
        meta: {
          page: 1,
          limit: 6,
          total: 0,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
      };
    });

    renderWithProviders(<MyEventsPage />);

    // Check title and tab count
    expect(screen.getByRole('heading', { name: /My Events & RSVPs/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Created by Me 15/i })).toBeInTheDocument();
      expect(screen.getByText('My Custom Workshop')).toBeInTheDocument();
    });

    // Verify pagination controls are rendered
    expect(screen.getByText(/Showing page/i)).toBeInTheDocument();
    expect(screen.getByText(/total events/i)).toBeInTheDocument();

    // Verify eventsApi was called with limit = 6, creator_id = 42
    expect(eventsApi.getEvents).toHaveBeenCalledWith(
      expect.objectContaining({
        creator_id: 42,
        page: 1,
        limit: 6,
      })
    );
  });

  it('navigates to page 2 when clicking page 2 button on Created Events', async () => {
    vi.mocked(eventsApi.getEvents).mockImplementation(async (params: any) => {
      if (params.creator_id === 42 && params.page === 2) {
        return {
          success: true,
          data: [{ ...mockEventItem, id: 102, title: 'Workshop Page 2' }],
          meta: {
            page: 2,
            limit: 6,
            total: 15,
            totalPages: 3,
            hasNextPage: true,
            hasPrevPage: true,
          },
        };
      }
      return {
        success: true,
        data: [mockEventItem],
        meta: {
          page: 1,
          limit: 6,
          total: 15,
          totalPages: 3,
          hasNextPage: true,
          hasPrevPage: false,
        },
      };
    });

    renderWithProviders(<MyEventsPage />);

    await waitFor(() => {
      expect(screen.getByText('My Custom Workshop')).toBeInTheDocument();
    });

    // Click page 2 button
    const page2Button = screen.getByRole('button', { name: '2' });
    fireEvent.click(page2Button);

    await waitFor(() => {
      expect(screen.getByText('Workshop Page 2')).toBeInTheDocument();
    });

    expect(eventsApi.getEvents).toHaveBeenCalledWith(
      expect.objectContaining({
        creator_id: 42,
        page: 2,
        limit: 6,
      })
    );
  });

  it('switches to My RSVPs tab, filters by status, and displays paginated RSVP events', async () => {
    const rsvpEvent: EventItem = {
      ...mockEventItem,
      id: 201,
      title: 'Awesome AI Conference',
      userRsvp: 'yes',
      isCreator: false,
    };

    vi.mocked(eventsApi.getEvents).mockImplementation(async (params: any) => {
      if (params.my_rsvps === 'all') {
        return {
          success: true,
          data: [rsvpEvent],
          meta: {
            page: 1,
            limit: 6,
            total: 8,
            totalPages: 2,
            hasNextPage: true,
            hasPrevPage: false,
          },
        };
      }
      if (params.my_rsvps === 'yes') {
        return {
          success: true,
          data: [rsvpEvent],
          meta: {
            page: 1,
            limit: 6,
            total: 5,
            totalPages: 1,
            hasNextPage: false,
            hasPrevPage: false,
          },
        };
      }
      return {
        success: true,
        data: [mockEventItem],
        meta: {
          page: 1,
          limit: 6,
          total: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
      };
    });

    renderWithProviders(<MyEventsPage />);

    // Click on "My RSVPs" tab
    const rsvpsTabBtn = await screen.findByRole('button', { name: /My RSVPs/i });
    fireEvent.click(rsvpsTabBtn);

    await waitFor(() => {
      expect(screen.getByText('Awesome AI Conference')).toBeInTheDocument();
    });

    // Check filter by RSVP status button
    const goingFilterBtn = screen.getByRole('button', { name: /Going/i });
    fireEvent.click(goingFilterBtn);

    await waitFor(() => {
      expect(eventsApi.getEvents).toHaveBeenCalledWith(
        expect.objectContaining({
          my_rsvps: 'yes',
          page: 1,
          limit: 6,
        })
      );
    });
  });

  it('triggers debounced server-side search when typing in search bar', async () => {
    vi.mocked(eventsApi.getEvents).mockResolvedValue({
      success: true,
      data: [mockEventItem],
      meta: {
        page: 1,
        limit: 6,
        total: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
    });

    renderWithProviders(<MyEventsPage />);

    await waitFor(() => {
      expect(screen.getByText('My Custom Workshop')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Search events by title, description, or location/i);
    fireEvent.change(searchInput, { target: { value: 'Workshop' } });

    await waitFor(
      () => {
        expect(eventsApi.getEvents).toHaveBeenCalledWith(
          expect.objectContaining({
            creator_id: 42,
            search: 'Workshop',
          })
        );
      },
      { timeout: 1000 }
    );
  });

  it('filters by timeframe (upcoming/past) and triggers server-side request', async () => {
    vi.mocked(eventsApi.getEvents).mockResolvedValue({
      success: true,
      data: [mockEventItem],
      meta: {
        page: 1,
        limit: 6,
        total: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
    });

    renderWithProviders(<MyEventsPage />);

    await waitFor(() => {
      expect(screen.getByText('My Custom Workshop')).toBeInTheDocument();
    });

    // Click on Upcoming timeframe pill
    const upcomingBtn = screen.getByRole('button', { name: /Upcoming Events/i });
    fireEvent.click(upcomingBtn);

    await waitFor(() => {
      expect(eventsApi.getEvents).toHaveBeenCalledWith(
        expect.objectContaining({
          creator_id: 42,
          timeframe: 'upcoming',
        })
      );
    });
  });

  it('displays empty state with Clear All Filters button when no events match filters', async () => {
    vi.mocked(eventsApi.getEvents).mockResolvedValue({
      success: true,
      data: [],
      meta: {
        page: 1,
        limit: 6,
        total: 0,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
    });

    renderWithProviders(<MyEventsPage />);

    // Click on Past timeframe
    const pastBtn = screen.getByRole('button', { name: /Past Events/i });
    fireEvent.click(pastBtn);

    await waitFor(() => {
      expect(screen.getByText('No Matching Events Found')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Clear All Filters/i })).toBeInTheDocument();
    });

    // Click Clear All Filters
    const clearBtn = screen.getByRole('button', { name: /Clear All Filters/i });
    fireEvent.click(clearBtn);

    await waitFor(() => {
      expect(eventsApi.getEvents).toHaveBeenCalledWith(
        expect.objectContaining({
          creator_id: 42,
          timeframe: 'all',
        })
      );
    });
  });

  it('displays timeframe counts (all, upcoming, past) on filter bar timeframe tabs', async () => {
    vi.mocked(eventsApi.getEvents).mockImplementation(async (params: any) => {
      if (params.timeframe === 'upcoming') {
        return {
          success: true,
          data: [mockEventItem],
          meta: { page: 1, limit: 1, total: 10, totalPages: 10, hasNextPage: true, hasPrevPage: false },
        };
      }
      if (params.timeframe === 'past') {
        return {
          success: true,
          data: [],
          meta: { page: 1, limit: 1, total: 5, totalPages: 5, hasNextPage: true, hasPrevPage: false },
        };
      }
      return {
        success: true,
        data: [mockEventItem],
        meta: { page: 1, limit: 6, total: 15, totalPages: 3, hasNextPage: true, hasPrevPage: false },
      };
    });

    renderWithProviders(<MyEventsPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /All Events 15/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Upcoming Events 10/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Past Events 5/i })).toBeInTheDocument();
    });
  });
});
