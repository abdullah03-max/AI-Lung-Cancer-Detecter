import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Mail, User, Eye, EyeOff, Activity, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const RegisterPage: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await signUp(email, password, fullName);
      if (res.error) {
        setError(res.error);
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during account creation.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white border border-[#DCE3E7] rounded-lg p-8 shadow-xs space-y-6 text-left">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-10 h-10 rounded-lg bg-[#19354A] items-center justify-center text-white mb-1 shadow-xs">
            <Activity className="w-5 h-5 text-[#397C78]" />
          </div>
          <h2 className="text-xl font-semibold text-[#19354A] tracking-tight">
            Create Clinical Account
          </h2>
          <p className="text-xs text-[#667580]">
            Register an account to evaluate radiographs and track diagnostic records.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-[#FBEBEB] border border-[#A94442]/30 text-[#A94442] text-xs flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#A94442]" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#263238]">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-[#667580] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Dr. Jane Smith"
                className="w-full bg-white border border-[#DCE3E7] rounded-lg pl-9 pr-3.5 py-2 text-xs text-[#263238] placeholder:text-[#667580] focus:outline-none focus:border-[#19354A] focus:ring-1 focus:ring-[#19354A] transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#263238]">Email Address</label>
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

          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#263238]">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#667580] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-white border border-[#DCE3E7] rounded-lg pl-9 pr-9 py-2 text-xs text-[#263238] placeholder:text-[#667580] focus:outline-none focus:border-[#19354A] focus:ring-1 focus:ring-[#19354A] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#667580] hover:text-[#263238]"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#263238]">Confirm Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#667580] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-white border border-[#DCE3E7] rounded-lg pl-9 pr-3.5 py-2 text-xs text-[#263238] placeholder:text-[#667580] focus:outline-none focus:border-[#19354A] focus:ring-1 focus:ring-[#19354A] transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 px-4 rounded-lg bg-[#19354A] hover:bg-[#122635] disabled:opacity-50 text-white font-semibold text-xs shadow-xs transition-colors flex items-center justify-center space-x-2 mt-2"
          >
            {submitting ? (
              <span className="inline-block w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Complete Registration</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-[#DCE3E7] text-center text-xs text-[#667580]">
          Already registered?{' '}
          <Link to="/login" className="text-[#397C78] hover:underline font-semibold ml-0.5">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
