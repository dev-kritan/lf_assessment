import { format, parseISO } from "date-fns";
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Clock,
  Edit3,
  Globe,
  Loader2,
  Lock,
  LogIn,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Users,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { eventsApi } from "../api/events.api";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { EventFormModal } from "../components/EventFormModal";
import { LocationHoverCard } from "../components/LocationHoverCard";
import { RsvpButtonGroup } from "../components/RsvpButtonGroup";
import { TagsPopover } from "../components/TagsPopover";
import { APP_ROUTES, DEFAULT_ASSETS, getDicebearAvatarUrl } from "../constants";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { EventItem } from "../types";

export const EventDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [event, setEvent] = useState<EventItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isForbidden, setIsForbidden] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [attendeeFilter, setAttendeeFilter] = useState<
    "all" | "yes" | "maybe" | "no"
  >("all");

  const { user, isAuthenticated } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const fetchEvent = async (isBackground = false) => {
    if (!id) return;
    try {
      if (!isBackground) {
        setIsLoading(true);
      }
      setIsForbidden(false);
      setFetchError(null);
      const res = await eventsApi.getEventById(Number(id));
      if (res.success) {
        setEvent(res.data);
      }
    } catch (err: any) {
      if (
        err.response?.status === 403 ||
        err.response?.data?.error?.code === "PRIVATE_EVENT_FORBIDDEN"
      ) {
        setIsForbidden(true);
      } else if (err.response?.status === 404) {
        setEvent(null);
      } else {
        const msg =
          err.response?.data?.error?.message ||
          "Failed to load event details. Please check your connection.";
        setFetchError(msg);
        if (!isBackground) {
          error(msg);
        }
      }
    } finally {
      if (!isBackground) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchEvent();
  }, [id, isAuthenticated]);

  const handleBack = () => {
    const isFromMyEvents =
      searchParams.get("tab") !== null || searchParams.has("rsvp_status");
    const targetBase = isFromMyEvents ? APP_ROUTES.MY_EVENTS : APP_ROUTES.HOME;
    const queryString = searchParams.toString();
    if (queryString) {
      navigate(`${targetBase}?${queryString}`);
    } else {
      navigate(targetBase);
    }
  };

  const handleDelete = async () => {
    if (!event || isDeleting) return;
    try {
      setIsDeleting(true);
      const res = await eventsApi.deleteEvent(event.id);
      if (res.success) {
        success("Event deleted successfully");
        const isFromMyEvents =
          searchParams.get("tab") !== null || searchParams.has("rsvp_status");
        const targetBase = isFromMyEvents
          ? APP_ROUTES.MY_EVENTS
          : APP_ROUTES.HOME;
        const queryString = searchParams.toString();
        if (queryString) {
          navigate(`${targetBase}?${queryString}`);
        } else {
          navigate(targetBase);
        }
      }
    } catch (err: any) {
      error(err.response?.data?.error?.message || "Failed to delete event");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-sm font-semibold text-slate-500">
          Loading event details...
        </p>
      </div>
    );
  }

  if (fetchError && !event) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center animate-fade-in">
        <div className="w-16 h-16 rounded-3xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center mb-4 shadow-inner ring-4 ring-rose-500/10">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
          Unable to Load Event
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 mb-8 leading-relaxed">
          {fetchError}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => fetchEvent()}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
          <button
            type="button"
            onClick={handleBack}
            className="w-full sm:w-auto px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold text-sm transition-colors cursor-pointer"
          >
            Return to Events
          </button>
        </div>
      </div>
    );
  }

  if (isForbidden) {
    const isUnverifiedUser = isAuthenticated && user && !user.isEmailVerified;

    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center animate-fade-in">
        <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center mb-4 shadow-inner ring-1 ring-indigo-500/20">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
          {isUnverifiedUser ? "Email Verification Required" : "Private Event"}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 mb-8 leading-relaxed">
          {isUnverifiedUser
            ? "This gathering is True Private and restricted to verified community members. Please verify your email address to access details and RSVP."
            : "This gathering is private and restricted to signed-in community members. Sign in to view full event details and RSVP."}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          {isUnverifiedUser ? (
            <Link
              to={APP_ROUTES.PROFILE}
              state={{ highlightEmailVerification: true }}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              Verify Email in Profile
            </Link>
          ) : (
            <Link
              to={`${APP_ROUTES.LOGIN}?redirect=${encodeURIComponent(location.pathname + location.search)}`}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              Sign In to View
            </Link>
          )}
          <button
            type="button"
            onClick={handleBack}
            className="w-full sm:w-auto px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold text-sm transition-colors cursor-pointer"
          >
            Browse Public Events
          </button>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          Event Not Found
        </h2>
        <p className="text-slate-500 mt-2 mb-6">
          The event you are looking for does not exist or has been removed.
        </p>
        <button
          type="button"
          onClick={handleBack}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-colors cursor-pointer"
        >
          Return to Events
        </button>
      </div>
    );
  }

  const startDate = parseISO(event.startTime);
  const endDate = event.endTime ? parseISO(event.endTime) : null;
  const isPast = event.isPast;
  const pageParam = searchParams.get("page");

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in pb-20">
      {/* Back Button */}
      <button
        type="button"
        onClick={handleBack}
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white mb-6 transition-colors group cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        <span>Back to Events</span>
        {pageParam && Number(pageParam) > 1 && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
            Page {pageParam}
          </span>
        )}
      </button>

      {/* Main Event Visual Header */}
      <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-slate-900 border border-slate-200/80 dark:border-slate-800">
        <div className="relative h-72 sm:h-96 w-full">
          <img
            src={event.bannerUrl || DEFAULT_ASSETS.EVENT_BANNER}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

          {/* Badges on Top */}
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-md shadow-md ${
                event.eventType === "public"
                  ? "bg-emerald-500/90 text-white"
                  : event.isTruePrivate
                    ? "bg-purple-600/90 text-white"
                    : "bg-indigo-600/90 text-white"
              }`}
            >
              {event.eventType === "public" ? (
                <Globe className="w-3.5 h-3.5" />
              ) : (
                <Lock className="w-3.5 h-3.5" />
              )}
              {event.eventType === "public"
                ? "Public Event"
                : event.isTruePrivate
                  ? "True Private Event"
                  : "Private Event"}
            </span>

            {isPast && (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-900/90 text-slate-300 backdrop-blur-md shadow-md">
                <Clock className="w-3.5 h-3.5" /> Past Event
              </span>
            )}
          </div>

          {/* Admin Controls */}
          {event.isCreator && (
            <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white text-xs font-bold backdrop-blur-md hover:bg-white transition-all shadow-md"
              >
                <Edit3 className="w-3.5 h-3.5 text-indigo-500" />
                Edit
              </button>
              <button
                onClick={() => setIsDeleteDialogOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600/90 hover:bg-rose-600 text-white text-xs font-bold backdrop-blur-md transition-all shadow-md"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            </div>
          )}

          {/* Title & Tags inside Hero */}
          <div className="absolute bottom-6 left-6 right-6 z-10">
            <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
              {event.tags.slice(0, 5).map((t) => (
                <span
                  key={t.id}
                  style={{ backgroundColor: t.colorHex }}
                  className="px-3 py-0.5 rounded-full text-xs font-bold text-white shadow-sm"
                >
                  #{t.name}
                </span>
              ))}
              <TagsPopover
                tags={event.tags}
                limit={5}
                badgeClassName="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-900/80 hover:bg-slate-900 text-slate-200 backdrop-blur-md shadow-sm cursor-pointer transition-colors inline-flex items-center gap-1"
                popoverClassName="absolute left-0 bottom-full mb-2 z-50 flex flex-col gap-1.5 p-3.5 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-slate-700 shadow-2xl min-w-[240px] max-w-[320px] max-h-56 overflow-y-auto animate-fade-in pointer-events-auto"
                chipClassName="px-2.5 py-0.5 rounded-full text-xs font-bold border"
              />
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white leading-tight line-clamp-2">
              {event.title}
            </h1>
          </div>
        </div>
      </div>

      {/* Private Event Notice for Unauthenticated or Unverified Visitors */}
      {event.eventType === "private" &&
        (!isAuthenticated || (user && !user.isEmailVerified)) && (
          <div className="mt-6 p-4.5 rounded-3xl bg-gradient-to-r from-indigo-50/90 via-purple-50/50 to-pink-50/40 dark:from-indigo-950/40 dark:via-purple-950/30 dark:to-slate-900/40 border border-indigo-200/80 dark:border-indigo-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md backdrop-blur-md">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-indigo-500/25">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-extrabold text-slate-900 dark:text-white">
                  {isAuthenticated && user && !user.isEmailVerified
                    ? "Email Verification Required"
                    : "Private Community Event"}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                  {isAuthenticated && user && !user.isEmailVerified
                    ? "Please verify your email address to unlock event schedule, location, full details, organizer info, and community RSVPs."
                    : "Sign in to your account to unlock event schedule, location, full details, organizer info, and community RSVPs."}
                </p>
              </div>
            </div>
            {isAuthenticated && user && !user.isEmailVerified ? (
              <Link
                to={APP_ROUTES.PROFILE}
                state={{ highlightEmailVerification: true }}
                className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md shadow-indigo-500/25 flex-shrink-0 flex items-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Verify Email in Profile
              </Link>
            ) : (
              <Link
                to={`${APP_ROUTES.LOGIN}?redirect=${encodeURIComponent(location.pathname + location.search)}`}
                className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md shadow-indigo-500/25 flex-shrink-0 flex items-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5" />
                Sign In to Unlock
              </Link>
            )}
          </div>
        )}

      {/* Grid Layout: Details & Sidebar */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols): Information & Description */}
        <div className="lg:col-span-2 space-y-6 relative z-20">
          {/* Key Facts Card */}
          <div className="glass-card rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800/80 shadow-md relative z-30">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">
              Event Schedule & Location
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Date & Time */}
              <div className="flex items-start gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Date & Time
                  </p>
                  {event.eventType === "private" &&
                  (!isAuthenticated || (user && !user.isEmailVerified)) ? (
                    <>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mt-0.5">
                        Private Schedule
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        Restricted to verified members
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                        {format(startDate, "EEEE, MMMM dd, yyyy")}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        {format(startDate, "h:mm a")}
                        {endDate && ` – ${format(endDate, "h:mm a")}`}
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Location */}
              <div className="flex items-start gap-3.5 min-w-0 overflow-hidden pr-2">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1 pr-2">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-0.5">
                    Location
                  </p>
                  {event.eventType === "private" &&
                  (!isAuthenticated || (user && !user.isEmailVerified)) ? (
                    <>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mt-0.5">
                        Private Location
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        Restricted to verified members
                      </p>
                    </>
                  ) : (
                    <LocationHoverCard
                      location={event.location}
                      variant="detail"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Description Card */}
          <div className="glass-card rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-md relative z-10">
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-3">
              About this Event
            </h2>
            {event.eventType === "private" &&
            (!isAuthenticated || (user && !user.isEmailVerified)) ? (
              <div className="py-6 text-center bg-slate-50/50 dark:bg-slate-950/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-4">
                <Lock className="w-6 h-6 text-indigo-500 mx-auto mb-2 opacity-80" />
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Protected Event Details
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                  {isAuthenticated && user && !user.isEmailVerified
                    ? "Full event description is restricted to verified community members. Please verify your email to unlock."
                    : "Full event description is restricted to verified community members. Please sign in to unlock."}
                </p>
              </div>
            ) : (
              <div className="prose prose-slate dark:prose-invert max-w-none text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {event.description}
              </div>
            )}
          </div>

          {/* Tags & Categories Card */}
          {event.tags && event.tags.length > 0 && (
            <div className="glass-card rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-md relative z-10">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                  Categories & Tags
                </h2>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                  {event.tags.length} {event.tags.length === 1 ? "tag" : "tags"}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1">
                {event.tags.map((t) => (
                  <span
                    key={t.id}
                    style={{
                      backgroundColor: `${t.colorHex}18`,
                      color: t.colorHex,
                      borderColor: `${t.colorHex}35`,
                    }}
                    className="px-3 py-1 rounded-xl text-xs font-bold border transition-all hover:scale-105"
                  >
                    #{t.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Attendees List Card */}
          <div className="glass-card rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-md relative z-10">
            {event.eventType === "private" &&
            (!isAuthenticated || (user && !user.isEmailVerified)) ? (
              <div className="py-8 text-center bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-200/60 dark:border-slate-800 p-6">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center mb-3">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  RSVP &amp; Attendance are Private
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 mb-5 max-w-sm mx-auto leading-relaxed">
                  {isAuthenticated && user && !user.isEmailVerified
                    ? "Attendee responses and community participation are accessible only to verified community members."
                    : "Attendee responses and community participation are accessible only to signed-in, verified members."}
                </p>
                {isAuthenticated && user && !user.isEmailVerified ? (
                  <Link
                    to={APP_ROUTES.PROFILE}
                    state={{ highlightEmailVerification: true }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md shadow-indigo-500/25 active:scale-95"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Verify Email in Profile
                  </Link>
                ) : (
                  <Link
                    to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md shadow-indigo-500/25 active:scale-95"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    Sign In to View Attendance &amp; RSVP
                  </Link>
                )}
              </div>
            ) : (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Users className="w-5 h-5 text-indigo-500" />
                      Community Responses ({event.attendees?.length || 0})
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {event.rsvpStats.yes} going • {event.rsvpStats.maybe}{" "}
                      interested • {event.rsvpStats.no} declined
                    </p>
                  </div>

                  {/* Filter Tabs */}
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900/80 p-1 rounded-xl border border-slate-200/60 dark:border-slate-800/60 self-start sm:self-auto text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setAttendeeFilter("all")}
                      className={`px-2.5 py-1 rounded-lg transition-all ${
                        attendeeFilter === "all"
                          ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm font-bold"
                          : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      All ({event.attendees?.length || 0})
                    </button>
                    <button
                      type="button"
                      onClick={() => setAttendeeFilter("yes")}
                      className={`px-2.5 py-1 rounded-lg transition-all ${
                        attendeeFilter === "yes"
                          ? "bg-emerald-600 text-white shadow-sm font-bold"
                          : "text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400"
                      }`}
                    >
                      Going ({event.rsvpStats.yes})
                    </button>
                    <button
                      type="button"
                      onClick={() => setAttendeeFilter("maybe")}
                      className={`px-2.5 py-1 rounded-lg transition-all ${
                        attendeeFilter === "maybe"
                          ? "bg-amber-500 text-white shadow-sm font-bold"
                          : "text-slate-500 hover:text-amber-600 dark:hover:text-amber-400"
                      }`}
                    >
                      Maybe ({event.rsvpStats.maybe})
                    </button>
                    <button
                      type="button"
                      onClick={() => setAttendeeFilter("no")}
                      className={`px-2.5 py-1 rounded-lg transition-all ${
                        attendeeFilter === "no"
                          ? "bg-rose-600 text-white shadow-sm font-bold"
                          : "text-slate-500 hover:text-rose-600 dark:hover:text-rose-400"
                      }`}
                    >
                      No ({event.rsvpStats.no})
                    </button>
                  </div>
                </div>

                {/* Attendee Roster Grid */}
                {(() => {
                  const filteredAttendees = (event.attendees || []).filter(
                    (a) => {
                      if (attendeeFilter === "all") return true;
                      return a.status === attendeeFilter;
                    },
                  );

                  if (!event.attendees || event.attendees.length === 0) {
                    return (
                      <p className="text-xs text-slate-500 dark:text-slate-400 py-6 text-center">
                        No RSVPs recorded yet. Be the first to RSVP!
                      </p>
                    );
                  }

                  if (filteredAttendees.length === 0) {
                    return (
                      <p className="text-xs text-slate-500 dark:text-slate-400 py-6 text-center">
                        No attendees in this category yet.
                      </p>
                    );
                  }

                  return (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {filteredAttendees.map((attendee) => (
                        <div
                          key={attendee.id}
                          className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800"
                        >
                          <img
                            src={
                              attendee.avatarUrl ||
                              getDicebearAvatarUrl(attendee.name)
                            }
                            alt={attendee.name}
                            className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-300 dark:ring-slate-700 flex-shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {attendee.name}
                            </p>
                            <span
                              className={`inline-block text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md border mt-0.5 ${
                                attendee.status === "yes"
                                  ? "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/80 dark:border-emerald-900/60"
                                  : attendee.status === "maybe"
                                    ? "text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border-amber-200/80 dark:border-amber-900/60"
                                    : "text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border-rose-200/80 dark:border-rose-900/60"
                              }`}
                            >
                              {attendee.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </>
            )}
          </div>
        </div>

        {/* Right Sidebar: RSVP Widget & Organizer Card */}
        <div className="space-y-6 relative z-10">
          {/* RSVP Widget: Full interactive for public events or verified private events; Locked card for unverified/guest private events */}
          {event.eventType === "public" ||
          (isAuthenticated && user?.isEmailVerified) ? (
            <RsvpButtonGroup
              eventId={event.id}
              initialStatus={event.userRsvp}
              stats={event.rsvpStats}
              capacity={event.capacity}
              isPast={isPast}
              onRsvpSuccess={(newStatus, updatedStats) => {
                setEvent((prev) => {
                  if (!prev) return null;
                  let updatedAttendees = [...(prev.attendees || [])];
                  if (user) {
                    const existingIdx = updatedAttendees.findIndex(
                      (a) => a.id === user.id,
                    );
                    if (existingIdx >= 0) {
                      updatedAttendees[existingIdx] = {
                        ...updatedAttendees[existingIdx],
                        status: newStatus,
                        updatedAt: new Date().toISOString(),
                      };
                    } else {
                      updatedAttendees.push({
                        id: user.id,
                        name: user.name,
                        avatarUrl: user.avatarUrl || undefined,
                        status: newStatus,
                        updatedAt: new Date().toISOString(),
                      });
                    }
                  }
                  return {
                    ...prev,
                    userRsvp: newStatus,
                    rsvpStats: updatedStats,
                    attendees: updatedAttendees,
                  };
                });
                fetchEvent(true);
              }}
            />
          ) : (
            <div className="rounded-3xl glass-card p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-md">
              <div className="flex items-center justify-between gap-2 mb-3">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                  <span>Private Gathering</span>
                </h4>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                  Members Only
                </span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
                {isAuthenticated && user && !user.isEmailVerified
                  ? "RSVP participation and attendee roster are restricted to verified community members. Please verify your email to respond."
                  : "RSVP participation and attendee roster are restricted to verified community members."}
              </p>

              {isAuthenticated && user && !user.isEmailVerified ? (
                <Link
                  to={APP_ROUTES.PROFILE}
                  state={{ highlightEmailVerification: true }}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-xs shadow-md shadow-indigo-500/25 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Verify Email to RSVP
                </Link>
              ) : (
                <Link
                  to={`${APP_ROUTES.LOGIN}?redirect=${encodeURIComponent(location.pathname + location.search)}`}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-xs shadow-md shadow-indigo-500/25 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  Sign In to Participate
                </Link>
              )}
            </div>
          )}

          {/* Organizer Card */}
          <div className="glass-card rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-md">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Event Organizer
            </h3>
            {event.eventType === "private" &&
            (!isAuthenticated || (user && !user.isEmailVerified)) ? (
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center ring-2 ring-slate-200 dark:ring-slate-700 flex-shrink-0">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    Community Member
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    Verified members only
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <img
                  src={
                    event.creator.avatarUrl ||
                    getDicebearAvatarUrl(event.creator.name)
                  }
                  alt={event.creator.name}
                  className="w-12 h-12 rounded-2xl object-cover ring-2 ring-indigo-500/20"
                />
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    {event.creator.name}
                    {event.isCreator && (
                      <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 px-1.5 py-0.5 rounded-full">
                        You
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {event.creator.email}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <EventFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        eventToEdit={event}
        onSuccess={(updated) => setEvent(updated)}
      />

      {/* Delete Modal */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        title="Delete Event"
        message="Are you sure you want to permanently delete this event? All attendee RSVPs and event information will be deleted."
        confirmLabel="Delete Event"
        isDestructive
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setIsDeleteDialogOpen(false)}
      />
    </div>
  );
};
