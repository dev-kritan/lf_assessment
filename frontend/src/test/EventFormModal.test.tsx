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

  it('auto-focuses the event title input and closes when clicking outside or pressing Escape', async () => {
    const onCloseMock = vi.fn();

    vi.mocked(eventsApi.getTags).mockResolvedValue({
      success: true,
      data: [],
    });

    render(
      <ToastProvider>
        <EventFormModal
          isOpen={true}
          onClose={onCloseMock}
          onSuccess={vi.fn()}
        />
      </ToastProvider>
    );

    const titleInput = screen.getByPlaceholderText(/NextGen Web & AI Conference/i);
    expect(titleInput).toBeInTheDocument();

    await waitFor(() => {
      expect(document.activeElement).toBe(titleInput);
    });

    // Test Escape key closes modal
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onCloseMock).toHaveBeenCalledTimes(1);

    // Test clicking on outer backdrop closes modal
    const backdrop = titleInput.closest('.fixed.inset-0');
    expect(backdrop).toBeInTheDocument();
    if (backdrop) {
      fireEvent.click(backdrop);
      expect(onCloseMock).toHaveBeenCalledTimes(2);
    }
  });

  it('removes validation errors automatically in real-time as user types valid inputs', async () => {
    vi.mocked(eventsApi.getTags).mockResolvedValue({
      success: true,
      data: [],
    });

    render(
      <ToastProvider>
        <EventFormModal
          isOpen={true}
          onClose={vi.fn()}
          onSuccess={vi.fn()}
        />
      </ToastProvider>
    );

    const getFieldError = (fieldName: string) => {
      const container = document.querySelector(`[data-field="${fieldName}"]`);
      return container?.querySelector('.text-rose-500')?.textContent || null;
    };

    const titleInput = screen.getByPlaceholderText(/NextGen Web & AI Conference/i);
    const descriptionInput = screen.getByPlaceholderText(/Provide event overview/i);
    const locationInput = screen.getByPlaceholderText(/Grand Hall or Zoom Link/i);
    const submitBtn = screen.getByRole('button', { name: /Create Event/i });

    // 1. Submit empty form to trigger validation errors
    fireEvent.click(submitBtn);

    expect(getFieldError('title')).toMatch(/Title must be at least 3 characters|Event title is required/i);
    expect(getFieldError('description')).toMatch(/Description must be at least 10 characters|Description is required/i);
    expect(getFieldError('location')).toMatch(/Location must be at least 2 characters|Location is required/i);

    // 2. Type valid title -> title error should disappear automatically
    fireEvent.change(titleInput, { target: { value: 'AI Workshop 2026' } });
    expect(getFieldError('title')).toBeNull();

    // Description and location errors still remain
    expect(getFieldError('description')).toMatch(/Description must be at least 10 characters|Description is required/i);
    expect(getFieldError('location')).toMatch(/Location must be at least 2 characters|Location is required/i);

    // 3. Type valid location -> location error should disappear automatically
    fireEvent.change(locationInput, { target: { value: 'Main Hall' } });
    expect(getFieldError('location')).toBeNull();

    // 4. Type short description (< 10 chars) -> description error still present
    fireEvent.change(descriptionInput, { target: { value: 'Short' } });
    expect(getFieldError('description')).toMatch(/Description must be at least 10 characters/i);

    // 5. Type valid description (>= 10 chars) -> description error should disappear automatically
    fireEvent.change(descriptionInput, { target: { value: 'Comprehensive deep dive into React and TypeScript.' } });
    expect(getFieldError('description')).toBeNull();
  });

  it('clears end_time date ordering error automatically when end_time is adjusted to be after start_time', async () => {
    vi.mocked(eventsApi.getTags).mockResolvedValue({
      success: true,
      data: [],
    });

    render(
      <ToastProvider>
        <EventFormModal
          isOpen={true}
          onClose={vi.fn()}
          onSuccess={vi.fn()}
        />
      </ToastProvider>
    );

    const getFieldError = (fieldName: string) => {
      const container = document.querySelector(`[data-field="${fieldName}"]`);
      return container?.querySelector('.text-rose-500')?.textContent || null;
    };

    const titleInput = screen.getByPlaceholderText(/NextGen Web & AI Conference/i);
    const descriptionInput = screen.getByPlaceholderText(/Provide event overview/i);
    const locationInput = screen.getByPlaceholderText(/Grand Hall or Zoom Link/i);
    const submitBtn = screen.getByRole('button', { name: /Create Event/i });

    // Fill valid base fields
    fireEvent.change(titleInput, { target: { value: 'Valid Title Here' } });
    fireEvent.change(descriptionInput, { target: { value: 'Valid description with enough characters.' } });
    fireEvent.change(locationInput, { target: { value: 'Conference Room 1' } });

    // Set endTime earlier than startTime
    const dateInputs = document.querySelectorAll<HTMLInputElement>('input[type="datetime-local"]');
    const startInput = dateInputs[0];
    const endInput = dateInputs[1];

    fireEvent.change(startInput, { target: { value: '2026-09-01T14:00' } });
    fireEvent.change(endInput, { target: { value: '2026-09-01T10:00' } });

    // Submit form -> triggers "End time must be after start time"
    fireEvent.click(submitBtn);
    expect(getFieldError('endTime')).toBe('End time must be after start time');

    // Fix endTime to be after startTime
    fireEvent.change(endInput, { target: { value: '2026-09-01T18:00' } });

    // Error should be removed automatically in real-time
    expect(getFieldError('endTime')).toBeNull();
  });
});
