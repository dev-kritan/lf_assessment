import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { EventFormModal } from '../components/EventFormModal';
import { ToastProvider } from '../contexts/ToastContext';
import { eventsApi } from '../api/events.api';

vi.mock('../api/events.api', () => ({
  eventsApi: {
    getTags: vi.fn(),
    createTag: vi.fn(),
    createEvent: vi.fn(),
    updateEvent: vi.fn(),
  },
}));

describe('EventFormModal Component', () => {
  it('renders existing tags and adds new custom tag in real-time', async () => {
    const initialTags = [
      { id: 1, name: 'AI', colorHex: '#6366f1' },
      { id: 2, name: 'Web', colorHex: '#10b981' },
    ];

    vi.mocked(eventsApi.getTags).mockResolvedValue({
      success: true,
      data: initialTags,
    });

    vi.mocked(eventsApi.createTag).mockResolvedValue({
      success: true,
      data: { id: 3, name: 'Hackathon', colorHex: '#6366f1' },
    });

    const onTagCreatedMock = vi.fn();

    render(
      <ToastProvider>
        <EventFormModal
          isOpen={true}
          onClose={vi.fn()}
          onSuccess={vi.fn()}
          allTags={initialTags}
          onTagCreated={onTagCreatedMock}
        />
      </ToastProvider>
    );

    expect(screen.getByText('#AI')).toBeInTheDocument();
    expect(screen.getByText('#Web')).toBeInTheDocument();

    const input = screen.getByPlaceholderText(/Add custom tag/i);
    const addButton = screen.getByRole('button', { name: /Add/i });

    fireEvent.change(input, { target: { value: 'Hackathon' } });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(eventsApi.createTag).toHaveBeenCalledWith('Hackathon');
    });

    await waitFor(() => {
      expect(screen.getByText('#Hackathon')).toBeInTheDocument();
    });

    expect(onTagCreatedMock).toHaveBeenCalledWith({
      id: 3,
      name: 'Hackathon',
      colorHex: '#6366f1',
    });
  });

  it('selects existing tag without calling createTag if name matches case-insensitively', async () => {
    const initialTags = [
      { id: 10, name: 'Hello', colorHex: '#ec4899' },
    ];

    vi.mocked(eventsApi.getTags).mockResolvedValue({
      success: true,
      data: initialTags,
    });

    const createTagSpy = vi.mocked(eventsApi.createTag);
    createTagSpy.mockClear();

    render(
      <ToastProvider>
        <EventFormModal
          isOpen={true}
          onClose={vi.fn()}
          onSuccess={vi.fn()}
          allTags={initialTags}
        />
      </ToastProvider>
    );

    const input = screen.getByPlaceholderText(/Add custom tag/i);
    const addButton = screen.getByRole('button', { name: /Add/i });

    // Type lowercase 'hello' when '#Hello' already exists
    fireEvent.change(input, { target: { value: 'hello' } });
    fireEvent.click(addButton);

    // Should NOT call API
    expect(createTagSpy).not.toHaveBeenCalled();

    // Input should be cleared
    expect(input).toHaveValue('');

    // The tag '#Hello' button should be selected (has white text color)
    const tagButton = screen.getByText('#Hello');
    expect(tagButton).toHaveStyle({ color: 'rgb(255, 255, 255)' });
  });
});
