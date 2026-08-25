import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { EventListPage } from '../pages/EventListPage';
import { eventsApi } from '../api/events.api';
import { ToastProvider } from '../contexts/ToastContext';
import { AuthContext } from '../contexts/AuthContext';
import { EventItem } from '../types';

vi.mock('../api/events.api', () => ({
  eventsApi: {
    getEvents: vi.fn(),
    getTags: vi.fn(),
    getMetrics: vi.fn(),
    deleteEvent: vi.fn(),
  },
}));

const mockEvent: EventItem = {
  id: 1,
  title: 'Global Tech Summit 2026',
  description: 'Annual tech summit conference',
  location: 'Grand Convention Center',
  eventType: 'public',
  startTime: new Date(Date.now() + 86400000).toISOString(),
  endTime: null,
  capacity: 350,
  bannerUrl: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  isPast: false,
  creator: { id: 1, name: 'Alice Johnson', email: 'alice@example.com' },
  tags: [{ id: 1, name: 'Tech', colorHex: '#8b5cf6' }],
  rsvpStats: { yes: 10, maybe: 3, no: 1, total: 14 },
  userRsvp: 'yes',
  isCreator: false,
};

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider
        value={{
          user: { id: 1, name: 'Alice Johnson', email: 'alice@example.com', isEmailVerified: true, twoFactorEnabled: false },
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

describe('EventListPage Server-Side Pagination', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/');
    vi.clearAllMocks();
    vi.mocked(eventsApi.getTags).mockResolvedValue({
      success: true,
      data: [{ id: 1, name: 'Tech', colorHex: '#8b5cf6' }],
    });
    vi.mocked(eventsApi.getMetrics).mockResolvedValue({
      success: true,
      data: {
        totalEvents: 10,
        upcomingEvents: 8,
        pastEvents: 2,
        totalRsvps: 15,
        totalTags: 7,
      },
    });
    vi.mocked(eventsApi.getEvents).mockImplementation(async () => ({
      success: true,
      data: [mockEvent],
      meta: {
        page: 1,
        limit: 6,
        total: 10,
        totalPages: 2,
        hasNextPage: true,
        hasPrevPage: false,
      },
    }));
  });

  it('renders server-side pagination with 10 total events and 6 per page', async () => {
    vi.mocked(eventsApi.getEvents).mockImplementation(async () => ({
      success: true,
      data: [mockEvent],
      meta: {
        page: 1,
        limit: 6,
        total: 10,
        totalPages: 2,
        hasNextPage: true,
        hasPrevPage: false,
      },
    }));

    renderWithProviders(<EventListPage />);

    // Verify events and pagination badge are rendered
    await waitFor(() => {
      expect(screen.getByText('Global Tech Summit 2026')).toBeInTheDocument();
      expect(screen.getByText(/Server Paginated/i)).toBeInTheDocument();
      expect(screen.getByText(/Showing page/i)).toBeInTheDocument();
    });

    expect(eventsApi.getEvents).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 1,
        limit: 6,
      })
    );
  });

  it('navigates to page 2 when clicking page 2 button and triggers server fetch', async () => {
    vi.mocked(eventsApi.getEvents).mockImplementation(async (params: any) => {
      if (params.page === 2) {
        return {
          success: true,
          data: [{ ...mockEvent, id: 7, title: 'DevOps Production Masterclass' }],
          meta: {
            page: 2,
            limit: 6,
            total: 10,
            totalPages: 2,
            hasNextPage: false,
            hasPrevPage: true,
          },
        };
      }
      return {
        success: true,
        data: [mockEvent],
        meta: {
          page: 1,
          limit: 6,
          total: 10,
          totalPages: 2,
          hasNextPage: true,
          hasPrevPage: false,
        },
      };
    });

    renderWithProviders(<EventListPage />);

    await waitFor(() => {
      expect(screen.getByText('Global Tech Summit 2026')).toBeInTheDocument();
    });

    const page2Button = screen.getByRole('button', { name: '2' });
    fireEvent.click(page2Button);

    await waitFor(() => {
      expect(screen.getByText('DevOps Production Masterclass')).toBeInTheDocument();
    });

    expect(eventsApi.getEvents).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 2,
        limit: 6,
      })
    );
  });

  it('updates timeframe counts dynamically according to debounced search keyword', async () => {
    vi.mocked(eventsApi.getEvents).mockImplementation(async (params: any) => {
      if (params.search === 'Summit') {
        if (params.timeframe === 'upcoming') {
          return {
            success: true,
            data: [mockEvent],
            meta: { page: 1, limit: 1, total: 3, totalPages: 3, hasNextPage: true, hasPrevPage: false },
          };
        }
        if (params.timeframe === 'past') {
          return {
            success: true,
            data: [],
            meta: { page: 1, limit: 1, total: 1, totalPages: 1, hasNextPage: false, hasPrevPage: false },
          };
        }
        return {
          success: true,
          data: [mockEvent],
          meta: { page: 1, limit: 6, total: 4, totalPages: 1, hasNextPage: false, hasPrevPage: false },
        };
      }
      return {
        success: true,
        data: [mockEvent],
        meta: { page: 1, limit: 6, total: 10, totalPages: 2, hasNextPage: true, hasPrevPage: false },
      };
    });

    renderWithProviders(<EventListPage />);

    // Type in search bar
    const searchInput = screen.getByPlaceholderText(/Search events by title, description, or location/i);
    fireEvent.change(searchInput, { target: { value: 'Summit' } });

    await waitFor(
      () => {
        expect(eventsApi.getEvents).toHaveBeenCalledWith(
          expect.objectContaining({
            search: 'Summit',
            timeframe: 'all',
          })
        );
        expect(eventsApi.getEvents).toHaveBeenCalledWith(
          expect.objectContaining({
            search: 'Summit',
            timeframe: 'upcoming',
          })
        );
        expect(eventsApi.getEvents).toHaveBeenCalledWith(
          expect.objectContaining({
            search: 'Summit',
            timeframe: 'past',
          })
        );
      },
      { timeout: 1500 }
    );

    await waitFor(
      () => {
        expect(screen.getByRole('button', { name: /All Events 4/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Upcoming Events 3/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Past Events 1/i })).toBeInTheDocument();
      },
      { timeout: 1500 }
    );
  });
});
