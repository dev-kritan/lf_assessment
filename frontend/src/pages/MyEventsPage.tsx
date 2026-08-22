import React, { useState, useEffect } from 'react';
import { BookmarkCheck, Calendar, Users, PlusCircle, Loader2 } from 'lucide-react';
import { EventItem } from '../types';
import { eventsApi } from '../api/events.api';
import { rsvpApi } from '../api/rsvp.api';
import { EventCard } from '../components/EventCard';
import { EventFormModal } from '../components/EventFormModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Link, useNavigate } from 'react-router-dom';

export const MyEventsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'created' | 'rsvps'>('created');
  const [createdEvents, setCreatedEvents] = useState<EventItem[]>([]);
  const [userRsvps, setUserRsvps] = useState<any[]>([]);
  const [allTags, setAllTags] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<EventItem | null>(null);
  const [eventToDelete, setEventToDelete] = useState<EventItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { user, isAuthenticated } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const loadData = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const [createdRes, rsvpRes, tagsRes] = await Promise.all([
        eventsApi.getEvents({ creator_id: user.id, limit: 50 }),
        rsvpApi.getMyRsvps(),
        eventsApi.getTags(),
      ]);

      if (createdRes.success) setCreatedEvents(createdRes.data);
      if (rsvpRes.success) setUserRsvps(rsvpRes.data);
      if (tagsRes.success) setAllTags(tagsRes.data);
    } catch {
      error('Failed to load your events');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleDelete = async () => {
    if (!eventToDelete) return;
    try {
      setIsDeleting(true);
      const res = await eventsApi.deleteEvent(eventToDelete.id);
      if (res.success) {
        success('Event deleted successfully');
        setEventToDelete(null);
        loadData();
      }
    } catch (err: any) {
      error(err.response?.data?.error?.message || 'Failed to delete event');
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
            Manage your created events and track all gatherings you have RSVP'd to.
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
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-200/70 dark:bg-slate-800/70 backdrop-blur-md max-w-md mb-8">
        <button
          onClick={() => setActiveTab('created')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'created'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Created by Me ({createdEvents.length})
        </button>

        <button
          onClick={() => setActiveTab('rsvps')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'rsvps'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          My RSVPs ({userRsvps.length})
        </button>
      </div>

      {isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
          <p className="text-sm font-semibold text-slate-500">Loading your events...</p>
        </div>
      ) : activeTab === 'created' ? (
        /* Created by Me Tab */
        createdEvents.length === 0 ? (
          <div className="py-16 text-center glass-card rounded-3xl p-8 border border-slate-200 dark:border-slate-800 max-w-lg mx-auto">
            <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">You haven't created any events yet</h3>
            <p className="text-xs text-slate-500 mt-1 mb-6">
              Create an event to start inviting friends, colleagues, and community members.
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 shadow-sm"
            >
              Host Your First Event
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {createdEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onEdit={(evt) => {
                  setEventToEdit(evt);
                  setIsCreateModalOpen(true);
                }}
                onDelete={(evt) => setEventToDelete(evt)}
              />
            ))}
          </div>
        )
      ) : (
        /* My RSVPs Tab */
        userRsvps.length === 0 ? (
          <div className="py-16 text-center glass-card rounded-3xl p-8 border border-slate-200 dark:border-slate-800 max-w-lg mx-auto">
            <Users className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">No RSVPs yet</h3>
            <p className="text-xs text-slate-500 mt-1 mb-6">
              Browse upcoming community events and RSVP to attend!
            </p>
            <Link
              to="/"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 shadow-sm"
            >
              Browse Upcoming Events
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userRsvps.map((rsvp) => (
              <div
                key={rsvp.id}
                className="glass-card rounded-3xl p-5 border border-slate-200 dark:border-slate-800 flex flex-col justify-between hover:shadow-xl transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full uppercase ${
                        rsvp.user_rsvp_status === 'yes'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : rsvp.user_rsvp_status === 'maybe'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                      }`}
                    >
                      RSVP: {rsvp.user_rsvp_status}
                    </span>
                    <span className="text-[11px] text-slate-400 capitalize">{rsvp.event_type}</span>
                  </div>

                  <Link to={`/events/${rsvp.id}`}>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 line-clamp-1">
                      {rsvp.title}
                    </h3>
                  </Link>

                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">
                    {rsvp.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-500">By {rsvp.creator_name}</span>
                  <Link
                    to={`/events/${rsvp.id}`}
                    className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    View Details →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Create / Edit Modal */}
      <EventFormModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEventToEdit(null);
        }}
        eventToEdit={eventToEdit}
        onSuccess={loadData}
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
