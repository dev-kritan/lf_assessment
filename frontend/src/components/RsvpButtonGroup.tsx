import React, { useState } from 'react';
import { Check, HelpCircle, X, Users, AlertTriangle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { rsvpApi } from '../api/rsvp.api';
import { RsvpStats } from '../types';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface RsvpButtonGroupProps {
  eventId: number;
  initialStatus?: 'yes' | 'maybe' | 'no' | null;
  stats: RsvpStats;
  capacity?: number | null;
  isPast?: boolean;
  onRsvpSuccess?: (newStatus: 'yes' | 'maybe' | 'no', updatedStats: RsvpStats) => void;
}

export const RsvpButtonGroup: React.FC<RsvpButtonGroupProps> = ({
  eventId,
  initialStatus = null,
  stats,
  capacity,
  isPast = false,
  onRsvpSuccess,
}) => {
  const [currentStatus, setCurrentStatus] = useState<'yes' | 'maybe' | 'no' | null>(initialStatus);
  const [currentStats, setCurrentStats] = useState<RsvpStats>(stats);
  const [isLoading, setIsLoading] = useState(false);

  const { isAuthenticated } = useAuth();
  const { success, error, info } = useToast();
  const navigate = useNavigate();

  const isFull = capacity ? currentStats.yes >= capacity : false;

  const handleRsvp = async (status: 'yes' | 'maybe' | 'no') => {
    if (!isAuthenticated) {
      info('Please sign in to RSVP for this event');
      navigate('/login');
      return;
    }

    if (isPast) {
      info('This event has already ended. RSVPs are closed.');
      return;
    }

    if (status === 'yes' && isFull && currentStatus !== 'yes') {
      error('This event has reached full capacity. You can still RSVP as "Maybe".');
      return;
    }

    try {
      setIsLoading(true);
      const res = await rsvpApi.setRsvp(eventId, status);
      if (res.success) {
        setCurrentStatus(status);
        setCurrentStats(res.data.rsvpStats);
        success(res.data.message);

        if (status === 'yes') {
          // Celebrate with confetti effect
          confetti({
            particleCount: 75,
            spread: 60,
            origin: { y: 0.8 },
            colors: ['#6366f1', '#ec4899', '#10b981', '#f59e0b'],
          });
        }

        if (onRsvpSuccess) {
          onRsvpSuccess(status, res.data.rsvpStats);
        }
      }
    } catch (err: any) {
      error(err.response?.data?.error?.message || 'Failed to submit RSVP');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-3xl glass-card p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Users className="w-4 h-4 text-indigo-500" />
            RSVP for this Event
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Let the organizers and community know if you are coming.
          </p>
        </div>

        {capacity && (
          <div className="text-right">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
              isFull
                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
            }`}>
              {currentStats.yes} / {capacity} spots
            </span>
          </div>
        )}
      </div>

      {isFull && currentStatus !== 'yes' && (
        <div className="mb-3.5 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-center gap-2 text-xs text-amber-800 dark:text-amber-300">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-600" />
          <span>Event is at capacity. You can still RSVP as <strong>Maybe</strong> to stay updated!</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-3 gap-2.5">
        {/* Yes Button */}
        <button
          onClick={() => handleRsvp('yes')}
          disabled={isLoading || (isFull && currentStatus !== 'yes')}
          className={`relative flex flex-col items-center justify-center p-3 rounded-2xl border font-semibold text-xs transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
            currentStatus === 'yes'
              ? 'bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-500/20 ring-2 ring-emerald-400/40'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400'
          }`}
        >
          <div className="flex items-center gap-1">
            <Check className="w-4 h-4" />
            <span>Going</span>
          </div>
          <span className={`mt-1 text-[11px] font-bold ${
            currentStatus === 'yes' ? 'text-emerald-100' : 'text-slate-400 dark:text-slate-500'
          }`}>
            {currentStats.yes}
          </span>
        </button>

        {/* Maybe Button */}
        <button
          onClick={() => handleRsvp('maybe')}
          disabled={isLoading}
          className={`relative flex flex-col items-center justify-center p-3 rounded-2xl border font-semibold text-xs transition-all active:scale-95 disabled:opacity-50 ${
            currentStatus === 'maybe'
              ? 'bg-amber-500 border-amber-500 text-white shadow-md shadow-amber-500/20 ring-2 ring-amber-400/40'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-amber-500 hover:text-amber-600 dark:hover:text-amber-400'
          }`}
        >
          <div className="flex items-center gap-1">
            <HelpCircle className="w-4 h-4" />
            <span>Interested</span>
          </div>
          <span className={`mt-1 text-[11px] font-bold ${
            currentStatus === 'maybe' ? 'text-amber-100' : 'text-slate-400 dark:text-slate-500'
          }`}>
            {currentStats.maybe}
          </span>
        </button>

        {/* No Button */}
        <button
          onClick={() => handleRsvp('no')}
          disabled={isLoading}
          className={`relative flex flex-col items-center justify-center p-3 rounded-2xl border font-semibold text-xs transition-all active:scale-95 disabled:opacity-50 ${
            currentStatus === 'no'
              ? 'bg-rose-600 border-rose-600 text-white shadow-md shadow-rose-500/20 ring-2 ring-rose-400/40'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-rose-500 hover:text-rose-600 dark:hover:text-rose-400'
          }`}
        >
          <div className="flex items-center gap-1">
            <X className="w-4 h-4" />
            <span>Can't Go</span>
          </div>
          <span className={`mt-1 text-[11px] font-bold ${
            currentStatus === 'no' ? 'text-rose-100' : 'text-slate-400 dark:text-slate-500'
          }`}>
            {currentStats.no}
          </span>
        </button>
      </div>

      {currentStatus && (
        <div className="mt-3 text-center text-xs text-slate-500 dark:text-slate-400">
          Your current RSVP: <span className="font-bold uppercase text-indigo-600 dark:text-indigo-400">{currentStatus}</span>
        </div>
      )}
    </div>
  );
};
