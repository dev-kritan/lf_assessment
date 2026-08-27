import React from 'react';
import { AlertTriangle, Trash2, Loader2, Calendar, Users, X } from 'lucide-react';
import { EventItem } from '../types';

interface BulkDeleteConfirmDialogProps {
  isOpen: boolean;
  type: 'created' | 'rsvps';
  selectedEvents: EventItem[];
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const BulkDeleteConfirmDialog: React.FC<BulkDeleteConfirmDialogProps> = ({
  isOpen,
  type,
  selectedEvents,
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen || selectedEvents.length === 0) return null;

  const count = selectedEvents.length;
  const isCreated = type === 'created';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 overflow-hidden animate-scale-in">
        {/* Close Button */}
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with Warning Icon */}
        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 ring-4 ring-rose-500/10">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {isCreated
                ? `Delete ${count} Event${count === 1 ? '' : 's'} Permanently?`
                : `Remove RSVP for ${count} Event${count === 1 ? '' : 's'}?`}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {isCreated
                ? 'This action cannot be undone. All event details, tags, and attendee RSVPs will be permanently erased.'
                : 'Your attendance response will be removed from these events. You can RSVP again later if spots remain.'}
            </p>
          </div>
        </div>

        {/* Selected Items List */}
        <div className="my-4">
          <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              {isCreated ? (
                <Calendar className="w-3.5 h-3.5 text-indigo-500" />
              ) : (
                <Users className="w-3.5 h-3.5 text-emerald-500" />
              )}
              Selected {isCreated ? 'Events' : 'RSVPs'} ({count}):
            </span>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              {count} {count === 1 ? 'item' : 'items'} selected
            </span>
          </div>

          <div className="max-h-60 overflow-y-auto pr-1 space-y-2 rounded-2xl bg-slate-50 dark:bg-slate-800/60 p-3 border border-slate-200/80 dark:border-slate-800">
            {selectedEvents.map((evt) => (
              <div
                key={evt.id}
                className="flex items-center justify-between gap-3 text-xs py-2 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2 h-2 rounded-full bg-rose-500 flex-shrink-0" />
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {evt.title}
                  </span>
                </div>

                {isCreated ? (
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold border flex-shrink-0 ${
                      evt.eventType === 'public'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                        : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                    }`}
                  >
                    {evt.eventType === 'public' ? 'Public' : 'Private'}
                  </span>
                ) : (
                  evt.userRsvp && (
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold border flex-shrink-0 ${
                        evt.userRsvp === 'yes'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                          : evt.userRsvp === 'maybe'
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                          : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                      }`}
                    >
                      {evt.userRsvp === 'yes'
                        ? 'Going'
                        : evt.userRsvp === 'maybe'
                        ? 'Interested'
                        : 'Declined'}
                    </span>
                  )
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Warning Callout */}
        <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 mb-6">
          <p className="text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
            <Trash2 className="w-3.5 h-3.5 flex-shrink-0 text-rose-600 dark:text-rose-400" />
            <span>
              {isCreated
                ? 'Warning: Deleted events cannot be recovered.'
                : 'Warning: You will no longer receive updates or attendee access for these events.'}
            </span>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 shadow-md shadow-rose-500/25 transition-all flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{isCreated ? 'Deleting...' : 'Removing...'}</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>
                  {isCreated ? `Delete ${count} Event${count === 1 ? '' : 's'}` : `Remove ${count} RSVP${count === 1 ? '' : 's'}`}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
