import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Sparkles,
  Calendar,
  Users,
  Tag as TagIcon,
  PlusCircle,
  Layers,
  Flame,
  Loader2,
  CalendarX2,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { EventItem, Tag, PaginationMeta } from "../types";
import { eventsApi } from "../api/events.api";
import { EventCard } from "../components/EventCard";
import { FilterBar } from "../components/FilterBar";
import { Pagination } from "../components/Pagination";
import { StatCard } from "../components/StatCard";
import {
  MetricDetailDrawer,
  MetricType,
  clearDrawerEventsCache,
} from "../components/MetricDetailDrawer";
import { EventFormModal } from "../components/EventFormModal";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { TagEditModal } from "../components/TagEditModal";
import { TagDeleteModal } from "../components/TagDeleteModal";
import { useToast } from "../contexts/ToastContext";
import { useAuth } from "../contexts/AuthContext";
import { Link, useSearchParams } from "react-router-dom";
import { PAGINATION_LIMITS } from "../constants";

export const EventListPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read initial query params from URL
  const initialPage = Math.max(
    1,
    parseInt(searchParams.get("page") || "1", 10) || 1
  );
  const initialLimit =
    parseInt(
      searchParams.get("limit") || `${PAGINATION_LIMITS.EVENT_LIST_DEFAULT}`,
      10
    ) || PAGINATION_LIMITS.EVENT_LIST_DEFAULT;
  const initialSearch = searchParams.get("search") || "";
  const initialTimeframe =
    (searchParams.get("timeframe") as "all" | "upcoming" | "past") || "all";
  const initialEventType =
    (searchParams.get("event_type") as "all" | "public" | "private") || "all";
  const initialTag = searchParams.get("tag") || "";
  const initialSort =
    (searchParams.get("sort_by") as "date" | "popularity" | "created_at") ||
    "date";

  const [events, setEvents] = useState<EventItem[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [metrics, setMetrics] = useState<{
    totalEvents: number;
    upcomingEvents: number;
    pastEvents: number;
    totalRsvps: number;
    totalTags: number;
  } | null>(null);

  const [activeMetricDetail, setActiveMetricDetail] =
    useState<MetricType | null>(null);

  const [pagination, setPagination] = useState<PaginationMeta>({
    page: initialPage,
    limit: initialLimit,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  // Filter States
  const [search, setSearch] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [timeframe, setTimeframe] =
    useState<"all" | "upcoming" | "past">(initialTimeframe);
  const [eventType, setEventType] =
    useState<"all" | "public" | "private">(initialEventType);
  const [selectedTag, setSelectedTag] = useState(initialTag);
  const [sortBy, setSortBy] =
    useState<"date" | "popularity" | "created_at">(initialSort);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<EventItem | null>(null);
  const [eventToDelete, setEventToDelete] = useState<EventItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Tag Management State
  const [tagToEdit, setTagToEdit] = useState<Tag | null>(null);
  const [tagToDelete, setTagToDelete] = useState<Tag | null>(null);

  const { isAuthenticated, user } = useAuth();
  const { success, error } = useToast();

  // Helper to synchronize state with URL search params
  const updateUrlParams = (paramsToUpdate: {
    page?: number;
    limit?: number;
    search?: string;
    timeframe?: string;
    event_type?: string;
    tag?: string;
    sort_by?: string;
  }) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);

        // Page
        if (paramsToUpdate.page !== undefined) {
          if (paramsToUpdate.page > 1) {
            next.set("page", String(paramsToUpdate.page));
          } else {
            next.delete("page");
          }
        }

        // Limit
        if (paramsToUpdate.limit !== undefined) {
          if (paramsToUpdate.limit !== PAGINATION_LIMITS.EVENT_LIST_DEFAULT) {
            next.set("limit", String(paramsToUpdate.limit));
          } else {
            next.delete("limit");
          }
        }

        // Search
        if (paramsToUpdate.search !== undefined) {
          if (paramsToUpdate.search.trim()) {
            next.set("search", paramsToUpdate.search.trim());
          } else {
            next.delete("search");
          }
        }

        // Timeframe
        if (paramsToUpdate.timeframe !== undefined) {
          if (paramsToUpdate.timeframe && paramsToUpdate.timeframe !== "all") {
            next.set("timeframe", paramsToUpdate.timeframe);
          } else {
            next.delete("timeframe");
          }
        }

        // Event Type
        if (paramsToUpdate.event_type !== undefined) {
          if (
            paramsToUpdate.event_type &&
            paramsToUpdate.event_type !== "all"
          ) {
            next.set("event_type", paramsToUpdate.event_type);
          } else {
            next.delete("event_type");
          }
        }

        // Tag
        if (paramsToUpdate.tag !== undefined) {
          if (paramsToUpdate.tag.trim()) {
            next.set("tag", paramsToUpdate.tag.trim());
          } else {
            next.delete("tag");
          }
        }

        // Sort By
        if (paramsToUpdate.sort_by !== undefined) {
          if (paramsToUpdate.sort_by && paramsToUpdate.sort_by !== "date") {
            next.set("sort_by", paramsToUpdate.sort_by);
          } else {
            next.delete("sort_by");
          }
        }

        return next;
      },
      { replace: true }
    );
  };

  const isFirstSearchEffect = useRef(true);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Sync debounced search with URL and reset page
  useEffect(() => {
    if (isFirstSearchEffect.current) {
      isFirstSearchEffect.current = false;
      return;
    }
    setPagination((prev) => ({ ...prev, page: 1 }));
    updateUrlParams({ search: debouncedSearch, page: 1 });
  }, [debouncedSearch]);

  // Fetch Tags and Metrics with active filter context
  const fetchTagsAndMetrics = useCallback(async () => {
    try {
      const [tagsRes, metricsRes] = await Promise.all([
        eventsApi.getTags({
          event_type: eventType !== "all" ? eventType : undefined,
          timeframe: timeframe !== "all" ? timeframe : undefined,
          search: debouncedSearch || undefined,
        }),
        eventsApi.getMetrics(),
      ]);
      if (tagsRes.success) setTags(tagsRes.data);
      if (metricsRes.success) setMetrics(metricsRes.data);
    } catch {
      // Non-blocking
    }
  }, [eventType, timeframe, debouncedSearch, isAuthenticated, user]);

  useEffect(() => {
    fetchTagsAndMetrics();
  }, [fetchTagsAndMetrics]);

  // Fetch Events from Server with Pagination & Filter parameters
  const fetchEvents = useCallback(async () => {
    try {
      setIsLoading(true);
      setFetchError(null);
      const res = await eventsApi.getEvents({
        page: pagination.page,
        limit: pagination.limit,
        search: debouncedSearch || undefined,
        timeframe,
        event_type: eventType,
        tag: selectedTag || undefined,
        sort_by: sortBy,
      });

      if (res.success) {
        setEvents(res.data);
        if (res.meta) {
          setPagination(res.meta);
        }
      }
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || "Failed to load events. Please try again.";
      setFetchError(msg);
      error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [
    pagination.page,
    pagination.limit,
    debouncedSearch,
    timeframe,
    eventType,
    selectedTag,
    sortBy,
  ]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Pagination Change Handlers
  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
    updateUrlParams({ page: newPage, limit: pagination.limit });
    window.scrollTo({ top: 320, behavior: "smooth" });
  };

  const handleLimitChange = (newLimit: number) => {
    setPagination((prev) => ({ ...prev, limit: newLimit, page: 1 }));
    updateUrlParams({ page: 1, limit: newLimit });
  };

  const handleResetFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setTimeframe("all");
    setEventType("all");
    setSelectedTag("");
    setSortBy("date");
    setPagination((prev) => ({ ...prev, page: 1 }));
    setSearchParams({}, { replace: true });
  };

  const hasActiveFilters = !!(
    search ||
    timeframe !== "all" ||
    eventType !== "all" ||
    selectedTag ||
    sortBy !== "date"
  );

  const handleDeleteConfirm = async () => {
    if (!eventToDelete || isDeleting) return;
    try {
      setIsDeleting(true);
      const res = await eventsApi.deleteEvent(eventToDelete.id);
      if (res.success) {
        success("Event deleted successfully");
        clearDrawerEventsCache();
        setEventToDelete(null);
        fetchEvents();
        fetchTagsAndMetrics();
      }
    } catch (err: any) {
      error(err.response?.data?.error?.message || "Failed to delete event");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditTag = (tag: Tag) => {
    if (!isAuthenticated) {
      error("Please sign in to edit tags");
      return;
    }
    setTagToEdit(tag);
  };

  const handleDeleteTag = (tag: Tag) => {
    if (!isAuthenticated) {
      error("Please sign in to delete tags");
      return;
    }
    setTagToDelete(tag);
  };

  const handleTagEditedSuccess = (updatedTag: Tag) => {
    if (selectedTag === tagToEdit?.name) {
      setSelectedTag(updatedTag.name);
      updateUrlParams({ tag: updatedTag.name });
    }
    fetchTagsAndMetrics();
    fetchEvents();
  };

  const handleTagDeletedSuccess = (deletedTag: Tag) => {
    if (selectedTag === deletedTag.name) {
      setSelectedTag("");
      setPagination((prev) => ({ ...prev, page: 1 }));
      updateUrlParams({ tag: "", page: 1 });
    }
    fetchTagsAndMetrics();
    fetchEvents();
  };

  return (
    <div className="min-w-full pb-16">
      {/* Hero Banner Section */}
      <section className="relative overflow-hidden pt-12 pb-14 bg-gradient-to-b from-indigo-50/70 via-white to-slate-50 dark:from-indigo-950/20 dark:via-slate-900/40 dark:to-slate-950 border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="max-w-2xl text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80 shadow-sm mb-4">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                <span>Next-Gen Event Planning & Community Discovery</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15]">
                Plan, Discover & Attend{" "}
                <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Unforgettable Events
                </span>
              </h1>
              <p className="mt-4 text-base text-slate-600 dark:text-slate-300 max-w-xl">
                Explore upcoming workshops, tech summits, celebrations, and
                meetups. Manage your gatherings with real-time RSVPs and
                granular category filtering.
              </p>

              <div className="mt-6 flex flex-wrap items-center justify-center lg:justify-start gap-3">
                {isAuthenticated ? (
                  <button
                    onClick={() => {
                      setEventToEdit(null);
                      setIsModalOpen(true);
                    }}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-2xl font-bold text-sm shadow-lg shadow-indigo-500/25 active:scale-95 transition-all"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Host an Event
                  </button>
                ) : (
                  <Link
                    to="/login?redirect=/create-event"
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-2xl font-bold text-sm shadow-lg shadow-indigo-500/25 active:scale-95 transition-all"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Host an Event
                  </Link>
                )}

                <Link
                  to="/bonus-challenge"
                  className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 px-5 py-3 rounded-2xl font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm"
                >
                  <Layers className="w-4 h-4 text-emerald-500" />
                  View Bonus SQL Solution
                </Link>
              </div>
            </div>

            {/* Quick Metrics Grid */}
            {metrics && (
              <div className="grid grid-cols-2 gap-3 w-full lg:w-auto min-w-[320px]">
                <StatCard
                  label="Upcoming Events"
                  value={metrics.upcomingEvents}
                  icon={<Calendar className="w-5 h-5" />}
                  colorClass="bg-gradient-to-tr from-indigo-600 to-indigo-500"
                  description="Active on schedule"
                  onClick={() => setActiveMetricDetail("upcoming")}
                />
                <StatCard
                  label="Total RSVPs"
                  value={metrics.totalRsvps}
                  icon={<Users className="w-5 h-5" />}
                  colorClass="bg-gradient-to-tr from-emerald-600 to-emerald-500"
                  description="Confirmed attendees"
                  onClick={() => setActiveMetricDetail("rsvps")}
                />
                <StatCard
                  label="Categories"
                  value={metrics.totalTags}
                  icon={<TagIcon className="w-5 h-5" />}
                  colorClass="bg-gradient-to-tr from-amber-600 to-amber-500"
                  description="Filterable tags"
                  onClick={() => setActiveMetricDetail("categories")}
                />
                <StatCard
                  label="Past Events"
                  value={metrics.pastEvents}
                  icon={<Flame className="w-5 h-5" />}
                  colorClass="bg-gradient-to-tr from-purple-600 to-purple-500"
                  description="Archived history"
                  onClick={() => setActiveMetricDetail("past")}
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Filter Controls */}
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          selectedTimeframe={timeframe}
          onTimeframeChange={(tf) => {
            setTimeframe(tf);
            setPagination((prev) => ({ ...prev, page: 1 }));
            updateUrlParams({ timeframe: tf, page: 1 });
          }}
          selectedType={eventType}
          onTypeChange={(type) => {
            setEventType(type);
            setPagination((prev) => ({ ...prev, page: 1 }));
            updateUrlParams({ event_type: type, page: 1 });
          }}
          selectedTag={selectedTag}
          onTagChange={(tag) => {
            setSelectedTag(tag);
            setPagination((prev) => ({ ...prev, page: 1 }));
            updateUrlParams({ tag, page: 1 });
          }}
          sortBy={sortBy}
          onSortChange={(sort) => {
            setSortBy(sort);
            setPagination((prev) => ({ ...prev, page: 1 }));
            updateUrlParams({ sort_by: sort, page: 1 });
          }}
          tags={tags}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onReset={handleResetFilters}
          hasActiveFilters={hasActiveFilters}
          onEditTag={handleEditTag}
          onDeleteTag={handleDeleteTag}
          timeframeCounts={
            metrics
              ? {
                  all: metrics.totalEvents,
                  upcoming: metrics.upcomingEvents,
                  past: metrics.pastEvents,
                }
              : undefined
          }
        />

        {/* Loading Spinner */}
        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              Loading events...
            </p>
          </div>
        ) : fetchError && events.length === 0 ? (
          /* In-Page Error State */
          <div className="py-16 text-center glass-card rounded-3xl p-8 border border-rose-200 dark:border-rose-900/40 max-w-lg mx-auto my-8 animate-fade-in">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center mb-4 ring-4 ring-rose-500/10">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Unable to Load Events
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-6 leading-relaxed">
              {fetchError}
            </p>
            <button
              onClick={() => {
                fetchEvents();
                fetchTagsAndMetrics();
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors shadow-md shadow-indigo-500/25 active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry Loading
            </button>
          </div>
        ) : events.length === 0 ? (
          /* Empty State */
          <div className="py-20 text-center glass-card rounded-3xl p-8 border border-slate-200 dark:border-slate-800">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center mb-4">
              <CalendarX2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              No Events Found
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 mb-6">
              {hasActiveFilters
                ? "No events match your current filter criteria. Try searching with different keywords or resetting filters."
                : "There are currently no events listed. Be the first to create one!"}
            </p>
            {hasActiveFilters ? (
              <button
                onClick={handleResetFilters}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors shadow-sm"
              >
                Clear All Filters
              </button>
            ) : isAuthenticated ? (
              <button
                onClick={() => {
                  setEventToEdit(null);
                  setIsModalOpen(true);
                }}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors shadow-sm"
              >
                Create an Event
              </button>
            ) : (
              <Link
                to="/login?redirect=/create-event"
                className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors shadow-sm"
              >
                Sign In to Host an Event
              </Link>
            )}
          </div>
        ) : (
          /* Events Grid / List */
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                : "space-y-4"
            }
          >
            {events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onEdit={(evt) => {
                  setEventToEdit(evt);
                  setIsModalOpen(true);
                }}
                onDelete={(evt) => {
                  setEventToDelete(evt);
                }}
              />
            ))}
          </div>
        )}

        {/* Server-Side Pagination */}
        {!isLoading && (
          <Pagination
            meta={pagination}
            onPageChange={handlePageChange}
            onLimitChange={handleLimitChange}
          />
        )}
      </main>

      {/* Create / Edit Modal */}
      <EventFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEventToEdit(null);
        }}
        eventToEdit={eventToEdit}
        onSuccess={() => {
          clearDrawerEventsCache();
          fetchEvents();
          fetchTagsAndMetrics();
        }}
        allTags={tags}
        onTagCreated={(newTag) => setTags((prev) => [...prev, newTag])}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={!!eventToDelete}
        title="Delete Event"
        message={`Are you sure you want to permanently delete "${eventToDelete?.title}"? This action cannot be undone.`}
        confirmLabel="Delete Event"
        isDestructive
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setEventToDelete(null)}
      />

      {/* Metric Detail Responsive Drawer / Dialog */}
      {metrics && (
        <MetricDetailDrawer
          isOpen={!!activeMetricDetail}
          onClose={() => setActiveMetricDetail(null)}
          metricType={activeMetricDetail}
          metrics={metrics}
          events={events}
          tags={tags}
          onFilterTimeframe={(tf) => {
            setTimeframe(tf);
            setPagination((prev) => ({ ...prev, page: 1 }));
            updateUrlParams({ timeframe: tf, page: 1 });
          }}
          onFilterTag={(tag) => {
            setSelectedTag(tag);
            setPagination((prev) => ({ ...prev, page: 1 }));
            updateUrlParams({ tag, page: 1 });
          }}
          onEditTag={handleEditTag}
          onDeleteTag={handleDeleteTag}
        />
      )}

      {/* Tag Edit Modal with Event Association Notice */}
      <TagEditModal
        isOpen={!!tagToEdit}
        tag={tagToEdit}
        onClose={() => setTagToEdit(null)}
        onSuccess={handleTagEditedSuccess}
      />

      {/* Tag Delete Confirmation Modal with Event Association Warning */}
      <TagDeleteModal
        isOpen={!!tagToDelete}
        tag={tagToDelete}
        onClose={() => setTagToDelete(null)}
        onSuccess={handleTagDeletedSuccess}
      />
    </div>
  );
};
