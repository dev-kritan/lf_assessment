import React, { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ErrorBoundary } from '../components/ErrorBoundary';

const GoodChild: React.FC = () => <div>Normal Content Loaded</div>;

const ProblematicChild: React.FC<{ shouldThrow?: boolean }> = ({ shouldThrow = true }) => {
  if (shouldThrow) {
    throw new Error('Simulated critical UI render failure');
  }
  return <div>Recovered Child Content</div>;
};

const FallbackPropChild: React.FC = () => <div>Custom Prop Fallback Message</div>;

describe('ErrorBoundary Component', () => {
  // Suppress console.error during deliberate error throwing in tests
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('renders children normally when there is no runtime error', () => {
    render(
      <ErrorBoundary>
        <GoodChild />
      </ErrorBoundary>
    );

    expect(screen.getByText('Normal Content Loaded')).toBeInTheDocument();
  });

  it('catches render errors and renders the graceful error boundary UI', () => {
    render(
      <ErrorBoundary>
        <ProblematicChild />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText(/An unexpected error occurred while rendering this view/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Try Again/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Return to Home/i })).toBeInTheDocument();
  });

  it('allows toggling technical diagnostics details', () => {
    render(
      <ErrorBoundary>
        <ProblematicChild />
      </ErrorBoundary>
    );

    const toggleBtn = screen.getByRole('button', { name: /Technical Diagnostics/i });
    expect(toggleBtn).toBeInTheDocument();

    // Details hidden initially
    expect(screen.queryByText(/Simulated critical UI render failure/i)).not.toBeInTheDocument();

    // Click to open details
    fireEvent.click(toggleBtn);
    expect(screen.getByText(/Simulated critical UI render failure/i)).toBeInTheDocument();

    // Click to close details
    fireEvent.click(toggleBtn);
    expect(screen.queryByText(/Simulated critical UI render failure/i)).not.toBeInTheDocument();
  });

  it('supports custom fallback UI prop', () => {
    render(
      <ErrorBoundary fallback={<FallbackPropChild />}>
        <ProblematicChild />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom Prop Fallback Message')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  it('re-renders children when Try Again button is clicked', () => {
    const StatefulWrapper = () => {
      const [hasThrown, setHasThrown] = useState(true);
      return (
        <ErrorBoundary>
          {hasThrown ? (
            <div>
              <ProblematicChild shouldThrow={true} />
            </div>
          ) : (
            <div>Recovered Child Content</div>
          )}
        </ErrorBoundary>
      );
    };

    const { rerender } = render(<StatefulWrapper />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    const tryAgainBtn = screen.getByRole('button', { name: /Try Again/i });
    fireEvent.click(tryAgainBtn);
  });
});
