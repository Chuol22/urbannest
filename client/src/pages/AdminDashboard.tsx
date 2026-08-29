// client/src/pages/AdminDashboard.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { adminService } from '../services/admin.service';
import { 
  Users, 
  CheckCircle, 
  Clock, 
  XCircle, 
  FileText, 
  DollarSign, 
  ShieldAlert, 
  LogOut, 
  Settings, 
  TrendingUp, 
  Menu,
  X
} from 'lucide-react';

import BrokerVerificationTable from '../components/admin/BrokerVerificationTable';
import ListingReviewTable from '../components/admin/ListingReviewTable';
import PaymentsTable from '../components/admin/PaymentsTable';
import PaymentConfig from '../components/admin/PaymentConfig';
import { Alert } from '../components/ui/Alert';

interface Stats {
  pendingBrokers: number;
  approvedBrokers: number;
  rejectedBrokers: number;
  pendingListings: number;
  publishedListings: number;
  totalRevenue: number;
}

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'brokers' | 'listings' | 'payments' | 'users' | 'settings'>('overview');
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Redirect non-admin users
  React.useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/');
    }
  }, [user, navigate]);

  // Load dashboard stats
  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true);
        const res = await adminService.getDashboardStats();
        if (res.success && res.data) {
          setStats(res.data.stats || res.data);
        } else {
          setStats(res.stats || res);
        }
      } catch (err: any) {
        console.error("Error fetching admin stats:", err);
        setError('Failed to fetch dashboard summary metrics.');
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading Super Admin Control Panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row font-sans">
      {/* Mobile Navbar Header */}
      <header className="md:hidden bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between z-20">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 bg-emerald-500 rounded-lg flex items-center justify-center font-bold text-white shadow-md">
            A
          </div>
          <span className="font-extrabold text-lg tracking-wider text-white">Super Admin</span>
        </div>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-slate-300 focus:outline-none">
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Sidebar Navigation Panel */}
      <aside className={`w-full md:w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between p-6 fixed inset-y-0 left-0 transform md:transform-none md:translate-x-0 transition-transform duration-300 ease-in-out z-30 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } md:sticky md:h-screen`}>
        <div>
          {/* Logo Brand Header */}
          <div className="hidden md:flex items-center space-x-3 mb-8">
            <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center font-bold text-xl text-white shadow-md">
              A
            </div>
            <span className="font-extrabold text-xl tracking-wider text-white">Super Admin</span>
          </div>

          {/* Quick Profile Details */}
          <div className="mb-6 p-4 bg-slate-800/60 rounded-xl border border-slate-750">
            <p className="text-xs text-gray-400 font-medium">Logged in as</p>
            <p className="font-bold text-sm truncate text-white mt-0.5">{user?.first_name} {user?.last_name}</p>
            <span className="inline-block mt-2 text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 bg-emerald-950 text-emerald-400 rounded-md">System Root</span>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <button
              onClick={() => { setActiveTab('overview'); setSidebarOpen(false); }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-semibold transition ${
                activeTab === 'overview' 
                  ? 'bg-emerald-600 text-white shadow-lg' 
                  : 'text-gray-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <TrendingUp size={18} />
              <span>Metrics Overview</span>
            </button>

            <button
              onClick={() => { setActiveTab('brokers'); setSidebarOpen(false); }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-semibold transition ${
                activeTab === 'brokers' 
                  ? 'bg-emerald-600 text-white shadow-lg' 
                  : 'text-gray-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Users size={18} />
              <span>Broker Verification</span>
            </button>

            <button
              onClick={() => { setActiveTab('listings'); setSidebarOpen(false); }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-semibold transition ${
                activeTab === 'listings' 
                  ? 'bg-emerald-600 text-white shadow-lg' 
                  : 'text-gray-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <FileText size={18} />
              <span>Listing Reviews</span>
            </button>

            <button
              onClick={() => { setActiveTab('payments'); setSidebarOpen(false); }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-semibold transition ${
                activeTab === 'payments' 
                  ? 'bg-emerald-600 text-white shadow-lg' 
                  : 'text-gray-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <DollarSign size={18} />
              <span>Payment Operations</span>
            </button>

            <button
              onClick={() => { setActiveTab('settings'); setSidebarOpen(false); }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-semibold transition ${
                activeTab === 'settings' 
                  ? 'bg-emerald-600 text-white shadow-lg' 
                  : 'text-gray-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Settings size={18} />
              <span>Listing Fees Settings</span>
            </button>
          </nav>
        </div>

        {/* Logout Link */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-semibold text-rose-400 hover:bg-rose-950/20 hover:text-rose-300 transition mt-6"
        >
          <LogOut size={18} />
          <span>Exit Panel</span>
        </button>
      </aside>

      {/* Main View Area */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        {error && <Alert type="error" message={error} onClose={() => setError('')} />}

        {/* TABS VIEW SWITCH */}

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-fadeIn">
            <div>
              <h1 className="text-3xl font-extrabold text-white">Operational Dashboard</h1>
              <p className="text-sm text-slate-400 mt-1">Summary metrics of property creation flow and verifications.</p>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">Pending Brokers</p>
                  <h3 className="text-3xl font-extrabold text-amber-500 mt-2">{stats?.pendingBrokers || 0}</h3>
                </div>
                <div className="w-12 h-12 bg-amber-950/30 rounded-xl flex items-center justify-center text-amber-400 border border-amber-900/30">
                  <Clock size={22} />
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">Pending Review Listings</p>
                  <h3 className="text-3xl font-extrabold text-blue-500 mt-2">{stats?.pendingListings || 0}</h3>
                </div>
                <div className="w-12 h-12 bg-blue-950/30 rounded-xl flex items-center justify-center text-blue-400 border border-blue-900/30">
                  <FileText size={22} />
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">Total Approved Listings</p>
                  <h3 className="text-3xl font-extrabold text-emerald-500 mt-2">{stats?.publishedListings || 0}</h3>
                </div>
                <div className="w-12 h-12 bg-emerald-950/30 rounded-xl flex items-center justify-center text-emerald-400 border border-emerald-900/30">
                  <CheckCircle size={22} />
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">Cumulative Listing Fees</p>
                  <h3 className="text-3xl font-extrabold text-white mt-2">ETB {(stats?.totalRevenue || 0).toLocaleString()}</h3>
                </div>
                <div className="w-12 h-12 bg-slate-950 rounded-xl flex items-center justify-center text-emerald-500 border border-slate-850">
                  <DollarSign size={22} />
                </div>
              </div>
            </div>

            {/* Quick action info banner explaining the user registration and listing review flow */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center">
                <ShieldAlert className="text-emerald-500 mr-2" size={20} />
                Administrator Flow Guidelines
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-slate-300">
                <div className="space-y-2 border-l-2 border-emerald-500 pl-4">
                  <h4 className="font-bold text-white">Broker Identity Verification</h4>
                  <p className="text-xs">Verify corporate licenses and ID certificates. Only approved brokers and landlords can submit property ads. Make sure their files are readable before click approving.</p>
                </div>
                <div className="space-y-2 border-l-2 border-blue-500 pl-4">
                  <h4 className="font-bold text-white">Ad Listing Review and Fees</h4>
                  <p className="text-xs">Approved brokers generate draft listings. Once listing fee payment is cleared, the status moves to pending review. Verify description, map accuracy, and price before publication.</p>
                </div>
              </div>
            </div>

            {/* Recent Pending Table Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-white mb-4">Brokers Awaiting Verification</h3>
                <BrokerVerificationTable />
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-white mb-4">Properties Awaiting Review</h3>
                <ListingReviewTable />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: BROKER VERIFICATION */}
        {activeTab === 'brokers' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h1 className="text-2xl font-extrabold text-white">Broker Verification Management</h1>
              <p className="text-xs text-slate-400">Review pending identity validations to verify brokers and property owners.</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <BrokerVerificationTable />
            </div>
          </div>
        )}

        {/* TAB 3: LISTING REVIEWS */}
        {activeTab === 'listings' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h1 className="text-2xl font-extrabold text-white">Listing Review Management</h1>
              <p className="text-xs text-slate-400">Publish properties to the home feed or reject listings with notes.</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <ListingReviewTable />
            </div>
          </div>
        )}

        {/* TAB 4: PAYMENTS OPERATIONS */}
        {activeTab === 'payments' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h1 className="text-2xl font-extrabold text-white">Transaction Logs</h1>
              <p className="text-xs text-slate-400">Auditing list of incoming listing fee payment operations.</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <PaymentsTable />
            </div>
          </div>
        )}

        {/* TAB 5: LISTING FEE SETTINGS */}
        {activeTab === 'settings' && (
          <div className="space-y-6 animate-fadeIn max-w-3xl">
            <div>
              <h1 className="text-2xl font-extrabold text-white">Listing Fees Configuration</h1>
              <p className="text-xs text-slate-400">Adjust the fee amounts charged to brokers for selling or renting properties.</p>
            </div>
            <PaymentConfig />
          </div>
        )}
      </main>
    </div>
  );
}
