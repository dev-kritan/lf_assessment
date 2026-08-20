import React from 'react';
import { Link } from 'react-router-dom';
import { CalendarX, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 text-center">
      <div className="max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-8">
        <div className="w-16 h-16 rounded-3xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center mb-4">
          <CalendarX className="w-8 h-8" />
        </div>
        <h1 className="text-4xl font-black text-slate-900 dark:text-white">404</h1>
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 mt-2">Page Not Found</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-6">
          The page you are looking for might have been moved or does not exist.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Events
        </Link>
      </div>
    </div>
  );
};
