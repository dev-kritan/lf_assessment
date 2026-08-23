import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TagDeleteModal } from '../components/TagDeleteModal';
import { TagEditModal } from '../components/TagEditModal';
import { eventsApi } from '../api/events.api';
import { ToastProvider } from '../contexts/ToastContext';
import { Tag } from '../types';

vi.mock('../api/events.api', () => ({
  eventsApi: {
    getTagUsage: vi.fn(),
    updateTag: vi.fn(),
    deleteTag: vi.fn(),
  },
}));

const mockTag: Tag = {
  id: 42,
  name: 'Artificial Intelligence',
  colorHex: '#6366f1',
  eventCount: 3,
};

const mockUsageData = {
  tag: mockTag,
  eventCount: 3,
  associatedEvents: [
    {
      id: 101,
      title: 'Global AI Summit 2026',
      eventType: 'public' as const,
      startTime: '2026-09-15T09:00:00.000Z',
      location: 'San Francisco, CA',
      isTruePrivate: false,
    },
    {
      id: 102,
      title: 'Machine Learning Deep Dive',
      eventType: 'private' as const,
      startTime: '2026-10-01T14:00:00.000Z',
      location: 'Online',
      isTruePrivate: false,
    },
    {
      id: 103,
      title: 'NeurIPS Discussion Group',
      eventType: 'public' as const,
      startTime: '2026-11-20T17:00:00.000Z',
      location: 'Seattle, WA',
      isTruePrivate: false,
    },
  ],
};

describe('TagDeleteModal Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders warning with exact associated events count and event list', async () => {
    (eventsApi.getTagUsage as any).mockResolvedValueOnce({
      success: true,
      data: mockUsageData,
    });

    render(
      <ToastProvider>
        <TagDeleteModal
          isOpen={true}
          tag={mockTag}
          onClose={vi.fn()}
          onSuccess={vi.fn()}
        />
      </ToastProvider>
    );

    // Verify tag chip preview
    expect(screen.getByText('#Artificial Intelligence')).toBeInTheDocument();

    // Verify warning text showing event count
    await waitFor(() => {
      expect(screen.getByText(/associated with/i)).toBeInTheDocument();
      expect(screen.getByText(/3 events/i)).toBeInTheDocument();
      expect(screen.getByText(/no longer be able to filter/i)).toBeInTheDocument();
    });

    // Verify associated events listed
    expect(screen.getByText('Global AI Summit 2026')).toBeInTheDocument();
    expect(screen.getByText('Machine Learning Deep Dive')).toBeInTheDocument();
    expect(screen.getByText('NeurIPS Discussion Group')).toBeInTheDocument();
  });

  it('calls deleteTag API and triggers onSuccess upon confirmation', async () => {
    (eventsApi.getTagUsage as any).mockResolvedValueOnce({
      success: true,
      data: mockUsageData,
    });
    (eventsApi.deleteTag as any).mockResolvedValueOnce({
      success: true,
      data: { deletedTag: mockTag, affectedEventsCount: 3 },
    });

    const onSuccess = vi.fn();
    const onClose = vi.fn();

    render(
      <ToastProvider>
        <TagDeleteModal
          isOpen={true}
          tag={mockTag}
          onClose={onClose}
          onSuccess={onSuccess}
        />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Global AI Summit 2026')).toBeInTheDocument();
    });

    const deleteBtn = screen.getByRole('button', { name: /yes, delete tag/i });
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(eventsApi.deleteTag).toHaveBeenCalledWith(42);
      expect(onSuccess).toHaveBeenCalledWith(mockTag);
      expect(onClose).toHaveBeenCalled();
    });
  });
});

describe('TagEditModal Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders edit form with live preview, event impact notice, and initial values', async () => {
    (eventsApi.getTagUsage as any).mockResolvedValueOnce({
      success: true,
      data: mockUsageData,
    });

    render(
      <ToastProvider>
        <TagEditModal
          isOpen={true}
          tag={mockTag}
          onClose={vi.fn()}
          onSuccess={vi.fn()}
        />
      </ToastProvider>
    );

    // Initial inputs
    const input = screen.getByDisplayValue('Artificial Intelligence');
    expect(input).toBeInTheDocument();

    // Event impact notice
    await waitFor(() => {
      expect(screen.getByText(/Editing will automatically update the tag name and color/i)).toBeInTheDocument();
    });

    expect(screen.getByText('Global AI Summit 2026')).toBeInTheDocument();
  });

  it('submits updated tag name and color and triggers onSuccess', async () => {
    (eventsApi.getTagUsage as any).mockResolvedValueOnce({
      success: true,
      data: mockUsageData,
    });
    (eventsApi.updateTag as any).mockResolvedValueOnce({
      success: true,
      data: { id: 42, name: 'Applied AI', colorHex: '#10b981' },
    });

    const onSuccess = vi.fn();
    const onClose = vi.fn();

    render(
      <ToastProvider>
        <TagEditModal
          isOpen={true}
          tag={mockTag}
          onClose={onClose}
          onSuccess={onSuccess}
        />
      </ToastProvider>
    );

    const input = screen.getByDisplayValue('Artificial Intelligence');
    fireEvent.change(input, { target: { value: 'Applied AI' } });

    await waitFor(() => {
      expect(screen.getByText('Global AI Summit 2026')).toBeInTheDocument();
    });

    // Click Save Changes
    const saveBtn = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(eventsApi.updateTag).toHaveBeenCalledWith(42, {
        name: 'Applied AI',
        colorHex: '#6366f1',
      });
      expect(onSuccess).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });
});
