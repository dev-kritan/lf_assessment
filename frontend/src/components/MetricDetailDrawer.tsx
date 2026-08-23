import React, { useEffect, useRef } from 'react';
import { 
  X, 
  Calendar, 
  Users, 
  Tag as TagIcon, 
  Flame, 
  ArrowRight, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  HelpCircle, 
  XCircle,
  ExternalLink,
  Sparkles,
  Edit2,
  Trash2
} from 'lucide-react';
import { EventItem, Tag } from '../types';
import { format, parseISO } from 'date-fns';
import { Link } from 'react-router-dom';

export type MetricType = 'upcoming' | 'rsvps' | 'categories' | 'past';

interface MetricDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  metricType: MetricType | null;
  metrics: {
    totalEvents: number;
    upcomingEvents: number;
    pastEvents: number;
    totalRsvps: number;
    totalTags: number;
  };
  events: EventItem[];
  tags: Tag[];
  onFilterTimeframe?: (tf: 'all' | 'upcoming' | 'past') => void;
  onFilterTag?: (tag: string) => void;
  onEditTag?: (tag: Tag) => void;
  onDeleteTag?: (tag: Tag) => void;
}

export const MetricDetailDrawer: React.FC<MetricDetailDrawerProps> = ({
  isOpen,
  onClose,
  metricType,
  metrics,
  events,
  tags,
  onFilterTimeframe,
  onFilterTag,
  onEditTag,
  onDeleteTag,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !metricType) return null;

  // Derive metrics & previews
  const upcomingEventsList = events.filter((e) => !e.isPast);
  const pastEventsList = events.filter((e) => e.isPast);

  // Aggregate RSVP breakdown from loaded events
  const aggregatedRsvps = events.reduce(
    (acc, evt) => {
      acc.yes += evt.rsvpStats?.yes || 0;
      acc.maybe += evt.rsvpStats?.maybe || 0;
      acc.no += evt.rsvpStats?.no || 0;
      return acc;
    },
    { yes: 0, maybe: 0, no: 0 }
  );

  const totalLoadedRsvps = aggregatedRsvps.yes + aggregatedRsvps.maybe + aggregatedRsvps.no;
  const yesPercentage = totalLoadedRsvps > 0 ? Math.round((aggregatedRsvps.yes / totalLoadedRsvps) * 100) : 0;
  const maybePercentage = totalLoadedRsvps > 0 ? Math.round((aggregatedRsvps.maybe / totalLoadedRsvps) * 100) : 0;
  const noPercentage = totalLoadedRsvps > 0 ? Math.round((aggregatedRsvps.no / totalLoadedRsvps) * 100) : 0;

  const metricConfig = {
    upcoming: {
      title: 'Upcoming Events',
      subtitle: 'Events currently active and scheduled on the platform',
      badge: `${metrics.upcomingEvents} Scheduled`,
      icon: <Calendar className="w-6 h-6 text-white" />,
      colorClass: 'bg-gradient-to-tr from-indigo-600 to-indigo-500',
      badgeClass: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300',
    },
    rsvps: {
      title: 'Total RSVPs & Engagement',
      subtitle: 'Community attendance responses and participation metrics',
      badge: `${metrics.totalRsvps} Responses`,
      icon: <Users className="w-6 h-6 text-white" />,
      colorClass: 'bg-gradient-to-tr from-emerald-600 to-emerald-500',
      badgeClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300',
    },
    categories: {
      title: 'Categories & Tags',
      subtitle: 'Filterable tags and topics organizing gatherings',
      badge: `${metrics.totalTags} Categories`,
      icon: <TagIcon className="w-6 h-6 text-white" />,
      colorClass: 'bg-gradient-to-tr from-amber-600 to-amber-500',
      badgeClass: 'bg-amber-50 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300',
    },
    past: {
      title: 'Past Events Archive',
      subtitle: 'Historical records of previously hosted events',
      badge: `${metrics.pastEvents} Archived`,
      icon: <Flame className="w-6 h-6 text-white" />,
      colorClass: 'bg-gradient-to-tr from-purple-600 to-purple-500',
      badgeClass: 'bg-purple-50 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300',
    },
  };

  const currentConfig = metricConfig[metricType];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Container: Dialog on Mobile (< lg) / Sidebar Drawer on Desktop (lg+) */}
      <div className="fixed inset-0 pointer-events-none flex lg:justify-end items-center lg:items-stretch justify-center p-4 lg:p-0">
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label={currentConfig.title}
          className="pointer-events-auto w-full max-w-lg lg:max-w-md lg:w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl lg:shadow-2xl rounded-3xl lg:rounded-none lg:rounded-l-3xl max-h-[90vh] lg:max-h-full flex flex-col justify-between overflow-hidden animate-fade-in lg:animate-slide-left"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4 bg-slate-50/50 dark:bg-slate-950/30">
            <div className="flex items-center gap-3.5">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-md flex-shrink-0 ${currentConfig.colorClass}`}>
                {currentConfig.icon}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                    {currentConfig.title}
                  </h2>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {currentConfig.subtitle}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close panel"
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Content Body */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            {/* KPI Highlight Card */}
            <div className="glass-card rounded-2xl p-4 border border-slate-200/70 dark:border-slate-800/70 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Global Stat Metric
                </span>
                <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                  {metricType === 'upcoming' && metrics.upcomingEvents}
                  {metricType === 'rsvps' && metrics.totalRsvps}
                  {metricType === 'categories' && metrics.totalTags}
                  {metricType === 'past' && metrics.pastEvents}
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${currentConfig.badgeClass}`}>
                {currentConfig.badge}
              </span>
            </div>

            {/* Upcoming Events View */}
            {metricType === 'upcoming' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Next Upcoming Previews
                  </h3>
                  <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
                    {upcomingEventsList.length} loaded
                  </span>
                </div>

                {upcomingEventsList.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">No upcoming events currently loaded.</p>
                ) : (
                  <div className="space-y-2.5">
                    {upcomingEventsList.slice(0, 4).map((evt) => {
                      const startDate = parseISO(evt.startTime);
                      return (
                        <Link
                          key={evt.id}
                          to={`/events/${evt.id}`}
                          onClick={onClose}
                          className="group block p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800/80 hover:border-indigo-500/40 bg-slate-50/40 dark:bg-slate-950/40 hover:bg-white dark:hover:bg-slate-800 transition-all shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                              {evt.title}
                            </h4>
                            <ExternalLink className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                          </div>
                          <div className="mt-1 flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-indigo-500" />
                              {format(startDate, 'MMM dd, yyyy')}
                            </span>
                            {evt.location && (
                              <span className="flex items-center gap-1 truncate">
                                <MapPin className="w-3 h-3 text-rose-500" />
                                {evt.location}
                              </span>
                            )}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Total RSVPs View */}
            {metricType === 'rsvps' && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Community Response Breakdown
                </h3>

                <div className="space-y-3">
                  {/* Going (Yes) */}
                  <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/60">
                    <div className="flex items-center justify-between text-xs font-bold text-emerald-800 dark:text-emerald-300 mb-1.5">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Confirmed Going (Yes)
                      </span>
                      <span>{aggregatedRsvps.yes} ({yesPercentage}%)</span>
                    </div>
                    <div className="w-full h-2 bg-emerald-200/60 dark:bg-emerald-950 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${yesPercentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Interested (Maybe) */}
                  <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/60">
                    <div className="flex items-center justify-between text-xs font-bold text-amber-800 dark:text-amber-300 mb-1.5">
                      <span className="flex items-center gap-1.5">
                        <HelpCircle className="w-4 h-4 text-amber-600" />
                        Interested (Maybe)
                      </span>
                      <span>{aggregatedRsvps.maybe} ({maybePercentage}%)</span>
                    </div>
                    <div className="w-full h-2 bg-amber-200/60 dark:bg-amber-950 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full transition-all duration-500"
                        style={{ width: `${maybePercentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Declined (No) */}
                  <div className="p-3.5 rounded-2xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/60">
                    <div className="flex items-center justify-between text-xs font-bold text-rose-800 dark:text-rose-300 mb-1.5">
                      <span className="flex items-center gap-1.5">
                        <XCircle className="w-4 h-4 text-rose-600" />
                        Declined (No)
                      </span>
                      <span>{aggregatedRsvps.no} ({noPercentage}%)</span>
                    </div>
                    <div className="w-full h-2 bg-rose-200/60 dark:bg-rose-950 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-rose-500 rounded-full transition-all duration-500"
                        style={{ width: `${noPercentage}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/50 text-[11px] text-slate-500 dark:text-slate-400">
                  💡 Real-time engagement is tracked automatically when community members RSVP to events.
                </div>
              </div>
            )}

            {/* Categories View */}
            {metricType === 'categories' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    All System Tags ({tags.length})
                  </h3>
                  <span className="text-[11px] text-slate-400">Click to filter</span>
                </div>

                <div className="flex flex-wrap gap-2 max-h-72 overflow-y-auto p-1">
                  {tags.map((t) => (
                    <div
                      key={t.id}
                      style={{
                        backgroundColor: `${t.colorHex}18`,
                        color: t.colorHex,
                        borderColor: `${t.colorHex}35`,
                      }}
                      className="group px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          if (onFilterTag) {
                            onFilterTag(t.name);
                          }
                          onClose();
                        }}
                        className="flex items-center gap-1.5 cursor-pointer hover:underline focus:outline-none"
                      >
                        <span>#{t.name}</span>
                        {t.eventCount !== undefined && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/60 dark:bg-slate-900/60">
                            {t.eventCount}
                          </span>
                        )}
                      </button>

                      {(onEditTag || onDeleteTag) && (
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity ml-1">
                          {onEditTag && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditTag(t);
                              }}
                              title={`Edit tag #${t.name}`}
                              aria-label={`Edit tag ${t.name}`}
                              className="p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/20 transition-colors"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          )}
                          {onDeleteTag && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteTag(t);
                              }}
                              title={`Delete tag #${t.name}`}
                              aria-label={`Delete tag ${t.name}`}
                              className="p-1 rounded-lg hover:bg-rose-500 hover:text-white transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Past Events View */}
            {metricType === 'past' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Previously Concluded Events
                  </h3>
                  <span className="text-xs text-purple-600 dark:text-purple-400 font-semibold">
                    {pastEventsList.length} loaded
                  </span>
                </div>

                {pastEventsList.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">No past events currently loaded.</p>
                ) : (
                  <div className="space-y-2.5">
                    {pastEventsList.slice(0, 4).map((evt) => {
                      const startDate = parseISO(evt.startTime);
                      return (
                        <Link
                          key={evt.id}
                          to={`/events/${evt.id}`}
                          onClick={onClose}
                          className="group block p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800/80 hover:border-purple-500/40 bg-slate-50/40 dark:bg-slate-950/40 hover:bg-white dark:hover:bg-slate-800 transition-all shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors line-clamp-1">
                              {evt.title}
                            </h4>
                            <ExternalLink className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                          </div>
                          <div className="mt-1 flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-purple-500" />
                              {format(startDate, 'MMM dd, yyyy')}
                            </span>
                            {evt.location && (
                              <span className="flex items-center gap-1 truncate">
                                <MapPin className="w-3 h-3 text-rose-500" />
                                {evt.location}
                              </span>
                            )}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Action Bar */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 flex items-center justify-between gap-3">
            {metricType === 'upcoming' && (
              <button
                type="button"
                onClick={() => {
                  if (onFilterTimeframe) onFilterTimeframe('upcoming');
                  onClose();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 flex items-center justify-center gap-1.5 transition-all"
              >
                <span>Filter by Upcoming Events</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {metricType === 'past' && (
              <button
                type="button"
                onClick={() => {
                  if (onFilterTimeframe) onFilterTimeframe('past');
                  onClose();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-500/20 flex items-center justify-center gap-1.5 transition-all"
              >
                <span>Browse Past Events Archive</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {(metricType === 'rsvps' || metricType === 'categories') && (
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all"
              >
                Done / Close
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
