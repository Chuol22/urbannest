// client/src/components/admin/AdminLayout.tsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShieldAlert, 
  Users, 
  Building2, 
  CreditCard, 
  FileText, 
  Menu, 
  X, 
  LogOut, 
  UserCheck, 
  Bell, 
  RefreshCw,
  Clock,
  ShieldCheck
} from 'lucide-react';
import { toast } from 'sonner';

export const AdminLayout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sessionTimer, setSessionTimer] = useState<number>(4 * 60 * 60); // 4 hours in seconds
  const [showWarning, setShowWarning] = useState<boolean>(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Load current user from storage
  const userString = localStorage.getItem('user') || sessionStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;

  // Session timer countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setSessionTimer(prev => {
        if (prev <= 300 && prev > 0 && !showWarning) {
          setShowWarning(true);
        }
        if (prev <= 1) {
          clearInterval(interval);
          handleLogout('Session expired. Please log in again.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [showWarning]);

  const extendSession = () => {
    setSessionTimer(4 * 60 * 60);
    setShowWarning(false);
    toast.success('Session extended for 4 hours.');
  };

  const handleLogout = (msg?: string) => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    toast.info(msg || 'Logged out successfully.');
    navigate('/login');
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs > 0 ? `${hrs}h ` : ''}${mins}m ${secs}s`;
  };

  const navItems = [
    { label: 'Dashboard Overview', path: '/admin', icon: LayoutDashboard },
    { label: 'Verify Accounts & Users', path: '/admin/all-users', icon: Users },
    { label: 'Review Property Listings', path: '/admin/listings', icon: Building2 },
    { label: 'Payment Transactions', path: '/admin/payments', icon: CreditCard },
    { label: 'Admin Security & 2FA', path: '/admin/users', icon: ShieldCheck },
    { label: 'Security Audit Logs', path: '/admin/audit-logs', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col md:flex-row font-sans">
      {/* Session Warning Banner */}
      {showWarning && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-600 text-white px-4 py-3 flex items-center justify-between shadow-lg">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 animate-pulse" />
            <span className="font-medium text-sm md:text-base">
              Your admin session expires in {formatTime(sessionTimer)}. Would you like to extend it?
            </span>
          </div>
          <div className="flex space-x-2">
            <button 
              onClick={extendSession}
              className="px-3 py-1 bg-white text-amber-900 rounded font-semibold text-xs md:text-sm hover:bg-amber-100 transition"
            >
              Extend Session
            </button>
            <button 
              onClick={() => handleLogout()}
              className="px-3 py-1 bg-amber-800 text-white rounded font-semibold text-xs md:text-sm hover:bg-amber-900 transition"
            >
              Logout Now
            </button>
          </div>
        </div>
      )}

      {/* Mobile Top Navigation */}
      <div className="md:hidden flex items-center justify-between bg-slate-800 px-4 py-3 border-b border-slate-700">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center font-bold text-slate-950">
            UN
          </div>
          <span className="font-bold text-lg text-white">Super Admin</span>
        </div>
        <button 
          onClick={() => setMobileOpen(!mobileOpen)} 
          className="p-2 text-slate-300 hover:text-white rounded-lg bg-slate-700"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-40 w-64 bg-slate-800 border-r border-slate-700/80 flex flex-col justify-between transform transition-transform duration-200 ease-in-out
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div>
          {/* Header Branding */}
          <div className="hidden md:flex items-center space-x-3 px-6 py-6 border-b border-slate-700/80">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-black text-slate-950 text-xl shadow-lg shadow-emerald-500/20">
              UN
            </div>
            <div>
              <h1 className="font-bold text-white tracking-wide text-lg">UrbanNEST</h1>
              <p className="text-xs text-emerald-400 font-semibold tracking-wider uppercase">Super Admin System</p>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="mt-6 px-3 space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`
                    flex items-center space-x-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-150
                    ${isActive 
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold shadow-inner' 
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-700/50'}
                  `}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer User Info & Logout */}
        <div className="p-4 border-t border-slate-700/80 bg-slate-800/50">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold text-sm">
              {user?.first_name ? user.first_name[0] : 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {user ? `${user.first_name || ''} ${user.last_name || ''}` : 'Admin User'}
              </p>
              <p className="text-xs text-slate-400 truncate">{user?.email || 'admin@urbannest.com'}</p>
            </div>
          </div>

          <button
            onClick={() => handleLogout()}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-xs font-semibold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-900 overflow-y-auto">
        {/* Top Desktop Bar */}
        <header className="hidden md:flex items-center justify-between px-8 py-4 bg-slate-800/40 border-b border-slate-800 backdrop-blur">
          <div className="flex items-center space-x-3 text-slate-400 text-sm">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span>UrbanNEST Administration Portal</span>
          </div>

          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2 text-xs text-slate-400 bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Session: {formatTime(sessionTimer)}</span>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center space-x-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700 transition"
              title="Refresh Page Data"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
              <span>Refresh</span>
            </button>
          </div>
        </header>

        {/* Page Outlet */}
        <div className="p-4 md:p-8 flex-1">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
