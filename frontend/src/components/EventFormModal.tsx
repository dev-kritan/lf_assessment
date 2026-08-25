import React, { useState, useEffect, useRef } from 'react';
import { X, Calendar, MapPin, Tag as TagIcon, Globe, Lock, Image as ImageIcon, Users, Plus, Loader2 } from 'lucide-react';
import { EventItem, Tag } from '../types';
import { eventsApi } from '../api/events.api';
import { useToast } from '../contexts/ToastContext';
import { format, parseISO } from 'date-fns';
import { DEFAULT_ASSETS, UI_TIMINGS } from '../constants';
import { eventFormSchema, validateForm as validateWithZod, mapApiErrors } from '../dto';

interface EventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventToEdit?: EventItem | null;
  onSuccess: (event: EventItem) => void;
  allTags?: Tag[];
  onTagCreated?: (tag: Tag) => void;
}

export const EventFormModal: React.FC<EventFormModalProps> = ({
  isOpen,
  onClose,
  eventToEdit,
  onSuccess,
  allTags,
  onTagCreated,
}) => {
  const { success, error } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [eventType, setEventType] = useState<'public' | 'private'>('public');
  const [isTruePrivate, setIsTruePrivate] = useState<boolean>(false);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [capacity, setCapacity] = useState<string>('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [availableTags, setAvailableTags] = useState<Tag[]>(allTags || []);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

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

  // Auto-focus Event Title input when modal opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        titleInputRef.current?.focus();
      }, UI_TIMINGS.AUTO_FOCUS_DELAY_MS);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      if (allTags && allTags.length > 0) {
        setAvailableTags(allTags);
      }
      eventsApi.getTags().then((res) => {
        if (res.success && res.data) {
          setAvailableTags(res.data);
        }
      }).catch(() => {});
    }
  }, [isOpen, allTags]);

  useEffect(() => {
    if (eventToEdit) {
      setTitle(eventToEdit.title);
      setDescription(eventToEdit.description);
      setLocation(eventToEdit.location);
      setEventType(eventToEdit.eventType);
      setIsTruePrivate(eventToEdit.eventType === 'private' ? Boolean(eventToEdit.isTruePrivate) : false);
      try {
        setStartTime(format(parseISO(eventToEdit.startTime), "yyyy-MM-dd'T'HH:mm"));
        if (eventToEdit.endTime) {
          setEndTime(format(parseISO(eventToEdit.endTime), "yyyy-MM-dd'T'HH:mm"));
        } else {
          setEndTime('');
        }
      } catch {
        setStartTime('');
        setEndTime('');
      }
      setCapacity(eventToEdit.capacity ? String(eventToEdit.capacity) : '');
      setBannerUrl(eventToEdit.bannerUrl || '');
      setSelectedTagIds(eventToEdit.tags.map((t) => t.id));
    } else {
      // Default to tomorrow 10:00 AM
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      tomorrow.setHours(10, 0, 0, 0);
      const endTomorrow = new Date(tomorrow.getTime() + 3 * 60 * 60 * 1000);

      setTitle('');
      setDescription('');
      setLocation('');
      setEventType('public');
      setIsTruePrivate(false);
      setStartTime(format(tomorrow, "yyyy-MM-dd'T'HH:mm"));
      setEndTime(format(endTomorrow, "yyyy-MM-dd'T'HH:mm"));
      setCapacity('');
      setBannerUrl(DEFAULT_ASSETS.EVENT_BANNER);
      setSelectedTagIds([]);
    }
    setFormErrors({});
  }, [eventToEdit, isOpen]);

  const toggleTag = (tagId: number) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const handleAddNewTag = async () => {
    const inputName = newTagInput.trim();
    if (!inputName || isCreatingTag) return;

    // Case-insensitive check against already available tags
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
        setAvailableTags((prev) => {
          if (prev.some((t) => t.id === newTag.id)) return prev;
          return [...prev, newTag];
        });
        setSelectedTagIds((prev) =>
          prev.includes(newTag.id) ? prev : [...prev, newTag.id]
        );
        if (onTagCreated) {
          onTagCreated(newTag);
        }
        setNewTagInput('');
        success(`Tag #${newTag.name} added`);
      }
    } catch {
      error('Failed to create tag');
    } finally {
      setIsCreatingTag(false);
    }
  };

  const scrollToFirstError = (errors: Record<string, string>) => {
    const errorKeys = Object.keys(errors);
    if (errorKeys.length === 0) return;
    const firstKey = errorKeys[0];

    setTimeout(() => {
      if (!formRef.current) return;
      const targetElement =
        formRef.current.querySelector<HTMLElement>(`[data-field="${firstKey}"]`) ||
        formRef.current.querySelector<HTMLElement>(`input[name="${firstKey}"], textarea[name="${firstKey}"]`) ||
        formRef.current.querySelector<HTMLElement>('.border-rose-500') ||
        formRef.current.querySelector<HTMLElement>('.text-rose-500');

      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const focusable =
          targetElement.tagName === 'INPUT' || targetElement.tagName === 'TEXTAREA' || targetElement.tagName === 'SELECT'
            ? targetElement
            : targetElement.querySelector<HTMLElement>('input, textarea, select');
        focusable?.focus?.();
      }
    }, 50);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setFormErrors({});

    const validation = validateWithZod(eventFormSchema, {
      title,
      description,
      location,
      eventType,
      isTruePrivate,
      startTime,
      endTime: endTime || undefined,
      capacity: capacity ? Number(capacity) : undefined,
      bannerUrl: bannerUrl ? bannerUrl.trim() : undefined,
      tagIds: selectedTagIds,
    });

    if (!validation.isValid) {
      setFormErrors(validation.errors);
      error(validation.firstError || 'Please fix the errors before saving.');
      scrollToFirstError(validation.errors);
      return;
    }

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

      if (eventToEdit) {
        const res = await eventsApi.updateEvent(eventToEdit.id, payload);
        if (res.success) {
          success('Event updated successfully!');
          onSuccess(res.data);
          onClose();
        }
      } else {
        const res = await eventsApi.createEvent(payload);
        if (res.success) {
          success('Event created successfully!');
          onSuccess(res.data);
          onClose();
        }
      }
    } catch (err: any) {
      const apiError = err.response?.data?.error;
      const message = apiError?.message || 'Failed to save event';
      if (apiError?.details) {
        const fieldErrors = mapApiErrors(apiError);
        setFormErrors(fieldErrors);
        scrollToFirstError(fieldErrors);
      }
      error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-4 sm:my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            {eventToEdit ? 'Edit Event Details' : 'Create New Event'}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form ref={formRef} onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Event Title */}
          <div data-field="title">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Event Title *
            </label>
            <input
              ref={titleInputRef}
              type="text"
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. NextGen Web & AI Conference 2026"
              className={`w-full px-3.5 sm:px-4 py-2.5 rounded-xl border text-sm bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
                formErrors.title ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'
              }`}
            />
            {formErrors.title && <p className="text-xs text-rose-500 mt-1">{formErrors.title}</p>}
          </div>

          {/* Description */}
          <div data-field="description">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Description *
            </label>
            <textarea
              rows={3}
              name="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide event overview, schedule, highlights..."
              className={`w-full px-3.5 sm:px-4 py-2.5 rounded-xl border text-sm bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
                formErrors.description ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'
              }`}
            />
            {formErrors.description && <p className="text-xs text-rose-500 mt-1">{formErrors.description}</p>}
          </div>

          {/* Location and Capacity Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div data-field="location">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Location *
              </label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  name="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Grand Hall or Zoom Link"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
                    formErrors.location ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'
                  }`}
                />
              </div>
              {formErrors.location && <p className="text-xs text-rose-500 mt-1">{formErrors.location}</p>}
            </div>

            <div data-field="capacity">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Max Capacity (Optional)
              </label>
              <div className="relative">
                <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="number"
                  name="capacity"
                  min="1"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  placeholder="Leave empty for unlimited"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
                    formErrors.capacity ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'
                  }`}
                />
              </div>
              {formErrors.capacity && <p className="text-xs text-rose-500 mt-1">{formErrors.capacity}</p>}
            </div>
          </div>

          {/* Date and Time Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div data-field="startTime">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Start Date & Time *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="datetime-local"
                  name="startTime"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
                    formErrors.startTime ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'
                  }`}
                />
              </div>
              {formErrors.startTime && <p className="text-xs text-rose-500 mt-1">{formErrors.startTime}</p>}
            </div>

            <div data-field="endTime">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                End Date & Time (Optional)
              </label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="datetime-local"
                  name="endTime"
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

          {/* Privacy & Visibility Settings (Dual Toggles - Mobile Streamlined) */}
          <div className="space-y-2.5 sm:space-y-3">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Privacy & Visibility Settings
            </label>

            {/* Toggle 1: Base Privacy Type (Public vs Private) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
              <button
                type="button"
                onClick={() => {
                  setEventType('public');
                  setIsTruePrivate(false);
                }}
                className={`flex items-start gap-2.5 sm:gap-3 p-3 sm:p-3.5 rounded-xl sm:rounded-2xl border text-left transition-all ${
                  eventType === 'public'
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 ${
                  eventType === 'public' ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                }`}>
                  <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-bold truncate">Public Event</p>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                    Visible to all visitors in the event list.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setEventType('private')}
                className={`flex items-start gap-2.5 sm:gap-3 p-3 sm:p-3.5 rounded-xl sm:rounded-2xl border text-left transition-all ${
                  eventType === 'private'
                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 ${
                  eventType === 'private' ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                }`}>
                  <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-bold truncate">Private Event</p>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                    Community members only.
                  </p>
                </div>
              </button>
            </div>

            {/* Toggle 2: True Private (Conditional Extra Toggle - Mobile Optimized Card) */}
            <div
              className={`p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border transition-all ${
                eventType === 'private'
                  ? 'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60'
                  : 'border-slate-200/50 dark:border-slate-800/50 bg-slate-100/50 dark:bg-slate-950/20 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5 sm:gap-3 min-w-0">
                  <div
                    className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                      eventType === 'private' && isTruePrivate
                        ? 'bg-purple-600 text-white shadow-sm shadow-purple-500/30'
                        : eventType === 'private'
                        ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                    }`}
                  >
                    <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                        Make Event &ldquo;True Private&rdquo;
                      </p>
                      <span
                        className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-1.5 sm:px-2 py-0.5 rounded-full ${
                          eventType === 'public'
                            ? 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                            : isTruePrivate
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                            : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {eventType === 'public'
                          ? 'Public'
                          : isTruePrivate
                          ? 'True Private'
                          : 'Standard Private'}
                      </span>
                    </div>
                    <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                      {eventType === 'public'
                        ? 'Switch to Private above to enable True Private.'
                        : isTruePrivate
                        ? 'Completely hidden from unauthenticated guests in the event list.'
                        : 'Visible in public list with lock badge. Sign-in required to RSVP.'}
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
                  className={`relative inline-flex h-5 w-9 sm:h-6 sm:w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 mt-0.5 ${
                    eventType !== 'private'
                      ? 'cursor-not-allowed bg-slate-200 dark:bg-slate-800'
                      : isTruePrivate
                      ? 'cursor-pointer bg-purple-600'
                      : 'cursor-pointer bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 sm:h-5 sm:w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      eventType === 'private' && isTruePrivate ? 'translate-x-4 sm:translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Banner Image URL */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Cover Image URL (Optional)
            </label>
            <div className="relative">
              <ImageIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="url"
                value={bannerUrl}
                onChange={(e) => setBannerUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-sm bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
          </div>

          {/* Tags Selection & Dynamic Creation */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Categories & Tags
            </label>
            <div className="flex flex-wrap gap-1.5 mb-3 max-h-36 overflow-y-auto p-1.5 border border-slate-100 dark:border-slate-800/60 rounded-2xl bg-slate-50/50 dark:bg-slate-950/40">
              {availableTags.length === 0 ? (
                <p className="text-xs text-slate-400 dark:text-slate-500 py-1 px-2">No tags available yet. Create one below!</p>
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

            {/* Add Custom Tag Inline */}
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
                placeholder="Add custom tag (e.g. Hackathon, Gala)..."
                className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
              <button
                type="button"
                onClick={handleAddNewTag}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold text-sm shadow-md shadow-indigo-500/20 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : eventToEdit ? (
                'Save Changes'
              ) : (
                'Create Event'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
