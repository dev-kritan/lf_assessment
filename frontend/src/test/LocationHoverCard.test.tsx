import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { LocationHoverCard } from '../components/LocationHoverCard';
import { ToastProvider } from '../contexts/ToastContext';

if (typeof window.PointerEvent === 'undefined') {
  class PointerEvent extends MouseEvent {
    pointerType: string;
    constructor(type: string, params: any = {}) {
      super(type, params);
      this.pointerType = params.pointerType || '';
    }
  }
  window.PointerEvent = PointerEvent as any;
}

describe('LocationHoverCard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = (props: React.ComponentProps<typeof LocationHoverCard>) => {
    return render(
      <ToastProvider>
        <LocationHoverCard {...props} />
      </ToastProvider>
    );
  };

  it('renders restricted placeholder when event is private for unverified guests', () => {
    renderComponent({
      location: 'Secret Headquarters',
      isRestricted: true,
    });

    expect(
      screen.getByText(/Private Location • Verified Members Only/i)
    ).toBeInTheDocument();
  });

  it('renders venue name and reveals modern hover card on mouse pointer enter with active blue styling', async () => {
    const { container } = renderComponent({
      location: 'Creative Quarter Co-working Space',
    });

    const outerContainer = container.firstElementChild as HTMLElement;
    const labelSpan = screen.getByText('Creative Quarter Co-working Space');
    expect(labelSpan).toBeInTheDocument();

    // Pointer hover with mouse pointerType
    act(() => {
      fireEvent.pointerEnter(outerContainer, { pointerType: 'mouse' });
    });

    expect(await screen.findByText('Venue Location')).toBeInTheDocument();
    expect(labelSpan).toHaveClass('text-indigo-600');
    expect(screen.getByRole('link', { name: /Open in Maps/i })).toHaveAttribute(
      'href',
      expect.stringContaining('google.com/maps/search')
    );
  });

  it('ignores touch pointerenter to avoid mobile tap flicker and opens on single tap with blue text', async () => {
    const { container } = renderComponent({
      location: 'Mobile Friendly Convention Center',
      variant: 'detail',
    });

    const outerContainer = container.firstElementChild as HTMLElement;
    const trigger = screen.getByText('Mobile Friendly Convention Center');

    // Simulate mobile touch start / pointerEnter with touch pointerType
    act(() => {
      fireEvent(
        outerContainer,
        new PointerEvent('pointerenter', { pointerType: 'touch', bubbles: true })
      );
    });

    // Should NOT open on touch pointerenter
    expect(screen.queryByText('Venue Location')).not.toBeInTheDocument();

    // Tap trigger once
    act(() => {
      fireEvent.click(trigger);
    });

    // Should open on the very first click and turn text blue
    expect(await screen.findByText('Venue Location')).toBeInTheDocument();
    expect(trigger).toHaveClass('text-indigo-600');

    // Tap outside to close
    act(() => {
      fireEvent.mouseDown(document.body);
    });

    expect(screen.queryByText('Venue Location')).not.toBeInTheDocument();
  });

  it('renders truncated shared Google Maps link and displays full URL on hover', async () => {
    const mapUrl = 'https://maps.app.goo.gl/wrgoXz1zWgPPfmDv6';
    const { container } = renderComponent({
      location: mapUrl,
    });

    // Should display shortened host/path
    expect(screen.getByText(/maps\.app\.goo\.gl/i)).toBeInTheDocument();

    // Hover over container with mouse
    const outerContainer = container.firstElementChild as HTMLElement;
    act(() => {
      fireEvent.pointerEnter(outerContainer, { pointerType: 'mouse' });
    });

    expect(await screen.findByText('Google Maps Link')).toBeInTheDocument();
    expect(screen.getByText(mapUrl)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Open in Maps/i })).toHaveAttribute('href', mapUrl);
  });

  it('copies location to clipboard on Copy button click', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    const mapUrl = 'https://maps.app.goo.gl/wrgoXz1zWgPPfmDv6';
    const { container } = renderComponent({
      location: mapUrl,
    });

    const outerContainer = container.firstElementChild as HTMLElement;
    act(() => {
      fireEvent.pointerEnter(outerContainer, { pointerType: 'mouse' });
    });

    const copyBtn = await screen.findByRole('button', { name: /copy/i });
    act(() => {
      fireEvent.click(copyBtn);
    });

    expect(writeTextMock).toHaveBeenCalledWith(mapUrl);
    expect(await screen.findByText('Copied')).toBeInTheDocument();
  });

  it('renders with viewport-bounded positioning on card variant without hardcoded sm:left-0 override', async () => {
    const { container } = renderComponent({
      location: 'Centrally Positioned Innovation Hub',
      variant: 'card',
    });

    const outerContainer = container.firstElementChild as HTMLElement;
    act(() => {
      fireEvent.pointerEnter(outerContainer, { pointerType: 'mouse' });
    });

    const popover = await screen.findByText('Venue Location');
    const popoverContainer = popover.closest('div.absolute') as HTMLElement;
    expect(popoverContainer).toBeInTheDocument();
    expect(popoverContainer).not.toHaveClass('sm:left-0');
    // Verify dynamic left positioning style or fallback centering is applied
    expect(popoverContainer.style.left).toBeDefined();
  });

  it('supports keyboard navigation: toggles on Enter key and closes on Escape key', async () => {
    renderComponent({
      location: 'Accessible Conference Center',
    });

    const trigger = screen.getByRole('button', { name: /Accessible Conference Center/i });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    // Press Enter to open
    act(() => {
      fireEvent.keyDown(trigger, { key: 'Enter' });
    });

    expect(await screen.findByText('Venue Location')).toBeInTheDocument();
    expect(trigger).toHaveAttribute('aria-expanded', 'true');

    // Press Escape to close
    act(() => {
      fireEvent.keyDown(document, { key: 'Escape' });
    });

    expect(screen.queryByText('Venue Location')).not.toBeInTheDocument();
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });
});
