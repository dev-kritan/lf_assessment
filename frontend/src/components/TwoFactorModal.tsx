import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Copy, Check, Loader2, AlertCircle } from 'lucide-react';
import { authApi } from '../api/auth.api';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';

interface TwoFactorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const TwoFactorModal: React.FC<TwoFactorModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { success, error } = useToast();
  const { refreshProfile } = useAuth();

  useEffect(() => {
    if (isOpen) {
      fetch2FASetup();
    }
  }, [isOpen]);

  const fetch2FASetup = async () => {
    if (isLoading || (qrCode && secret)) return;
    try {
      setIsLoading(true);
      setErrorMessage('');
      const res = await authApi.setup2FA();
      if (res.success && res.data) {
        setQrCode(res.data.qrCode);
        setSecret(res.data.secret);
      }
    } catch {
      error('Failed to initialize 2FA setup');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerifyAndEnable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isVerifying) return;
    if (!token.trim() || token.trim().length !== 6) {
      setErrorMessage('Please enter the 6-digit authentication code.');
      return;
    }

    try {
      setIsVerifying(true);
      setErrorMessage('');
      const res = await authApi.enable2FA(token.trim());
      if (res.success) {
        success('Two-Factor Authentication is now enabled!');
        await refreshProfile();
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error?.message || 'Invalid 2FA code. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Setup Two-Factor Auth (2FA)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Enhance account security with TOTP authentication
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            <p className="text-xs text-slate-500">Generating secure QR code...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-slate-600 dark:text-slate-300">
              1. Scan this QR code with Google Authenticator, Authy, or 1Password:
            </p>

            {qrCode && (
              <div className="flex justify-center p-3 rounded-2xl bg-white border border-slate-200 dark:border-slate-800">
                <img src={qrCode} alt="2FA QR Code" className="w-44 h-44 object-contain rounded-lg" />
              </div>
            )}

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Or enter key manually:</span>
                <button
                  type="button"
                  onClick={handleCopySecret}
                  className="flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <p className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 mt-1 break-all select-all">
                {secret}
              </p>
            </div>

            <form onSubmit={handleVerifyAndEnable} className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  2. Enter the 6-digit code from your app:
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={token}
                  onChange={(e) => setToken(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="w-full text-center tracking-widest text-lg font-mono font-bold px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {errorMessage && (
                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isVerifying || token.length !== 6}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-1.5"
                >
                  {isVerifying && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Verify & Activate
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
