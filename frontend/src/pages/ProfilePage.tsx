import React, { useState } from 'react';
import { User, Mail, Calendar, KeyRound, LogOut, ShieldCheck, CheckCircle, AlertCircle, Database } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const ProfilePage: React.FC = () => {
  const { user, signOut, resetPassword, isLiveSupabase } = useAuth();
  const [resetRequested, setResetRequested] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [sendingReset, setSendingReset] = useState(false);

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    setSendingReset(true);
    setResetError(null);
    try {
      const res = await resetPassword(user.email);
      if (res.error) {
        setResetError(res.error);
      } else {
        setResetRequested(true);
      }
    } catch (err: any) {
      setResetError(err.message || 'Failed to dispatch reset request.');
    } finally {
      setSendingReset(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-left">
      <div className="space-y-1 border-b border-slate-800 pb-6">
        <h1 className="text-3xl font-bold text-white">Researcher Profile &amp; Settings</h1>
        <p className="text-sm text-slate-400">
          Manage your clinical account credentials and Supabase authentication session.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="md:col-span-1 p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-4">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-tr from-teal-500 to-cyan-400 flex items-center justify-center text-slate-950 font-bold text-2xl shadow-lg shadow-teal-500/20">
            {user?.fullName?.charAt(0) || user?.email?.charAt(0) || 'U'}
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">{user?.fullName || 'Clinical Researcher'}</h2>
            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
          </div>

          <div className="pt-2">
            <span
              className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-mono border ${
                isLiveSupabase
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              }`}
            >
              <Database className="w-3 h-3" />
              <span>{isLiveSupabase ? 'Supabase Auth Active' : 'Local Dev Mode'}</span>
            </span>
          </div>

          <div className="pt-4 border-t border-slate-800">
            <button
              onClick={signOut}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 text-xs font-semibold border border-slate-700/80 transition-colors flex items-center justify-center space-x-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out of Account</span>
            </button>
          </div>
        </div>

        {/* Account Details & Security */}
        <div className="md:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
            <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-3 flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-teal-400" />
              <span>Account Credentials</span>
            </h3>

            <div className="space-y-4 text-sm">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center space-x-3 text-slate-400">
                  <User className="w-4 h-4 text-teal-400" />
                  <span className="text-xs font-medium">Display Name</span>
                </div>
                <span className="font-semibold text-white">{user?.fullName || 'Not specified'}</span>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center space-x-3 text-slate-400">
                  <Mail className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-medium">Email Address</span>
                </div>
                <span className="font-mono text-white text-xs">{user?.email}</span>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center space-x-3 text-slate-400">
                  <Calendar className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-medium">Account Created</span>
                </div>
                <span className="font-mono text-slate-300 text-xs">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Active Session'}
                </span>
              </div>
            </div>
          </div>

          {/* Security & Password */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-3 flex items-center space-x-2">
              <KeyRound className="w-5 h-5 text-teal-400" />
              <span>Security &amp; Password</span>
            </h3>

            {resetError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-400" />
                <span>{resetError}</span>
              </div>
            )}

            {resetRequested ? (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>A password reset link has been dispatched to your email address.</span>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-200">Reset Account Password</p>
                  <p className="text-xs text-slate-400">
                    Receive an email with a secure link to update your Supabase password.
                  </p>
                </div>
                <button
                  onClick={handlePasswordReset}
                  disabled={sendingReset}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 font-semibold text-xs border border-slate-700 transition-colors shrink-0"
                >
                  {sendingReset ? 'Sending...' : 'Request Password Reset'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
