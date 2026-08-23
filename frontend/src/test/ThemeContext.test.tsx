import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';

const ThemeConsumer = () => {
  const { theme, resolvedTheme, setTheme, toggleTheme, isSystemTheme } = useTheme();
  return (
    <div>
      <div data-testid="theme-value">{theme}</div>
      <div data-testid="resolved-theme-value">{resolvedTheme}</div>
      <div data-testid="is-system">{isSystemTheme ? 'true' : 'false'}</div>
      <button onClick={() => setTheme('light')} data-testid="set-light">Set Light</button>
      <button onClick={() => setTheme('dark')} data-testid="set-dark">Set Dark</button>
      <button onClick={() => setTheme('system')} data-testid="set-system">Set System</button>
      <button onClick={toggleTheme} data-testid="toggle-theme">Toggle</button>
    </div>
  );
};

describe('ThemeContext Auto Detection & Management', () => {
  let listeners: Array<(e: { matches: boolean }) => void> = [];
  let matchesDark = false;

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    document.documentElement.style.colorScheme = '';
    listeners = [];
    matchesDark = false;

    // Mock matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query.includes('dark') ? matchesDark : false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn((event: string, callback: (e: { matches: boolean }) => void) => {
          if (event === 'change') {
            listeners.push(callback);
          }
        }),
        removeEventListener: vi.fn((event: string, callback: (e: { matches: boolean }) => void) => {
          if (event === 'change') {
            listeners = listeners.filter((cb) => cb !== callback);
          }
        }),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('auto-detects system dark theme when OS prefers dark mode', () => {
    matchesDark = true;

    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme-value').textContent).toBe('system');
    expect(screen.getByTestId('resolved-theme-value').textContent).toBe('dark');
    expect(screen.getByTestId('is-system').textContent).toBe('true');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.style.colorScheme).toBe('dark');
  });

  it('auto-detects system light theme when OS prefers light mode', () => {
    matchesDark = false;

    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme-value').textContent).toBe('system');
    expect(screen.getByTestId('resolved-theme-value').textContent).toBe('light');
    expect(screen.getByTestId('is-system').textContent).toBe('true');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(document.documentElement.style.colorScheme).toBe('light');
  });

  it('dynamically adapts when OS color scheme changes in real-time in system mode', () => {
    matchesDark = false;

    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );

    expect(screen.getByTestId('resolved-theme-value').textContent).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    // Simulate OS theme change to dark mode
    act(() => {
      listeners.forEach((listener) => listener({ matches: true }));
    });

    expect(screen.getByTestId('resolved-theme-value').textContent).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    // Simulate OS theme change back to light mode
    act(() => {
      listeners.forEach((listener) => listener({ matches: false }));
    });

    expect(screen.getByTestId('resolved-theme-value').textContent).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('allows manual override to dark and light and saves preference to localStorage', () => {
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );

    fireEvent.click(screen.getByTestId('set-dark'));
    expect(screen.getByTestId('theme-value').textContent).toBe('dark');
    expect(screen.getByTestId('resolved-theme-value').textContent).toBe('dark');
    expect(screen.getByTestId('is-system').textContent).toBe('false');
    expect(localStorage.getItem('theme')).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    fireEvent.click(screen.getByTestId('set-light'));
    expect(screen.getByTestId('theme-value').textContent).toBe('light');
    expect(screen.getByTestId('resolved-theme-value').textContent).toBe('light');
    expect(screen.getByTestId('is-system').textContent).toBe('false');
    expect(localStorage.getItem('theme')).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    fireEvent.click(screen.getByTestId('set-system'));
    expect(screen.getByTestId('theme-value').textContent).toBe('system');
    expect(screen.getByTestId('is-system').textContent).toBe('true');
    expect(localStorage.getItem('theme')).toBe('system');
  });

  it('cycles through system -> dark -> light -> system using toggleTheme', () => {
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme-value').textContent).toBe('system');

    // system -> dark
    fireEvent.click(screen.getByTestId('toggle-theme'));
    expect(screen.getByTestId('theme-value').textContent).toBe('dark');

    // dark -> light
    fireEvent.click(screen.getByTestId('toggle-theme'));
    expect(screen.getByTestId('theme-value').textContent).toBe('light');

    // light -> system
    fireEvent.click(screen.getByTestId('toggle-theme'));
    expect(screen.getByTestId('theme-value').textContent).toBe('system');
  });
});
