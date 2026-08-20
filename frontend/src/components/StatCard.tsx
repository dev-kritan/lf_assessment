import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  colorClass: string;
  description?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  colorClass,
  description,
}) => {
  return (
    <div className="glass-card rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800/80 hover:shadow-xl transition-all duration-300 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md flex-shrink-0 ${colorClass}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</p>
        <h4 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">{value}</h4>
        {description && <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>}
      </div>
    </div>
  );
};
