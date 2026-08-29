import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Mail, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  Key, 
  ExternalLink,
  Loader2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { authApi } from '../api/auth.api';
import { TwoFactorModal } from '../components/TwoFactorModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Link } from 'react-router-dom';
import { APP_ROUTES, getDicebearAvatarUrl } from '../constants';

export const ProfilePage: React.FC = () => {
  const { user, refreshProfile } = useAuth();
  const { success, error, info } = useToast();

  const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);
  const [isDisable2FADialogOpen, setIsDisable2FADialogOpen] = useState(false);
  const [disableToken, setDisableToken] = useState('');
  const [isDisabling, setIsDisabling] = useState(false);
  const [verificationUrl, setVerificationUrl] = useState('');
  const [isRequestingEmail, setIsRequestingEmail] = useState(false);

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center">
        <p className="text-sm text-slate-500">Please sign in to view your profile and security settings.</p>
        <Link to={`${APP_ROUTES.LOGIN}?redirect=${encodeURIComponent(APP_ROUTES.PROFILE)}`} className="mt-4 inline-block px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs">
          Sign In
        </Link>
      </div>
    );
  }

  const handleDisable2FA = async () => {
    if (!user?.twoFactorEnabled || isDisabling) return;
    if (!disableToken || disableToken.length !== 6) {
      error('Please enter the 6-digit code to disable 2FA');
      return;
    }

    try {
      setIsDisabling(true);
      const res = await authApi.disable2FA(disableToken);
      if (res.success) {
        success('Two-factor authentication disabled.');
        await refreshProfile();
        setIsDisable2FADialogOpen(false);
        setDisableToken('');
      }
    } catch (err: any) {
      error(err.response?.data?.error?.message || 'Failed to disable 2FA');
    } finally {
      setIsDisabling(false);
    }
  };

  const handleRequestVerificationEmail = async () => {
    try {
      setIsRequestingEmail(true);
      const res = await authApi.requestVerificationLink();
      if (res.success && res.data) {
        setVerificationUrl(res.data.verificationUrl);
        info('Verification link generated below. In production this would be sent via SMTP.');
      }
    } catch (err: any) {
      error(err.response?.data?.error?.message || 'Failed to generate verification link');
    } finally {
      setIsRequestingEmail(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-24 animate-fade-in space-y-8">
      {/* Profile Header Card */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800/80 shadow-lg flex flex-col sm:flex-row items-center gap-6">
        <img
          src={user.avatarUrl || getDicebearAvatarUrl(user.name)}
          alt={user.name}
          className="w-24 h-24 rounded-3xl object-cover ring-4 ring-indigo-500/20 shadow-lg"
        />

        <div className="text-center sm:text-left flex-1">
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">{user.name}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{user.email}</p>

          <div className="mt-4 flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
            {user.isEmailVerified ? (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5" /> Email Verified
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 px-3 py-1 rounded-full border border-amber-200 dark:border-amber-800">
                <AlertCircle className="w-3.5 h-3.5" /> Email Unverified
              </span>
            )}

            {user.twoFactorEnabled ? (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-950/80 px-3 py-1 rounded-full border border-indigo-200 dark:border-indigo-800">
                <ShieldCheck className="w-3.5 h-3.5" /> 2FA Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                <ShieldAlert className="w-3.5 h-3.5 text-slate-400" /> 2FA Inactive
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Security & Authentication Section */}
      <div className="space-y-6">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Key className="w-5 h-5 text-indigo-500" />
          Security & Authentication Settings
        </h2>

        {/* 2FA Setup Card */}
        <div className="glass-card rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="max-w-xl">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Two-Factor Authentication (TOTP)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Add an extra layer of protection to your account using Google Authenticator, Authy, or Microsoft Authenticator. When signing in, you will be prompted for a 6-digit verification code.
              </p>
            </div>

            {user.twoFactorEnabled ? (
              <button
                onClick={() => setIsDisable2FADialogOpen(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 hover:bg-rose-100 transition-colors self-start sm:self-auto"
              >
                Disable 2FA
              </button>
            ) : (
              <button
                onClick={() => setIs2FAModalOpen(true)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20 active:scale-95 transition-all self-start sm:self-auto"
              >
                Enable 2FA Protection
              </button>
            )}
          </div>
        </div>

        {/* Email Verification Card */}
        <div className="glass-card rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="max-w-xl">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-500" />
                Email Verification
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                {user.isEmailVerified
                  ? 'Your email address is verified. You have full access to create events, manage RSVPs, and view private community events.'
                  : 'Your email address is not verified yet. Verification is required to create, edit, or delete events, submit RSVPs, and view True Private events.'}
              </p>
            </div>

            {!user.isEmailVerified && (
              <button
                onClick={handleRequestVerificationEmail}
                disabled={isRequestingEmail}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 active:scale-95 transition-all flex items-center gap-1.5 self-start sm:self-auto disabled:opacity-50"
              >
                {isRequestingEmail && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Send Verification Link
              </button>
            )}
          </div>

          {verificationUrl && (
            <div className="mt-4 p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-blue-900 dark:text-blue-200">Email Verification Link Sent & Ready:</p>
                <p className="text-[11px] text-blue-700 dark:text-blue-300 truncate max-w-md mt-0.5">{verificationUrl}</p>
              </div>
              <Link
                to={verificationUrl}
                className="px-3.5 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 flex items-center gap-1.5 self-start sm:self-auto shadow-sm"
              >
                Confirm Now <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* 2FA Setup Modal */}
      <TwoFactorModal
        isOpen={is2FAModalOpen}
        onClose={() => setIs2FAModalOpen(false)}
        onSuccess={() => {
          refreshProfile();
        }}
      />

      {/* Disable 2FA Prompt Dialog */}
      {isDisable2FADialogOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Disable 2FA Authentication</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Please enter the 6-digit code from your authenticator app to confirm disabling 2FA.
            </p>
            <input
              type="text"
              maxLength={6}
              value={disableToken}
              onChange={(e) => setDisableToken(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="w-full text-center font-mono font-bold tracking-widest text-lg px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 mb-4"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsDisable2FADialogOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDisable2FA}
                disabled={isDisabling || disableToken.length !== 6}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold disabled:opacity-50"
              >
                {isDisabling ? 'Disabling...' : 'Confirm Disable'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
