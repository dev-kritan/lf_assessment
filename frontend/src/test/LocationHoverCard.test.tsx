import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { LocationHoverCard } from '../components/LocationHoverCard';
import { ToastProvider } from '../contexts/ToastContext';

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

  it('renders venue name and reveals modern hover card on mouse enter', async () => {
    const { container } = renderComponent({
      location: 'Creative Quarter Co-working Space',
    });

    const outerContainer = container.firstElementChild as HTMLElement;
    expect(screen.getByText('Creative Quarter Co-working Space')).toBeInTheDocument();

    // Hover on container to reveal hover card
    act(() => {
      fireEvent.mouseEnter(outerContainer);
    });

    expect(await screen.findByText('Venue Location')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Open in Maps/i })).toHaveAttribute(
      'href',
      expect.stringContaining('google.com/maps/search')
    );
  });

  it('renders truncated shared Google Maps link and displays full URL on hover', async () => {
    const mapUrl = 'https://maps.app.goo.gl/wrgoXz1zWgPPfmDv6';
    const { container } = renderComponent({
      location: mapUrl,
    });

    // Should display shortened host/path
    expect(screen.getByText(/maps\.app\.goo\.gl/i)).toBeInTheDocument();

    // Hover over container
    const outerContainer = container.firstElementChild as HTMLElement;
    act(() => {
      fireEvent.mouseEnter(outerContainer);
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
      fireEvent.mouseEnter(outerContainer);
    });

    const copyBtn = await screen.findByRole('button', { name: /copy/i });
    act(() => {
      fireEvent.click(copyBtn);
    });

    expect(writeTextMock).toHaveBeenCalledWith(mapUrl);
    expect(await screen.findByText('Copied')).toBeInTheDocument();
  });
});
