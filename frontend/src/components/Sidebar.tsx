import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Upload,
  Clock,
  User,
  Settings,
  LogOut,
  X,
  Activity
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { label: 'Overview', path: '/dashboard', icon: LayoutDashboard },
    { label: 'New Analysis', path: '/predict', icon: Upload },
    { label: 'Analysis History', path: '/history', icon: Clock },
    { label: 'My Profile', path: '/profile', icon: User },
    { label: 'Settings', path: '/profile#settings', icon: Settings },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
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

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white text-[#263238] border-r border-[#DCE3E7]">
      {/* Brand Header */}
      <div className="h-16 px-6 flex items-center justify-between border-b border-[#DCE3E7]">
        <NavLink to="/dashboard" className="flex items-center space-x-3 group" onClick={onClose}>
          <div className="w-9 h-9 rounded-lg bg-[#19354A] flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
            <Activity className="w-5 h-5 text-[#397C78]" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-base tracking-tight text-[#19354A] leading-tight">
              Lung Imaging
            </span>
            <span className="text-[11px] text-[#667580] tracking-normal">
              Clinical Diagnostic Suite
            </span>
          </div>
        </NavLink>
        <button
          onClick={onClose}
          className="lg:hidden p-1.5 rounded-md text-[#667580] hover:text-[#19354A] hover:bg-[#F4F6F7]"
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-[#667580] uppercase">
          Workstation Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#19354A] text-white shadow-sm'
                    : 'text-[#526A7A] hover:text-[#19354A] hover:bg-[#F4F6F7]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-[#397C78]' : 'text-[#526A7A]'
                    }`}
                  />
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Clinical Disclaimer Notice */}
      <div className="mx-3 mb-4 p-3 rounded-lg bg-[#F4F6F7] border border-[#DCE3E7] text-[11px] text-[#667580] leading-relaxed">
        <p className="font-medium text-[#263238] mb-0.5">Clinical Notice</p>
        Research and educational use only. Not for standalone diagnostic use.
      </div>

      {/* User Footer Profile */}
      <div className="p-3 border-t border-[#DCE3E7] bg-white">
        <div className="flex items-center justify-between p-2 rounded-lg hover:bg-[#F4F6F7] transition-colors">
          <NavLink
            to="/profile"
            onClick={onClose}
            className="flex items-center space-x-3 min-w-0 flex-1 mr-2"
          >
            <div className="w-8 h-8 rounded-full bg-[#EEF6F5] border border-[#DCE3E7] flex items-center justify-center text-xs font-semibold text-[#19354A] shrink-0">
              {getInitials(user?.fullName, user?.email)}
            </div>
            <div className="min-w-0 flex-1 text-left">
              <p className="text-xs font-semibold text-[#263238] truncate">
                {user?.fullName || 'Physician / User'}
              </p>
              <p className="text-[11px] text-[#667580] truncate font-mono">
                {user?.email || 'authenticated'}
              </p>
            </div>
          </NavLink>
          <button
            onClick={handleSignOut}
            title="Sign Out"
            className="p-1.5 rounded-md text-[#667580] hover:text-[#A94442] hover:bg-[#FBEBEB] transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block w-64 h-screen shrink-0 sticky top-0">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop & Container */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={onClose}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full h-full z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
