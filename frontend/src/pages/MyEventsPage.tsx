import React, { useState, useEffect, useCallback } from 'react';
import { BookmarkCheck, Calendar, Users, PlusCircle, Loader2, ListFilter, CheckCircle2, HelpCircle, XCircle } from 'lucide-react';
import { EventItem, Tag, PaginationMeta } from '../types';
import { eventsApi } from '../api/events.api';
import { rsvpApi } from '../api/rsvp.api';
import { EventCard } from '../components/EventCard';
import { EventFormModal } from '../components/EventFormModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Pagination } from '../components/Pagination';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Link, useNavigate } from 'react-router-dom';

export const MyEventsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'created' | 'rsvps'>('created');
  
  // Created events pagination state
  const [createdEvents, setCreatedEvents] = useState<EventItem[]>([]);
  const [createdMeta, setCreatedMeta] = useState<PaginationMeta>({
    page: 1,
    limit: 6,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [isCreatedLoading, setIsCreatedLoading] = useState(true);

  // RSVP events pagination state
  const [rsvpEvents, setRsvpEvents] = useState<EventItem[]>([]);
  const [rsvpMeta, setRsvpMeta] = useState<PaginationMeta>({
    page: 1,
    limit: 6,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [rsvpStatusFilter, setRsvpStatusFilter] = useState<'all' | 'yes' | 'maybe' | 'no'>('all');
  const [rsvpCounts, setRsvpCounts] = useState<{
    all: number;
    yes: number;
    maybe: number;
    no: number;
  }>({ all: 0, yes: 0, maybe: 0, no: 0 });
  const [isRsvpLoading, setIsRsvpLoading] = useState(true);

  const [allTags, setAllTags] = useState<Tag[]>([]);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<EventItem | null>(null);
  const [eventToDelete, setEventToDelete] = useState<EventItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login?redirect=/my-events');
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Load system tags for create modal
  useEffect(() => {
    eventsApi.getTags().then((res) => {
      if (res.success && res.data) {
        setAllTags(res.data);
      }
    }).catch(() => {});
  }, []);

  // Fetch paginated Created Events
  const fetchCreatedEvents = useCallback(async (page = createdMeta.page, limit = createdMeta.limit) => {
    if (!user) return;
    try {
      setIsCreatedLoading(true);
      const res = await eventsApi.getEvents({
        creator_id: user.id,
        page,
        limit,
        sort_by: 'date',
        sort_order: 'desc',
      });

      if (res.success && res.data) {
        setCreatedEvents(res.data);
        if (res.meta) {
          setCreatedMeta(res.meta);
        }
      }
    } catch {
      error('Failed to load your created events');
    } finally {
      setIsCreatedLoading(false);
    }
  }, [user, createdMeta.page, createdMeta.limit, error]);

  // Fetch paginated RSVP Events
  const fetchRsvpEvents = useCallback(async (
    page = rsvpMeta.page,
    limit = rsvpMeta.limit,
    status = rsvpStatusFilter
  ) => {
    if (!user) return;
    try {
      setIsRsvpLoading(true);
      const res = await eventsApi.getEvents({
        my_rsvps: status,
        page,
        limit,
        sort_by: 'date',
        sort_order: 'asc',
      });

      if (res.success && res.data) {
        setRsvpEvents(res.data);
        if (res.meta) {
          setRsvpMeta(res.meta);
        }
      }
    } catch {
      error('Failed to load your RSVP events');
    } finally {
      setIsRsvpLoading(false);
    }
  }, [user, rsvpMeta.page, rsvpMeta.limit, rsvpStatusFilter, error]);

  // Fetch RSVP counts for all status types
  const fetchRsvpCounts = useCallback(async () => {
    if (!user) return;
    try {
      const res = await rsvpApi.getMyRsvps();
      if (res.success && res.data) {
        const counts = { all: 0, yes: 0, maybe: 0, no: 0 };
        res.data.forEach((r: any) => {
          counts.all++;
          const st = (r.user_rsvp_status || '').toLowerCase();
          if (st === 'yes') counts.yes++;
          else if (st === 'maybe') counts.maybe++;
          else if (st === 'no') counts.no++;
        });
        setRsvpCounts(counts);
      }
    } catch {
      // Fallback
    }
  }, [user]);

  // Initial fetch on user availability
  useEffect(() => {
    if (user) {
      fetchCreatedEvents(1, createdMeta.limit);
      fetchRsvpEvents(1, rsvpMeta.limit, rsvpStatusFilter);
      fetchRsvpCounts();
    }
  }, [user]);

  // Handle Created page change
  const handleCreatedPageChange = (newPage: number) => {
    fetchCreatedEvents(newPage, createdMeta.limit);
  };

  const handleCreatedLimitChange = (newLimit: number) => {
    fetchCreatedEvents(1, newLimit);
  };

  // Handle RSVP page change
  const handleRsvpPageChange = (newPage: number) => {
    fetchRsvpEvents(newPage, rsvpMeta.limit, rsvpStatusFilter);
  };

  const handleRsvpLimitChange = (newLimit: number) => {
    fetchRsvpEvents(1, newLimit, rsvpStatusFilter);
  };

  const handleRsvpFilterChange = (status: 'all' | 'yes' | 'maybe' | 'no') => {
    setRsvpStatusFilter(status);
    fetchRsvpEvents(1, rsvpMeta.limit, status);
  };

  const refreshAll = () => {
    fetchCreatedEvents();
    fetchRsvpEvents();
    fetchRsvpCounts();
  };

  const handleDelete = async () => {
    if (!eventToDelete || isDeleting) return;
    try {
      setIsDeleting(true);
      const res = await eventsApi.deleteEvent(eventToDelete.id);
      if (res.success) {
        success('Event deleted successfully');
        setEventToDelete(null);
        refreshAll();
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
          Created by Me ({createdMeta.total})
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
          My RSVPs ({rsvpCounts.all || rsvpMeta.total})
        </button>
      </div>

      {/* Tab 1: Created by Me */}
      {activeTab === 'created' && (
        <>
          {isCreatedLoading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
              <p className="text-sm font-semibold text-slate-500">Loading your created events...</p>
            </div>
          ) : createdEvents.length === 0 ? (
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
            <div>
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

              {/* Pagination for Created Events */}
              <Pagination
                meta={createdMeta}
                onPageChange={handleCreatedPageChange}
                onLimitChange={handleCreatedLimitChange}
              />
            </div>
          )}
        </>
      )}

      {/* Tab 2: My RSVPs */}
      {activeTab === 'rsvps' && (
        <>
          {/* Status Sub-Filters */}
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mr-1 flex items-center gap-1">
              <ListFilter className="w-3.5 h-3.5" />
              Filter by RSVP:
            </span>
            {[
              { id: 'all', label: 'All', count: rsvpCounts.all },
              { id: 'yes', label: 'Going', count: rsvpCounts.yes, icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> },
              { id: 'maybe', label: 'Interested', count: rsvpCounts.maybe, icon: <HelpCircle className="w-3.5 h-3.5 text-amber-500" /> },
              { id: 'no', label: 'Declined', count: rsvpCounts.no, icon: <XCircle className="w-3.5 h-3.5 text-rose-500" /> },
            ].map((pill) => (
              <button
                key={pill.id}
                onClick={() => handleRsvpFilterChange(pill.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  rsvpStatusFilter === pill.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {pill.icon}
                <span>{pill.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    rsvpStatusFilter === pill.id
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {pill.count}
                </span>
              </button>
            ))}
          </div>

          {isRsvpLoading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
              <p className="text-sm font-semibold text-slate-500">Loading your RSVP'd events...</p>
            </div>
          ) : rsvpEvents.length === 0 ? (
            <div className="py-16 text-center glass-card rounded-3xl p-8 border border-slate-200 dark:border-slate-800 max-w-lg mx-auto">
              <Users className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">No RSVPs found</h3>
              <p className="text-xs text-slate-500 mt-1 mb-6">
                {rsvpStatusFilter !== 'all'
                  ? `You haven't responded as "${rsvpStatusFilter === 'yes' ? 'Going' : rsvpStatusFilter === 'maybe' ? 'Interested' : 'Declined'}" to any events yet.`
                  : 'Browse upcoming community events and RSVP to attend!'}
              </p>
              <Link
                to="/"
                className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 shadow-sm inline-block"
              >
                Browse Upcoming Events
              </Link>
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rsvpEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                  />
                ))}
              </div>

              {/* Pagination for RSVP Events */}
              <Pagination
                meta={rsvpMeta}
                onPageChange={handleRsvpPageChange}
                onLimitChange={handleRsvpLimitChange}
              />
            </div>
          )}
        </>
      )}

      {/* Create / Edit Modal */}
      <EventFormModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEventToEdit(null);
        }}
        eventToEdit={eventToEdit}
        onSuccess={refreshAll}
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
