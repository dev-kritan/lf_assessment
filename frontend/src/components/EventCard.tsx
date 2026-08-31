import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Lock, 
  Globe, 
  Edit3, 
  Trash2, 
  Clock,
  Check
} from 'lucide-react';
import { EventItem } from '../types';
import { format, parseISO } from 'date-fns';

import { TagsPopover } from './TagsPopover';
import { LocationHoverCard } from './LocationHoverCard';
import { AuthContext } from '../contexts/AuthContext';
import { DEFAULT_ASSETS, getDicebearAvatarUrl, APP_ROUTES } from '../constants';

interface EventCardProps {
  event: EventItem;
  onEdit?: (event: EventItem) => void;
  onDelete?: (event: EventItem) => void;
  showAdminControls?: boolean;
  selectable?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (event: EventItem) => void;
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  onEdit,
  onDelete,
  showAdminControls = true,
  selectable = false,
  isSelected = false,
  onToggleSelect,
}) => {
  const location = useLocation();
  const authContext = useContext(AuthContext);
  const isAuthenticated = authContext?.isAuthenticated ?? false;
  const user = authContext?.user;
  const isRestrictedPrivate = event.eventType === 'private' && (!isAuthenticated || (user && !user.isEmailVerified));
  const isMyEvents = location.pathname === APP_ROUTES.MY_EVENTS;
  const searchParams = new URLSearchParams(location.search);
  const currentTab = searchParams.get('tab');
  const fromTitle = isMyEvents
    ? (currentTab === 'rsvps' ? 'My RSVPs' : 'My Events')
    : 'Events';
  const navState = {
    from: location.pathname + location.search,
    fromTitle,
  };

  const startDate = parseISO(event.startTime);
  const isPast = event.isPast;

  const handleCardClick = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(`scroll_pos_${location.pathname}${location.search}`, String(window.scrollY));
    }
  };

  return (
    <div className={`group relative rounded-3xl overflow-visible hover:z-30 glass-card transition-all duration-300 hover:shadow-2xl hover:-translate-y-1.5 flex flex-col h-full border ${
      isSelected
        ? 'ring-2 ring-indigo-500 border-indigo-500 dark:border-indigo-400 bg-indigo-50/20 dark:bg-indigo-950/30'
        : isPast 
        ? 'border-slate-200 dark:border-slate-800 opacity-85 hover:opacity-100' 
        : 'border-slate-200/80 dark:border-slate-800/80 hover:border-indigo-500/40 dark:hover:border-indigo-400/40'
    }`}>
      {/* Banner / Header Visual */}
      <div className="relative h-48 w-full overflow-hidden rounded-t-3xl bg-slate-800">
        <Link
          to={APP_ROUTES.EVENT_DETAIL(event.id, location.search)}
          state={navState}
          onClick={handleCardClick}
          className="block w-full h-full"
        >
          <img
            src={event.bannerUrl || DEFAULT_ASSETS.EVENT_CARD_BANNER}
            alt={event.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />
        </Link>

        {/* Selection Checkbox (Top-Right) */}
        {selectable && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleSelect?.(event);
            }}
            aria-label={isSelected ? `Deselect ${event.title}` : `Select ${event.title}`}
            className={`absolute top-3.5 right-3.5 z-20 w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 backdrop-blur-md shadow-lg ${
              isSelected
                ? 'bg-indigo-600 text-white ring-2 ring-white dark:ring-slate-900 scale-105'
                : 'bg-slate-900/60 text-white/70 hover:text-white hover:bg-slate-900/80 border border-white/20 hover:scale-105'
            }`}
          >
            {isSelected ? (
              <Check className="w-5 h-5 stroke-[2.5]" />
            ) : (
              <div className="w-4 h-4 rounded-md border-2 border-white/70" />
            )}
          </button>
        )}

        {/* Badges: Event Type & Past Indicator */}
        <div className="absolute top-3.5 left-3.5 flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md shadow-md transition-all ${
              event.eventType === 'public'
                ? 'bg-emerald-500/85 text-white border border-emerald-400/30'
                : event.isTruePrivate
                ? 'bg-gradient-to-r from-purple-700/95 to-pink-700/95 text-white border border-purple-400/40 shadow-purple-500/30'
                : 'bg-gradient-to-r from-violet-600/90 to-indigo-600/90 text-white border border-violet-400/40 shadow-indigo-500/20'
            }`}
          >
            {event.eventType === 'public' ? (
              <Globe className="w-3.5 h-3.5" />
            ) : (
              <Lock className="w-3.5 h-3.5" />
            )}
            <span>
              {event.eventType === 'public' 
                ? 'Public' 
                : event.isTruePrivate 
                ? 'True Private' 
                : 'Private'}
            </span>
          </span>

          {isPast && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-900/80 text-slate-300 backdrop-blur-md shadow-sm border border-slate-700/40">
              <Clock className="w-3 h-3" />
              <span>Past</span>
            </span>
          )}
        </div>

        {/* Date Stamp Widget */}
        {!isRestrictedPrivate && (
          <div className="absolute bottom-3 right-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl px-3 py-1.5 shadow-lg text-center flex items-center gap-2">
            <div className="text-rose-600 dark:text-rose-400 font-extrabold text-lg leading-none">
              {format(startDate, 'dd')}
            </div>
            <div className="text-left border-l border-slate-200 dark:border-slate-700 pl-2">
              <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">
                {format(startDate, 'MMM')}
              </div>
              <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                {format(startDate, 'EEE')}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content Body */}
      <div className="p-4 sm:p-6 flex-1 flex flex-col justify-between">
        <div>
          {/* Tags */}
          <div className="flex flex-wrap items-center gap-1.5 mb-2.5 sm:mb-3">
            {event.tags.slice(0, 3).map((t) => (
              <span
                key={t.id}
                style={{ backgroundColor: `${t.colorHex}18`, color: t.colorHex }}
                className="px-2 sm:px-2.5 py-0.5 rounded-md text-[11px] sm:text-xs font-semibold"
              >
                #{t.name}
              </span>
            ))}
            <TagsPopover tags={event.tags} limit={3} />
          </div>

          {/* Title */}
          <Link
            to={APP_ROUTES.EVENT_DETAIL(event.id, location.search)}
            state={navState}
            onClick={handleCardClick}
          >
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
              {event.title}
            </h3>
          </Link>

          {/* Description Excerpt */}
          <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
            {isRestrictedPrivate
              ? 'Private event details restricted to verified members.'
              : event.description}
          </p>

          {/* Meta Info */}
          <div className="mt-3 sm:mt-4 space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2 min-w-0">
              <Calendar className="w-4 h-4 text-indigo-500 shrink-0" />
              <span className="truncate">
                {isRestrictedPrivate
                  ? 'Private Schedule • Verified Members Only'
                  : format(startDate, 'EEE, MMM d, yyyy • h:mm a')}
              </span>
            </div>
            <div className="flex items-center gap-2 max-w-full min-w-0">
              <LocationHoverCard
                location={event.location}
                isRestricted={Boolean(isRestrictedPrivate)}
                className="max-w-full"
              />
            </div>
          </div>
        </div>

        {/* Footer info: RSVP & Creator */}
        <div className="mt-4 sm:mt-5 pt-3 sm:pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <img
              src={event.creator.avatarUrl || getDicebearAvatarUrl(event.creator.name)}
              alt={event.creator.name}
              className="w-6 h-6 rounded-full object-cover ring-1 ring-slate-300 dark:ring-slate-700 shrink-0"
            />
            <span className="text-xs text-slate-600 dark:text-slate-400 truncate max-w-[100px]">
              {isRestrictedPrivate ? 'Private Organizer' : event.creator.name}
            </span>
          </div>

          {/* RSVP Attendees Counter */}
          {isRestrictedPrivate ? (
            <div className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-200/60 dark:border-indigo-900/60 shrink-0">
              <Lock className="w-3 h-3" />
              <span>Members Only</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 shrink-0">
              <Users className="w-3.5 h-3.5 text-emerald-500" />
              <span>{event.rsvpStats.yes} going</span>
              {event.capacity && (
                <span className="text-slate-400 font-normal">/ {event.capacity}</span>
              )}
            </div>
          )}
        </div>

        {/* Action Controls for Event Creator */}
        {showAdminControls && event.isCreator && (
          <div className="mt-3 pt-2.5 border-t border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
            {onEdit && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  onEdit(event);
                }}
                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-xs flex items-center gap-1 font-medium"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Edit
              </button>
            )}

            {onDelete && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  onDelete(event);
                }}
                className="p-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors text-xs flex items-center gap-1 font-medium"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
