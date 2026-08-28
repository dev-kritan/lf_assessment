import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { UserPlus, User, Mail, Lock, Loader2, ArrowRight, CheckCircle2, Send, RotateCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { authApi } from '../api/auth.api';
import { APP_ROUTES, UI_TIMINGS } from '../constants';
import { registerSchema, validateForm, mapApiErrors } from '../dto';

export const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isRegistered, setIsRegistered] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendStatus, setResendStatus] = useState('');

  const errorRef = useRef<HTMLParagraphElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const { register } = useAuth();
  const { success, error } = useToast();
  const location = useLocation();

  useEffect(() => {
    // Auto-focus full name input after elements load
    const timer = setTimeout(() => {
      nameInputRef.current?.focus();
    }, UI_TIMINGS.AUTO_FOCUS_DELAY_MS);
    return () => clearTimeout(timer);
  }, [isRegistered]);

  useEffect(() => {
    if (formError && errorRef.current?.scrollIntoView) {
      errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [formError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setFormError('');
    setFieldErrors({});

    const validation = validateForm(registerSchema, {
      name,
      email,
      password,
      confirmPassword,
    });

    if (!validation.isValid) {
      setFieldErrors(validation.errors);
      const firstField = Object.keys(validation.errors)[0];
      if (firstField) {
        const el = document.querySelector(`[data-field="${firstField}"]`);
        el?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
        const input = el?.querySelector('input');
        input?.focus();
      }
      return;
    }

    try {
      setIsLoading(true);
      const trimmedEmail = email.trim();
      await register(name.trim(), trimmedEmail, password);
      setRegisteredEmail(trimmedEmail);
      setIsRegistered(true);
      success('Account created! Please verify your email.');
    } catch (err: any) {
      const apiError = err.response?.data?.error;
      const msg = apiError?.message || 'Registration failed. Please try again.';
      setFormError(msg);
      if (apiError?.details) {
        setFieldErrors(mapApiErrors(apiError));
      }
      error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (isResending || !registeredEmail) return;
    try {
      setIsResending(true);
      setResendStatus('');
      const res = await authApi.resendVerification(registeredEmail);
      setResendStatus(res.message || 'Verification link sent!');
      success('Verification email resent.');
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Failed to resend verification email.';
      error(msg);
    } finally {
      setIsResending(false);
    }
  };

  if (isRegistered) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-8 text-center">
          <div className="w-16 h-16 rounded-3xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 mx-auto flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/10">
            <Mail className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Check Your Inbox</h2>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-2">
            We’ve sent a verification link to <strong className="text-slate-900 dark:text-white">{registeredEmail}</strong>.
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            Please click the link in your email within <strong>24 hours</strong> to activate your account and start using EventHub.
          </p>

          {resendStatus && (
            <div className="mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300">
              {resendStatus}
            </div>
          )}

          <div className="mt-6 space-y-3">
            <Link
              to={`${APP_ROUTES.LOGIN}${location.search}`}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-sm shadow-md shadow-indigo-500/25 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              Go to Sign In
              <ArrowRight className="w-4 h-4" />
            </Link>

            <button
              type="button"
              onClick={handleResend}
              disabled={isResending}
              className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all flex items-center justify-center gap-2"
            >
              {isResending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Resending...
                </>
              ) : (
                <>
                  <RotateCw className="w-3.5 h-3.5" />
                  Didn&apos;t receive it? Resend Email
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 mx-auto flex items-center justify-center mb-3">
            <UserPlus className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Create an Account</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Join the community to plan events and connect with attendees
          </p>
        </div>

        {/* Form */}
        <form noValidate onSubmit={handleSubmit} className="space-y-4">
          <div data-field="name">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                ref={nameInputRef}
                type="text"
                name="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: '' }));
                  if (formError) setFormError('');
                }}
                placeholder="e.g. Alice Johnson"
                autoFocus
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border ${
                  fieldErrors.name ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-200 dark:border-slate-800'
                } bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50`}
              />
            </div>
            {fieldErrors.name && <p className="text-xs text-rose-500 mt-1">{fieldErrors.name}</p>}
          </div>

          <div data-field="email">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                name="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: '' }));
                  if (formError) setFormError('');
                }}
                placeholder="alice@example.com"
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border ${
                  fieldErrors.email ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-200 dark:border-slate-800'
                } bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50`}
              />
            </div>
            {fieldErrors.email && <p className="text-xs text-rose-500 mt-1">{fieldErrors.email}</p>}
          </div>

          <div data-field="password">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Password (min. 6 characters)
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                name="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: '' }));
                  if (formError) setFormError('');
                }}
                placeholder="••••••••"
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border ${
                  fieldErrors.password ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-200 dark:border-slate-800'
                } bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50`}
              />
            </div>
            {fieldErrors.password && <p className="text-xs text-rose-500 mt-1">{fieldErrors.password}</p>}
          </div>

          <div data-field="confirmPassword">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                name="confirmPassword"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (fieldErrors.confirmPassword) setFieldErrors((prev) => ({ ...prev, confirmPassword: '' }));
                  if (formError) setFormError('');
                }}
                placeholder="••••••••"
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border ${
                  fieldErrors.confirmPassword ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-200 dark:border-slate-800'
                } bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50`}
              />
            </div>
            {fieldErrors.confirmPassword && (
              <p className="text-xs text-rose-500 mt-1">{fieldErrors.confirmPassword}</p>
            )}
          </div>

          {formError && !Object.keys(fieldErrors).length && (
            <p
              ref={errorRef}
              className="text-xs text-rose-600 dark:text-rose-400 font-medium bg-rose-50 dark:bg-rose-950/40 p-2.5 rounded-xl border border-rose-200 dark:border-rose-900/60"
            >
              {formError}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-sm shadow-md shadow-indigo-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating Account...
              </>
            ) : (
              <>
                Sign Up
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-6">
          Already have an account?{' '}
          <Link
            to={`${APP_ROUTES.LOGIN}${location.search}`}
            className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};
