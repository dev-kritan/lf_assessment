import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { authApi } from '../api/auth.api';
import { useAuth } from '../contexts/AuthContext';
import { APP_ROUTES } from '../constants';

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState('');

  const { refreshProfile } = useAuth();

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage('No verification token provided.');
      return;
    }

    const verify = async () => {
      try {
        const res = await authApi.verifyEmail(token);
        if (res.success) {
          setStatus('success');
          await refreshProfile();
        }
      } catch (err: any) {
        setStatus('error');
        setErrorMessage(err.response?.data?.error?.message || 'Invalid or expired verification link.');
      }
    };

    verify();
  }, [token]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-8 text-center">
        {status === 'verifying' && (
          <div className="py-8 space-y-4">
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto" />
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Verifying Your Email...</h3>
            <p className="text-xs text-slate-500">Please wait while we confirm your email verification token.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="py-4 space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-lg">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">Email Verified!</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Your email address has been successfully verified. You have full access to create and join events.
            </p>
            <div className="pt-4">
              <Link
                to={APP_ROUTES.HOME}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-all"
              >
                Go to Events Dashboard <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="py-4 space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center shadow-lg">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">Verification Failed</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300">{errorMessage}</p>
            <div className="pt-4">
              <Link
                to={APP_ROUTES.PROFILE}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-800 text-white font-bold text-sm shadow-md hover:bg-slate-700 transition-all"
              >
                Back to Profile
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
