import React, { useState, useRef, useEffect } from 'react';
import { Tag } from '../types';

interface TagsPopoverProps {
  tags: Tag[];
  limit: number;
  badgeClassName?: string;
  popoverClassName?: string;
  chipClassName?: string;
}

export const TagsPopover: React.FC<TagsPopoverProps> = ({
  tags,
  limit,
  badgeClassName,
  popoverClassName,
  chipClassName,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const remainingTags = tags.slice(limit);
  if (remainingTags.length === 0) return null;

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 600);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <span
        className={
          badgeClassName ||
          'px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer inline-flex items-center gap-0.5'
        }
      >
        +{remainingTags.length} more
      </span>

      {isOpen && (
        <div
          className={
            popoverClassName ||
            'absolute left-0 bottom-full mb-2 z-50 flex flex-col gap-1.5 p-3 rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 min-w-[210px] max-w-[270px] max-h-52 overflow-y-auto animate-fade-in pointer-events-auto'
          }
        >
          <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider pb-1.5 border-b border-slate-100 dark:border-slate-800">
            Additional Tags ({remainingTags.length})
          </div>
          <div className="flex flex-wrap gap-1 pt-1">
            {remainingTags.map((t) => (
              <span
                key={t.id}
                style={{
                  backgroundColor: `${t.colorHex}18`,
                  color: t.colorHex,
                  borderColor: `${t.colorHex}30`,
                }}
                className={
                  chipClassName ||
                  'px-2 py-0.5 rounded-md text-xs font-semibold border'
                }
              >
                #{t.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
