import confetti from "canvas-confetti";
import {
  AlertTriangle,
  Check,
  HelpCircle,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { rsvpApi } from "../api/rsvp.api";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { RsvpStats } from "../types";

export interface RsvpButtonGroupProps {
  eventId: number;
  initialStatus?: "yes" | "maybe" | "no" | null;
  stats: RsvpStats;
  capacity?: number | null;
  isPast?: boolean;
  onRsvpSuccess?: (
    newStatus: "yes" | "maybe" | "no",
    updatedStats: RsvpStats,
  ) => void;
  variant?: "card" | "compact";
  className?: string;
}

export const RsvpButtonGroup: React.FC<RsvpButtonGroupProps> = ({
  eventId,
  initialStatus = null,
  stats,
  capacity,
  isPast = false,
  onRsvpSuccess,
  variant = "card",
  className = "",
}) => {
  const [currentStatus, setCurrentStatus] = useState<
    "yes" | "maybe" | "no" | null
  >(initialStatus);
  const [currentStats, setCurrentStats] = useState<RsvpStats>(stats);
  const [isLoading, setIsLoading] = useState(false);

  const { isAuthenticated } = useAuth();
  const { success, error, info } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const isFull = capacity ? currentStats.yes >= capacity : false;
  const fillPercent = capacity
    ? Math.min(100, Math.round((currentStats.yes / capacity) * 100))
    : 0;

  const hasAutoRsvpdRef = useRef(false);

  // Synchronize state when props update
  useEffect(() => {
    if (initialStatus !== undefined) {
      setCurrentStatus(initialStatus);
    }
  }, [initialStatus]);

  useEffect(() => {
    setCurrentStats(stats);
  }, [stats]);

  const handleRsvp = async (status: "yes" | "maybe" | "no") => {
    if (!isAuthenticated) {
      info(`Please sign in to RSVP "${status === 'yes' ? 'Going' : status === 'maybe' ? 'Maybe' : 'Can\'t Go'}"`);
      const targetParams = new URLSearchParams(location.search);
      targetParams.set('auto_rsvp', status);
      const targetUrl = `${location.pathname}?${targetParams.toString()}`;
      navigate(`/login?redirect=${encodeURIComponent(targetUrl)}`);
      return;
    }

    if (isPast) {
      info("This event has already ended. RSVPs are closed.");
      return;
    }

    if (status === "yes" && isFull && currentStatus !== "yes") {
      error(
        'This event has reached full capacity. You can still RSVP as "Maybe".',
      );
      return;
    }

    try {
      setIsLoading(true);
      const res = await rsvpApi.setRsvp(eventId, status);
      if (res.success) {
        setCurrentStatus(status);
        setCurrentStats(res.data.rsvpStats);
        success(res.data.message);

        if (status === "yes") {
          confetti({
            particleCount: 60,
            spread: 55,
            origin: { y: 0.8 },
            colors: ["#6366f1", "#ec4899", "#10b981", "#f59e0b"],
          });
        }

        if (onRsvpSuccess) {
          onRsvpSuccess(status, res.data.rsvpStats);
        }
      }
    } catch (err: any) {
      error(err.response?.data?.error?.message || "Failed to submit RSVP");
    } finally {
      setIsLoading(false);
    }
  };

  // Intent-preserving Auto-RSVP post login
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const autoRsvpParam = searchParams.get('auto_rsvp') as "yes" | "maybe" | "no" | null;

    if (
      isAuthenticated &&
      autoRsvpParam &&
      ["yes", "maybe", "no"].includes(autoRsvpParam) &&
      !hasAutoRsvpdRef.current
    ) {
      hasAutoRsvpdRef.current = true;

      // Clean the query parameter from URL history cleanly
      const newParams = new URLSearchParams(location.search);
      newParams.delete('auto_rsvp');
      const newQuery = newParams.toString() ? `?${newParams.toString()}` : '';
      navigate(`${location.pathname}${newQuery}`, { replace: true });

      // Automatically execute RSVP with preserved intent
      handleRsvp(autoRsvpParam);
    }
  }, [isAuthenticated, location.search, location.pathname, navigate]);

  const isCard = variant === "card";

  return (
    <div
      className={`${
        isCard
          ? "rounded-3xl glass-card p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-md"
          : "w-full"
      } ${className}`}
    >
      {/* Header & Capacity section */}
      {isCard && (
        <div className="mb-4">
          <div className="flex items-center justify-between gap-2 mb-2">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Users className="w-4 h-4 text-indigo-500 flex-shrink-0" />
              <span>RSVP</span>
            </h4>

            {capacity ? (
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  isFull
                    ? "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
                    : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                }`}
              >
                {currentStats.yes} / {capacity} spots
              </span>
            ) : (
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {currentStats.yes} attending
              </span>
            )}
          </div>

          {/* Mini Capacity Progress Bar */}
          {capacity && (
            <div className="w-full bg-slate-100 dark:bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  isFull
                    ? "bg-rose-500"
                    : fillPercent > 80
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                }`}
                style={{ width: `${fillPercent}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* Full capacity warning */}
      {isFull && currentStatus !== "yes" && (
        <div className="mb-3 p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 flex items-center gap-2 text-xs text-amber-800 dark:text-amber-300">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
          <span className="text-[11px] leading-tight">
            Capacity reached. You can still RSVP as <strong>Maybe</strong>!
          </span>
        </div>
      )}

      {/* Action Buttons: Responsive & Ergonomic Grid */}
      <div className="flex flex-col gap-y-2">
        {/* Yes / Going Button */}
        <button
          type="button"
          onClick={() => handleRsvp("yes")}
          disabled={isLoading || (isFull && currentStatus !== "yes")}
          className={`relative flex items-center justify-between px-2.5 py-2 sm:px-3 sm:py-2.5 rounded-xl border text-xs font-semibold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
            currentStatus === "yes"
              ? "bg-emerald-600 border-emerald-600 text-white shadow-sm shadow-emerald-500/20 ring-2 ring-emerald-400/40"
              : "border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/80 text-slate-700 dark:text-slate-200 hover:border-emerald-500/60 hover:text-emerald-600 dark:hover:text-emerald-400"
          }`}
          title="Going"
        >
          <span className="flex items-center gap-1 min-w-0 truncate">
            <Check className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">Going</span>
          </span>
          <span
            className={`ml-1 px-1.5 py-0.2 rounded-md text-[10px] font-bold ${
              currentStatus === "yes"
                ? "bg-emerald-700/60 text-white"
                : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
            }`}
          >
            {currentStats.yes}
          </span>
        </button>

        {/* Maybe / Interested Button */}
        <button
          type="button"
          onClick={() => handleRsvp("maybe")}
          disabled={isLoading}
          className={`relative flex items-center justify-between px-2.5 py-2 sm:px-3 sm:py-2.5 rounded-xl border text-xs font-semibold transition-all active:scale-95 disabled:opacity-50 ${
            currentStatus === "maybe"
              ? "bg-amber-500 border-amber-500 text-white shadow-sm shadow-amber-500/20 ring-2 ring-amber-400/40"
              : "border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/80 text-slate-700 dark:text-slate-200 hover:border-amber-500/60 hover:text-amber-600 dark:hover:text-amber-400"
          }`}
          title="Maybe"
        >
          <span className="flex items-center gap-1 min-w-0 truncate">
            <HelpCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">Maybe</span>
          </span>
          <span
            className={`ml-1 px-1.5 py-0.2 rounded-md text-[10px] font-bold ${
              currentStatus === "maybe"
                ? "bg-amber-600/60 text-white"
                : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
            }`}
          >
            {currentStats.maybe}
          </span>
        </button>

        {/* No / Can't Go Button */}
        <button
          type="button"
          onClick={() => handleRsvp("no")}
          disabled={isLoading}
          className={`relative flex items-center justify-between px-2.5 py-2 sm:px-3 sm:py-2.5 rounded-xl border text-xs font-semibold transition-all active:scale-95 disabled:opacity-50 ${
            currentStatus === "no"
              ? "bg-rose-600 border-rose-600 text-white shadow-sm shadow-rose-500/20 ring-2 ring-rose-400/40"
              : "border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/80 text-slate-700 dark:text-slate-200 hover:border-rose-500/60 hover:text-rose-600 dark:hover:text-rose-400"
          }`}
          title="Can't Go"
        >
          <span className="flex items-center gap-1 min-w-0 truncate">
            <X className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">No</span>
          </span>
          <span
            className={`ml-1 px-1.5 py-0.2 rounded-md text-[10px] font-bold ${
              currentStatus === "no"
                ? "bg-rose-700/60 text-white"
                : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
            }`}
          >
            {currentStats.no}
          </span>
        </button>
      </div>

      {/* Current RSVP feedback status */}
      {currentStatus && (
        <div className="mt-2.5 flex items-center justify-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
          <Sparkles className="w-3 h-3 text-indigo-500" />
          <span>You responded:</span>
          <span
            className={`font-bold capitalize ${
              currentStatus === "yes"
                ? "text-emerald-600 dark:text-emerald-400"
                : currentStatus === "maybe"
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-rose-600 dark:text-rose-400"
            }`}
          >
            {currentStatus === "yes"
              ? "Going"
              : currentStatus === "maybe"
                ? "Maybe"
                : "Not Going"}
          </span>
        </div>
      )}
    </div>
  );
};

export default RsvpButtonGroup;
