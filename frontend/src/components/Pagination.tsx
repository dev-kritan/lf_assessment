import React from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Server,
} from "lucide-react";
import { PaginationMeta } from "../types";
import { CustomSelect } from "./CustomSelect";
import { PER_PAGE_OPTIONS } from "../constants";

interface PaginationProps {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  meta,
  onPageChange,
  onLimitChange,
}) => {
  const { page, totalPages, total, limit, hasPrevPage, hasNextPage } = meta;

  const limitOptions = PER_PAGE_OPTIONS as unknown as {
    value: number;
    label: string;
  }[];

  const startItem = total === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(total, page * limit);

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
    <div className="mt-10 relative z-20 flex flex-col md:flex-row items-center justify-between gap-4 py-4 px-2 sm:px-4 rounded-2xl glass-card border border-slate-200/80 dark:border-slate-800/80 transition-all shadow-sm">
      {/* Count & Server Indicator */}
      <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400">
        {total > 0 ? (
          <span>
            page{" "}
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {page}
            </span>{" "}
            of{" "}
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {totalPages}
            </span>
          </span>
        ) : (
          <span>0 total events found</span>
        )}
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center gap-1 sm:gap-1.5">
        {/* First Page Button */}
        {totalPages > 3 && (
          <button
            onClick={() => onPageChange(1)}
            disabled={!hasPrevPage}
            aria-label="First page"
            title="First page"
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-xs"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
        )}

        {/* Previous Page Button */}
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPrevPage}
          aria-label="Previous page"
          title="Previous page"
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-xs"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Numbered Page Buttons */}
        {getPageNumbers().map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            aria-current={page === p ? "page" : undefined}
            className={`min-w-[36px] h-9 px-2.5 rounded-xl text-xs font-bold transition-all ${
              page === p
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/25 scale-105"
                : "border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            {p}
          </button>
        ))}

        {/* Next Page Button */}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNextPage}
          aria-label="Next page"
          title="Next page"
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-xs"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Last Page Button */}
        {totalPages > 3 && (
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={!hasNextPage}
            aria-label="Last page"
            title="Last page"
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-xs"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        )}
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
            placement="top"
            align="right"
            ariaLabel="Select events per page"
          />
        </div>
      )}
    </div>
  );
};
