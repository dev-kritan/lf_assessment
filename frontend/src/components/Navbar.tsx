import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Calendar,
  Plus,
  PlusCircle,
  Sun,
  Moon,
  Monitor,
  User as UserIcon,
  LogOut,
  ShieldCheck,
  Database,
  BookmarkCheck,
  Menu,
  X,
  CalendarCheck,
  FileText,
  ExternalLink,
  LogIn,
  UserPlus,
  BookOpen,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { useToast } from "../contexts/ToastContext";
import { APP_ROUTES, getDicebearAvatarUrl, API_BASE_URL } from "../constants";

interface NavbarProps {
  onOpenCreateModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenCreateModal }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, resolvedTheme, toggleTheme } = useTheme();
  const { success, error } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const apiDocsUrl = `${API_BASE_URL.replace(/\/api\/v1\/?$/, "")}/api-docs`;

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node)
      ) {
        setProfileDropdownOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setProfileDropdownOpen(false);
      }
    };

    if (profileDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [profileDropdownOpen]);

  const handleCreateEventClick = () => {
    if (!isAuthenticated) {
      navigate(
        `${APP_ROUTES.LOGIN}?redirect=${encodeURIComponent(APP_ROUTES.CREATE_EVENT)}`,
      );
      return;
    }

    if (user && !user.isEmailVerified) {
      error(
        "Email verification required: Please verify your email address to create events.",
      );
      navigate(APP_ROUTES.PROFILE, {
        state: { highlightEmailVerification: true },
      });
      return;
    }

    onOpenCreateModal?.();
  };

  const getThemeIcon = () => {
    if (theme === "system") {
      return (
        <span className="relative inline-flex items-center justify-center">
          <Monitor className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
          <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
        </span>
      );
    }
    if (theme === "dark") {
      return <Sun className="w-5 h-5 text-amber-400" />;
    }
    return <Moon className="w-5 h-5 text-slate-700 dark:text-slate-300" />;
  };

  const getThemeTitle = () => {
    if (theme === "system") {
      return `Theme: Auto / System (${resolvedTheme}) — Click to toggle`;
    }
    if (theme === "dark") {
      return "Theme: Dark — Click to toggle";
    }
    return "Theme: Light — Click to toggle";
  };

  const handleLogout = async () => {
    await logout();
    success("Logged out successfully");
    navigate(APP_ROUTES.HOME);
    setProfileDropdownOpen(false);
  };

  const isActive = (path: string) => location.pathname === path;

  const currentPathWithSearch = location.pathname + location.search;
  const isAuthPage =
    location.pathname === APP_ROUTES.LOGIN ||
    location.pathname === APP_ROUTES.REGISTER;
  const loginUrl = isAuthPage
    ? APP_ROUTES.LOGIN
    : `${APP_ROUTES.LOGIN}?redirect=${encodeURIComponent(currentPathWithSearch)}`;
  const registerUrl = isAuthPage
    ? APP_ROUTES.REGISTER
    : `${APP_ROUTES.REGISTER}?redirect=${encodeURIComponent(currentPathWithSearch)}`;

  return (
    <nav className="sticky top-0 z-40 w-full glass border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link
              to={APP_ROUTES.HOME}
              className="flex items-center gap-2.5 group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-pink-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <Calendar className="w-5 h-5" />
              </div>
              <span className="text-xl font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400">
                EventHub
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-1">
              <Link
                to={APP_ROUTES.HOME}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex gap-x-2 items-center ${
                  isActive(APP_ROUTES.HOME)
                    ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50"
                }`}
              >
                <Calendar className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                <p>Browse Events</p>
              </Link>

              {isAuthenticated && (
                <Link
                  to={APP_ROUTES.MY_EVENTS}
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    isActive(APP_ROUTES.MY_EVENTS)
                      ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50"
                      : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50"
                  }`}
                >
                  <BookmarkCheck className="w-4 h-4" />
                  My Events & RSVPs
                </Link>
              )}

              <Link
                to={APP_ROUTES.BONUS_CHALLENGE}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  isActive(APP_ROUTES.BONUS_CHALLENGE)
                    ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50"
                }`}
              >
                <Database className="w-4 h-4" />
                <span>SQL Challenge</span>
              </Link>

              <a
                href={apiDocsUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors flex gap-x-2 items-center"
              >
                <FileText className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                <p>API Docs (Swagger)</p>
              </a>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="hidden md:flex items-center gap-3">
            {/* Theme Mode Toggle (Auto/Dark/Light) */}
            <button
              onClick={toggleTheme}
              aria-label={getThemeTitle()}
              title={getThemeTitle()}
              className="p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {getThemeIcon()}
            </button>

            {/* Create Event CTA */}
            <button
              onClick={handleCreateEventClick}
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/30 active:scale-95 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              Create Event
            </button>

            {/* User Profile / Auth State */}
            {isAuthenticated && user ? (
              <div className="relative" ref={profileDropdownRef}>
                <button
                  onClick={() => setProfileDropdownOpen((prev) => !prev)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none"
                  aria-label="User Profile Menu"
                  aria-expanded={profileDropdownOpen}
                >
                  <img
                    src={user.avatarUrl || getDicebearAvatarUrl(user.name)}
                    alt={user.name}
                    className="w-8 h-8 rounded-lg object-cover ring-2 ring-indigo-500/30"
                  />
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-200 hidden lg:block">
                    {user.name.split(" ")[0]}
                  </span>
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl glass-card shadow-2xl py-2 z-50 border border-slate-200/80 dark:border-slate-800/80 animate-fade-in">
                    <div className="px-4 py-2.5 border-b border-slate-200 dark:border-slate-800">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {user.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {user.email}
                      </p>
                      <div className="mt-1.5 flex items-center gap-1.5">
                        {user.twoFactorEnabled ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded">
                            <ShieldCheck className="w-3 h-3" /> 2FA Active
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded">
                            2FA Disabled
                          </span>
                        )}
                        {user.isEmailVerified ? (
                          <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded">
                            Verified
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded">
                            Unverified
                          </span>
                        )}
                      </div>
                    </div>

                    <Link
                      to={APP_ROUTES.PROFILE}
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-800/80 transition-colors"
                    >
                      <UserIcon className="w-4 h-4 text-indigo-500" />
                      Profile & Security
                    </Link>

                    <Link
                      to={APP_ROUTES.MY_EVENTS}
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-800/80 transition-colors"
                    >
                      <CalendarCheck className="w-4 h-4 text-purple-500" />
                      My RSVPs & Events
                    </Link>

                    <div className="border-t border-slate-200 dark:border-slate-800 my-1" />

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to={loginUrl}
                  className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to={registerUrl}
                  className="px-4 py-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-xl transition-all"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Actions: Create Event Icon Button, Theme Toggle, Hamburger Button */}
          <div className="flex items-center gap-1.5 sm:gap-2 md:hidden">
            <button
              onClick={handleCreateEventClick}
              aria-label="Create Event"
              title="Create Event"
              className="p-2 rounded-xl text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200/60 dark:border-indigo-800/60 transition-colors shadow-sm"
            >
              <Plus className="w-5 h-5" />
            </button>

            <button
              onClick={toggleTheme}
              aria-label={getThemeTitle()}
              title={getThemeTitle()}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {getThemeIcon()}
            </button>

            <button
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Open menu"
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden glass border-t border-slate-200 dark:border-slate-800 px-4 pt-3 pb-6 space-y-2">
          <Link
            to={APP_ROUTES.HOME}
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-base font-medium transition-colors ${
              isActive(APP_ROUTES.HOME)
                ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50"
                : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Calendar className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
            <span>Browse Events</span>
          </Link>

          <button
            onClick={() => {
              setMobileMenuOpen(false);
              handleCreateEventClick();
            }}
            className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl text-base font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors"
          >
            <PlusCircle className="w-5 h-5" />
            <span>Create Event</span>
          </button>

          {isAuthenticated && (
            <Link
              to={APP_ROUTES.MY_EVENTS}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-base font-medium transition-colors ${
                isActive(APP_ROUTES.MY_EVENTS)
                  ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50"
                  : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <BookmarkCheck className="w-5 h-5 text-purple-500 dark:text-purple-400" />
              <span>My Events & RSVPs</span>
            </Link>
          )}

          <Link
            to={APP_ROUTES.BONUS_CHALLENGE}
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-base font-medium transition-colors ${
              isActive(APP_ROUTES.BONUS_CHALLENGE)
                ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50"
                : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <BookOpen className="w-4 h-4 text-amber-500" />
            <span>Strategy & Reasoning</span>
          </Link>

          <a
            href={apiDocsUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between px-3 py-2.5 rounded-xl text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-amber-500 dark:text-amber-400" />
              <span>Swagger API Docs</span>
            </div>
            <ExternalLink className="w-4 h-4 text-slate-400" />
          </a>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
            {isAuthenticated ? (
              <div className="space-y-2">
                <Link
                  to={APP_ROUTES.PROFILE}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-base font-medium transition-colors ${
                    isActive(APP_ROUTES.PROFILE)
                      ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50"
                      : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <UserIcon className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
                  <span>Profile & Security</span>
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl text-base font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Link
                  to={loginUrl}
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </Link>
                <Link
                  to={registerUrl}
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Sign Up</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
