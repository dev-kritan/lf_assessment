import React from 'react';
import { 
  Search, 
  Tag as TagIcon, 
  X, 
  SlidersHorizontal, 
  Grid, 
  List,
  Layers,
  Globe,
  Lock,
  Calendar,
  TrendingUp,
  Clock,
  Edit2,
  Trash2
} from 'lucide-react';
import { Tag } from '../types';
import { CustomSelect, SelectOption } from './CustomSelect';

interface FilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  selectedTimeframe: 'all' | 'upcoming' | 'past';
  onTimeframeChange: (tf: 'all' | 'upcoming' | 'past') => void;
  selectedType: 'all' | 'public' | 'private';
  onTypeChange: (type: 'all' | 'public' | 'private') => void;
  selectedTag: string;
  onTagChange: (tag: string) => void;
  sortBy: 'date' | 'popularity' | 'created_at';
  onSortChange: (sort: 'date' | 'popularity' | 'created_at') => void;
  tags: Tag[];
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  onReset: () => void;
  hasActiveFilters: boolean;
  onEditTag?: (tag: Tag) => void;
  onDeleteTag?: (tag: Tag) => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  search,
  onSearchChange,
  selectedTimeframe,
  onTimeframeChange,
  selectedType,
  onTypeChange,
  selectedTag,
  onTagChange,
  sortBy,
  onSortChange,
  tags,
  viewMode,
  onViewModeChange,
  onReset,
  hasActiveFilters,
  onEditTag,
  onDeleteTag,
}) => {
  const eventTypeOptions: SelectOption<'all' | 'public' | 'private'>[] = [
    { value: 'all', label: 'All Types', icon: <Layers className="w-3.5 h-3.5 text-slate-400" /> },
    { value: 'public', label: 'Public Events', icon: <Globe className="w-3.5 h-3.5 text-emerald-500" /> },
    { value: 'private', label: 'Private Events', icon: <Lock className="w-3.5 h-3.5 text-indigo-500" /> },
  ];

  const sortOptions: SelectOption<'date' | 'popularity' | 'created_at'>[] = [
    { value: 'date', label: 'Sort by Date', icon: <Calendar className="w-3.5 h-3.5 text-indigo-500" /> },
    { value: 'popularity', label: 'Most Popular (RSVP)', icon: <TrendingUp className="w-3.5 h-3.5 text-amber-500" /> },
    { value: 'created_at', label: 'Recently Created', icon: <Clock className="w-3.5 h-3.5 text-slate-400" /> },
  ];

  return (
    <div className="space-y-4 mb-8">
      {/* Top Row: Search & View Toggle */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search events by title, description, or location..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:focus:ring-indigo-400/50 shadow-sm transition-all"
          />
          {search && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Dropdowns: Event Type & Sort By */}
        <div className="flex items-center gap-2">
          {/* Event Type Filter */}
          <CustomSelect
            value={selectedType}
            onChange={onTypeChange}
            options={eventTypeOptions}
            buttonClassName="py-3"
            ariaLabel="Event Type Filter"
          />

          {/* Sort By Filter */}
          <CustomSelect
            value={sortBy}
            onChange={onSortChange}
            options={sortOptions}
            buttonClassName="py-3"
            ariaLabel="Sort By Filter"
          />

          {/* View Toggle */}
          <div className="hidden sm:flex items-center p-1 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <button
              onClick={() => onViewModeChange('grid')}
              aria-label="Grid View"
              className={`p-2 rounded-xl transition-colors ${
                viewMode === 'grid'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              aria-label="List View"
              className={`p-2 rounded-xl transition-colors ${
                viewMode === 'list'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Middle Bar: Timeframe Tabs (All, Upcoming, Past) */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-200/70 dark:bg-slate-800/70 backdrop-blur-md">
          {(['all', 'upcoming', 'past'] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => onTimeframeChange(tf)}
              className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all ${
                selectedTimeframe === tf
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-md shadow-slate-900/5'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tf === 'all' ? 'All Events' : tf === 'upcoming' ? '✨ Upcoming Events' : '🕰️ Past Events'}
            </button>
          ))}
        </div>

        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="flex items-center gap-1 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer px-2"
          >
            <X className="w-3.5 h-3.5" />
            Reset all filters
          </button>
        )}
      </div>

      {/* Bottom Bar: Tags Filter Chips */}
      {tags.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none">
          <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 flex-shrink-0">
            <TagIcon className="w-3.5 h-3.5" /> Tags:
          </span>
          <button
            onClick={() => onTagChange('')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors flex-shrink-0 ${
              !selectedTag
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            All Tags
          </button>

          {tags.map((t) => (
            <div
              key={t.id}
              className={`group relative inline-flex items-center rounded-full text-xs font-semibold transition-all flex-shrink-0 ${
                selectedTag === t.name ? 'shadow-sm ring-2 ring-indigo-500/30' : ''
              }`}
              style={
                selectedTag === t.name
                  ? { backgroundColor: t.colorHex, color: '#ffffff' }
                  : { backgroundColor: `${t.colorHex}18`, color: t.colorHex }
              }
            >
              <button
                type="button"
                onClick={() => onTagChange(selectedTag === t.name ? '' : t.name)}
                className="pl-3 pr-2 py-1 flex items-center gap-1 cursor-pointer focus:outline-none"
              >
                <span>#{t.name}</span>
                {t.eventCount !== undefined && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    selectedTag === t.name ? 'bg-white/25 text-white' : 'bg-slate-900/10 dark:bg-white/15'
                  }`}>
                    {t.eventCount}
                  </span>
                )}
              </button>

              {(onEditTag || onDeleteTag) && (
                <div className="flex items-center gap-0.5 pr-1.5 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
                  {onEditTag && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditTag(t);
                      }}
                      title={`Edit tag #${t.name}`}
                      aria-label={`Edit tag ${t.name}`}
                      className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/20 transition-colors"
                    >
                      <Edit2 className="w-2.5 h-2.5" />
                    </button>
                  )}
                  {onDeleteTag && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteTag(t);
                      }}
                      title={`Delete tag #${t.name}`}
                      aria-label={`Delete tag ${t.name}`}
                      className="p-1 rounded-full hover:bg-rose-500 hover:text-white transition-colors"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
