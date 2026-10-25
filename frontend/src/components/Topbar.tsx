import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Menu, Plus } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface TopbarProps {
  onToggleSidebar: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onToggleSidebar }) => {
  const location = useLocation();
  const { user } = useAuth();

  const getPageMeta = () => {
    switch (location.pathname) {
      case '/dashboard':
        return {
          title: 'Overview',
          description: 'Operational diagnostic metrics and recent evaluations',
        };
      case '/predict':
        return {
          title: 'New Analysis',
          description: 'Chest radiograph upload and automated classification',
        };
      case '/history':
        return {
          title: 'Analysis History',
          description: 'Audit log of evaluated thoracic radiographs',
        };
      case '/profile':
        return {
          title: 'My Profile',
          description: 'User credentials and account security settings',
        };
      default:
        return {
          title: 'Workstation',
          description: 'Clinical radiograph classification interface',
        };
    }
  };

  const { title, description } = getPageMeta();

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
    <header className="h-16 bg-white border-b border-[#DCE3E7] px-4 sm:px-6 lg:px-8 flex items-center justify-between shrink-0 sticky top-0 z-30">
      <div className="flex items-center space-x-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-md text-[#526A7A] hover:text-[#19354A] hover:bg-[#F4F6F7]"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-lg font-semibold text-[#19354A] leading-tight">
            {title}
          </h1>
          <p className="text-xs text-[#667580] hidden sm:block">
            {description}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        {location.pathname !== '/predict' && (
          <Link
            to="/predict"
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-[#19354A] hover:bg-[#122635] text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Analysis</span>
          </Link>
        )}

        <Link
          to="/profile"
          className="flex items-center space-x-2 p-1.5 sm:px-3 sm:py-1.5 rounded-lg hover:bg-[#F4F6F7] border border-transparent hover:border-[#DCE3E7] transition-colors"
          title="Account profile"
        >
          <div className="w-7 h-7 rounded-full bg-[#EEF6F5] border border-[#DCE3E7] flex items-center justify-center text-xs font-semibold text-[#19354A]">
            {getInitials(user?.fullName, user?.email)}
          </div>
          <span className="text-xs font-medium text-[#263238] hidden md:inline truncate max-w-[130px]">
            {user?.fullName || user?.email || 'Account'}
          </span>
        </Link>
      </div>
    </header>
  );
};
