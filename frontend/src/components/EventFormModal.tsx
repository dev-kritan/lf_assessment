import React, { useState, useEffect } from 'react';
import { X, Calendar, MapPin, Tag as TagIcon, Globe, Lock, Image as ImageIcon, Users, Plus, Loader2 } from 'lucide-react';
import { EventItem, Tag } from '../types';
import { eventsApi } from '../api/events.api';
import { useToast } from '../contexts/ToastContext';
import { format, parseISO } from 'date-fns';

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

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [eventType, setEventType] = useState<'public' | 'private'>('public');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [capacity, setCapacity] = useState<string>('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [availableTags, setAvailableTags] = useState<Tag[]>(allTags || []);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

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
      setStartTime(format(tomorrow, "yyyy-MM-dd'T'HH:mm"));
      setEndTime(format(endTomorrow, "yyyy-MM-dd'T'HH:mm"));
      setCapacity('');
      setBannerUrl('https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1000&auto=format&fit=crop&q=80');
      setSelectedTagIds([]);
    }
    setFormErrors({});
  }, [eventToEdit, isOpen]);

  if (!isOpen) return null;

  const toggleTag = (id: number) => {
    setSelectedTagIds((prev) =>
      prev.includes(id) ? prev.filter((tId) => tId !== id) : [...prev, id]
    );
  };

  const handleAddNewTag = async () => {
    const inputName = newTagInput.trim();
    if (!inputName) return;

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
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      const payload = {
        title: title.trim(),
        description: description.trim(),
        location: location.trim(),
        event_type: eventType,
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
      const message = err.response?.data?.error?.message || 'Failed to save event';
      error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
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
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
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
              className={`w-full px-4 py-2.5 rounded-xl border text-sm bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
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
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide event details, schedule, requirements, and who should attend..."
              className={`w-full px-4 py-2.5 rounded-xl border text-sm bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
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
                  placeholder="e.g. Grand Hall or Zoom Link"
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

          {/* Event Privacy Type */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Event Privacy Type *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                onClick={() => setEventType('public')}
                className={`flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                  eventType === 'public'
                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-bold">Public Event</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Visible to all visitors</p>
                </div>
              </label>

              <label
                onClick={() => setEventType('private')}
                className={`flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                  eventType === 'private'
                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-bold">Private Event</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Signed-in community only</p>
                </div>
              </label>
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
            <div className="flex flex-wrap gap-1.5 mb-3">
              {availableTags.map((tag) => (
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
              ))}
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
