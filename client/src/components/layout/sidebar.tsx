import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { AnimatePresence, motion } from 'framer-motion';

import { useAuth, UserRole } from '../../context/AuthContext';
import logo from '../../assets/images/unlogo.png';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  variant?: 'permanent' | 'temporary';
}

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  roles?: UserRole[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  variant = 'temporary'
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activePath, setActivePath] = useState(location.pathname);

  useEffect(() => {
    setActivePath(location.pathname);
  }, [location.pathname]);

  // Navigation items configuration
  const navItems: NavItem[] = [
    {
      path: '/dashboard',
      label: 'Dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      path: '/properties',
      label: 'Browse Properties',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
    },
    {
      path: '/mynest',
      label: 'My Nest',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      path: '/favorites',
      label: 'Favorites',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
    },
    {
      path: '/profile',
      label: 'Profile',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      path: '/settings',
      label: 'Settings',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  // Filter items based on user role
  const filteredNavItems = navItems.filter(item => {
    if (!item.roles) return true;
    if (!user) return false;
    return item.roles.includes(user.role);
  });

  const handleNavigation = (path: string) => {
    navigate(path);
    if (variant === 'temporary') {
      onClose();
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    if (variant === 'temporary') {
      onClose();
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-[#0F1116] shadow-2xl transition-colors border-r border-gray-100 dark:border-[#2E3543]">
      {/* Sidebar Header */}
      <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-[#2E3543]">
        <Link to="/" className="flex items-center space-x-2.5 group">
          <div className="bg-white/95 dark:bg-white/95 px-2.5 py-1.5 rounded-xl shadow-sm border border-[#C9A865]/30 flex items-center justify-center">
            <img src={logo} alt="UrbanNest Logo" className="h-8 w-auto object-contain" />
          </div>
        </Link>
        {variant === 'temporary' && (
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-[#181B22] dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#181B22] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* User Info */}
      {user && (
        <div className="p-4 border-b border-gray-100 dark:border-[#2E3543] bg-[#F4F5EF] dark:bg-[#181B22]/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#F0F8F3] dark:bg-[#2E7D4F]/30 border border-[#2E7D4F]/40 rounded-full flex items-center justify-center">
              <span className="text-[#2E7D4F] dark:text-[#5CAE78] font-bold">
                {(user.first_name || user.name || 'U').charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-[#181B22] dark:text-white truncate">
                {user.first_name ? `${user.first_name} ${user.last_name || ''}` : (user.name || 'User')}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email || user.phone}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto py-4">
        <div className="px-3 space-y-1.5">
          {filteredNavItems.map((item) => (
            <button
              key={item.path}
              onClick={() => handleNavigation(item.path)}
              className={`
                w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl transition-all
                ${activePath === item.path
                  ? 'bg-[#F4F5EF] dark:bg-[#181B22] text-[#181B22] dark:text-[#C9A865] font-bold border-l-4 border-[#C9A865] shadow-sm'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#181B22]/50 hover:text-[#181B22] dark:hover:text-white'
                }
              `}
            >
              <span className={activePath === item.path ? 'text-[#C9A865]' : 'text-gray-400 dark:text-gray-400'}>
                {item.icon}
              </span>
              <span className="text-sm font-semibold">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Footer Actions */}
      <div className="border-t border-gray-100 dark:border-[#2E3543] p-4 space-y-2">
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors font-medium"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="text-sm font-semibold">Logout</span>
        </button>
      </div>
    </div>
  );

  // Render based on variant
  if (variant === 'permanent') {
    return (
      <aside className="w-64 h-screen sticky top-0 overflow-y-auto border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        {sidebarContent}
      </aside>
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
          />

          {/* Sidebar */}
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="fixed top-0 left-0 h-full w-80 z-50"
          >
            {sidebarContent}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};