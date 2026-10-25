import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Activity, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await resetPassword(email);
      if (res.error) {
        setError(res.error);
      } else {
        setSent(true);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send password reset request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white border border-[#DCE3E7] rounded-lg p-8 shadow-xs space-y-6 text-left">
        <div className="text-center space-y-2">
          <div className="inline-flex w-10 h-10 rounded-lg bg-[#19354A] items-center justify-center text-white mb-1 shadow-xs">
            <Activity className="w-5 h-5 text-[#397C78]" />
          </div>
          <h2 className="text-xl font-semibold text-[#19354A] tracking-tight">
            Reset Password
          </h2>
          <p className="text-xs text-[#667580]">
            Enter your registered clinical account email to receive a recovery link.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-[#FBEBEB] border border-[#A94442]/30 text-[#A94442] text-xs flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#A94442]" />
            <span>{error}</span>
          </div>
        )}

        {sent ? (
          <div className="p-4 rounded-lg bg-[#EDF6F1] border border-[#39704F]/30 text-[#39704F] text-xs space-y-3 text-center">
            <CheckCircle2 className="w-6 h-6 mx-auto text-[#39704F]" />
            <p className="font-semibold text-[#263238]">Reset Link Dispatched</p>
            <p className="text-xs text-[#526A7A]">
              If an account matches <strong>{email}</strong>, password reset instructions have been sent to that address.
            </p>
            <div className="pt-2">
              <Link to="/login" className="text-xs font-semibold text-[#397C78] hover:underline">
                Return to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#263238]">Registered Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#667580] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="physician@hospital.org"
                  className="w-full bg-white border border-[#DCE3E7] rounded-lg pl-9 pr-3.5 py-2 text-xs text-[#263238] placeholder:text-[#667580] focus:outline-none focus:border-[#19354A] focus:ring-1 focus:ring-[#19354A] transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 rounded-lg bg-[#19354A] hover:bg-[#122635] disabled:opacity-50 text-white font-semibold text-xs shadow-xs transition-colors flex items-center justify-center space-x-2"
            >
              {submitting ? (
                <span className="inline-block w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <span>Send Password Reset Link</span>
              )}
            </button>
          </form>
        )}

        <div className="pt-4 border-t border-[#DCE3E7] text-center">
          <Link
            to="/login"
            className="inline-flex items-center space-x-1.5 text-xs text-[#526A7A] hover:text-[#19354A] font-medium transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Sign In</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
