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
      // When scrolled near bottom (within 90px of end of page)
      const atBottom = scrollY + windowHeight >= docHeight - 90;
      setIsAtBottom(atBottom);
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

  return (
    <div
      aria-label="Pagination Navigation"
      className={`sticky bottom-2 z-30 mx-auto mt-4 mb-1 backdrop-blur-xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800/90 flex items-center transition-all duration-300 ease-out animate-fade-in ${
        isAtBottom
          ? "w-full max-w-7xl px-3 sm:px-6 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl justify-between shadow-md"
          : "max-w-[calc(100vw-1.25rem)] sm:max-w-fit px-2 sm:px-4 py-1.5 sm:py-2 rounded-full justify-between sm:justify-center gap-1.5 sm:gap-3.5 shadow-2xl shadow-slate-950/20"
      }`}
    >
      {/* Count & Server Indicator */}
      <div className="flex items-center gap-1 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 pl-0.5 sm:pl-1">
        {total > 0 ? (
          <span className="whitespace-nowrap font-medium">
            <span className="hidden lg:inline">
              {isAtBottom && (
                <span className="text-slate-600 dark:text-slate-300 font-semibold mr-1.5">
                  Showing {startItem}–{endItem} of {total} events ·
                </span>
              )}
            </span>
            Page{" "}
            <span className="font-bold text-slate-900 dark:text-white">
              {page}
            </span>{" "}
            of{" "}
            <span className="font-bold text-slate-900 dark:text-white">
              {totalPages}
            </span>
          </span>
        ) : (
          <span className="whitespace-nowrap">0 events found</span>
        )}
      </div>

      {/* Divider when floating */}
      <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

      {/* Pagination Controls */}
      <div className="flex items-center gap-0.5 sm:gap-1">
        {/* First Page Button */}
        {totalPages > 3 && (
          <button
            onClick={() => onPageChange(1)}
            disabled={!hasPrevPage}
            aria-label="First page"
            title="First page"
            className="hidden sm:flex p-1.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-xs"
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
          className="p-1 sm:p-1.5 rounded-lg sm:rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-xs"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        {/* Numbered Page Buttons */}
        <div className="flex items-center gap-0.5 sm:gap-1">
          {getPageNumbers().map((p) => (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              aria-current={page === p ? "page" : undefined}
              className={`min-w-[26px] h-7 sm:min-w-[32px] sm:h-8 px-1.5 sm:px-2 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-all ${
                page === p
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/30 scale-105"
                  : "border border-slate-200/60 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
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
          className="p-1 sm:p-1.5 rounded-lg sm:rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-xs"
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
            className="hidden sm:flex p-1.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-xs"
          >
            <ChevronsRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Per Page Selector */}
      {onLimitChange && (
        <>
          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />
          <div className="flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 pr-0.5 sm:pr-1">
            <span className="hidden md:inline">Per page:</span>
            <CustomSelect
              value={limit}
              onChange={(val) => onLimitChange(Number(val))}
              options={limitOptions}
              size="sm"
              placement="top"
              align="right"
              buttonClassName="!py-0.5 !px-1.5 sm:!py-1 sm:!px-2 !text-[11px] sm:!text-xs !rounded-lg sm:!rounded-xl"
              ariaLabel="Select events per page"
            />
          </div>
        </>
      )}
    </div>
  );
};
