import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CountBadge } from '../components/CountBadge';

describe('CountBadge Component', () => {
  it('renders count with active styles when isActive is true', () => {
    render(<CountBadge count={42} isActive={true} />);
    const badge = screen.getByText('42');
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain('bg-indigo-100');
    expect(badge.className).toContain('text-indigo-700');
  });

  it('renders count with inactive styles when isActive is false', () => {
    render(<CountBadge count={10} isActive={false} />);
    const badge = screen.getByText('10');
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain('bg-slate-300/80');
    expect(badge.className).toContain('text-slate-700');
  });

  it('returns null when count is undefined or null', () => {
    const { container: c1 } = render(<CountBadge count={undefined} />);
    expect(c1.firstChild).toBeNull();

    const { container: c2 } = render(<CountBadge count={null} />);
    expect(c2.firstChild).toBeNull();
  });

  it('allows appending custom className', () => {
    render(<CountBadge count={5} className="custom-test-class" />);
    const badge = screen.getByText('5');
    expect(badge.className).toContain('custom-test-class');
  });

  it('supports aria-label for accessibility', () => {
    render(<CountBadge count={3} ariaLabel="3 unread items" />);
    const badge = screen.getByLabelText('3 unread items');
    expect(badge).toBeInTheDocument();
  });
});
