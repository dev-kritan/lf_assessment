import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, AlertCircle, Loader2, ArrowRight, Mail, Info, Send } from 'lucide-react';
import { authApi } from '../api/auth.api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { APP_ROUTES } from '../constants';

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const uid = searchParams.get('uid');
  const urlStatus = searchParams.get('status');
  const urlMessage = searchParams.get('message');

  const [status, setStatus] = useState<'verifying' | 'success' | 'already-verified' | 'error'>(() => {
    if (urlStatus === 'success') return 'success';
    if (urlStatus === 'already-verified') return 'already-verified';
    if (urlStatus === 'error') return 'error';
    return 'verifying';
  });
  const [message, setMessage] = useState(urlMessage || '');
  const [resendEmail, setResendEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendSuccessMsg, setResendSuccessMsg] = useState('');

  const { refreshProfile } = useAuth();
  const { success, error } = useToast();

  useEffect(() => {
    // If status came directly from server redirect
    if (urlStatus) {
      if (urlStatus === 'success') {
        setStatus('success');
        refreshProfile();
      } else if (urlStatus === 'already-verified') {
        setStatus('already-verified');
      } else {
        setStatus('error');
        setMessage(urlMessage || 'Verification failed.');
      }
      return;
    }

    if (!token) {
      setStatus('error');
      setMessage('No verification token provided. Please check your verification link or request a new one.');
      return;
    }

    const verify = async () => {
      try {
        const res = await authApi.verifyEmail(token, uid || undefined);
        if (res.success) {
          if (res.data?.alreadyVerified) {
            setStatus('already-verified');
            setMessage(res.data?.message || 'Your email address is already verified.');
          } else {
            setStatus('success');
            setMessage(res.data?.message || 'Your email address has been successfully verified.');
            await refreshProfile();
          }
        }
      } catch (err: any) {
        setStatus('error');
        const apiError = err.response?.data?.error;
        setMessage(apiError?.message || 'Invalid or expired verification link.');
      }
    };

    verify();
  }, [token, uid, urlStatus, urlMessage, refreshProfile]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail.trim() || isResending) return;

    try {
      setIsResending(true);
      setResendSuccessMsg('');
      const res = await authApi.resendVerification(resendEmail.trim());
      setResendSuccessMsg(res.message || 'If an account exists, a new verification link has been sent to your inbox.');
      success('Verification email sent!');
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Failed to resend verification email.';
      error(msg);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-8 text-center">
        {status === 'verifying' && (
          <div className="py-8 space-y-4">
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto" />
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Verifying Your Email...</h3>
            <p className="text-xs text-slate-500">Please wait while we validate your secure token.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="py-4 space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/10">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">Email Verified!</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              {message || 'Your email address has been successfully verified. You now have full access to EventHub.'}
            </p>
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to={APP_ROUTES.LOGIN}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-all"
              >
                Sign In Now <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {status === 'already-verified' && (
          <div className="py-4 space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center shadow-lg shadow-blue-500/10">
              <Info className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">Already Verified</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              {message || 'Your email address has already been verified. You can sign in to access your account.'}
            </p>
            <div className="pt-4">
              <Link
                to={APP_ROUTES.LOGIN}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-all"
              >
                Go to Sign In <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="py-4 space-y-5">
            <div className="w-16 h-16 rounded-3xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center shadow-lg shadow-rose-500/10">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">Verification Failed</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{message}</p>
            </div>

            {/* Resend Verification Form */}
            <div className="mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-left">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                Request a New Verification Link
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
                Enter your email address below to receive a new 24-hour verification link.
              </p>

              {resendSuccessMsg ? (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 font-medium">
                  {resendSuccessMsg}
                </div>
              ) : (
                <form onSubmit={handleResend} className="space-y-3">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={resendEmail}
                      onChange={(e) => setResendEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isResending || !resendEmail.trim()}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all"
                  >
                    {isResending ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Sending Link...
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        Send New Link
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            <div className="pt-2">
              <Link
                to={APP_ROUTES.LOGIN}
                className="text-xs font-semibold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors"
              >
                Back to Sign In
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
