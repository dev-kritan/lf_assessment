import { Check, ChevronDown } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

export interface SelectOption<T extends string | number = string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
  badge?: string;
}

interface CustomSelectProps<T extends string | number = string> {
  value: T;
  onChange: (value: T) => void;
  options: SelectOption<T>[];
  icon?: React.ReactNode;
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
  size?: "sm" | "md";
  placement?: "bottom" | "top" | "auto";
  align?: "left" | "right";
  ariaLabel?: string;
}

export function CustomSelect<T extends string | number = string>({
  value,
  onChange,
  options,
  icon,
  placeholder = "Select...",
  className = "",
  buttonClassName = "",
  menuClassName = "",
  size = "md",
  placement = "auto",
  align = "left",
  ariaLabel,
}: CustomSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [actualPlacement, setActualPlacement] = useState<"top" | "bottom">(
    placement === "top" ? "top" : "bottom"
  );
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Position calculation for placement
  useEffect(() => {
    if (!isOpen) return;

    if (placement === "top") {
      setActualPlacement("top");
      return;
    }
    if (placement === "bottom") {
      setActualPlacement("bottom");
      return;
    }

    // Auto-detect when placement is 'auto'
    if (containerRef.current && typeof window !== "undefined") {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      // If less than 220px below and more space above, open upwards
      if (spaceBelow < 220 && rect.top > spaceBelow) {
        setActualPlacement("top");
      } else {
        setActualPlacement("bottom");
      }
    }
  }, [isOpen, placement]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs rounded-xl gap-1.5",
    md: "px-3.5 py-2.5 text-xs font-semibold rounded-2xl gap-2",
  };

  const placementClasses =
    actualPlacement === "top" ? "bottom-full mb-2" : "top-full mt-2";

  const alignClasses = align === "right" ? "right-0" : "left-0";

  return (
    <div
      className={`relative inline-block ${isOpen ? "z-40" : ""} ${className}`}
      ref={containerRef}
    >
      {/* Trigger Button */}
      <button
        type="button"
        aria-label={ariaLabel || selectedOption?.label || placeholder}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/30 ${
          isOpen ? "ring-2 ring-indigo-500/40 border-indigo-500/50" : ""
        } ${sizeClasses[size]} ${buttonClassName}`}
      >
        <div className="flex items-center gap-2 truncate">
          {selectedOption?.icon || icon}
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 dark:text-slate-500 transition-transform duration-200 flex-shrink-0 ${
            isOpen ? "rotate-180 text-indigo-600 dark:text-indigo-400" : ""
          }`}
        />
      </button>

      {/* Floating Menu Popover */}
      {isOpen && (
        <div
          role="listbox"
          className={`absolute ${alignClasses} ${placementClasses} z-50 min-w-full w-max max-w-[280px] p-1.5 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800/90 shadow-2xl animate-fade-in ${menuClassName}`}
        >
          <div className="flex flex-col gap-0.5 max-h-60 overflow-y-auto">
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  type="button"
                  key={String(opt.value)}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs transition-all text-left ${
                    isSelected
                      ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold"
                      : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/70 font-medium"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {opt.icon && (
                      <span className="flex-shrink-0">{opt.icon}</span>
                    )}
                    <span className="truncate">{opt.label}</span>
                    {opt.badge && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500">
                        {opt.badge}
                      </span>
                    )}
                  </div>
                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 flex-shrink-0 ml-2" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
