import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Users, 
  Globe, 
  Lock, 
  Edit3, 
  Trash2, 
  ExternalLink,
  ShieldCheck,
  Loader2,
  Clock
} from 'lucide-react';
import { EventItem } from '../types';
import { eventsApi } from '../api/events.api';
import { RsvpButtonGroup } from '../components/RsvpButtonGroup';
import { EventFormModal } from '../components/EventFormModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { format, parseISO } from 'date-fns';
import { TagsPopover } from '../components/TagsPopover';

export const EventDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<EventItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [attendeeFilter, setAttendeeFilter] = useState<'all' | 'yes' | 'maybe' | 'no'>('all');

  const { isAuthenticated } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const fetchEvent = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const res = await eventsApi.getEventById(Number(id));
      if (res.success) {
        setEvent(res.data);
      }
    } catch (err: any) {
      error(err.response?.data?.error?.message || 'Failed to load event details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const handleDelete = async () => {
    if (!event) return;
    try {
      setIsDeleting(true);
      const res = await eventsApi.deleteEvent(event.id);
      if (res.success) {
        success('Event deleted successfully');
        navigate('/');
      }
    } catch (err: any) {
      error(err.response?.data?.error?.message || 'Failed to delete event');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-sm font-semibold text-slate-500">Loading event details...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Event Not Found</h2>
        <p className="text-slate-500 mt-2 mb-6">The event you are looking for does not exist or has been removed.</p>
        <Link to="/" className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm">
          Return to Events
        </Link>
      </div>
    );
  }

  const startDate = parseISO(event.startTime);
  const endDate = event.endTime ? parseISO(event.endTime) : null;
  const isPast = event.isPast;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in pb-20">
      {/* Back Button */}
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Events
      </Link>

      {/* Main Event Visual Header */}
      <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-slate-900 border border-slate-200/80 dark:border-slate-800">
        <div className="relative h-72 sm:h-96 w-full">
          <img
            src={event.bannerUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80'}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

          {/* Badges on Top */}
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-md shadow-md ${
                event.eventType === 'public'
                  ? 'bg-emerald-500/90 text-white'
                  : 'bg-indigo-600/90 text-white'
              }`}
            >
              {event.eventType === 'public' ? <Globe className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
              {event.eventType === 'public' ? 'Public Event' : 'Private Event'}
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

      {/* Grid Layout: Details & Sidebar */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols): Information & Description */}
        <div className="lg:col-span-2 space-y-6">
          {/* Key Facts Card */}
          <div className="glass-card rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-md">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">Event Schedule & Location</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Date & Time */}
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Date & Time</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                    {format(startDate, 'EEEE, MMMM dd, yyyy')}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    {format(startDate, 'h:mm a')}
                    {endDate && ` – ${format(endDate, 'h:mm a')}`}
                  </p>
                </div>
              </div>

              {/* Location */}
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Location</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{event.location}</p>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline mt-1 font-semibold"
                  >
                    Open in Google Maps <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Description Card */}
          <div className="glass-card rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-md">
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-3">About this Event</h2>
            <div className="prose prose-slate dark:prose-invert max-w-none text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {event.description}
            </div>
          </div>

          {/* Tags & Categories Card */}
          {event.tags && event.tags.length > 0 && (
            <div className="glass-card rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-md">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                  Categories & Tags
                </h2>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                  {event.tags.length} {event.tags.length === 1 ? 'tag' : 'tags'}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1">
                {event.tags.map((t) => (
                  <span
                    key={t.id}
                    style={{ backgroundColor: `${t.colorHex}18`, color: t.colorHex, borderColor: `${t.colorHex}35` }}
                    className="px-3 py-1 rounded-xl text-xs font-bold border transition-all hover:scale-105"
                  >
                    #{t.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Attendees List Card */}
          <div className="glass-card rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-500" />
                  Community Responses ({event.attendees?.length || 0})
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {event.rsvpStats.yes} going • {event.rsvpStats.maybe} interested • {event.rsvpStats.no} declined
                </p>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900/80 p-1 rounded-xl border border-slate-200/60 dark:border-slate-800/60 self-start sm:self-auto text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setAttendeeFilter('all')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    attendeeFilter === 'all'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm font-bold'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  All ({event.attendees?.length || 0})
                </button>
                <button
                  type="button"
                  onClick={() => setAttendeeFilter('yes')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    attendeeFilter === 'yes'
                      ? 'bg-emerald-600 text-white shadow-sm font-bold'
                      : 'text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400'
                  }`}
                >
                  Going ({event.rsvpStats.yes})
                </button>
                <button
                  type="button"
                  onClick={() => setAttendeeFilter('maybe')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    attendeeFilter === 'maybe'
                      ? 'bg-amber-500 text-white shadow-sm font-bold'
                      : 'text-slate-500 hover:text-amber-600 dark:hover:text-amber-400'
                  }`}
                >
                  Maybe ({event.rsvpStats.maybe})
                </button>
                <button
                  type="button"
                  onClick={() => setAttendeeFilter('no')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    attendeeFilter === 'no'
                      ? 'bg-rose-600 text-white shadow-sm font-bold'
                      : 'text-slate-500 hover:text-rose-600 dark:hover:text-rose-400'
                  }`}
                >
                  No ({event.rsvpStats.no})
                </button>
              </div>
            </div>

            {(() => {
              const filteredAttendees = (event.attendees || []).filter((a) => {
                if (attendeeFilter === 'all') return true;
                return a.status === attendeeFilter;
              });

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
                        src={attendee.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${attendee.name}`}
                        alt={attendee.name}
                        className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-300 dark:ring-slate-700 flex-shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{attendee.name}</p>
                        <span
                          className={`inline-block text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md border mt-0.5 ${
                            attendee.status === 'yes'
                              ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/80 dark:border-emerald-900/60'
                              : attendee.status === 'maybe'
                              ? 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border-amber-200/80 dark:border-amber-900/60'
                              : 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border-rose-200/80 dark:border-rose-900/60'
                          }`}
                        >
                          {attendee.status === 'yes' ? 'Attending' : attendee.status === 'maybe' ? 'Interested' : 'Declined'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>

        {/* Right Sidebar: RSVP Widget & Organizer Card */}
        <div className="space-y-6">
          {/* RSVP Button Group Widget */}
          <RsvpButtonGroup
            eventId={event.id}
            initialStatus={event.userRsvp}
            stats={event.rsvpStats}
            capacity={event.capacity}
            isPast={isPast}
            onRsvpSuccess={(newStatus, updatedStats) => {
              setEvent((prev) => (prev ? { ...prev, userRsvp: newStatus, rsvpStats: updatedStats } : null));
              fetchEvent();
            }}
          />

          {/* Organizer Card */}
          <div className="glass-card rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-md">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Event Organizer</h3>
            <div className="flex items-center gap-3">
              <img
                src={event.creator.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${event.creator.name}`}
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
                <p className="text-xs text-slate-500 dark:text-slate-400">{event.creator.email}</p>
              </div>
            </div>
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
