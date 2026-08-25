import {
  AlertTriangle,
  BookmarkCheck,
  Calendar,
  CalendarX2,
  CheckCircle2,
  HelpCircle,
  ListFilter,
  Loader2,
  PlusCircle,
  RefreshCw,
  Users,
  XCircle,
} from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { eventsApi } from "../api/events.api";
import { rsvpApi } from "../api/rsvp.api";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { EventCard } from "../components/EventCard";
import { EventFormModal } from "../components/EventFormModal";
import { FilterBar } from "../components/FilterBar";
import { Pagination } from "../components/Pagination";
import { CountBadge } from "../components/CountBadge";
import { APP_ROUTES, PAGINATION_LIMITS } from "../constants";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { EventItem, PaginationMeta, Tag } from "../types";

export const MyEventsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  // Read initial states from URL search params
  const initialTab = searchParams.get("tab") === "rsvps" ? "rsvps" : "created";
  const initialPage = parseInt(searchParams.get("page") || "1", 10);
  const initialLimit = parseInt(
    searchParams.get("limit") || String(PAGINATION_LIMITS.MY_EVENTS_DEFAULT),
    10,
  );
  const initialSearch = searchParams.get("search") || "";
  const initialTimeframe =
    (searchParams.get("timeframe") as "all" | "upcoming" | "past") || "all";
  const initialEventType =
    (searchParams.get("event_type") as "all" | "public" | "private") || "all";
  const initialTag = searchParams.get("tag") || "";
  const initialSort =
    (searchParams.get("sort_by") as "date" | "popularity" | "created_at") ||
    "date";
  const initialRsvpStatus =
    (searchParams.get("rsvp_status") as "all" | "yes" | "maybe" | "no") ||
    "all";
  const initialViewMode =
    (searchParams.get("view_mode") as "grid" | "list") || "grid";

  // Active Tab state
  const [activeTab, setActiveTab] = useState<"created" | "rsvps">(initialTab);

  // Common Server-Side Filter States
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

  // Created events pagination state
  const [createdEvents, setCreatedEvents] = useState<EventItem[]>([]);
  const [createdError, setCreatedError] = useState<string | null>(null);
  const [createdMeta, setCreatedMeta] = useState<PaginationMeta>({
    page: activeTab === "created" ? initialPage : 1,
    limit: initialLimit,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [createdTimeframeCounts, setCreatedTimeframeCounts] = useState<{
    all: number;
    upcoming: number;
    past: number;
  }>({ all: 0, upcoming: 0, past: 0 });
  const [hasCreatedLoadedOnce, setHasCreatedLoadedOnce] = useState(false);
  const [isCreatedFetching, setIsCreatedFetching] = useState(false);

  // RSVP events pagination & status filter state
  const [rsvpEvents, setRsvpEvents] = useState<EventItem[]>([]);
  const [rsvpError, setRsvpError] = useState<string | null>(null);
  const [rsvpMeta, setRsvpMeta] = useState<PaginationMeta>({
    page: activeTab === "rsvps" ? initialPage : 1,
    limit: initialLimit,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [rsvpStatusFilter, setRsvpStatusFilter] = useState<
    "all" | "yes" | "maybe" | "no"
  >(initialRsvpStatus);
  const [rsvpCounts, setRsvpCounts] = useState<{
    all: number;
    yes: number;
    maybe: number;
    no: number;
  }>({ all: 0, yes: 0, maybe: 0, no: 0 });
  const [rsvpTimeframeCounts, setRsvpTimeframeCounts] = useState<{
    all: number;
    upcoming: number;
    past: number;
  }>({ all: 0, upcoming: 0, past: 0 });
  const [hasRsvpLoadedOnce, setHasRsvpLoadedOnce] = useState(false);
  const [isRsvpFetching, setIsRsvpFetching] = useState(false);

  const [allTags, setAllTags] = useState<Tag[]>([]);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<EventItem | null>(null);
  const [eventToDelete, setEventToDelete] = useState<EventItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Redirect if unauthenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login?redirect=/my-events", { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Fetch all tags once for edit modal
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const res = await tagsApi.getTags();
        if (res.success && res.data) {
          setAllTags(res.data);
        }
      } catch {
        // Non-blocking
      }
    };
    if (isAuthenticated) {
      fetchTags();
    }
  }, [isAuthenticated]);

  // Helper to sync state changes with URL query parameters
  const updateUrlParams = useCallback(
    (paramsToUpdate: {
      tab?: "created" | "rsvps";
      page?: number;
      limit?: number;
      search?: string;
      timeframe?: string;
      event_type?: string;
      tag?: string;
      sort_by?: string;
      rsvp_status?: string;
      view_mode?: string;
    }) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);

          // Tab
          if (paramsToUpdate.tab !== undefined) {
            if (paramsToUpdate.tab === "rsvps") {
              next.set("tab", "rsvps");
            } else {
              next.delete("tab");
            }
          }

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
            if (paramsToUpdate.limit !== PAGINATION_LIMITS.MY_EVENTS_DEFAULT) {
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
            if (
              paramsToUpdate.timeframe &&
              paramsToUpdate.timeframe !== "all"
            ) {
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

          // RSVP Status
          if (paramsToUpdate.rsvp_status !== undefined) {
            if (
              paramsToUpdate.rsvp_status &&
              paramsToUpdate.rsvp_status !== "all"
            ) {
              next.set("rsvp_status", paramsToUpdate.rsvp_status);
            } else {
              next.delete("rsvp_status");
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
    },
    [setSearchParams],
  );

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const isFirstSearchEffect = useRef(true);

  // When debounced search updates, sync with URL and reset page to 1
  useEffect(() => {
    if (isFirstSearchEffect.current) {
      isFirstSearchEffect.current = false;
      return;
    }
    if (activeTab === "created") {
      setCreatedMeta((prev) => ({ ...prev, page: 1 }));
    } else {
      setRsvpMeta((prev) => ({ ...prev, page: 1 }));
    }
    updateUrlParams({ search: debouncedSearch, page: 1 });
  }, [debouncedSearch]);

  // Fetch paginated Created Events from Server
  const fetchCreatedEvents = useCallback(
    async (isSilent = false) => {
      if (!user) return;
      try {
        if (!isSilent) {
          setIsCreatedFetching(true);
        }
        setCreatedError(null);
        const res = await eventsApi.getEvents({
          creator_id: user.id,
          page: createdMeta.page,
          limit: createdMeta.limit,
          search: debouncedSearch.trim() || undefined,
          timeframe,
          event_type: eventType,
          tag: selectedTag.trim() || undefined,
          sort_by: sortBy,
          sort_order:
            sortBy === "date"
              ? timeframe === "past"
                ? "desc"
                : "asc"
              : "desc",
        });

        if (res.success && res.data) {
          setCreatedEvents(res.data);
          if (res.meta) {
            setCreatedMeta(res.meta);
          }
        }
      } catch (err: any) {
        const msg =
          err.response?.data?.error?.message ||
          "Failed to load your created events";
        setCreatedError(msg);
        error(msg);
      } finally {
        setIsCreatedFetching(false);
        setHasCreatedLoadedOnce(true);
      }
    },
    [
      user,
      createdMeta.page,
      createdMeta.limit,
      debouncedSearch,
      timeframe,
      eventType,
      selectedTag,
      sortBy,
      error,
    ],
  );

  // Fetch paginated RSVP Events from Server
  const fetchRsvpEvents = useCallback(
    async (isSilent = false) => {
      if (!user) return;
      try {
        if (!isSilent) {
          setIsRsvpFetching(true);
        }
        setRsvpError(null);
        const res = await eventsApi.getEvents({
          my_rsvps: rsvpStatusFilter,
          page: rsvpMeta.page,
          limit: rsvpMeta.limit,
          search: debouncedSearch.trim() || undefined,
          timeframe,
          event_type: eventType,
          tag: selectedTag.trim() || undefined,
          sort_by: sortBy,
          sort_order:
            sortBy === "date"
              ? timeframe === "past"
                ? "desc"
                : "asc"
              : "desc",
        });

        if (res.success && res.data) {
          setRsvpEvents(res.data);
          if (res.meta) {
            setRsvpMeta(res.meta);
          }
        }
      } catch (err: any) {
        const msg =
          err.response?.data?.error?.message ||
          "Failed to load your RSVP events";
        setRsvpError(msg);
        error(msg);
      } finally {
        setIsRsvpFetching(false);
        setHasRsvpLoadedOnce(true);
      }
    },
    [
      user,
      rsvpMeta.page,
      rsvpMeta.limit,
      rsvpStatusFilter,
      debouncedSearch,
      timeframe,
      eventType,
      selectedTag,
      sortBy,
      error,
    ],
  );

  // Fetch RSVP total counts and timeframe breakdown for badge pills
  const fetchRsvpCounts = useCallback(async () => {
    if (!user) return;
    try {
      const res = await rsvpApi.getMyRsvps();
      if (res.success && res.data) {
        const counts = { all: 0, yes: 0, maybe: 0, no: 0 };
        const tfCounts = { all: 0, upcoming: 0, past: 0 };
        const now = new Date();

        res.data.forEach((r: any) => {
          counts.all++;
          tfCounts.all++;
          const st = (r.user_rsvp_status || "").toLowerCase();
          if (st === "yes") counts.yes++;
          else if (st === "maybe") counts.maybe++;
          else if (st === "no") counts.no++;

          const startTime = new Date(r.start_time);
          if (startTime >= now) {
            tfCounts.upcoming++;
          } else {
            tfCounts.past++;
          }
        });
        setRsvpCounts(counts);
        setRsvpTimeframeCounts(tfCounts);
      }
    } catch {
      // Non-blocking fallback
    }
  }, [user]);

  // Fetch Created Events timeframe counts (all, upcoming, past)
  const fetchCreatedCounts = useCallback(async () => {
    if (!user) return;
    try {
      const [allRes, upcomingRes, pastRes] = await Promise.all([
        eventsApi.getEvents({
          creator_id: user.id,
          timeframe: "all",
          limit: 1,
        }),
        eventsApi.getEvents({
          creator_id: user.id,
          timeframe: "upcoming",
          limit: 1,
        }),
        eventsApi.getEvents({
          creator_id: user.id,
          timeframe: "past",
          limit: 1,
        }),
      ]);

      setCreatedTimeframeCounts({
        all: allRes.meta?.total || 0,
        upcoming: upcomingRes.meta?.total || 0,
        past: pastRes.meta?.total || 0,
      });
    } catch {
      // Non-blocking fallback
    }
  }, [user]);

  // Reactive fetch on user/tab/filters change
  useEffect(() => {
    if (user) {
      if (activeTab === "created") {
        fetchCreatedEvents();
      } else {
        fetchRsvpEvents();
      }
      fetchCreatedCounts();
      fetchRsvpCounts();
    }
  }, [
    user,
    activeTab,
    fetchCreatedEvents,
    fetchRsvpEvents,
    fetchCreatedCounts,
    fetchRsvpCounts,
  ]);

  // Tab switching
  const handleTabChange = (tab: "created" | "rsvps") => {
    setActiveTab(tab);
    updateUrlParams({
      tab,
      page: 1,
    });
    if (tab === "created") {
      setCreatedMeta((prev) => ({ ...prev, page: 1 }));
    } else {
      setRsvpMeta((prev) => ({ ...prev, page: 1 }));
    }
  };

  // Filter change handlers
  const handleTimeframeChange = (newTf: "all" | "upcoming" | "past") => {
    setTimeframe(newTf);
    if (activeTab === "created") {
      setCreatedMeta((prev) => ({ ...prev, page: 1 }));
    } else {
      setRsvpMeta((prev) => ({ ...prev, page: 1 }));
    }
    updateUrlParams({ timeframe: newTf, page: 1 });
  };

  const handleTypeChange = (newType: "all" | "public" | "private") => {
    setEventType(newType);
    if (activeTab === "created") {
      setCreatedMeta((prev) => ({ ...prev, page: 1 }));
    } else {
      setRsvpMeta((prev) => ({ ...prev, page: 1 }));
    }
    updateUrlParams({ event_type: newType, page: 1 });
  };

  const handleTagChange = (newTag: string) => {
    setSelectedTag(newTag);
    if (activeTab === "created") {
      setCreatedMeta((prev) => ({ ...prev, page: 1 }));
    } else {
      setRsvpMeta((prev) => ({ ...prev, page: 1 }));
    }
    updateUrlParams({ tag: newTag, page: 1 });
  };

  const handleSortChange = (newSort: "date" | "popularity" | "created_at") => {
    setSortBy(newSort);
    if (activeTab === "created") {
      setCreatedMeta((prev) => ({ ...prev, page: 1 }));
    } else {
      setRsvpMeta((prev) => ({ ...prev, page: 1 }));
    }
    updateUrlParams({ sort_by: newSort, page: 1 });
  };

  const handleViewModeChange = (newMode: "grid" | "list") => {
    setViewMode(newMode);
    updateUrlParams({ view_mode: newMode });
  };

  // RSVP Sub-Filter change
  const handleRsvpStatusFilterChange = (
    status: "all" | "yes" | "maybe" | "no",
  ) => {
    setRsvpStatusFilter(status);
    setRsvpMeta((prev) => ({ ...prev, page: 1 }));
    updateUrlParams({ rsvp_status: status, page: 1 });
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setTimeframe("all");
    setEventType("all");
    setSelectedTag("");
    setSortBy("date");
    if (activeTab === "rsvps") {
      setRsvpStatusFilter("all");
    }
    if (activeTab === "created") {
      setCreatedMeta((prev) => ({ ...prev, page: 1 }));
    } else {
      setRsvpMeta((prev) => ({ ...prev, page: 1 }));
    }
    updateUrlParams({
      search: "",
      timeframe: "all",
      event_type: "all",
      tag: "",
      sort_by: "date",
      rsvp_status: "all",
      page: 1,
    });
  };

  // Check if any filters are active
  const hasActiveFilters = !!(
    search.trim() ||
    timeframe !== "all" ||
    eventType !== "all" ||
    selectedTag ||
    sortBy !== "date" ||
    (activeTab === "rsvps" && rsvpStatusFilter !== "all")
  );

  // Pagination change handlers
  const handleCreatedPageChange = (newPage: number) => {
    setCreatedMeta((prev) => ({ ...prev, page: newPage }));
    updateUrlParams({ page: newPage });
  };

  const handleCreatedLimitChange = (newLimit: number) => {
    setCreatedMeta((prev) => ({ ...prev, page: 1, limit: newLimit }));
    updateUrlParams({ page: 1, limit: newLimit });
  };

  const handleRsvpPageChange = (newPage: number) => {
    setRsvpMeta((prev) => ({ ...prev, page: newPage }));
    updateUrlParams({ page: newPage });
  };

  const handleRsvpLimitChange = (newLimit: number) => {
    setRsvpMeta((prev) => ({ ...prev, page: 1, limit: newLimit }));
    updateUrlParams({ page: 1, limit: newLimit });
  };

  const refreshAll = () => {
    if (activeTab === "created") {
      fetchCreatedEvents();
    } else {
      fetchRsvpEvents();
    }
    fetchCreatedCounts();
    fetchRsvpCounts();
  };

  // Smoothly attach new/updated event without UI flash
  const handleEventSaved = useCallback(
    (savedEvent: EventItem) => {
      if (eventToEdit) {
        setCreatedEvents((prev) =>
          prev.map((item) => (item.id === savedEvent.id ? savedEvent : item)),
        );
      } else {
        setCreatedEvents((prev) => [
          savedEvent,
          ...prev.filter((item) => item.id !== savedEvent.id),
        ]);
        setCreatedMeta((prev) => ({
          ...prev,
          total: (prev.total || 0) + 1,
        }));
        setCreatedTimeframeCounts((prev) => {
          const isUpcoming = new Date(savedEvent.startTime) >= new Date();
          return {
            ...prev,
            all: prev.all + 1,
            upcoming: isUpcoming ? prev.upcoming + 1 : prev.upcoming,
            past: !isUpcoming ? prev.past + 1 : prev.past,
          };
        });
      }
      fetchCreatedEvents(true);
      fetchCreatedCounts();
      fetchRsvpCounts();
    },
    [eventToEdit, fetchCreatedEvents, fetchCreatedCounts, fetchRsvpCounts],
  );

  // Listen for globally created events
  useEffect(() => {
    const handleGlobalEventCreated = (e: Event) => {
      const customEvent = e as CustomEvent<EventItem>;
      if (customEvent.detail && customEvent.detail.creator?.id === user?.id) {
        handleEventSaved(customEvent.detail);
      } else {
        fetchCreatedEvents(true);
        fetchCreatedCounts();
        fetchRsvpCounts();
      }
    };

    window.addEventListener("event-created", handleGlobalEventCreated);
    return () => {
      window.removeEventListener("event-created", handleGlobalEventCreated);
    };
  }, [handleEventSaved, fetchCreatedEvents, fetchCreatedCounts, fetchRsvpCounts, user?.id]);

  // Event Deletion
  const handleDelete = async () => {
    if (!eventToDelete || isDeleting) return;
    try {
      setIsDeleting(true);
      const res = await eventsApi.deleteEvent(eventToDelete.id);
      if (res.success) {
        success("Event deleted successfully");
        setEventToDelete(null);
        refreshAll();
      }
    } catch (err: any) {
      error(err.response?.data?.error?.message || "Failed to delete event");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-24 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
            <BookmarkCheck className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            My Events & RSVPs
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Manage your created events and track all gatherings you have RSVP'd
            to.
          </p>
        </div>

        <button
          onClick={() => {
            setEventToEdit(null);
            setIsCreateModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-500/20 active:scale-95 transition-all self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          Create New Event
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-200/70 dark:bg-slate-800/70 backdrop-blur-md max-w-md mb-6">
        <button
          onClick={() => handleTabChange("created")}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === "created"
              ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-md"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Created by Me</span>
          <CountBadge
            count={createdTimeframeCounts.all || createdMeta.total}
            isActive={activeTab === "created"}
          />
        </button>

        <button
          onClick={() => handleTabChange("rsvps")}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === "rsvps"
              ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-md"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>My RSVPs</span>
          <CountBadge
            count={
              rsvpTimeframeCounts.all || rsvpCounts.all || rsvpMeta.total
            }
            isActive={activeTab === "rsvps"}
          />
        </button>
      </div>

      {/* RSVP Quick Status Filter Pills (Active only on RSVPs tab) */}
      {activeTab === "rsvps" && (
        <div className="flex flex-wrap items-center gap-2 mb-6 animate-fade-in">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mr-1 flex items-center gap-1">
            <ListFilter className="w-3.5 h-3.5" />
            Filter by RSVP:
          </span>
          {[
            { id: "all", label: "All", count: rsvpCounts.all },
            {
              id: "yes",
              label: "Going",
              count: rsvpCounts.yes,
              icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />,
            },
            {
              id: "maybe",
              label: "Interested",
              count: rsvpCounts.maybe,
              icon: <HelpCircle className="w-3.5 h-3.5 text-amber-500" />,
            },
            {
              id: "no",
              label: "Declined",
              count: rsvpCounts.no,
              icon: <XCircle className="w-3.5 h-3.5 text-rose-500" />,
            },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => handleRsvpStatusFilterChange(pill.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                rsvpStatusFilter === pill.id
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              {pill.icon}
              <span>{pill.label}</span>
              <CountBadge
                count={pill.count}
                isActive={rsvpStatusFilter === pill.id}
                className={
                  rsvpStatusFilter === pill.id
                    ? "bg-white/20 text-white dark:bg-white/20 dark:text-white"
                    : undefined
                }
              />
            </button>
          ))}
        </div>
      )}

      {/* Server-Side Filter Bar with Timeframe Counts */}
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        selectedTimeframe={timeframe}
        onTimeframeChange={handleTimeframeChange}
        selectedType={eventType}
        onTypeChange={handleTypeChange}
        selectedTag={selectedTag}
        onTagChange={handleTagChange}
        sortBy={sortBy}
        onSortChange={handleSortChange}
        tags={allTags}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        onReset={handleResetFilters}
        hasActiveFilters={hasActiveFilters}
        timeframeCounts={
          activeTab === "created" ? createdTimeframeCounts : rsvpTimeframeCounts
        }
      />

      {/* Tab 1: Created by Me */}
      <div className={activeTab === "created" ? "mt-8 animate-fade-in block" : "hidden"}>
        {!hasCreatedLoadedOnce && createdEvents.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              Loading your created events...
            </p>
          </div>
        ) : createdError && createdEvents.length === 0 ? (
          <div className="py-16 text-center glass-card rounded-3xl p-8 border border-rose-200 dark:border-rose-900/40 max-w-lg mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center mb-4 ring-4 ring-rose-500/10">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Unable to Load Created Events
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-6">
              {createdError}
            </p>
            <button
              onClick={() => fetchCreatedEvents()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors shadow-md shadow-indigo-500/25 active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry
            </button>
          </div>
        ) : createdEvents.length === 0 ? (
          <div className="py-16 text-center glass-card rounded-3xl p-8 border border-slate-200 dark:border-slate-800 max-w-lg mx-auto animate-fade-in">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center mb-4">
              <CalendarX2 className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {hasActiveFilters
                ? "No Matching Events Found"
                : "You haven't created any events yet"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-6">
              {hasActiveFilters
                ? "No created events match your current filter criteria. Try adjusting or resetting your filters."
                : "Create an event to start inviting friends, colleagues, and community members."}
            </p>
            {hasActiveFilters ? (
              <button
                onClick={handleResetFilters}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 shadow-sm"
              >
                Clear All Filters
              </button>
            ) : (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 shadow-sm"
              >
                Host Your First Event
              </button>
            )}
          </div>
        ) : (
          <div className={`transition-opacity duration-200 ${isCreatedFetching ? "opacity-60 pointer-events-none" : "opacity-100"}`}>
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  : "space-y-4"
              }
            >
              {createdEvents.map((event) => (
                <div
                  key={event.id}
                  className="animate-slide-up transition-all duration-300 h-full"
                >
                  <EventCard
                    event={event}
                    onEdit={(evt) => {
                      setEventToEdit(evt);
                      setIsCreateModalOpen(true);
                    }}
                    onDelete={(evt) => setEventToDelete(evt)}
                  />
                </div>
              ))}
            </div>

            {/* Server-Side Pagination for Created Events */}
            <Pagination
              meta={createdMeta}
              onPageChange={handleCreatedPageChange}
              onLimitChange={handleCreatedLimitChange}
            />
          </div>
        )}
      </div>

      {/* Tab 2: My RSVPs */}
      <div className={activeTab === "rsvps" ? "mt-8 animate-fade-in block" : "hidden"}>
        {!hasRsvpLoadedOnce && rsvpEvents.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              Loading your RSVP'd events...
            </p>
          </div>
        ) : rsvpError && rsvpEvents.length === 0 ? (
          <div className="py-16 text-center glass-card rounded-3xl p-8 border border-rose-200 dark:border-rose-900/40 max-w-lg mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center mb-4 ring-4 ring-rose-500/10">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Unable to Load RSVPs
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-6">
              {rsvpError}
            </p>
            <button
              onClick={() => fetchRsvpEvents()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors shadow-md shadow-indigo-500/25 active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry
            </button>
          </div>
        ) : rsvpEvents.length === 0 ? (
          <div className="py-16 text-center glass-card rounded-3xl p-8 border border-slate-200 dark:border-slate-800 max-w-lg mx-auto animate-fade-in">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center mb-4">
              <Users className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {hasActiveFilters
                ? "No Matching RSVPs Found"
                : "No RSVPs found"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-6">
              {hasActiveFilters
                ? "No RSVP events match your current filter criteria. Try adjusting or clearing filters."
                : rsvpStatusFilter !== "all"
                  ? `You haven't responded as "${rsvpStatusFilter === "yes" ? "Going" : rsvpStatusFilter === "maybe" ? "Interested" : "Declined"}" to any events yet.`
                  : "Browse upcoming community events and RSVP to attend!"}
            </p>
            {hasActiveFilters ? (
              <button
                onClick={handleResetFilters}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 shadow-sm"
              >
                Clear All Filters
              </button>
            ) : (
              <Link
                to="/"
                className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 shadow-sm inline-block"
              >
                Browse Upcoming Events
              </Link>
            )}
          </div>
        ) : (
          <div className={`transition-opacity duration-200 ${isRsvpFetching ? "opacity-60 pointer-events-none" : "opacity-100"}`}>
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  : "space-y-4"
              }
            >
              {rsvpEvents.map((event) => (
                <div
                  key={event.id}
                  className="animate-slide-up transition-all duration-300 h-full"
                >
                  <EventCard key={event.id} event={event} />
                </div>
              ))}
            </div>

            {/* Server-Side Pagination for RSVP Events */}
            <Pagination
              meta={rsvpMeta}
              onPageChange={handleRsvpPageChange}
              onLimitChange={handleRsvpLimitChange}
            />
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <EventFormModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEventToEdit(null);
        }}
        eventToEdit={eventToEdit}
        onSuccess={handleEventSaved}
        allTags={allTags}
        onTagCreated={(newTag) => setAllTags((prev) => [...prev, newTag])}
      />

      {/* Delete Confirm Modal */}
      <ConfirmDialog
        isOpen={!!eventToDelete}
        title="Delete Event"
        message={`Are you sure you want to permanently delete "${eventToDelete?.title}"?`}
        confirmLabel="Delete Event"
        isDestructive
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setEventToDelete(null)}
      />
    </div>
  );
};
