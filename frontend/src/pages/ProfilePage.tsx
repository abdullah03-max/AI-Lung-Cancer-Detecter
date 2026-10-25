import React, { useState } from 'react';
import {
  User,
  Mail,
  Calendar,
  KeyRound,
  LogOut,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Settings
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const ProfilePage: React.FC = () => {
  const { user, signOut, resetPassword } = useAuth();
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

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      return name.slice(0, 2).toUpperCase();
    }
    if (email) return email.slice(0, 2).toUpperCase();
    return 'LI';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-left">
      {/* Top Header Card */}
      <div className="bg-white border border-[#DCE3E7] rounded-lg p-6 shadow-xs">
        <h2 className="text-xl font-semibold text-[#19354A]">
          My Profile &amp; Settings
        </h2>
        <p className="text-sm text-[#667580] mt-1">
          Manage clinical workstation credentials, security settings, and diagnostic preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User Profile Card */}
        <div className="md:col-span-1 bg-white border border-[#DCE3E7] rounded-lg p-6 shadow-xs text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-[#EEF6F5] border border-[#DCE3E7] flex items-center justify-center text-[#19354A] font-bold text-xl shadow-xs">
            {getInitials(user?.fullName, user?.email)}
          </div>

          <div>
            <h3 className="text-base font-semibold text-[#19354A]">
              {user?.fullName || 'Physician / Researcher'}
            </h3>
            <p className="text-xs text-[#667580] truncate mt-0.5 font-mono">
              {user?.email}
            </p>
          </div>

          <div className="pt-2">
            <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs font-medium bg-[#EDF6F1] text-[#39704F] border border-[#39704F]/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verified Session</span>
            </span>
          </div>

          <div className="pt-4 border-t border-[#DCE3E7]">
            <button
              onClick={signOut}
              className="w-full py-2 px-3 rounded-lg bg-white hover:bg-[#FBEBEB] text-[#A94442] hover:text-[#A94442] text-xs font-semibold border border-[#DCE3E7] transition-colors flex items-center justify-center space-x-2"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Credentials & Security Settings */}
        <div className="md:col-span-2 space-y-6">
          {/* Account Credentials */}
          <div className="bg-white border border-[#DCE3E7] rounded-lg p-6 shadow-xs space-y-4">
            <h3 className="text-base font-semibold text-[#19354A] border-b border-[#DCE3E7] pb-3 flex items-center space-x-2">
              <User className="w-4 h-4 text-[#526A7A]" />
              <span>Account Credentials</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-lg bg-[#F8FAFB] border border-[#DCE3E7]">
                <div className="flex items-center space-x-2.5 text-[#667580]">
                  <User className="w-4 h-4 text-[#526A7A]" />
                  <span className="font-medium">Full Name</span>
                </div>
                <span className="font-semibold text-[#263238]">{user?.fullName || 'Not specified'}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-[#F8FAFB] border border-[#DCE3E7]">
                <div className="flex items-center space-x-2.5 text-[#667580]">
                  <Mail className="w-4 h-4 text-[#526A7A]" />
                  <span className="font-medium">Email Address</span>
                </div>
                <span className="font-mono text-[#263238] font-medium">{user?.email}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-[#F8FAFB] border border-[#DCE3E7]">
                <div className="flex items-center space-x-2.5 text-[#667580]">
                  <Calendar className="w-4 h-4 text-[#526A7A]" />
                  <span className="font-medium">Account Established</span>
                </div>
                <span className="font-medium text-[#263238]">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Active'}
                </span>
              </div>
            </div>
          </div>

          {/* Password & Security */}
          <div className="bg-white border border-[#DCE3E7] rounded-lg p-6 shadow-xs space-y-4">
            <h3 className="text-base font-semibold text-[#19354A] border-b border-[#DCE3E7] pb-3 flex items-center space-x-2">
              <KeyRound className="w-4 h-4 text-[#526A7A]" />
              <span>Security &amp; Password</span>
            </h3>

            {resetError && (
              <div className="p-3 rounded-lg bg-[#FBEBEB] border border-[#A94442]/30 text-[#A94442] text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{resetError}</span>
              </div>
            )}

            {resetRequested ? (
              <div className="p-3 rounded-lg bg-[#EDF6F1] border border-[#39704F]/30 text-[#39704F] text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>A password reset link has been dispatched to your email address.</span>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-[#263238]">Reset Password</p>
                  <p className="text-[11px] text-[#667580] mt-0.5">
                    Send a secure password reset link to your registered email address.
                  </p>
                </div>
                <button
                  onClick={handlePasswordReset}
                  disabled={sendingReset}
                  className="px-3.5 py-2 rounded-lg bg-white hover:bg-[#F4F6F7] text-[#19354A] font-semibold text-xs border border-[#DCE3E7] transition-colors shrink-0"
                >
                  {sendingReset ? 'Sending...' : 'Request Password Reset'}
                </button>
              </div>
            )}
          </div>

          {/* Workstation Settings (anchored for #settings) */}
          <div id="settings" className="bg-white border border-[#DCE3E7] rounded-lg p-6 shadow-xs space-y-4">
            <h3 className="text-base font-semibold text-[#19354A] border-b border-[#DCE3E7] pb-3 flex items-center space-x-2">
              <Settings className="w-4 h-4 text-[#526A7A]" />
              <span>Workstation Preferences</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-lg bg-[#F8FAFB] border border-[#DCE3E7]">
                <div>
                  <p className="font-semibold text-[#263238]">Automated Image Quality Validation</p>
                  <p className="text-[11px] text-[#667580] mt-0.5">
                    Pre-checks contrast and borders before sending to deep learning inference.
                  </p>
                </div>
                <span className="text-[11px] font-semibold text-[#39704F] bg-[#EDF6F1] px-2 py-0.5 rounded border border-[#39704F]/20">
                  Enabled
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-[#F8FAFB] border border-[#DCE3E7]">
                <div>
                  <p className="font-semibold text-[#263238]">Session Audit Logging</p>
                  <p className="text-[11px] text-[#667580] mt-0.5">
                    Store classification histories and confidence distributions in private records.
                  </p>
                </div>
                <span className="text-[11px] font-semibold text-[#39704F] bg-[#EDF6F1] px-2 py-0.5 rounded border border-[#39704F]/20">
                  Active
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
