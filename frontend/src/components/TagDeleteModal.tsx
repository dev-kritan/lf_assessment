import React, { useState, useEffect } from 'react';
import { AlertTriangle, Trash2, Loader2, Calendar, Globe, Lock, X } from 'lucide-react';
import { Tag, TagUsageData } from '../types';
import { eventsApi } from '../api/events.api';
import { useToast } from '../contexts/ToastContext';
import { format } from 'date-fns';

interface TagDeleteModalProps {
  isOpen: boolean;
  tag: Tag | null;
  onClose: () => void;
  onSuccess: (deletedTag: Tag) => void;
}

export const TagDeleteModal: React.FC<TagDeleteModalProps> = ({
  isOpen,
  tag,
  onClose,
  onSuccess,
}) => {
  const [usageData, setUsageData] = useState<TagUsageData | null>(null);
  const [isLoadingUsage, setIsLoadingUsage] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { success, error } = useToast();

  useEffect(() => {
    if (isOpen && tag) {
      setIsLoadingUsage(true);
      eventsApi
        .getTagUsage(tag.id)
        .then((res) => {
          if (res.success) {
            setUsageData(res.data);
          }
        })
        .catch(() => {
          // If usage endpoint fails, fallback to existing eventCount
          setUsageData({
            tag,
            eventCount: tag.eventCount || 0,
            associatedEvents: [],
          });
        })
        .finally(() => {
          setIsLoadingUsage(false);
        });
    } else {
      setUsageData(null);
    }
  }, [isOpen, tag]);

  if (!isOpen || !tag) return null;

  const eventCount = usageData ? usageData.eventCount : (tag.eventCount || 0);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const res = await eventsApi.deleteTag(tag.id);
      if (res.success) {
        success(`Tag "#${tag.name}" was successfully deleted`);
        onSuccess(tag);
        onClose();
      }
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Failed to delete tag';
      error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-sm">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Delete Tag
                <span
                  style={{ backgroundColor: `${tag.colorHex}20`, color: tag.colorHex }}
                  className="px-2 py-0.5 rounded-full text-xs font-semibold"
                >
                  #{tag.name}
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Confirm tag deletion and review impact
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isDeleting}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Loading Usage State */}
        {isLoadingUsage ? (
          <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
            <span className="text-xs font-medium">Checking associated events...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Warning Message Box */}
            <div
              className={`p-4 rounded-2xl border ${
                eventCount > 0
                  ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200/80 dark:border-amber-900/60 text-amber-900 dark:text-amber-200'
                  : 'bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                  eventCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500'
                }`} />
                <div className="text-xs leading-relaxed">
                  {eventCount > 0 ? (
                    <>
                      <strong className="font-bold">Important Notice:</strong> This tag is currently associated with{' '}
                      <span className="font-extrabold underline">{eventCount} {eventCount === 1 ? 'event' : 'events'}</span>.
                      If you proceed with deletion:
                      <ul className="list-disc list-inside mt-1.5 space-y-0.5 text-amber-800 dark:text-amber-300">
                        <li>The tag will be unlinked from all associated events.</li>
                        <li>You and other users will <strong>no longer be able to filter</strong> these events using this tag.</li>
                        <li>This action cannot be undone.</li>
                      </ul>
                    </>
                  ) : (
                    <>
                      This tag is not linked to any active events. Deleting it will safely remove it from the system without affecting any events.
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* List of Associated Events (if any) */}
            {usageData && usageData.associatedEvents.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Associated Events ({usageData.associatedEvents.length})
                  </span>
                </div>
                <div className="max-h-44 overflow-y-auto space-y-1.5 p-1 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
                  {usageData.associatedEvents.map((evt) => (
                    <div
                      key={evt.id}
                      className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-900 dark:text-white truncate">
                          {evt.title}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(evt.startTime), 'MMM d, yyyy')}
                          </span>
                          {evt.location && <span className="truncate max-w-[120px]">📍 {evt.location}</span>}
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 flex-shrink-0 ${
                        evt.eventType === 'public'
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300'
                      }`}>
                        {evt.eventType === 'public' ? <Globe className="w-2.5 h-2.5" /> : <Lock className="w-2.5 h-2.5" />}
                        {evt.eventType}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting || isLoadingUsage}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-500/20 active:scale-95 transition-all flex items-center gap-1.5"
          >
            {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Yes, Delete Tag
          </button>
        </div>
      </div>
    </div>
  );
};
