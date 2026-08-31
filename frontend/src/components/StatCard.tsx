import React from 'react';
import { ChevronRight } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  colorClass: string;
  description?: string;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  colorClass,
  description,
  onClick,
}) => {
  return (
    <div 
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      className={`glass-card rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 md:p-5 border border-slate-200/80 dark:border-slate-800/80 transition-all duration-300 flex flex-col justify-between group text-left relative overflow-hidden ${
        onClick 
          ? 'cursor-pointer hover:shadow-xl hover:-translate-y-1 hover:border-indigo-500/40 dark:hover:border-indigo-400/40 active:scale-[0.98]' 
          : 'hover:shadow-md'
      }`}
    >
      {/* Top Row: Icon badge + Action indicator */}
      <div className="flex items-center justify-between gap-2 mb-2 sm:mb-3">
        <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform shrink-0 ${colorClass}`}>
          {icon}
        </div>
        {onClick && (
          <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800/80 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/80 flex items-center justify-center transition-colors">
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
          </div>
        )}
      </div>

      {/* Main Metric Content */}
      <div className="min-w-0 space-y-0.5">
        <div className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
          {value}
        </div>
        <p className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate pt-1">
          {label}
        </p>
        {description && (
          <p className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 truncate">
            {description}
          </p>
        )}
      </div>
    </div>
  );
};

