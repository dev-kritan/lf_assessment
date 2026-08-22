import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CustomSelect } from '../components/CustomSelect';

describe('CustomSelect Component', () => {
  const options = [
    { value: 'all', label: 'All Types' },
    { value: 'public', label: 'Public Events' },
    { value: 'private', label: 'Private Events' },
  ];

  it('renders trigger button with selected option label', () => {
    const onChange = vi.fn();
    render(
      <CustomSelect
        value="all"
        onChange={onChange}
        options={options}
      />
    );

    expect(screen.getByRole('button', { name: /all types/i })).toBeInTheDocument();
  });

  it('opens options list when clicked and selects new option', () => {
    const onChange = vi.fn();
    render(
      <CustomSelect
        value="all"
        onChange={onChange}
        options={options}
      />
    );

    const trigger = screen.getByRole('button', { name: /all types/i });
    fireEvent.click(trigger);

    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getByText('Public Events')).toBeInTheDocument();
    expect(screen.getByText('Private Events')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Public Events'));
    expect(onChange).toHaveBeenCalledWith('public');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('closes dropdown on Escape key', () => {
    const onChange = vi.fn();
    render(
      <CustomSelect
        value="all"
        onChange={onChange}
        options={options}
      />
    );

    const trigger = screen.getByRole('button', { name: /all types/i });
    fireEvent.click(trigger);
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
});
