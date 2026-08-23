import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Globe, 
  Lock, 
  Image as ImageIcon, 
  Users, 
  Plus, 
  Loader2, 
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { Tag } from '../types';
import { eventsApi } from '../api/events.api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { format } from 'date-fns';

export const CreateEventPage: React.FC = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [eventType, setEventType] = useState<'public' | 'private'>('public');
  const [isTruePrivate, setIsTruePrivate] = useState<boolean>(false);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [capacity, setCapacity] = useState<string>('');
  const [bannerUrl, setBannerUrl] = useState('https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1000&auto=format&fit=crop&q=80');
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login?redirect=/create-event');
    }
  }, [isAuthenticated, authLoading, navigate]);

  useEffect(() => {
    // Default to tomorrow 10:00 AM
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    tomorrow.setHours(10, 0, 0, 0);
    const endTomorrow = new Date(tomorrow.getTime() + 3 * 60 * 60 * 1000);

    setStartTime(format(tomorrow, "yyyy-MM-dd'T'HH:mm"));
    setEndTime(format(endTomorrow, "yyyy-MM-dd'T'HH:mm"));

    eventsApi.getTags().then((res) => {
      if (res.success && res.data) {
        setAvailableTags(res.data);
      }
    }).catch(() => {});
  }, []);

  const toggleTag = (id: number) => {
    setSelectedTagIds((prev) =>
      prev.includes(id) ? prev.filter((tId) => tId !== id) : [...prev, id]
    );
  };

  const handleAddNewTag = async () => {
    const inputName = newTagInput.trim();
    if (!inputName || isCreatingTag) return;

    // Case-insensitive check
    const existingTag = availableTags.find(
      (t) => t.name.toLowerCase() === inputName.toLowerCase()
    );

    if (existingTag) {
      setSelectedTagIds((prev) =>
        prev.includes(existingTag.id) ? prev : [...prev, existingTag.id]
      );
      setNewTagInput('');
      success(`Tag #${existingTag.name} selected`);
      return;
    }

    try {
      setIsCreatingTag(true);
      const res = await eventsApi.createTag(inputName);
      if (res.success && res.data) {
        const newTag = res.data;
        setAvailableTags((prev) => [...prev, newTag]);
        setSelectedTagIds((prev) => [...prev, newTag.id]);
        setNewTagInput('');
        success(`Tag #${newTag.name} added`);
      }
    } catch {
      error('Failed to create tag');
    } finally {
      setIsCreatingTag(false);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!title.trim() || title.length < 3) {
      errors.title = 'Title must be at least 3 characters long.';
    }
    if (!description.trim() || description.length < 10) {
      errors.description = 'Description must be at least 10 characters long.';
    }
    if (!location.trim()) {
      errors.location = 'Location is required.';
    }
    if (!startTime) {
      errors.startTime = 'Start time is required.';
    }
    if (startTime && endTime) {
      if (new Date(endTime) < new Date(startTime)) {
        errors.endTime = 'End time must be after start time.';
      }
    }
    if (capacity && (isNaN(Number(capacity)) || Number(capacity) <= 0)) {
      errors.capacity = 'Capacity must be a positive number.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      const payload = {
        title: title.trim(),
        description: description.trim(),
        location: location.trim(),
        event_type: eventType,
        is_true_private: eventType === 'private' ? isTruePrivate : false,
        start_time: new Date(startTime).toISOString(),
        end_time: endTime ? new Date(endTime).toISOString() : null,
        capacity: capacity ? Number(capacity) : null,
        banner_url: bannerUrl.trim() || null,
        tag_ids: selectedTagIds,
      };

      const res = await eventsApi.createEvent(payload);
      if (res.success) {
        success('Event created successfully!');
        navigate(`/events/${res.data.id}`);
      }
    } catch (err: any) {
      const message = err.response?.data?.error?.message || 'Failed to create event';
      error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-sm font-semibold text-slate-500">Verifying session...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-24 animate-fade-in">
      {/* Back to Events */}
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Events
      </Link>

      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header Visual */}
        <div className="px-6 sm:px-8 py-6 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-indigo-50/80 via-purple-50/40 to-transparent dark:from-indigo-950/30 dark:via-purple-950/20 dark:to-slate-900 flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>New Event Creator</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Host an Event</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Fill in the details below to publish your gathering and manage RSVPs.
            </p>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          {/* Event Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Event Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. NextGen Web & AI Conference 2026"
              className={`w-full px-4 py-3 rounded-2xl border text-sm bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
                formErrors.title ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'
              }`}
            />
            {formErrors.title && <p className="text-xs text-rose-500 mt-1">{formErrors.title}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Description *
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide a compelling description, event agenda, prerequisites, and instructions for attendees..."
              className={`w-full px-4 py-3 rounded-2xl border text-sm bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
                formErrors.description ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'
              }`}
            />
            {formErrors.description && <p className="text-xs text-rose-500 mt-1">{formErrors.description}</p>}
          </div>

          {/* Location & Capacity Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Location / Venue *
              </label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Innovation Hub or Zoom URL"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
                    formErrors.location ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'
                  }`}
                />
              </div>
              {formErrors.location && <p className="text-xs text-rose-500 mt-1">{formErrors.location}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Max Capacity (Optional)
              </label>
              <div className="relative">
                <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="number"
                  min="1"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  placeholder="Leave empty for unlimited spots"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
                    formErrors.capacity ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'
                  }`}
                />
              </div>
              {formErrors.capacity && <p className="text-xs text-rose-500 mt-1">{formErrors.capacity}</p>}
            </div>
          </div>

          {/* Date and Time Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Start Date & Time *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
                    formErrors.startTime ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'
                  }`}
                />
              </div>
              {formErrors.startTime && <p className="text-xs text-rose-500 mt-1">{formErrors.startTime}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                End Date & Time (Optional)
              </label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
                    formErrors.endTime ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'
                  }`}
                />
              </div>
              {formErrors.endTime && <p className="text-xs text-rose-500 mt-1">{formErrors.endTime}</p>}
            </div>
          </div>

          {/* Privacy & Visibility Settings (Dual Toggles) */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Privacy & Visibility Settings
            </label>

            {/* Toggle 1: Base Privacy Type (Public vs Private) */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setEventType('public');
                  setIsTruePrivate(false);
                }}
                className={`flex items-start gap-3 p-3.5 rounded-2xl border text-left transition-all ${
                  eventType === 'public'
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  eventType === 'public' ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                }`}>
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-bold">Public Event</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Visible to all visitors in the event list.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setEventType('private')}
                className={`flex items-start gap-3 p-3.5 rounded-2xl border text-left transition-all ${
                  eventType === 'private'
                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  eventType === 'private' ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                }`}>
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-bold">Private Event</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Community members only.
                  </p>
                </div>
              </button>
            </div>

            {/* Toggle 2: True Private (Conditional Extra Toggle - Only available for Private events) */}
            <div
              className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                eventType === 'private'
                  ? 'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60'
                  : 'border-slate-200/50 dark:border-slate-800/50 bg-slate-100/50 dark:bg-slate-950/20 opacity-60'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                    eventType === 'private' && isTruePrivate
                      ? 'bg-purple-600 text-white shadow-sm shadow-purple-500/30'
                      : eventType === 'private'
                      ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                  }`}
                >
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      Make Event &ldquo;True Private&rdquo;
                    </p>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        eventType === 'public'
                          ? 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                          : isTruePrivate
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                          : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {eventType === 'public'
                        ? 'Disabled (Public Event)'
                        : isTruePrivate
                        ? 'True Private (Hidden)'
                        : 'Standard Private (Listed)'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {eventType === 'public'
                      ? 'Only available for private events. Switch to Private above to enable True Private.'
                      : isTruePrivate
                      ? 'Completely hidden from unauthenticated guests in the event list. Guests cannot access or view this event.'
                      : 'Standard Private: visible in the public event list with a lock badge. Guests can view event info, but must sign in to RSVP.'}
                  </p>
                </div>
              </div>

              {/* Toggle Switch */}
              <button
                type="button"
                role="switch"
                disabled={eventType !== 'private'}
                aria-label="Toggle True Private"
                aria-checked={isTruePrivate}
                onClick={() => {
                  if (eventType === 'private') {
                    setIsTruePrivate(!isTruePrivate);
                  }
                }}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                  eventType !== 'private'
                    ? 'cursor-not-allowed bg-slate-200 dark:bg-slate-800'
                    : isTruePrivate
                    ? 'cursor-pointer bg-purple-600'
                    : 'cursor-pointer bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    eventType === 'private' && isTruePrivate ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Banner URL */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Cover Banner Image URL (Optional)
            </label>
            <div className="relative">
              <ImageIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="url"
                value={bannerUrl}
                onChange={(e) => setBannerUrl(e.target.value)}
                placeholder="https://images.unsplash.com/photo-..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-sm bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
          </div>

          {/* Categories & Tags */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Categories & Tags
            </label>
            <div className="flex flex-wrap gap-1.5 mb-3 max-h-36 overflow-y-auto p-2 border border-slate-100 dark:border-slate-800/60 rounded-2xl bg-slate-50/50 dark:bg-slate-950/40">
              {availableTags.length === 0 ? (
                <p className="text-xs text-slate-400 py-1 px-2">No tags yet. Add one below!</p>
              ) : (
                availableTags.map((tag) => (
                  <button
                    type="button"
                    key={tag.id}
                    onClick={() => toggleTag(tag.id)}
                    style={
                      selectedTagIds.includes(tag.id)
                        ? { backgroundColor: tag.colorHex, color: '#ffffff' }
                        : { backgroundColor: `${tag.colorHex}15`, color: tag.colorHex }
                    }
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                      selectedTagIds.includes(tag.id) ? 'ring-2 ring-indigo-400/40 shadow-sm' : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    #{tag.name}
                  </button>
                ))
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddNewTag();
                  }
                }}
                placeholder="Add custom tag (e.g. Hackathon, Summit)..."
                className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
              <button
                type="button"
                onClick={handleAddNewTag}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <Link
              to="/"
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating Event...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Publish Event
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEventPage;
