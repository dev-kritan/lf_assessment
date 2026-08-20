import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
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
});
