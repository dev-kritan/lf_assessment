import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { PER_PAGE_OPTIONS } from "../constants";
import { PaginationMeta } from "../types";
import { CustomSelect } from "./CustomSelect";

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
  const [isAtBottom, setIsAtBottom] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    let ticking = false;

    const checkViewportAndScroll = () => {
      if (typeof window === "undefined") return;
      const width = window.innerWidth;
      setIsMobile(width < 640);

      const scrollY = window.scrollY || window.pageYOffset;
      const windowHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;
      const distanceFromBottom = docHeight - (scrollY + windowHeight);

      // Hysteresis: enter bottom docked mode at <= 40px, exit docked mode when > 100px
      setIsAtBottom((prev) => {
        if (prev) {
          return distanceFromBottom <= 100;
        } else {
          return distanceFromBottom <= 40;
        }
      });
      ticking = false;
    };

    const onScrollOrResize = () => {
      if (!ticking) {
        window.requestAnimationFrame(checkViewportAndScroll);
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize, { passive: true });
    checkViewportAndScroll();

    return () => {
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, []);

  const limitOptions = PER_PAGE_OPTIONS as unknown as {
    value: number;
    label: string;
  }[];

  const startItem = total === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(total, page * limit);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = isMobile ? 3 : 5;
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

  // If no items exist, do not render
  if (total === 0) {
    return null;
  }

  // Single-page results: clean inline static summary instead of sticky floating bar
  if (totalPages <= 1) {
    return (
      <div
        aria-label="Pagination Navigation"
        className="w-full max-w-7xl mx-auto mt-6 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400 py-2.5 px-3 sm:py-3 sm:px-4 rounded-xl sm:rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/90 shadow-sm"
      >
        <div className="font-medium text-slate-600 dark:text-slate-300 text-xs sm:text-sm">
          Showing all {total} {total === 1 ? "event" : "events"} · Page 1 of 1
        </div>
        {onLimitChange && (
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="hidden sm:inline">Per page:</span>
            <CustomSelect
              value={limit}
              onChange={(val) => onLimitChange(Number(val))}
              options={limitOptions}
              size="sm"
              placement="top"
              align="right"
              buttonClassName="!py-0.5 sm:!py-1 !px-1.5 sm:!px-2 !text-[11px] sm:!text-xs !rounded-lg sm:!rounded-xl"
              ariaLabel="Select events per page"
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      aria-label="Pagination Navigation"
      className={`sticky bottom-2 sm:bottom-3 z-30 mx-auto mt-4 sm:mt-6 mb-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-800/90 flex items-center transform-gpu translate-z-0 transition-[box-shadow,border-color,background-color] duration-200 ${
        isAtBottom
          ? "w-full max-w-7xl px-3 sm:px-6 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl justify-between shadow-md"
          : "w-fit max-w-[calc(100vw-1rem)] px-2 sm:px-4 py-1.5 sm:py-2 rounded-2xl sm:rounded-full justify-center gap-1.5 sm:gap-3 shadow-xl shadow-slate-950/15"
      }`}
    >
      {/* Count & Server Indicator */}
      <div className="flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 font-medium shrink-0 pl-1 sm:pl-0">
        <span className="hidden lg:inline text-slate-500 dark:text-slate-400">
          Showing {startItem}–{endItem} of {total} ·
        </span>
        <span className="whitespace-nowrap">
          Page{" "}
          <span className="font-bold text-slate-900 dark:text-white">
            {page}
          </span>{" "}
          of{" "}
          <span className="font-bold text-slate-900 dark:text-white">
            {totalPages}
          </span>
        </span>
      </div>

      {/* Divider when floating on tablet/desktop */}
      <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block shrink-0" />

      {/* Pagination Controls */}
      <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
        {/* First Page Button */}
        {totalPages > 3 && (
          <button
            onClick={() => onPageChange(1)}
            disabled={!hasPrevPage}
            aria-label="First page"
            title="First page"
            className="hidden sm:flex p-1.5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shadow-xs shrink-0"
          >
            <ChevronsLeft className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Previous Page Button */}
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPrevPage}
          aria-label="Previous page"
          title="Previous page"
          className="w-7 h-7 sm:w-8 sm:h-8 p-1 sm:p-1.5 rounded-lg sm:rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shadow-xs shrink-0 flex items-center justify-center"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        {/* Numbered Page Buttons */}
        <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
          {getPageNumbers().map((p) => (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              aria-current={page === p ? "page" : undefined}
              className={`min-w-[28px] sm:min-w-[34px] h-7 sm:h-8 px-1.5 sm:px-2 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-all shrink-0 ${
                page === p
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/30 scale-105"
                  : "border border-slate-200/80 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Next Page Button */}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNextPage}
          aria-label="Next page"
          title="Next page"
          className="w-7 h-7 sm:w-8 sm:h-8 p-1 sm:p-1.5 rounded-lg sm:rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shadow-xs shrink-0 flex items-center justify-center"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        {/* Last Page Button */}
        {totalPages > 3 && (
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={!hasNextPage}
            aria-label="Last page"
            title="Last page"
            className="hidden sm:flex p-1.5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shadow-xs shrink-0"
          >
            <ChevronsRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Per Page Selector */}
      {onLimitChange && (
        <>
          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block shrink-0" />
          <div className="flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 shrink-0 pr-1 sm:pr-0">
            <span className="hidden lg:inline">Per page:</span>
            <CustomSelect
              value={limit}
              onChange={(val) => onLimitChange(Number(val))}
              options={limitOptions}
              size="sm"
              placement="top"
              align="right"
              buttonClassName="!py-0.5 sm:!py-1 !px-1.5 sm:!px-2 !text-[11px] sm:!text-xs !rounded-lg sm:!rounded-xl"
              ariaLabel="Select events per page"
            />
          </div>
        </>
      )}
    </div>
  );
};
