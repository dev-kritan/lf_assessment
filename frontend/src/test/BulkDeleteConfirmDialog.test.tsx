import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BulkDeleteConfirmDialog } from '../components/BulkDeleteConfirmDialog';
import { EventItem } from '../types';

const mockEvents: EventItem[] = [
  {
    id: 1,
    title: 'React Summit',
    description: 'React conference',
    location: 'Online',
    eventType: 'public',
    startTime: new Date().toISOString(),
    endTime: null,
    capacity: 100,
    bannerUrl: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isPast: false,
    creator: { id: 1, name: 'Alice', email: 'alice@example.com' },
    tags: [],
    rsvpStats: { yes: 10, maybe: 2, no: 1, total: 13 },
    userRsvp: 'yes',
  },
  {
    id: 2,
    title: 'Node.js Workshop',
    description: 'Node backend',
    location: 'Hall B',
    eventType: 'public',
    startTime: new Date().toISOString(),
    endTime: null,
    capacity: 50,
    bannerUrl: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isPast: false,
    creator: { id: 1, name: 'Alice', email: 'alice@example.com' },
    tags: [],
    rsvpStats: { yes: 5, maybe: 1, no: 0, total: 6 },
    userRsvp: 'maybe',
  },
];

describe('BulkDeleteConfirmDialog Component', () => {
  it('does not render when isOpen is false', () => {
    const { container } = render(
      <BulkDeleteConfirmDialog
        isOpen={false}
        type="created"
        selectedEvents={mockEvents}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders created events warning title and event previews', () => {
    render(
      <BulkDeleteConfirmDialog
        isOpen={true}
        type="created"
        selectedEvents={mockEvents}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByText('Delete 2 Events Permanently?')).toBeInTheDocument();
    expect(screen.getByText('React Summit')).toBeInTheDocument();
    expect(screen.getByText('Node.js Workshop')).toBeInTheDocument();
    expect(screen.getByText(/Warning: Deleted events cannot be recovered/i)).toBeInTheDocument();
  });

  it('renders RSVP warning title and calls onConfirm when clicked', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <BulkDeleteConfirmDialog
        isOpen={true}
        type="rsvps"
        selectedEvents={mockEvents}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    expect(screen.getByText('Remove RSVP for 2 Events?')).toBeInTheDocument();
    expect(screen.getByText(/Warning: You will no longer receive updates/i)).toBeInTheDocument();

    const deleteBtn = screen.getByRole('button', { name: /Remove 2 RSVPs/i });
    fireEvent.click(deleteBtn);
    expect(onConfirm).toHaveBeenCalledTimes(1);

    const cancelBtn = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelBtn);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
