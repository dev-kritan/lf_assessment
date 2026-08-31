import React, { useState, useEffect, Suspense, lazy } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Calendar, Loader2 } from "lucide-react";
import { eventsApi } from "./api/events.api";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { EventFormModal } from "./components/EventFormModal";
import { Navbar } from "./components/Navbar";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ToastProvider } from "./contexts/ToastContext";
import { EventListPage } from "./pages/EventListPage";
import { EventDetailPage } from "./pages/EventDetailPage";
import { MyEventsPage } from "./pages/MyEventsPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";

// Lazy-loaded secondary pages for optimized bundle size & initial load speed
const CreateEventPage = lazy(() =>
  import("./pages/CreateEventPage").then((m) => ({ default: m.CreateEventPage })),
);
const ProfilePage = lazy(() =>
  import("./pages/ProfilePage").then((m) => ({ default: m.ProfilePage })),
);
const VerifyEmailPage = lazy(() =>
  import("./pages/VerifyEmailPage").then((m) => ({ default: m.VerifyEmailPage })),
);
const BonusChallengePage = lazy(() =>
  import("./pages/BonusChallengePage").then((m) => ({ default: m.BonusChallengePage })),
);
const NotFoundPage = lazy(() =>
  import("./pages/NotFoundPage").then((m) => ({ default: m.NotFoundPage })),
);

import { APP_ROUTES } from "./constants";

export const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

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
          <Suspense
            fallback={
              <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                <span className="text-xs text-slate-400 font-medium">Loading view...</span>
              </div>
            }
          >
            <Routes>
              <Route path={APP_ROUTES.HOME} element={<EventListPage />} />
              <Route
                path={APP_ROUTES.EVENT_DETAIL_PATTERN}
                element={<EventDetailPage />}
              />
              <Route
                path={APP_ROUTES.CREATE_EVENT}
                element={<CreateEventPage />}
              />
              <Route path={APP_ROUTES.MY_EVENTS} element={<MyEventsPage />} />
              <Route path={APP_ROUTES.LOGIN} element={<LoginPage />} />
              <Route path={APP_ROUTES.REGISTER} element={<RegisterPage />} />
              <Route path={APP_ROUTES.PROFILE} element={<ProfilePage />} />
              <Route
                path={APP_ROUTES.VERIFY_EMAIL}
                element={<VerifyEmailPage />}
              />
              <Route
                path={APP_ROUTES.BONUS_CHALLENGE}
                element={<BonusChallengePage />}
              />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>

      {/* Global Event Creation Modal from Navbar */}
      <EventFormModal
        isOpen={isGlobalCreateModalOpen}
        onClose={() => setIsGlobalCreateModalOpen(false)}
        onSuccess={(savedEvent) => {
          window.dispatchEvent(
            new CustomEvent("event-created", { detail: savedEvent }),
          );
        }}
        allTags={tags}
        onTagCreated={(newTag) => setTags((prev) => [...prev, newTag])}
      />

      {/* Modern Footer */}
      <footer className="glass border-t border-slate-200/80 dark:border-slate-800/80 py-3.5 sm:py-4 transition-colors mt-auto relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-pink-500 flex items-center justify-center text-white shadow-sm">
                <Calendar className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-slate-900 dark:text-white">
                EventHub
              </span>
              <span className="text-xs text-slate-400">
                | Full-Stack Event Application
              </span>
            </div>
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
              <ScrollToTop />
              <AppContent />
            </BrowserRouter>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
