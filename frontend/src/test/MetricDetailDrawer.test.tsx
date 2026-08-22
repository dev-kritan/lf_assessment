import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { MetricDetailDrawer } from '../components/MetricDetailDrawer';
import { EventItem, Tag } from '../types';

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

  it('renders upcoming events detail and triggers onFilterTimeframe when action clicked', () => {
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
    expect(screen.getByText('Upcoming Tech Summit')).toBeInTheDocument();
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
});
