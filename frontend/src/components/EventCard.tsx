import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Lock, 
  Globe, 
  Edit3, 
  Trash2, 
  Clock
} from 'lucide-react';
import { EventItem } from '../types';
import { format, parseISO } from 'date-fns';

interface EventCardProps {
  event: EventItem;
  onEdit?: (event: EventItem) => void;
  onDelete?: (event: EventItem) => void;
  showAdminControls?: boolean;
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  onEdit,
  onDelete,
  showAdminControls = true,
}) => {
  const startDate = parseISO(event.startTime);
  const isPast = event.isPast;

  return (
    <div className={`group relative rounded-3xl overflow-hidden glass-card transition-all duration-300 hover:shadow-2xl hover:-translate-y-1.5 flex flex-col h-full border ${
      isPast 
        ? 'border-slate-200 dark:border-slate-800 opacity-85 hover:opacity-100' 
        : 'border-slate-200/80 dark:border-slate-800/80 hover:border-indigo-500/40 dark:hover:border-indigo-400/40'
    }`}>
      {/* Banner / Header Visual */}
      <div className="relative h-48 w-full overflow-hidden bg-slate-800">
        <img
          src={event.bannerUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80'}
          alt={event.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />

        {/* Badges: Event Type & Past Indicator */}
        <div className="absolute top-3.5 left-3.5 flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md shadow-sm ${
              event.eventType === 'public'
                ? 'bg-emerald-500/80 text-white'
                : 'bg-indigo-600/80 text-white'
            }`}
          >
            {event.eventType === 'public' ? <Globe className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
            {event.eventType === 'public' ? 'Public' : 'Private'}
          </span>

          {isPast && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-900/80 text-slate-300 backdrop-blur-md">
              <Clock className="w-3 h-3" /> Past
            </span>
          )}
        </div>

        {/* Date Stamp Widget */}
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
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {event.tags.map((t) => (
              <span
                key={t.id}
                style={{ backgroundColor: `${t.colorHex}18`, color: t.colorHex }}
                className="px-2.5 py-0.5 rounded-md text-xs font-semibold"
              >
                #{t.name}
              </span>
            ))}
          </div>

          {/* Title */}
          <Link to={`/events/${event.id}`}>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
              {event.title}
            </h3>
          </Link>

          {/* Description Excerpt */}
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
            {event.description}
          </p>

          {/* Meta Details (Time & Location) */}
          <div className="mt-4 space-y-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2 truncate">
              <Calendar className="w-4 h-4 text-indigo-500 flex-shrink-0" />
              <span>{format(startDate, 'MMM dd, yyyy • h:mm a')}</span>
            </div>

            <div className="flex items-center gap-2 truncate">
              <MapPin className="w-4 h-4 text-rose-500 flex-shrink-0" />
              <span className="truncate">{event.location}</span>
            </div>
          </div>
        </div>

        {/* Footer info: RSVP & Creator */}
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src={event.creator.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${event.creator.name}`}
              alt={event.creator.name}
              className="w-6 h-6 rounded-full object-cover ring-1 ring-slate-300 dark:ring-slate-700"
            />
            <span className="text-xs text-slate-600 dark:text-slate-400 truncate max-w-[100px]">
              {event.creator.name}
            </span>
          </div>

          {/* RSVP Attendees Counter */}
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <Users className="w-3.5 h-3.5 text-emerald-500" />
            <span>{event.rsvpStats.yes} going</span>
            {event.capacity && (
              <span className="text-slate-400 font-normal">/ {event.capacity}</span>
            )}
          </div>
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
