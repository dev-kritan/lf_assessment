import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PaginationMeta } from '../types';
import { CustomSelect } from './CustomSelect';
import { PER_PAGE_OPTIONS } from '../constants';

interface PaginationProps {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({ meta, onPageChange, onLimitChange }) => {
  const { page, totalPages, total, limit } = meta;

  const limitOptions = PER_PAGE_OPTIONS as unknown as { value: number; label: string }[];

  if (totalPages <= 1 && total <= limit) {
    return (
      <div className="mt-8 text-center text-xs text-slate-500 dark:text-slate-400">
        Showing all <span className="font-semibold text-slate-800 dark:text-slate-200">{total}</span> events
      </div>
    );
  }

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 py-4 border-t border-slate-200 dark:border-slate-800">
      {/* Count Info */}
      <div className="text-xs text-slate-500 dark:text-slate-400">
        Showing page <span className="font-semibold text-slate-800 dark:text-slate-200">{page}</span> of{' '}
        <span className="font-semibold text-slate-800 dark:text-slate-200">{totalPages}</span> (
        <span className="font-semibold text-slate-800 dark:text-slate-200">{total}</span> total events)
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={!meta.hasPrevPage}
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {getPageNumbers().map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${
              page === p
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {p}
          </button>
        ))}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={!meta.hasNextPage}
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Per Page Selector */}
      {onLimitChange && (
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span>Per page:</span>
          <CustomSelect
            value={limit}
            onChange={(val) => onLimitChange(Number(val))}
            options={limitOptions}
            size="sm"
            ariaLabel="Select events per page"
          />
        </div>
      )}
    </div>
  );
};
