import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FilterBar } from '../components/FilterBar';

describe('FilterBar Component', () => {
  const mockTags = [
    { id: 1, name: 'Tech', colorHex: '#6366f1', eventCount: 5 },
    { id: 2, name: 'Workshop', colorHex: '#10b981', eventCount: 3 },
  ];

  it('renders search input and timeframe tabs correctly', () => {
    const onSearchChange = vi.fn();
    const onTimeframeChange = vi.fn();
    const onTypeChange = vi.fn();
    const onTagChange = vi.fn();
    const onSortChange = vi.fn();
    const onViewModeChange = vi.fn();
    const onReset = vi.fn();

    render(
      <FilterBar
        search=""
        onSearchChange={onSearchChange}
        selectedTimeframe="upcoming"
        onTimeframeChange={onTimeframeChange}
        selectedType="all"
        onTypeChange={onTypeChange}
        selectedTag=""
        onTagChange={onTagChange}
        sortBy="date"
        onSortChange={onSortChange}
        tags={mockTags}
        viewMode="grid"
        onViewModeChange={onViewModeChange}
        onReset={onReset}
        hasActiveFilters={false}
      />
    );

    expect(screen.getByPlaceholderText(/search events/i)).toBeInTheDocument();
    expect(screen.getByText(/upcoming events/i)).toBeInTheDocument();
    expect(screen.getByText(/past events/i)).toBeInTheDocument();
    expect(screen.getByText(/#Tech/i)).toBeInTheDocument();

    fireEvent.click(screen.getByText(/past events/i));
    expect(onTimeframeChange).toHaveBeenCalledWith('past');
  });

  it('triggers onTypeChange and onSortChange when custom dropdown options are selected', () => {
    const onSearchChange = vi.fn();
    const onTimeframeChange = vi.fn();
    const onTypeChange = vi.fn();
    const onTagChange = vi.fn();
    const onSortChange = vi.fn();
    const onViewModeChange = vi.fn();
    const onReset = vi.fn();

    render(
      <FilterBar
        search=""
        onSearchChange={onSearchChange}
        selectedTimeframe="upcoming"
        onTimeframeChange={onTimeframeChange}
        selectedType="all"
        onTypeChange={onTypeChange}
        selectedTag=""
        onTagChange={onTagChange}
        sortBy="date"
        onSortChange={onSortChange}
        tags={mockTags}
        viewMode="grid"
        onViewModeChange={onViewModeChange}
        onReset={onReset}
        hasActiveFilters={false}
      />
    );

    // Open Event Type dropdown
    const typeDropdown = screen.getByRole('button', { name: /event type filter/i });
    fireEvent.click(typeDropdown);
    fireEvent.click(screen.getByText('Public Events'));
    expect(onTypeChange).toHaveBeenCalledWith('public');

    // Open Sort By dropdown
    const sortDropdown = screen.getByRole('button', { name: /sort by filter/i });
    fireEvent.click(sortDropdown);
    fireEvent.click(screen.getByText('Most Popular (RSVP)'));
    expect(onSortChange).toHaveBeenCalledWith('popularity');
  });

  it('renders timeframe counts beside toggle tab buttons when provided', () => {
    render(
      <FilterBar
        search=""
        onSearchChange={vi.fn()}
        selectedTimeframe="all"
        onTimeframeChange={vi.fn()}
        selectedType="all"
        onTypeChange={vi.fn()}
        selectedTag=""
        onTagChange={vi.fn()}
        sortBy="date"
        onSortChange={vi.fn()}
        tags={mockTags}
        viewMode="grid"
        onViewModeChange={vi.fn()}
        onReset={vi.fn()}
        hasActiveFilters={false}
        timeframeCounts={{
          all: 25,
          upcoming: 18,
          past: 7,
        }}
      />
    );

    expect(screen.getByText('All Events')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByText('18')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
  });
});
