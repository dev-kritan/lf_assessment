import React from 'react';

export interface CountBadgeProps {
  count?: number | string | null;
  isActive?: boolean;
  className?: string;
  ariaLabel?: string;
}

/**
 * Reusable uniform count badge component.
 * Displays count in a sleek pill format with active/inactive theme-aware styling.
 */
export const CountBadge: React.FC<CountBadgeProps> = ({
  count,
  isActive = false,
  className = '',
  ariaLabel,
}) => {
  if (count === undefined || count === null) return null;

  return (
    <span
      aria-label={ariaLabel}
      className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
        isActive
          ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
          : 'bg-slate-300/80 dark:bg-slate-700/80 text-slate-700 dark:text-slate-300'
      } ${className}`}
    >
      {count}
    </span>
  );
};
