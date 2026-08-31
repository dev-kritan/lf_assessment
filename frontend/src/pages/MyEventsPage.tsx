import {
  AlertTriangle,
  BookmarkCheck,
  Calendar,
  CalendarX2,
  Check,
  CheckCircle2,
  HelpCircle,
  ListFilter,
  Loader2,
  PlusCircle,
  RefreshCw,
  Trash2,
  Users,
  XCircle,
} from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { eventsApi } from "../api/events.api";
import { rsvpApi } from "../api/rsvp.api";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { BulkDeleteConfirmDialog } from "../components/BulkDeleteConfirmDialog";
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
  const location = useLocation();
  const isRestoredRef = useRef(false);
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();
  const filterBarRef = useRef<HTMLDivElement>(null);

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

  // Bulk Multi-Select & Bulk Delete State
  const [selectedCreatedIds, setSelectedCreatedIds] = useState<number[]>([]);
  const [selectedRsvpIds, setSelectedRsvpIds] = useState<number[]>([]);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Redirect if unauthenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login?redirect=/my-events", { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Fetch all tags once for edit modal & filter chips
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const res = await eventsApi.getTags();
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

  // When debounced search updates, sync with URL and reset page to 1 ONLY if search keyword differs from URL
  useEffect(() => {
    const currentUrlSearch = searchParams.get("search") || "";
    if (debouncedSearch.trim() !== currentUrlSearch.trim()) {
      if (activeTab === "created") {
        setCreatedMeta((prev) => ({ ...prev, page: 1 }));
      } else {
        setRsvpMeta((prev) => ({ ...prev, page: 1 }));
      }
      updateUrlParams({ search: debouncedSearch, page: 1 });
    }
  }, [debouncedSearch, searchParams, activeTab]);

  // Synchronize all states from URL search params (e.g., Back to Events, Browser Navigation, Tab switches)
  useEffect(() => {
    const urlTab = searchParams.get("tab") === "rsvps" ? "rsvps" : "created";
    const urlPage = parseInt(searchParams.get("page") || "1", 10) || 1;
    const urlLimit =
      parseInt(
        searchParams.get("limit") ||
          String(PAGINATION_LIMITS.MY_EVENTS_DEFAULT),
        10,
      ) || PAGINATION_LIMITS.MY_EVENTS_DEFAULT;
    const urlSearch = searchParams.get("search") || "";
    const urlTimeframe =
      (searchParams.get("timeframe") as "all" | "upcoming" | "past") || "all";
    const urlEventType =
      (searchParams.get("event_type") as "all" | "public" | "private") || "all";
    const urlTag = searchParams.get("tag") || "";
    const urlSort =
      (searchParams.get("sort_by") as "date" | "popularity" | "created_at") ||
      "date";
    const urlRsvpStatus =
      (searchParams.get("rsvp_status") as "all" | "yes" | "maybe" | "no") ||
      "all";
    const urlViewMode =
      (searchParams.get("view_mode") as "grid" | "list") || "grid";

    if (activeTab !== urlTab) {
      setActiveTab(urlTab);
    }

    if (urlTab === "created") {
      setCreatedMeta((prev) => {
        if (prev.page !== urlPage || prev.limit !== urlLimit) {
          return { ...prev, page: urlPage, limit: urlLimit };
        }
        return prev;
      });
    } else {
      setRsvpMeta((prev) => {
        if (prev.page !== urlPage || prev.limit !== urlLimit) {
          return { ...prev, page: urlPage, limit: urlLimit };
        }
        return prev;
      });
    }

    if (search !== urlSearch) {
      setSearch(urlSearch);
      setDebouncedSearch(urlSearch);
    }
    if (timeframe !== urlTimeframe) setTimeframe(urlTimeframe);
    if (eventType !== urlEventType) setEventType(urlEventType);
    if (selectedTag !== urlTag) setSelectedTag(urlTag);
    if (sortBy !== urlSort) setSortBy(urlSort);
    if (rsvpStatusFilter !== urlRsvpStatus) setRsvpStatusFilter(urlRsvpStatus);
    if (viewMode !== urlViewMode) setViewMode(urlViewMode);
  }, [searchParams]);

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

  // Fetch RSVP total counts and timeframe breakdown for badge pills dynamically filtered by tag, search, and event type
  const fetchRsvpCounts = useCallback(async () => {
    if (!user) return;
    try {
      const baseParams = {
        my_rsvps: rsvpStatusFilter,
        tag: selectedTag.trim() || undefined,
        search: debouncedSearch.trim() || undefined,
        event_type: eventType !== "all" ? eventType : undefined,
        limit: 1,
      };

      const [allRes, upcomingRes, pastRes, rawRsvpsRes] = await Promise.all([
        eventsApi.getEvents({
          ...baseParams,
          timeframe: "all",
        }),
        eventsApi.getEvents({
          ...baseParams,
          timeframe: "upcoming",
        }),
        eventsApi.getEvents({
          ...baseParams,
          timeframe: "past",
        }),
        rsvpApi.getMyRsvps(),
      ]);

      setRsvpTimeframeCounts({
        all: allRes.meta?.total || 0,
        upcoming: upcomingRes.meta?.total || 0,
        past: pastRes.meta?.total || 0,
      });

      if (rawRsvpsRes.success && rawRsvpsRes.data) {
        const counts = { all: 0, yes: 0, maybe: 0, no: 0 };
        rawRsvpsRes.data.forEach((r: any) => {
          counts.all++;
          const st = (r.user_rsvp_status || "").toLowerCase();
          if (st === "yes") counts.yes++;
          else if (st === "maybe") counts.maybe++;
          else if (st === "no") counts.no++;
        });
        setRsvpCounts(counts);
      }
    } catch {
      // Non-blocking fallback
    }
  }, [user, selectedTag, debouncedSearch, eventType, rsvpStatusFilter]);

  // Fetch Created Events timeframe counts (all, upcoming, past) dynamically filtered by tag, search, and event type
  const fetchCreatedCounts = useCallback(async () => {
    if (!user) return;
    try {
      const baseParams = {
        creator_id: user.id,
        tag: selectedTag.trim() || undefined,
        search: debouncedSearch.trim() || undefined,
        event_type: eventType !== "all" ? eventType : undefined,
        limit: 1,
      };

      const [allRes, upcomingRes, pastRes] = await Promise.all([
        eventsApi.getEvents({
          ...baseParams,
          timeframe: "all",
        }),
        eventsApi.getEvents({
          ...baseParams,
          timeframe: "upcoming",
        }),
        eventsApi.getEvents({
          ...baseParams,
          timeframe: "past",
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
  }, [user, selectedTag, debouncedSearch, eventType]);

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

  // Keep scroll position updated for current path and search parameters
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (typeof window !== "undefined" && window.scrollY > 0) {
            sessionStorage.setItem(
              `scroll_pos_${location.pathname}${location.search}`,
              String(window.scrollY),
            );
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [location.pathname, location.search]);

  // Reset restoration flag when user explicitly changes query params / tabs
  useEffect(() => {
    isRestoredRef.current = false;
  }, [location.pathname, location.search]);

  // Restore scroll position after events load
  useEffect(() => {
    const isFetching =
      activeTab === "created" ? isCreatedFetching : isRsvpFetching;
    const currentEvents =
      activeTab === "created" ? createdEvents : rsvpEvents;

    if (!isFetching && currentEvents.length > 0 && !isRestoredRef.current) {
      const savedScroll = sessionStorage.getItem(
        `scroll_pos_${location.pathname}${location.search}`,
      );
      if (savedScroll) {
        const top = Number(savedScroll);
        if (top > 0) {
          isRestoredRef.current = true;
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              window.scrollTo({ top, behavior: "instant" as ScrollBehavior });
            });
          });
        }
      }
    }
  }, [
    activeTab,
    isCreatedFetching,
    isRsvpFetching,
    createdEvents,
    rsvpEvents,
    location.pathname,
    location.search,
  ]);

  // Tab switching
  const handleTabChange = (tab: "created" | "rsvps") => {
    setActiveTab(tab);
    setSelectedCreatedIds([]);
    setSelectedRsvpIds([]);
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
    setSelectedCreatedIds([]);
    setSelectedRsvpIds([]);
    if (activeTab === "created") {
      setCreatedMeta((prev) => ({ ...prev, page: 1 }));
    } else {
      setRsvpMeta((prev) => ({ ...prev, page: 1 }));
    }
    updateUrlParams({ timeframe: newTf, page: 1 });
  };

  const handleTypeChange = (newType: "all" | "public" | "private") => {
    setEventType(newType);
    setSelectedCreatedIds([]);
    setSelectedRsvpIds([]);
    if (activeTab === "created") {
      setCreatedMeta((prev) => ({ ...prev, page: 1 }));
    } else {
      setRsvpMeta((prev) => ({ ...prev, page: 1 }));
    }
    updateUrlParams({ event_type: newType, page: 1 });
  };

  const handleTagChange = (newTag: string) => {
    setSelectedTag(newTag);
    setSelectedCreatedIds([]);
    setSelectedRsvpIds([]);
    if (activeTab === "created") {
      setCreatedMeta((prev) => ({ ...prev, page: 1 }));
    } else {
      setRsvpMeta((prev) => ({ ...prev, page: 1 }));
    }
    updateUrlParams({ tag: newTag, page: 1 });
  };

  const handleSortChange = (newSort: "date" | "popularity" | "created_at") => {
    setSortBy(newSort);
    setSelectedCreatedIds([]);
    setSelectedRsvpIds([]);
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
    setSelectedRsvpIds([]);
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
    setSelectedCreatedIds([]);
    setSelectedRsvpIds([]);
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

  const scrollToFilterBar = () => {
    const filterBarEl =
      filterBarRef.current || document.getElementById("events-filter-bar");
    if (filterBarEl) {
      const yOffset = -80; // 64px sticky navbar + 16px buffer
      const y =
        filterBarEl.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Pagination change handlers
  const handleCreatedPageChange = (newPage: number) => {
    setSelectedCreatedIds([]);
    setCreatedMeta((prev) => ({ ...prev, page: newPage }));
    updateUrlParams({ page: newPage });
    scrollToFilterBar();
  };

  const handleCreatedLimitChange = (newLimit: number) => {
    setSelectedCreatedIds([]);
    setCreatedMeta((prev) => ({ ...prev, page: 1, limit: newLimit }));
    updateUrlParams({ page: 1, limit: newLimit });
  };

  const handleRsvpPageChange = (newPage: number) => {
    setSelectedRsvpIds([]);
    setRsvpMeta((prev) => ({ ...prev, page: newPage }));
    updateUrlParams({ page: newPage });
    scrollToFilterBar();
  };

  const handleRsvpLimitChange = (newLimit: number) => {
    setSelectedRsvpIds([]);
    setRsvpMeta((prev) => ({ ...prev, page: 1, limit: newLimit }));
    updateUrlParams({ page: 1, limit: newLimit });
  };

  // Multi-select handlers for Created Events
  const handleToggleSelectCreated = (event: EventItem) => {
    setSelectedCreatedIds((prev) =>
      prev.includes(event.id)
        ? prev.filter((id) => id !== event.id)
        : [...prev, event.id],
    );
  };

  const handleToggleSelectAllCreated = () => {
    const visibleIds = createdEvents.map((e) => e.id);
    const allVisibleSelected =
      visibleIds.length > 0 &&
      visibleIds.every((id) => selectedCreatedIds.includes(id));
    if (allVisibleSelected) {
      setSelectedCreatedIds((prev) =>
        prev.filter((id) => !visibleIds.includes(id)),
      );
    } else {
      setSelectedCreatedIds((prev) =>
        Array.from(new Set([...prev, ...visibleIds])),
      );
    }
  };

  // Multi-select handlers for RSVP Events
  const handleToggleSelectRsvp = (event: EventItem) => {
    setSelectedRsvpIds((prev) =>
      prev.includes(event.id)
        ? prev.filter((id) => id !== event.id)
        : [...prev, event.id],
    );
  };

  const handleToggleSelectAllRsvp = () => {
    const visibleIds = rsvpEvents.map((e) => e.id);
    const allVisibleSelected =
      visibleIds.length > 0 &&
      visibleIds.every((id) => selectedRsvpIds.includes(id));
    if (allVisibleSelected) {
      setSelectedRsvpIds((prev) =>
        prev.filter((id) => !visibleIds.includes(id)),
      );
    } else {
      setSelectedRsvpIds((prev) =>
        Array.from(new Set([...prev, ...visibleIds])),
      );
    }
  };

  // Bulk Delete Execution
  const handleBulkDeleteConfirm = async () => {
    if (isBulkDeleting) return;
    setIsBulkDeleting(true);
    try {
      if (activeTab === "created") {
        if (selectedCreatedIds.length === 0) return;
        const res = await eventsApi.bulkDeleteEvents(selectedCreatedIds);
        if (res.success) {
          const count = res.data?.deletedCount ?? selectedCreatedIds.length;
          success(
            `Successfully deleted ${count} event${count === 1 ? "" : "s"}`,
          );
          setSelectedCreatedIds([]);
          setIsBulkDeleteModalOpen(false);
          refreshAll();
        }
      } else {
        if (selectedRsvpIds.length === 0) return;
        const res = await rsvpApi.bulkDeleteRsvps(selectedRsvpIds);
        if (res.success) {
          const count = res.data?.removedCount ?? selectedRsvpIds.length;
          success(
            `Successfully removed RSVP for ${count} event${count === 1 ? "" : "s"}`,
          );
          setSelectedRsvpIds([]);
          setIsBulkDeleteModalOpen(false);
          refreshAll();
        }
      }
    } catch (err: any) {
      error(
        err.response?.data?.error?.message || "Failed to execute bulk deletion",
      );
    } finally {
      setIsBulkDeleting(false);
    }
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
  }, [
    handleEventSaved,
    fetchCreatedEvents,
    fetchCreatedCounts,
    fetchRsvpCounts,
    user?.id,
  ]);

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
    <div className="max-w-7xl 2xl:max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12 pt-6 sm:pt-10 pb-1 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2 sm:gap-2.5">
            <BookmarkCheck className="w-7 h-7 sm:w-8 sm:h-8 text-indigo-600 dark:text-indigo-400" />
            My Events & RSVPs
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Manage your created events and track all gatherings you have RSVP'd
            to.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-200/70 dark:bg-slate-800/70 backdrop-blur-md w-full sm:max-w-md mb-6">
        <button
          onClick={() => handleTabChange("created")}
          className={`flex-1 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 sm:gap-2 ${
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
          className={`flex-1 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 sm:gap-2 ${
            activeTab === "rsvps"
              ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-md"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>My RSVPs</span>
          <CountBadge
            count={rsvpTimeframeCounts.all || rsvpCounts.all || rsvpMeta.total}
            isActive={activeTab === "rsvps"}
          />
        </button>
      </div>

      {/* RSVP Quick Status Filter Pills (Active only on RSVPs tab) */}
      {activeTab === "rsvps" && (
        <div className="overflow-x-auto scrollbar-none pb-2 mb-4 animate-fade-in">
          <div className="flex items-center gap-2 w-max sm:w-auto">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mr-1 flex items-center gap-1 shrink-0">
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
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 ${
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
        </div>
      )}

      {/* Server-Side Filter Bar with Timeframe Counts */}
      <div ref={filterBarRef}>
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
      </div>

      {/* Tab 1: Created by Me */}
      <div
        className={
          activeTab === "created" ? "mt-8 animate-fade-in block" : "hidden"
        }
      >
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
                onClick={() => {
                  if (user && !user.isEmailVerified) {
                    error("Email verification required: Please verify your email address to create events.");
                    navigate(APP_ROUTES.PROFILE, { state: { highlightEmailVerification: true } });
                    return;
                  }
                  setIsCreateModalOpen(true);
                }}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 shadow-sm"
              >
                Host Your First Event
              </button>
            )}
          </div>
        ) : (
          <div
            className={`transition-opacity duration-200 ${isCreatedFetching ? "opacity-60 pointer-events-none" : "opacity-100"}`}
          >
            {/* Bulk Selection Bar for Created Events */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5 p-3 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleToggleSelectAllCreated}
                  className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  <div
                    className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-all ${
                      createdEvents.length > 0 &&
                      createdEvents.every((e) =>
                        selectedCreatedIds.includes(e.id),
                      )
                        ? "bg-indigo-600 border-indigo-600 text-white"
                        : selectedCreatedIds.some((id) =>
                              createdEvents.some((e) => e.id === id),
                            )
                          ? "bg-indigo-100 dark:bg-indigo-950 border-indigo-500 text-indigo-600 dark:text-indigo-400"
                          : "border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    }`}
                  >
                    {createdEvents.length > 0 &&
                    createdEvents.every((e) =>
                      selectedCreatedIds.includes(e.id),
                    ) ? (
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    ) : selectedCreatedIds.some((id) =>
                        createdEvents.some((e) => e.id === id),
                      ) ? (
                      <div className="w-2 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded" />
                    ) : null}
                  </div>
                  <span>Select All Visible ({createdEvents.length})</span>
                </button>

                {selectedCreatedIds.length > 0 && (
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 animate-fade-in">
                    {selectedCreatedIds.length} selected
                  </span>
                )}
              </div>

              {selectedCreatedIds.length > 0 && (
                <div className="flex items-center gap-2 animate-fade-in">
                  <button
                    type="button"
                    onClick={() => setSelectedCreatedIds([])}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    Clear Selection
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsBulkDeleteModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm shadow-rose-500/20 active:scale-95 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Selected ({selectedCreatedIds.length})
                  </button>
                </div>
              )}
            </div>

            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6 2xl:gap-8"
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
                    selectable
                    isSelected={selectedCreatedIds.includes(event.id)}
                    onToggleSelect={handleToggleSelectCreated}
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
      <div
        className={
          activeTab === "rsvps" ? "mt-8 animate-fade-in block" : "hidden"
        }
      >
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
              {hasActiveFilters ? "No Matching RSVPs Found" : "No RSVPs found"}
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
          <div
            className={`transition-opacity duration-200 ${isRsvpFetching ? "opacity-60 pointer-events-none" : "opacity-100"}`}
          >
            {/* Bulk Selection Bar for RSVP Events */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5 p-3 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleToggleSelectAllRsvp}
                  className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  <div
                    className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-all ${
                      rsvpEvents.length > 0 &&
                      rsvpEvents.every((e) => selectedRsvpIds.includes(e.id))
                        ? "bg-indigo-600 border-indigo-600 text-white"
                        : selectedRsvpIds.some((id) =>
                              rsvpEvents.some((e) => e.id === id),
                            )
                          ? "bg-indigo-100 dark:bg-indigo-950 border-indigo-500 text-indigo-600 dark:text-indigo-400"
                          : "border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    }`}
                  >
                    {rsvpEvents.length > 0 &&
                    rsvpEvents.every((e) => selectedRsvpIds.includes(e.id)) ? (
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    ) : selectedRsvpIds.some((id) =>
                        rsvpEvents.some((e) => e.id === id),
                      ) ? (
                      <div className="w-2 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded" />
                    ) : null}
                  </div>
                  <span>Select All Visible ({rsvpEvents.length})</span>
                </button>

                {selectedRsvpIds.length > 0 && (
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 animate-fade-in">
                    {selectedRsvpIds.length} selected
                  </span>
                )}
              </div>

              {selectedRsvpIds.length > 0 && (
                <div className="flex items-center gap-2 animate-fade-in">
                  <button
                    type="button"
                    onClick={() => setSelectedRsvpIds([])}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    Clear Selection
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsBulkDeleteModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm shadow-rose-500/20 active:scale-95 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Remove Selected RSVPs ({selectedRsvpIds.length})
                  </button>
                </div>
              )}
            </div>

            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6 2xl:gap-8"
                  : "space-y-4"
              }
            >
              {rsvpEvents.map((event) => (
                <div
                  key={event.id}
                  className="animate-slide-up transition-all duration-300 h-full"
                >
                  <EventCard
                    key={event.id}
                    event={event}
                    selectable
                    isSelected={selectedRsvpIds.includes(event.id)}
                    onToggleSelect={handleToggleSelectRsvp}
                  />
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

      {/* Single Delete Confirm Modal */}
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

      {/* Bulk Delete Warning Confirm Dialog */}
      <BulkDeleteConfirmDialog
        isOpen={isBulkDeleteModalOpen}
        type={activeTab}
        selectedEvents={
          activeTab === "created"
            ? createdEvents.filter((e) => selectedCreatedIds.includes(e.id))
            : rsvpEvents.filter((e) => selectedRsvpIds.includes(e.id))
        }
        isLoading={isBulkDeleting}
        onConfirm={handleBulkDeleteConfirm}
        onCancel={() => setIsBulkDeleteModalOpen(false)}
      />
    </div>
  );
};
