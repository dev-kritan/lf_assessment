import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Calendar, 
  PlusCircle, 
  Sun, 
  Moon, 
  User as UserIcon, 
  LogOut, 
  ShieldCheck, 
  Database, 
  BookmarkCheck,
  Menu,
  X,
  CalendarCheck
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';

interface NavbarProps {
  onOpenCreateModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenCreateModal }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { success } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    success('Logged out successfully');
    navigate('/');
    setProfileDropdownOpen(false);
  };

  const isActive = (path: string) => location.pathname === path;

  const currentPathWithSearch = location.pathname + location.search;
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const loginUrl = isAuthPage ? '/login' : `/login?redirect=${encodeURIComponent(currentPathWithSearch)}`;
  const registerUrl = isAuthPage ? '/register' : `/register?redirect=${encodeURIComponent(currentPathWithSearch)}`;

  return (
    <nav className="sticky top-0 z-40 w-full glass border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5 group">
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
                to="/"
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/')
                    ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50'
                }`}
              >
                Browse Events
              </Link>

              {isAuthenticated && (
                <Link
                  to="/my-events"
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    isActive('/my-events')
                      ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <BookmarkCheck className="w-4 h-4" />
                  My Events & RSVPs
                </Link>
              )}

              <Link
                to="/bonus-challenge"
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  isActive('/bonus-challenge')
                    ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50'
                }`}
              >
                <Database className="w-4 h-4 text-emerald-500" />
                <span>Bonus SQL Challenge</span>
                <span className="text-[10px] uppercase tracking-wider font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 px-1.5 py-0.5 rounded-full">
                  8 Marks
                </span>
              </Link>

              <a
                href="http://localhost:5000/api-docs"
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
              >
                API Docs (Swagger)
              </a>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="hidden md:flex items-center gap-3">
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Create Event CTA */}
            {isAuthenticated ? (
              <button
                onClick={onOpenCreateModal}
                className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/30 active:scale-95 transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                Create Event
              </button>
            ) : (
              <Link
                to="/login?redirect=/create-event"
                className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-md shadow-indigo-500/20 active:scale-95 transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                Create Event
              </Link>
            )}

            {/* User Profile / Auth State */}
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen((prev) => !prev)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none"
                >
                  <img
                    src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`}
                    alt={user.name}
                    className="w-8 h-8 rounded-lg object-cover ring-2 ring-indigo-500/30"
                  />
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-200 hidden lg:block">
                    {user.name.split(' ')[0]}
                  </span>
                </button>

                {profileDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 rounded-2xl glass-card shadow-2xl py-2 z-50 border border-slate-200/80 dark:border-slate-800/80 animate-fade-in"
                    onMouseLeave={() => setProfileDropdownOpen(false)}
                  >
                    <div className="px-4 py-2.5 border-b border-slate-200 dark:border-slate-800">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{user.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
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
                        {user.isEmailVerified && (
                          <span className="text-[10px] font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded">
                            Verified
                          </span>
                        )}
                      </div>
                    </div>

                    <Link
                      to="/profile"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-800/80 transition-colors"
                    >
                      <UserIcon className="w-4 h-4 text-indigo-500" />
                      Profile & Security
                    </Link>

                    <Link
                      to="/my-events"
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

          {/* Mobile Hamburger Button */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
            </button>

            <button
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Open menu"
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden glass border-t border-slate-200 dark:border-slate-800 px-4 pt-3 pb-6 space-y-2">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Browse Events
          </Link>

          {isAuthenticated && (
            <Link
              to="/my-events"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              My Events & RSVPs
            </Link>
          )}

          <Link
            to="/bonus-challenge"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Bonus SQL Challenge
          </Link>

          <a
            href="http://localhost:5000/api-docs"
            target="_blank"
            rel="noreferrer"
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Swagger API Docs
          </a>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
            {isAuthenticated ? (
              <div className="space-y-2">
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 dark:text-slate-200"
                >
                  Profile & Security
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-base font-medium text-rose-600 dark:text-rose-400"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Link
                  to={loginUrl}
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-xl font-semibold bg-indigo-600 text-white"
                >
                  Sign In
                </Link>
                <Link
                  to={registerUrl}
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-xl font-semibold border border-slate-300 dark:border-slate-700"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
