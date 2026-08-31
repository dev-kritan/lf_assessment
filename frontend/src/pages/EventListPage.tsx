import {
  AlertTriangle,
  CalendarX2,
  Flame,
  Loader2,
  RefreshCw,
  Sparkles,
  Tag as TagIcon,
  Users,
} from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { eventsApi } from "../api/events.api";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { EventCard } from "../components/EventCard";
import { EventFormModal } from "../components/EventFormModal";
import { FilterBar } from "../components/FilterBar";
import {
  MetricDetailDrawer,
  MetricType,
  clearDrawerEventsCache,
} from "../components/MetricDetailDrawer";
import { Pagination } from "../components/Pagination";
import { StatCard } from "../components/StatCard";
import { TagDeleteModal } from "../components/TagDeleteModal";
import { TagEditModal } from "../components/TagEditModal";
import { APP_ROUTES, PAGINATION_LIMITS } from "../constants";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { EventItem, PaginationMeta, Tag } from "../types";

export const EventListPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read initial query params from URL
  const initialPage = Math.max(
    1,
    parseInt(searchParams.get("page") || "1", 10) || 1,
  );
  const initialLimit =
    parseInt(
      searchParams.get("limit") || `${PAGINATION_LIMITS.EVENT_LIST_DEFAULT}`,
      10,
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
  const initialViewMode =
    (searchParams.get("view_mode") as "grid" | "list") || "grid";

  const [events, setEvents] = useState<EventItem[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [metrics, setMetrics] = useState<{
    totalEvents: number;
    upcomingEvents: number;
    pastEvents: number;
    totalRsvps: number;
    totalTags: number;
  } | null>(null);

  const [timeframeCounts, setTimeframeCounts] = useState<{
    all: number;
    upcoming: number;
    past: number;
  }>({ all: 0, upcoming: 0, past: 0 });

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
  const [timeframe, setTimeframe] = useState<"all" | "upcoming" | "past">(
    initialTimeframe,
  );
  const [eventType, setEventType] = useState<"all" | "public" | "private">(
    initialEventType,
  );
  const [selectedTag, setSelectedTag] = useState(initialTag);
  const [sortBy, setSortBy] = useState<"date" | "popularity" | "created_at">(
    initialSort,
  );
  const [viewMode, setViewMode] = useState<"grid" | "list">(initialViewMode);

  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
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
  const navigate = useNavigate();

  // Helper to synchronize state with URL search params
  const updateUrlParams = (paramsToUpdate: {
    page?: number;
    limit?: number;
    search?: string;
    timeframe?: string;
    event_type?: string;
    tag?: string;
    sort_by?: string;
    view_mode?: string;
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

        // View Mode
        if (paramsToUpdate.view_mode !== undefined) {
          if (paramsToUpdate.view_mode === "list") {
            next.set("view_mode", "list");
          } else {
            next.delete("view_mode");
          }
        }

        return next;
      },
      { replace: true },
    );
  };

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Sync debounced search with URL and reset page ONLY when the search keyword actually changes from the current URL
  useEffect(() => {
    const currentUrlSearch = searchParams.get("search") || "";
    if (debouncedSearch.trim() !== currentUrlSearch.trim()) {
      setPagination((prev) => ({ ...prev, page: 1 }));
      updateUrlParams({ search: debouncedSearch, page: 1 });
    }
  }, [debouncedSearch, searchParams]);

  // Synchronize all states from URL search params (e.g., Back to Events, Browser Navigation, Direct Links)
  useEffect(() => {
    const urlPage = parseInt(searchParams.get("page") || "1", 10) || 1;
    const urlLimit =
      parseInt(
        searchParams.get("limit") || `${PAGINATION_LIMITS.EVENT_LIST_DEFAULT}`,
        10,
      ) || PAGINATION_LIMITS.EVENT_LIST_DEFAULT;
    const urlSearch = searchParams.get("search") || "";
    const urlTimeframe =
      (searchParams.get("timeframe") as "all" | "upcoming" | "past") || "all";
    const urlEventType =
      (searchParams.get("event_type") as "all" | "public" | "private") || "all";
    const urlTag = searchParams.get("tag") || "";
    const urlSort =
      (searchParams.get("sort_by") as "date" | "popularity" | "created_at") ||
      "date";
    const urlViewMode =
      (searchParams.get("view_mode") as "grid" | "list") || "grid";

    setPagination((prev) => {
      if (prev.page !== urlPage || prev.limit !== urlLimit) {
        return { ...prev, page: urlPage, limit: urlLimit };
      }
      return prev;
    });

    if (search !== urlSearch) {
      setSearch(urlSearch);
      setDebouncedSearch(urlSearch);
    }
    if (timeframe !== urlTimeframe) setTimeframe(urlTimeframe);
    if (eventType !== urlEventType) setEventType(urlEventType);
    if (selectedTag !== urlTag) setSelectedTag(urlTag);
    if (sortBy !== urlSort) setSortBy(urlSort);
    if (viewMode !== urlViewMode) setViewMode(urlViewMode);
  }, [searchParams]);

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

  // Fetch dynamic timeframe breakdown (all, upcoming, past) respecting search, tag, and event type
  const fetchTimeframeCounts = useCallback(async () => {
    try {
      const baseParams = {
        search: debouncedSearch.trim() || undefined,
        tag: selectedTag.trim() || undefined,
        event_type: eventType !== "all" ? eventType : undefined,
        limit: 1,
      };

      const [allRes, upcomingRes, pastRes] = await Promise.all([
        eventsApi.getEvents({ ...baseParams, timeframe: "all" }),
        eventsApi.getEvents({ ...baseParams, timeframe: "upcoming" }),
        eventsApi.getEvents({ ...baseParams, timeframe: "past" }),
      ]);

      setTimeframeCounts({
        all: allRes.meta?.total || 0,
        upcoming: upcomingRes.meta?.total || 0,
        past: pastRes.meta?.total || 0,
      });
    } catch {
      // Non-blocking fallback to metrics if available
      if (metrics) {
        setTimeframeCounts({
          all: metrics.totalEvents,
          upcoming: metrics.upcomingEvents,
          past: metrics.pastEvents,
        });
      }
    }
  }, [debouncedSearch, selectedTag, eventType, metrics]);

  useEffect(() => {
    fetchTagsAndMetrics();
  }, [fetchTagsAndMetrics]);

  useEffect(() => {
    fetchTimeframeCounts();
  }, [fetchTimeframeCounts]);

  // Fetch Events from Server with Pagination & Filter parameters
  const fetchEvents = useCallback(
    async (options?: { isSilent?: boolean }) => {
      const isSilent = options?.isSilent ?? false;
      try {
        if (!isSilent) {
          setIsFetching(true);
        }
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
        const msg =
          err.response?.data?.error?.message ||
          "Failed to load events. Please try again.";
        setFetchError(msg);
        error(msg);
      } finally {
        setIsFetching(false);
        setHasLoadedOnce(true);
      }
    },
    [
      pagination.page,
      pagination.limit,
      debouncedSearch,
      timeframe,
      eventType,
      selectedTag,
      sortBy,
      error,
    ],
  );

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Smoothly attach new/updated event without UI flash or layout shift
  const handleEventSaved = useCallback(
    (savedEvent: EventItem) => {
      clearDrawerEventsCache();
      if (eventToEdit) {
        // In-place update for edited event
        setEvents((prev) =>
          prev.map((item) => (item.id === savedEvent.id ? savedEvent : item)),
        );
      } else {
        // Smoothly prepend newly created event to top of current list
        setEvents((prev) => [
          savedEvent,
          ...prev.filter((item) => item.id !== savedEvent.id),
        ]);
        setPagination((prev) => ({
          ...prev,
          total: (prev.total || 0) + 1,
        }));
      }
      // Background sync without unmounting UI or flashing loading spinner
      fetchEvents({ isSilent: true });
      fetchTagsAndMetrics();
      fetchTimeframeCounts();
    },
    [eventToEdit, fetchEvents, fetchTagsAndMetrics, fetchTimeframeCounts],
  );

  // Listen for globally created events (e.g. from navbar modal)
  useEffect(() => {
    const handleGlobalEventCreated = (e: Event) => {
      const customEvent = e as CustomEvent<EventItem>;
      if (customEvent.detail) {
        handleEventSaved(customEvent.detail);
      } else {
        fetchEvents({ isSilent: true });
        fetchTagsAndMetrics();
        fetchTimeframeCounts();
      }
    };

    window.addEventListener("event-created", handleGlobalEventCreated);
    return () => {
      window.removeEventListener("event-created", handleGlobalEventCreated);
    };
  }, [
    handleEventSaved,
    fetchEvents,
    fetchTagsAndMetrics,
    fetchTimeframeCounts,
  ]);

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

  const handleViewModeChange = (newMode: "grid" | "list") => {
    setViewMode(newMode);
    updateUrlParams({ view_mode: newMode });
  };

  const handleResetFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setTimeframe("all");
    setEventType("all");
    setSelectedTag("");
    setSortBy("date");
    setPagination((prev) => ({ ...prev, page: 1 }));
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams();
        if (prev.get("view_mode") === "list") {
          next.set("view_mode", "list");
        }
        return next;
      },
      { replace: true },
    );
  };

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
        fetchTimeframeCounts();
      }
    } catch (err: any) {
      error(err.response?.data?.error?.message || "Failed to delete event");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditTag = (tag: Tag) => {
    setTagToEdit(tag);
  };

  const handleDeleteTag = (tag: Tag) => {
    setTagToDelete(tag);
  };

  const handleTagEditedSuccess = (updatedTag: Tag) => {
    if (selectedTag === tagToEdit?.name) {
      setSelectedTag(updatedTag.name);
      updateUrlParams({ tag: updatedTag.name });
    }
    fetchTagsAndMetrics();
    fetchTimeframeCounts();
    fetchEvents({ isSilent: true });
  };

  const handleTagDeletedSuccess = (deletedTag: Tag) => {
    if (selectedTag === deletedTag.name) {
      setSelectedTag("");
      setPagination((prev) => ({ ...prev, page: 1 }));
      updateUrlParams({ tag: "", page: 1 });
    }
    fetchTagsAndMetrics();
    fetchTimeframeCounts();
    fetchEvents({ isSilent: true });
  };

  const hasActiveFilters = Boolean(
    search.trim() ||
    timeframe !== "all" ||
    eventType !== "all" ||
    selectedTag ||
    sortBy !== "date",
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      {/* Hero / Header Section */}
      <section className="relative overflow-hidden pt-12 pb-16 bg-gradient-to-b from-indigo-50/50 via-white to-transparent dark:from-indigo-950/20 dark:via-slate-950 dark:to-slate-950 border-b border-slate-200/60 dark:border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            {/* Title & Description */}
            <div className="max-w-2xl space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                Community & Gatherings Platform
              </div>
              <h1 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                Discover, Organize & Join{" "}
                <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Unforgettable Events
                </span>
              </h1>
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400">
                Explore hackathons, workshops, conferences, and meetups. Filter
                by date, tags, popularity, or RSVP.
              </p>
            </div>

            {/* Quick Metrics Grid */}
            {metrics && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full lg:w-auto min-w-0 sm:min-w-[320px]">
                <StatCard
                  label="Upcoming Events"
                  value={metrics.upcomingEvents}
                  icon={<Sparkles className="w-5 h-5" />}
                  colorClass="bg-gradient-to-tr from-emerald-600 to-emerald-500"
                  description="Next 30 days"
                  onClick={() => setActiveMetricDetail("upcoming")}
                />
                <StatCard
                  label="Total RSVPs"
                  value={metrics.totalRsvps}
                  icon={<Users className="w-5 h-5" />}
                  colorClass="bg-gradient-to-tr from-indigo-600 to-indigo-500"
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
          onViewModeChange={handleViewModeChange}
          onReset={handleResetFilters}
          hasActiveFilters={hasActiveFilters}
          onEditTag={handleEditTag}
          onDeleteTag={handleDeleteTag}
          timeframeCounts={timeframeCounts}
        />

        {/* Loading Spinner only on initial load when events is empty */}
        {!hasLoadedOnce && events.length === 0 ? (
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
          <div className="py-20 text-center glass-card rounded-3xl p-8 border border-slate-200 dark:border-slate-800 animate-fade-in">
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
                  if (user && !user.isEmailVerified) {
                    error("Email verification required: Please verify your email address to create events.");
                    navigate(APP_ROUTES.PROFILE, { state: { highlightEmailVerification: true } });
                    return;
                  }
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
          /* Events Grid / List with smooth dimming during background fetch */
          <div
            className={`transition-opacity duration-200 ${
              isFetching ? "opacity-60 pointer-events-none" : "opacity-100"
            }`}
          >
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  : "space-y-4"
              }
            >
              {events.map((event) => (
                <div
                  key={event.id}
                  className="animate-slide-up transition-all duration-300 h-full"
                >
                  <EventCard
                    event={event}
                    onEdit={(evt) => {
                      setEventToEdit(evt);
                      setIsModalOpen(true);
                    }}
                    onDelete={(evt) => {
                      setEventToDelete(evt);
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Server-Side Pagination */}
            <Pagination
              meta={pagination}
              onPageChange={handlePageChange}
              onLimitChange={handleLimitChange}
            />
          </div>
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
        onSuccess={handleEventSaved}
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
