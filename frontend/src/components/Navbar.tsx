import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Activity, LayoutDashboard, User, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const Navbar: React.FC = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();

  const isAuthPage = ['/login', '/register', '/forgot-password'].includes(location.pathname);

  return (
    <nav className="border-b border-[#DCE3E7] bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-9 h-9 rounded-lg bg-[#19354A] flex items-center justify-center text-white shadow-xs transition-transform group-hover:scale-105">
              <Activity className="w-5 h-5 text-[#397C78]" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-base font-semibold text-[#19354A] leading-tight tracking-tight">
                Lung Imaging
              </span>
              <span className="text-[11px] text-[#667580] tracking-normal">
                Clinical Diagnostic Suite
              </span>
            </div>
          </Link>

          {/* Navigation Links for Authenticated or Public */}
          <div className="flex items-center space-x-3">
            {user ? (
              <div className="flex items-center space-x-2">
                <Link
                  to="/dashboard"
                  className="flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#19354A] text-white hover:bg-[#122635] transition-colors"
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-[#397C78]" />
                  <span>Workstation</span>
                </Link>
                <Link
                  to="/profile"
                  className="p-1.5 rounded-lg text-[#526A7A] hover:text-[#19354A] hover:bg-[#F4F6F7] border border-[#DCE3E7] transition-colors"
                  title="Profile"
                >
                  <User className="w-4 h-4" />
                </Link>
                <button
                  onClick={signOut}
                  title="Sign Out"
                  className="p-1.5 rounded-lg text-[#667580] hover:text-[#A94442] hover:bg-[#FBEBEB] border border-[#DCE3E7] transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : !isAuthPage ? (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="text-xs font-semibold text-[#526A7A] hover:text-[#19354A] px-3 py-2 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#19354A] hover:bg-[#122635] text-white shadow-xs transition-colors"
                >
                  Access Platform
                </Link>
              </div>
            ) : (
              <Link
                to="/"
                className="text-xs font-medium text-[#526A7A] hover:text-[#19354A]"
              >
                Back to Home
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
