import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { MetricDetailDrawer } from '../components/MetricDetailDrawer';
import { EventItem, Tag } from '../types';
import { eventsApi } from '../api/events.api';

vi.mock('../api/events.api', () => ({
  eventsApi: {
    getEvents: vi.fn(),
  },
}));

describe('MetricDetailDrawer Component', () => {
  const mockMetrics = {
    totalEvents: 10,
    upcomingEvents: 7,
    pastEvents: 3,
    totalRsvps: 45,
    totalTags: 5,
  };

  const mockTags: Tag[] = [
    { id: 1, name: 'Tech', colorHex: '#6366f1', eventCount: 4 },
    { id: 2, name: 'AI', colorHex: '#ec4899', eventCount: 2 },
  ];

  const mockEvents: EventItem[] = [
    {
      id: 1,
      title: 'Upcoming Tech Summit',
      description: 'Tech summit event',
      location: 'Tech Hall',
      eventType: 'public',
      startTime: new Date(Date.now() + 86400000).toISOString(),
      endTime: null,
      capacity: 100,
      bannerUrl: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPast: false,
      creator: { id: 1, name: 'Alice', email: 'alice@example.com' },
      tags: [mockTags[0]],
      rsvpStats: { yes: 20, maybe: 10, no: 5, total: 35 },
      userRsvp: null,
      isCreator: false,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (eventsApi.getEvents as any).mockResolvedValue({
      success: true,
      data: mockEvents,
      meta: {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
    });
  });

  it('renders upcoming events detail and triggers onFilterTimeframe when action clicked', async () => {
    const onClose = vi.fn();
    const onFilterTimeframe = vi.fn();

    render(
      <BrowserRouter>
        <MetricDetailDrawer
          isOpen={true}
          onClose={onClose}
          metricType="upcoming"
          metrics={mockMetrics}
          events={mockEvents}
          tags={mockTags}
          onFilterTimeframe={onFilterTimeframe}
        />
      </BrowserRouter>
    );

    expect(screen.getByRole('heading', { name: 'Upcoming Events' })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('Upcoming Tech Summit')).toBeInTheDocument();
    });
    expect(screen.getByText('7 Scheduled')).toBeInTheDocument();

    const filterBtn = screen.getByRole('button', { name: /filter by upcoming events/i });
    fireEvent.click(filterBtn);
    expect(onFilterTimeframe).toHaveBeenCalledWith('upcoming');
    expect(onClose).toHaveBeenCalled();
  });

  it('renders categories detail and allows clicking a category to filter', () => {
    const onClose = vi.fn();
    const onFilterTag = vi.fn();

    render(
      <BrowserRouter>
        <MetricDetailDrawer
          isOpen={true}
          onClose={onClose}
          metricType="categories"
          metrics={mockMetrics}
          events={mockEvents}
          tags={mockTags}
          onFilterTag={onFilterTag}
        />
      </BrowserRouter>
    );

    expect(screen.getByRole('heading', { name: 'Categories & Tags' })).toBeInTheDocument();
    expect(screen.getByText('#Tech')).toBeInTheDocument();
    expect(screen.getByText('#AI')).toBeInTheDocument();

    fireEvent.click(screen.getByText('#Tech'));
    expect(onFilterTag).toHaveBeenCalledWith('Tech');
    expect(onClose).toHaveBeenCalled();
  });

  it('renders total RSVPs breakdown with percentages', () => {
    const onClose = vi.fn();

    render(
      <BrowserRouter>
        <MetricDetailDrawer
          isOpen={true}
          onClose={onClose}
          metricType="rsvps"
          metrics={mockMetrics}
          events={mockEvents}
          tags={mockTags}
        />
      </BrowserRouter>
    );

    expect(screen.getByRole('heading', { name: 'Total RSVPs & Engagement' })).toBeInTheDocument();
    expect(screen.getByText(/Confirmed Going \(Yes\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Interested \(Maybe\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Declined \(No\)/i)).toBeInTheDocument();
  });

  it('closes on close button click and Escape key', () => {
    const onClose = vi.fn();

    render(
      <BrowserRouter>
        <MetricDetailDrawer
          isOpen={true}
          onClose={onClose}
          metricType="past"
          metrics={mockMetrics}
          events={mockEvents}
          tags={mockTags}
        />
      </BrowserRouter>
    );

    const closeBtn = screen.getByRole('button', { name: /close panel/i });
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('filters tags by search query and supports edit/delete tag triggers', () => {
    const onEditTag = vi.fn();
    const onDeleteTag = vi.fn();
    const multipleTags: Tag[] = [
      { id: 1, name: 'Tech', colorHex: '#6366f1', eventCount: 4 },
      { id: 2, name: 'Design', colorHex: '#ec4899', eventCount: 2 },
      { id: 3, name: 'Marketing', colorHex: '#f59e0b', eventCount: 1 },
      { id: 4, name: 'Health', colorHex: '#10b981', eventCount: 3 },
      { id: 5, name: 'Music', colorHex: '#8b5cf6', eventCount: 5 },
    ];

    render(
      <BrowserRouter>
        <MetricDetailDrawer
          isOpen={true}
          onClose={vi.fn()}
          metricType="categories"
          metrics={mockMetrics}
          events={mockEvents}
          tags={multipleTags}
          onEditTag={onEditTag}
          onDeleteTag={onDeleteTag}
        />
      </BrowserRouter>
    );

    const searchInput = screen.getByPlaceholderText(/search tags/i);
    expect(searchInput).toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: 'desi' } });
    expect(screen.getByText('#Design')).toBeInTheDocument();
    expect(screen.queryByText('#Tech')).not.toBeInTheDocument();

    const editBtn = screen.getByTitle('Edit tag #Design');
    fireEvent.click(editBtn);
    expect(onEditTag).toHaveBeenCalledWith(multipleTags[1]);

    const deleteBtn = screen.getByTitle('Delete tag #Design');
    fireEvent.click(deleteBtn);
    expect(onDeleteTag).toHaveBeenCalledWith(multipleTags[1]);
  });

  it('fetches and appends next page when scrolling past events list', async () => {
    const page1Event: EventItem = {
      ...mockEvents[0],
      id: 201,
      title: 'Past Workshop Part 1',
      isPast: true,
    };
    const page2Event: EventItem = {
      ...mockEvents[0],
      id: 202,
      title: 'Past Workshop Part 2',
      isPast: true,
    };

    (eventsApi.getEvents as any)
      .mockResolvedValueOnce({
        success: true,
        data: [page1Event],
        meta: {
          page: 1,
          limit: 10,
          total: 2,
          totalPages: 2,
          hasNextPage: true,
          hasPrevPage: false,
        },
      })
      .mockResolvedValueOnce({
        success: true,
        data: [page2Event],
        meta: {
          page: 2,
          limit: 10,
          total: 2,
          totalPages: 2,
          hasNextPage: false,
          hasPrevPage: true,
        },
      });

    render(
      <BrowserRouter>
        <MetricDetailDrawer
          isOpen={true}
          onClose={vi.fn()}
          metricType="past"
          metrics={mockMetrics}
          events={[page1Event]}
          tags={mockTags}
        />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Past Workshop Part 1')).toBeInTheDocument();
    });

    const scrollContainer = screen.getByText('Past Workshop Part 1').closest('div[class*="overflow-y-auto"]');
    expect(scrollContainer).toBeInTheDocument();

    if (scrollContainer) {
      Object.defineProperty(scrollContainer, 'scrollHeight', { value: 550, configurable: true });
      Object.defineProperty(scrollContainer, 'clientHeight', { value: 100, configurable: true });
      Object.defineProperty(scrollContainer, 'scrollTop', { value: 500, configurable: true });
      fireEvent.scroll(scrollContainer);
    }

    await waitFor(() => {
      expect(screen.getByText('Past Workshop Part 2')).toBeInTheDocument();
    });

    expect(screen.getByText('Past Workshop Part 1')).toBeInTheDocument();
  });

  it('displays scroll notification badge and clickable load more banner when hasMore is true', async () => {
    const page1Event: EventItem = {
      ...mockEvents[0],
      id: 301,
      title: 'Upcoming Conference 2026',
      isPast: false,
    };
    const page2Event: EventItem = {
      ...mockEvents[0],
      id: 302,
      title: 'Upcoming Conference Day 2',
      isPast: false,
    };

    (eventsApi.getEvents as any)
      .mockResolvedValueOnce({
        success: true,
        data: [page1Event],
        meta: {
          page: 1,
          limit: 10,
          total: 2,
          totalPages: 2,
          hasNextPage: true,
          hasPrevPage: false,
        },
      })
      .mockResolvedValueOnce({
        success: true,
        data: [page2Event],
        meta: {
          page: 2,
          limit: 10,
          total: 2,
          totalPages: 2,
          hasNextPage: false,
          hasPrevPage: true,
        },
      });

    render(
      <BrowserRouter>
        <MetricDetailDrawer
          isOpen={true}
          onClose={vi.fn()}
          metricType="upcoming"
          metrics={{ ...mockMetrics, upcomingEvents: 2 }}
          events={[page1Event]}
          tags={mockTags}
        />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Upcoming Conference 2026')).toBeInTheDocument();
    });

    // Check that "Scroll for more" notification pill is rendered
    expect(screen.getByText(/Scroll for more/i)).toBeInTheDocument();

    // Check that interactive load more banner is rendered
    const loadMoreBtn = screen.getByRole('button', { name: /Scroll down to load more events/i });
    expect(loadMoreBtn).toBeInTheDocument();

    // Click the load more banner
    fireEvent.click(loadMoreBtn);

    await waitFor(() => {
      expect(screen.getByText('Upcoming Conference Day 2')).toBeInTheDocument();
    });

    // When all events are loaded (hasMore is false), end banner is shown
    expect(screen.getByText(/All 2 events loaded/i)).toBeInTheDocument();
  });
});
