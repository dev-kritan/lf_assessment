import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { TopLoader, topLoader } from '../components/TopLoader';

describe('TopLoader Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders correctly on initial load with null/hidden until triggered', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <TopLoader />
      </MemoryRouter>
    );

    // Initial render without navigation is idle/hidden
    expect(screen.queryByTestId('toploader')).toBeNull();
  });

  it('animates and displays progress bar on route transition', () => {
    const NavigationTester: React.FC = () => {
      const navigate = useNavigate();
      return (
        <div>
          <TopLoader />
          <button onClick={() => navigate('/events/42')}>Go to Detail</button>
        </div>
      );
    };

    render(
      <MemoryRouter initialEntries={['/']}>
        <NavigationTester />
      </MemoryRouter>
    );

    const button = screen.getByText('Go to Detail');
    act(() => {
      button.click();
    });

    // TopLoader should be visible immediately with role progressbar
    const loader = screen.getByTestId('toploader');
    expect(loader).toBeInTheDocument();
    expect(loader).toHaveAttribute('role', 'progressbar');

    // Bar and glow elements should exist
    const bar = screen.getByTestId('toploader-bar');
    expect(bar).toBeInTheDocument();

    // Fast-forward animation timers to completion
    act(() => {
      vi.advanceTimersByTime(350);
    });

    act(() => {
      vi.advanceTimersByTime(300);
    });
  });

  it('supports programmatic control via topLoader.start(), set(), and done()', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <TopLoader />
      </MemoryRouter>
    );

    // Programmatically start
    act(() => {
      topLoader.start();
    });

    const loader = screen.getByTestId('toploader');
    expect(loader).toBeInTheDocument();

    // Set custom progress percentage
    act(() => {
      topLoader.set(65);
    });

    const bar = screen.getByTestId('toploader-bar');
    expect(bar.style.width).toBe('65%');

    // Finish programmatically
    act(() => {
      topLoader.done();
    });

    expect(bar.style.width).toBe('100%');

    // Fast-forward fadeout
    act(() => {
      vi.advanceTimersByTime(600);
    });

    expect(screen.queryByTestId('toploader')).toBeNull();
  });

  it('customizes height, gradient color, and spinner', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <TopLoader
          height={5}
          color="linear-gradient(90deg, #ff0000, #00ff00)"
          showSpinner={true}
          zIndex={10000}
        />
      </MemoryRouter>
    );

    act(() => {
      topLoader.start();
    });

    const loader = screen.getByTestId('toploader');
    const bar = screen.getByTestId('toploader-bar');
    const spinner = screen.getByTestId('toploader-spinner');

    expect(loader.style.zIndex).toBe('10000');
    expect(bar.style.height).toBe('5px');
    expect(bar.style.background).toBe('linear-gradient(90deg, #ff0000, #00ff00)');
    expect(spinner).toBeInTheDocument();
  });
});
