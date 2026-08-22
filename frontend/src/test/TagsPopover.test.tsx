import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TagsPopover } from '../components/TagsPopover';

describe('TagsPopover Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockTags = [
    { id: 1, name: 'React', colorHex: '#6366f1' },
    { id: 2, name: 'TypeScript', colorHex: '#10b981' },
    { id: 3, name: 'AI', colorHex: '#ec4899' },
    { id: 4, name: 'Design', colorHex: '#f59e0b' },
    { id: 5, name: 'Cloud', colorHex: '#06b6d4' },
  ];

  it('opens popover on hover and remains open for 600ms before closing', () => {
    render(<TagsPopover tags={mockTags} limit={2} />);

    // Initially badge is present, popover is not open
    const badge = screen.getByText('+3 more');
    expect(badge).toBeInTheDocument();
    expect(screen.queryByText('#AI')).not.toBeInTheDocument();

    // Hover over badge
    fireEvent.mouseEnter(badge.parentElement!);
    expect(screen.getByText('Additional Tags (3)')).toBeInTheDocument();
    expect(screen.getByText('#AI')).toBeInTheDocument();
    expect(screen.getByText('#Design')).toBeInTheDocument();
    expect(screen.getByText('#Cloud')).toBeInTheDocument();

    // Mouse leave
    fireEvent.mouseLeave(badge.parentElement!);

    // Should STILL be open immediately (before 600ms)
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(screen.getByText('Additional Tags (3)')).toBeInTheDocument();

    // After 600ms total, should close
    act(() => {
      vi.advanceTimersByTime(350);
    });
    expect(screen.queryByText('Additional Tags (3)')).not.toBeInTheDocument();
  });
});
