import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import { AuthProvider } from './contexts/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Navbar } from './components/Navbar';
import { EventListPage } from './pages/EventListPage';
import { EventDetailPage } from './pages/EventDetailPage';
import { MyEventsPage } from './pages/MyEventsPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ProfilePage } from './pages/ProfilePage';
import { CreateEventPage } from './pages/CreateEventPage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';
import { BonusChallengePage } from './pages/BonusChallengePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { EventFormModal } from './components/EventFormModal';
import { eventsApi } from './api/events.api';
import { Calendar, ShieldCheck, Database, Layers } from 'lucide-react';

import { APP_ROUTES } from './constants';

export const AppContent: React.FC = () => {
  const [isGlobalCreateModalOpen, setIsGlobalCreateModalOpen] = useState(false);
  const [tags, setTags] = useState<any[]>([]);

  const handleOpenGlobalCreateModal = async () => {
    try {
      const res = await eventsApi.getTags();
      if (res.success) setTags(res.data);
    } catch {
      // Non-blocking
    }
    setIsGlobalCreateModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <Navbar onOpenCreateModal={handleOpenGlobalCreateModal} />

      <main className="flex-1">
        <ErrorBoundary>
          <Routes>
            <Route path={APP_ROUTES.HOME} element={<EventListPage />} />
            <Route path={APP_ROUTES.EVENT_DETAIL_PATTERN} element={<EventDetailPage />} />
            <Route path={APP_ROUTES.CREATE_EVENT} element={<CreateEventPage />} />
            <Route path={APP_ROUTES.MY_EVENTS} element={<MyEventsPage />} />
            <Route path={APP_ROUTES.LOGIN} element={<LoginPage />} />
            <Route path={APP_ROUTES.REGISTER} element={<RegisterPage />} />
            <Route path={APP_ROUTES.PROFILE} element={<ProfilePage />} />
            <Route path={APP_ROUTES.VERIFY_EMAIL} element={<VerifyEmailPage />} />
            <Route path={APP_ROUTES.BONUS_CHALLENGE} element={<BonusChallengePage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </ErrorBoundary>
      </main>

      {/* Global Event Creation Modal from Navbar */}
      <EventFormModal
        isOpen={isGlobalCreateModalOpen}
        onClose={() => setIsGlobalCreateModalOpen(false)}
        onSuccess={() => {
          window.location.reload();
        }}
        allTags={tags}
        onTagCreated={(newTag) => setTags((prev) => [...prev, newTag])}
      />

      {/* Modern Footer */}
      <footer className="glass border-t border-slate-200/80 dark:border-slate-800/80 py-10 transition-colors mt-auto relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-pink-500 flex items-center justify-center text-white shadow-sm">
                <Calendar className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-slate-900 dark:text-white">EventHub</span>
              <span className="text-xs text-slate-400">| Full-Stack Event Assessment Application</span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-indigo-500" /> React 18 + TS
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Database className="w-3.5 h-3.5 text-blue-500" /> Knex.js (No ORMs) + MySQL
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> JWT + 2FA TOTP
              </span>
            </div>

            <p className="text-xs text-slate-400">
              Built with precision for Full-Stack Assessment
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <BrowserRouter>
              <AppContent />
            </BrowserRouter>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
