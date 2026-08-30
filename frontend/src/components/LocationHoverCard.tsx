import React, { useState, useRef, useEffect, useContext } from 'react';
import { MapPin, ExternalLink, Copy, Check, Navigation } from 'lucide-react';
import { parseLocation } from '../utils/location.util';
import { ToastContext } from '../contexts/ToastContext';

export interface LocationHoverCardProps {
  location?: string | null;
  isRestricted?: boolean | null;
  className?: string;
  variant?: 'card' | 'detail';
}

export const LocationHoverCard: React.FC<LocationHoverCardProps> = ({
  location,
  isRestricted = false,
  className = '',
  variant = 'card',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const toastContext = useContext(ToastContext);
  const parsed = parseLocation(location);

  const handleMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    if (!isRestricted && location) {
      setIsOpen(true);
    }
  };

  const handleMouseLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 200);
  };

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const textToCopy = parsed.fullLocation || parsed.mapUrl;
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      toastContext?.success?.(parsed.isMapUrl ? 'Map URL copied to clipboard!' : 'Location address copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isRestricted) {
    return (
      <div className={`flex items-center gap-2 truncate ${className}`}>
        <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
        <span className="truncate text-slate-500 dark:text-slate-400">
          Private Location • Verified Members Only
        </span>
      </div>
    );
  }

  if (variant === 'detail') {
    return (
      <div
        ref={containerRef}
        className={`relative inline-block max-w-full ${isOpen ? 'z-50' : 'z-auto'} ${className}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="flex flex-col min-w-0 max-w-full">
          <span
            className="text-sm font-bold text-slate-900 dark:text-white truncate block max-w-[180px] sm:max-w-[220px] md:max-w-[260px]"
            title={parsed.displayText}
          >
            {parsed.displayText}
          </span>
          {parsed.mapUrl && (
            <a
              href={parsed.mapUrl}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold mt-1"
            >
              Open in Google Maps <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        {/* Floating Glassmorphic Hover Card for Detail Page */}
        {isOpen && (
          <div
            className="absolute left-0 top-full mt-2 z-[999] w-72 sm:w-80 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 shadow-2xl p-4 animate-in fade-in zoom-in-95 duration-150 pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-100 dark:border-slate-800/80">
              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-200/60 dark:border-indigo-800/60">
                <Navigation className="w-3 h-3" />
                {parsed.isMapUrl ? 'Shared Map Link' : 'Venue Location'}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Copy Address / URL"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <p className="text-xs font-medium text-slate-800 dark:text-slate-200 break-all select-all font-mono leading-relaxed bg-slate-50 dark:bg-slate-950/80 p-2 rounded-xl border border-slate-100 dark:border-slate-800/60">
              {parsed.fullLocation}
            </p>

            {parsed.mapUrl && (
              <div className="mt-3 flex items-center justify-end gap-2">
                <a
                  href={parsed.mapUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-colors"
                >
                  <span>Launch Maps</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Card Variant (default for EventCard)
  return (
    <div
      ref={containerRef}
      className={`relative inline-flex items-center max-w-full ${isOpen ? 'z-50' : 'z-auto'} ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex items-center gap-2 max-w-full group/loc cursor-pointer">
        <MapPin className="w-4 h-4 text-rose-500 flex-shrink-0 transition-transform group-hover/loc:scale-110" />
        <span className="truncate text-xs text-slate-600 dark:text-slate-300 group-hover/loc:text-indigo-600 dark:group-hover/loc:text-indigo-400 transition-colors">
          {parsed.displayText}
        </span>
        {parsed.isMapUrl && (
          <ExternalLink className="w-3 h-3 text-slate-400 group-hover/loc:text-indigo-500 flex-shrink-0 opacity-70" />
        )}
      </div>

      {/* Modern Interactive Glassmorphic Hover Card */}
      {isOpen && (
        <div
          className="absolute left-0 bottom-full mb-2 z-[999] w-72 sm:w-80 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 shadow-2xl p-3.5 animate-in fade-in zoom-in-95 duration-150 pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-md border border-rose-200/60 dark:border-rose-900/60">
                <Navigation className="w-2.5 h-2.5" />
                {parsed.isMapUrl ? 'Google Maps Link' : 'Venue Location'}
              </span>
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-500" />
                  <span className="text-emerald-500 text-[10px]">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span className="text-[10px]">Copy</span>
                </>
              )}
            </button>
          </div>

          {/* Body */}
          <div className="bg-slate-50 dark:bg-slate-950/80 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80 mb-3">
            <p className="text-[11px] font-mono text-slate-700 dark:text-slate-300 break-all select-all leading-relaxed">
              {parsed.fullLocation}
            </p>
          </div>

          {/* Action Link */}
          {parsed.mapUrl && (
            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-slate-400">Click to navigate</span>
              <a
                href={parsed.mapUrl}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-colors"
              >
                <span>Open in Maps</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
