import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  LogIn,
  Lock,
  Mail,
  ShieldCheck,
  KeyRound,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { APP_ROUTES, UI_TIMINGS } from "../constants";
import { loginSchema, validateForm, mapApiErrors } from "../dto";

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [requires2FA, setRequires2FA] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const errorRef = useRef<HTMLParagraphElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const twoFactorInputRef = useRef<HTMLInputElement>(null);

  const { login } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const redirectParam = searchParams.get("redirect");
  const from = redirectParam || (location.state as any)?.from?.pathname || APP_ROUTES.HOME;

  useEffect(() => {
    // Auto-focus email input (or 2FA code input) after elements load
    const timer = setTimeout(() => {
      if (requires2FA) {
        twoFactorInputRef.current?.focus();
      } else {
        emailInputRef.current?.focus();
      }
    }, UI_TIMINGS.AUTO_FOCUS_DELAY_MS);
    return () => clearTimeout(timer);
  }, [requires2FA]);

  useEffect(() => {
    if (formError && errorRef.current?.scrollIntoView) {
      errorRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [formError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setFormError("");
    setFieldErrors({});

    const validation = validateForm(loginSchema, {
      email,
      password,
      twoFactorCode: requires2FA ? twoFactorCode : undefined,
    });

    if (!validation.isValid) {
      setFieldErrors(validation.errors);
      setFormError(validation.firstError || "Please correct the form errors.");
      return;
    }

    try {
      setIsLoading(true);
      const res = await login(
        email.trim(),
        password,
        requires2FA ? twoFactorCode.trim() : undefined,
      );

      if (res.requiresTwoFactor) {
        setRequires2FA(true);
        success("Two-factor authentication code required.");
      } else {
        success("Signed in successfully!");
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      const apiError = err.response?.data?.error;
      const msg = apiError?.message || "Login failed. Please check your credentials.";
      setFormError(msg);
      if (apiError?.details) {
        setFieldErrors(mapApiErrors(apiError));
      }
      error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoAccount = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("Password123!");
    setFormError("");
    setRequires2FA(false);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 mx-auto flex items-center justify-center mb-3">
            {requires2FA ? (
              <ShieldCheck className="w-6 h-6" />
            ) : (
              <LogIn className="w-6 h-6" />
            )}
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {requires2FA ? "Two-Factor Authentication" : "Welcome Back"}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {requires2FA
              ? "Enter the 6-digit code from your authenticator app"
              : "Sign in to create, manage, and RSVP to events"}
          </p>
        </div>

        {/* Demo Accounts Quick-Fill Helper */}
        {!requires2FA && (
          <div className="mb-6 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              ⚡ Quick Demo Accounts
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillDemoAccount("alice@example.com")}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-800 hover:border-indigo-400 transition-all text-left"
              >
                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                  Alice (Organizer)
                </span>
                <span className="block text-[10px] text-slate-400">
                  alice@example.com
                </span>
              </button>

              <button
                type="button"
                onClick={() => fillDemoAccount("bob@example.com")}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-800 hover:border-indigo-400 transition-all text-left"
              >
                <span className="font-bold text-purple-600 dark:text-purple-400">
                  Bob (Attendee)
                </span>
                <span className="block text-[10px] text-slate-400">
                  bob@example.com
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!requires2FA ? (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    ref={emailInputRef}
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: "" }));
                    }}
                    placeholder="you@example.com"
                    autoFocus
                    required
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border ${
                      fieldErrors.email
                        ? "border-rose-500 ring-1 ring-rose-500"
                        : "border-slate-200 dark:border-slate-800"
                    } bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50`}
                  />
                </div>
                {fieldErrors.email && (
                  <p className="text-xs text-rose-500 mt-1">{fieldErrors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: "" }));
                    }}
                    placeholder="••••••••"
                    required
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border ${
                      fieldErrors.password
                        ? "border-rose-500 ring-1 ring-rose-500"
                        : "border-slate-200 dark:border-slate-800"
                    } bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50`}
                  />
                </div>
                {fieldErrors.password && (
                  <p className="text-xs text-rose-500 mt-1">{fieldErrors.password}</p>
                )}
              </div>
            </>
          ) : (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                6-Digit Security Code
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  ref={twoFactorInputRef}
                  type="text"
                  maxLength={6}
                  value={twoFactorCode}
                  onChange={(e) => {
                    setTwoFactorCode(e.target.value.replace(/\D/g, ""));
                    if (fieldErrors.twoFactorCode || fieldErrors.token) {
                      setFieldErrors((prev) => ({ ...prev, twoFactorCode: "", token: "" }));
                    }
                  }}
                  placeholder="000000"
                  autoFocus
                  required
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border ${
                    fieldErrors.twoFactorCode || fieldErrors.token
                      ? "border-rose-500 ring-1 ring-rose-500"
                      : "border-slate-200 dark:border-slate-800"
                  } bg-white dark:bg-slate-950 text-base font-mono font-bold tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-indigo-500/50`}
                />
              </div>
              {(fieldErrors.twoFactorCode || fieldErrors.token) && (
                <p className="text-xs text-rose-500 mt-1">
                  {fieldErrors.twoFactorCode || fieldErrors.token}
                </p>
              )}
            </div>
          )}

          {formError && (
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
                Signing in...
              </>
            ) : requires2FA ? (
              <>
                Verify Code & Sign In
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                Sign In
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-6">
          Don&apos;t have an account yet?{" "}
          <Link
            to={`${APP_ROUTES.REGISTER}${location.search}`}
            className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
};
