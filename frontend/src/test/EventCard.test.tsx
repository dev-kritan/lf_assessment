import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { EventCard } from '../components/EventCard';
import { EventItem } from '../types';

const mockEvent: EventItem = {
  id: 1,
  title: 'React & TypeScript Summit 2026',
  description: 'An advanced deep dive into modern React architecture.',
  location: 'Tech Hub Main Auditorium',
  eventType: 'public',
  startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  endTime: null,
  capacity: 100,
  bannerUrl: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  isPast: false,
  creator: {
    id: 1,
    name: 'Alice Johnson',
    email: 'alice@example.com',
    avatarUrl: undefined,
  },
  tags: [
    { id: 1, name: 'Tech', colorHex: '#6366f1' },
    { id: 2, name: 'Workshop', colorHex: '#10b981' },
  ],
  rsvpStats: { yes: 15, maybe: 5, no: 1, total: 21 },
  userRsvp: 'yes',
  isCreator: true,
};

describe('EventCard Component', () => {
  it('renders event title, location and tags properly', () => {
    render(
      <BrowserRouter>
        <EventCard event={mockEvent} />
      </BrowserRouter>
    );

    expect(screen.getByText('React & TypeScript Summit 2026')).toBeInTheDocument();
    expect(screen.getByText('Tech Hub Main Auditorium')).toBeInTheDocument();
    expect(screen.getByText('#Tech')).toBeInTheDocument();
    expect(screen.getByText('#Workshop')).toBeInTheDocument();
    expect(screen.getByText(/15 going/i)).toBeInTheDocument();
    expect(screen.getByText('Public')).toBeInTheDocument();
  });

  it('renders up to 3 tags and shows +X more badge for excess tags', () => {
    const eventWithManyTags: EventItem = {
      ...mockEvent,
      tags: [
        { id: 1, name: 'Tech', colorHex: '#6366f1' },
        { id: 2, name: 'Workshop', colorHex: '#10b981' },
        { id: 3, name: 'AI', colorHex: '#ec4899' },
        { id: 4, name: 'Design', colorHex: '#f59e0b' },
        { id: 5, name: 'Career', colorHex: '#06b6d4' },
      ],
    };

    render(
      <BrowserRouter>
        <EventCard event={eventWithManyTags} />
      </BrowserRouter>
    );

    expect(screen.getByText('#Tech')).toBeInTheDocument();
    expect(screen.getByText('#Workshop')).toBeInTheDocument();
    expect(screen.getByText('#AI')).toBeInTheDocument();
    expect(screen.getByText('+2 more')).toBeInTheDocument();
  });

  it('renders Members Only badge for private event when unauthenticated', () => {
    const privateEvent: EventItem = {
      ...mockEvent,
      id: 2,
      title: 'Private Executive Session',
      eventType: 'private',
    };

    render(
      <BrowserRouter>
        <EventCard event={privateEvent} />
      </BrowserRouter>
    );

    expect(screen.getByText('Private Executive Session')).toBeInTheDocument();
    expect(screen.getByText('Members Only')).toBeInTheDocument();
  });

  it('includes query parameters in event detail links when rendered with location.search (e.g. ?page=2)', () => {
    render(
      <MemoryRouter initialEntries={['/?page=2']}>
        <EventCard event={mockEvent} />
      </MemoryRouter>
    );

    const links = screen.getAllByRole('link', { name: /React & TypeScript Summit 2026/i });
    expect(links.length).toBeGreaterThan(0);
    links.forEach((link) => {
      expect(link).toHaveAttribute('href', '/events/1?page=2');
    });
  });
});
