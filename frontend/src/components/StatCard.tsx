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
      className={`glass-card rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800/80 transition-all duration-300 flex items-center justify-between gap-4 group text-left ${
        onClick 
          ? 'cursor-pointer hover:shadow-xl hover:-translate-y-0.5 hover:border-indigo-500/40 dark:hover:border-indigo-400/40 active:scale-[0.98]' 
          : 'hover:shadow-md'
      }`}
    >
      <div className="flex items-center gap-4 min-w-0">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md flex-shrink-0 group-hover:scale-105 transition-transform ${colorClass}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">{label}</p>
          <h4 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">{value}</h4>
          {description && <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">{description}</p>}
        </div>
      </div>
      {onClick && (
        <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
      )}
    </div>
  );
};
