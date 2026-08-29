// client/src/pages/admin/AdminDashboard.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/admin.service';
import { DashboardMetrics, AuditLog, PlatformUser } from '../../types/admin.types';
import { 
  Users, 
  Building2, 
  CreditCard, 
  ShieldCheck, 
  Clock, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronRight,
  Zap,
  Activity,
  UserCheck,
  UserX,
  FileCheck,
  ExternalLink,
  X
} from 'lucide-react';
import { toast } from 'sonner';

export const AdminDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentLogs, setRecentLogs] = useState<AuditLog[]>([]);
  const [pendingUsers, setPendingUsers] = useState<PlatformUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [isStale, setIsStale] = useState<boolean>(false);

  // Reject modal state
  const [rejectingUser, setRejectingUser] = useState<PlatformUser | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const fetchDashboardData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      // 1. Fetch main stats
      const res = await adminService.getDashboardStats();
      if (res.success && res.data) {
        setMetrics(res.data.stats || res.data);
      }

      // 2. Fetch recent audit logs
      const logsRes = await adminService.getAuditLogs({ page: 1, limit: 6 });
      if (logsRes.success && logsRes.data?.logs) {
        setRecentLogs(logsRes.data.logs);
      }

      // 3. Fetch pending verification users (brokers and landlords)
      const usersRes = await adminService.getAllUsers({ 
        verification_status: 'pending_review', 
        limit: 10 
      });
      if (usersRes.success && usersRes.data?.users) {
        setPendingUsers(usersRes.data.users);
      } else {
        // Fallback check for unverified brokers
        const brokersRes = await adminService.getPendingBrokers();
        if (brokersRes.success && Array.isArray(brokersRes.data)) {
          setPendingUsers(brokersRes.data);
        }
      }

      setLastRefreshed(new Date());
      setIsStale(false);
      if (isManual) toast.success('Dashboard metrics updated');
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setIsStale(true);
      if (isManual) toast.error('Failed to refresh data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Direct quick approve account
  const handleQuickApprove = async (user: PlatformUser) => {
    try {
      setIsProcessing(true);
      const res = await adminService.verifyUser(user.id, {
        verification_status: 'approved'
      });
      if (res.success) {
        toast.success(`Account for ${user.first_name} ${user.last_name} (${user.role}) has been Approved!`);
        fetchDashboardData();
      } else {
        toast.error(res.message || 'Failed to approve account');
      }
    } catch (err: any) {
      console.error('Approve account error:', err);
      toast.error(err.response?.data?.message || 'Error approving account');
    } finally {
      setIsProcessing(false);
    }
  };

  // Direct quick reject account submit
  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingUser) return;
    if (!rejectionReason || rejectionReason.trim().length < 5) {
      toast.error('Please provide a reason of at least 5 characters');
      return;
    }

    try {
      setIsProcessing(true);
      const res = await adminService.verifyUser(rejectingUser.id, {
        verification_status: 'rejected',
        rejection_reason: rejectionReason.trim()
      });
      if (res.success) {
        toast.success(`Account for ${rejectingUser.first_name} ${rejectingUser.last_name} has been Rejected`);
        setRejectingUser(null);
        setRejectionReason('');
        fetchDashboardData();
      } else {
        toast.error(res.message || 'Failed to reject account');
      }
    } catch (err: any) {
      console.error('Reject account error:', err);
      toast.error(err.response?.data?.message || 'Error rejecting account');
    } finally {
      setIsProcessing(false);
    }
  };

  // Real-time polling every 30 seconds
  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mb-4"></div>
        <p className="text-slate-400 text-sm">Loading System Metrics & Activity...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-800 to-slate-800/80 p-6 rounded-2xl border border-slate-700/60 shadow-xl">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Superadmin Dashboard</h1>
            {isStale && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center space-x-1">
                <AlertTriangle className="w-3 h-3" />
                <span>Cached Data</span>
              </span>
            )}
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Review and approve broker/landlord accounts, moderate property listings, and audit revenue.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs text-slate-400">Last updated</p>
            <p className="text-xs font-semibold text-slate-300">{lastRefreshed.toLocaleTimeString()}</p>
          </div>
          <button
            onClick={() => fetchDashboardData(true)}
            disabled={refreshing}
            className="flex items-center space-x-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-sm font-semibold transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh Now'}</span>
          </button>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Users */}
        <div className="bg-slate-800/90 border border-slate-700/80 p-5 rounded-2xl shadow-lg relative overflow-hidden group hover:border-emerald-500/50 transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Registered Users</p>
              <h2 className="text-3xl font-extrabold text-white mt-1">
                {metrics?.totalUsers ?? 0}
              </h2>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-700/50 flex items-center justify-between text-xs text-slate-400">
            <span>Landlords: {metrics?.usersByRole?.owner || 0}</span>
            <span>Brokers: {metrics?.usersByRole?.agent || 0}</span>
            <span>Seekers: {metrics?.usersByRole?.seeker || 0}</span>
          </div>
        </div>

        {/* Pending Verifications */}
        <div className="bg-slate-800/90 border border-slate-700/80 p-5 rounded-2xl shadow-lg relative overflow-hidden group hover:border-amber-500/50 transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Accounts Awaiting Approval</p>
              <h2 className="text-3xl font-extrabold text-amber-400 mt-1">
                {pendingUsers.length || ((metrics?.pendingVerifications?.owner || 0) + (metrics?.pendingVerifications?.agent || 0))}
              </h2>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-700/50 flex items-center justify-between text-xs text-slate-400">
            <Link to="/admin/all-users" className="text-amber-400 hover:underline flex items-center font-medium">
              <span>View All User Accounts</span>
              <ChevronRight className="w-3 h-3 ml-1" />
            </Link>
          </div>
        </div>

        {/* Listings Queue */}
        <div className="bg-slate-800/90 border border-slate-700/80 p-5 rounded-2xl shadow-lg relative overflow-hidden group hover:border-teal-500/50 transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Published Properties</p>
              <h2 className="text-3xl font-extrabold text-white mt-1">
                {metrics?.propertiesByStatus?.available ?? 0}
              </h2>
            </div>
            <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center">
              <Building2 className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-700/50 flex items-center justify-between text-xs text-slate-400">
            <span className="text-amber-400">Pending Review: {metrics?.propertiesByStatus?.pending || 0}</span>
            <Link to="/admin/listings" className="text-teal-400 hover:underline flex items-center font-medium">
              <span>Review Ads</span>
              <ChevronRight className="w-3 h-3 ml-1" />
            </Link>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-slate-800/90 border border-slate-700/80 p-5 rounded-2xl shadow-lg relative overflow-hidden group hover:border-emerald-500/50 transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Listing Fees Collected</p>
              <h2 className="text-3xl font-extrabold text-emerald-400 mt-1">
                ETB {(metrics?.totalRevenue ?? 0).toLocaleString()}
              </h2>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <CreditCard className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-700/50 flex items-center justify-between text-xs text-slate-400">
            <span>Completed Payments</span>
            <Link to="/admin/payments" className="text-emerald-400 hover:underline flex items-center font-medium">
              <span>Audit Receipts</span>
              <ChevronRight className="w-3 h-3 ml-1" />
            </Link>
          </div>
        </div>
      </div>

      {/* ACTION CARD SECTION: ACCOUNTS AWAITING APPROVAL */}
      <div className="bg-slate-800/90 rounded-2xl border border-slate-700/80 p-6 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700/80 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Broker & Landlord Accounts Awaiting Approval</h3>
              <p className="text-xs text-slate-400">Newly registered brokers or landlords who need admin verification to publish listings.</p>
            </div>
          </div>
          <Link
            to="/admin/all-users"
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center space-x-1"
          >
            <span>Open Full User Management</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {pendingUsers.length === 0 ? (
          <div className="py-10 text-center space-y-2 bg-slate-900/40 rounded-xl border border-slate-700/40">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <p className="text-sm font-semibold text-white">All Accounts Are Verified & Up to Date</p>
            <p className="text-xs text-slate-400">No broker or landlord registration is currently pending your approval.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingUsers.map(u => (
              <div 
                key={u.id}
                className="bg-slate-900 border border-slate-700/70 hover:border-slate-600 rounded-xl p-4 flex flex-col justify-between space-y-4 shadow-md transition"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-white text-base">
                        {u.first_name} {u.last_name}
                      </h4>
                      <p className="text-xs text-slate-400">{u.email || u.phone}</p>
                      {u.email && u.phone && (
                        <p className="text-xs text-slate-400">{u.phone}</p>
                      )}
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-extrabold uppercase border ${
                      u.role === 'agent' 
                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' 
                        : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                    }`}>
                      {u.role === 'agent' ? '🏢 Broker' : '🏠 Landlord'}
                    </span>
                  </div>

                  {u.verification_document_url ? (
                    <a
                      href={u.verification_document_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-xs text-emerald-400 hover:underline pt-1"
                    >
                      <FileCheck className="w-3.5 h-3.5 mr-1" />
                      <span>View Uploaded License / ID</span>
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic">No document file attached</p>
                  )}
                </div>

                {/* Direct Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => handleQuickApprove(u)}
                    disabled={isProcessing}
                    className="flex items-center justify-center space-x-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition shadow disabled:opacity-50"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Approve Account</span>
                  </button>
                  <button
                    onClick={() => {
                      setRejectingUser(u);
                      setRejectionReason('');
                    }}
                    disabled={isProcessing}
                    className="flex items-center justify-center space-x-1 py-2 px-3 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-600/40 font-bold text-xs rounded-lg transition disabled:opacity-50"
                  >
                    <UserX className="w-3.5 h-3.5" />
                    <span>Reject Account</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="bg-slate-800/60 p-5 rounded-2xl border border-slate-700/60">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center space-x-2">
          <Zap className="w-4 h-4 text-emerald-400" />
          <span>Quick Administrative Actions</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Link
            to="/admin/all-users"
            className="flex items-center space-x-3 p-3.5 bg-slate-800 hover:bg-slate-700/80 rounded-xl border border-slate-700 transition text-sm font-semibold text-slate-200"
          >
            <UserCheck className="w-5 h-5 text-emerald-400" />
            <span>Verify User Accounts</span>
          </Link>
          <Link
            to="/admin/listings"
            className="flex items-center space-x-3 p-3.5 bg-slate-800 hover:bg-slate-700/80 rounded-xl border border-slate-700 transition text-sm font-semibold text-slate-200"
          >
            <Building2 className="w-5 h-5 text-teal-400" />
            <span>Review Listings</span>
          </Link>
          <Link
            to="/admin/payments"
            className="flex items-center space-x-3 p-3.5 bg-slate-800 hover:bg-slate-700/80 rounded-xl border border-slate-700 transition text-sm font-semibold text-slate-200"
          >
            <CreditCard className="w-5 h-5 text-blue-400" />
            <span>Audit Transactions</span>
          </Link>
          <Link
            to="/admin/users"
            className="flex items-center space-x-3 p-3.5 bg-slate-800 hover:bg-slate-700/80 rounded-xl border border-slate-700 transition text-sm font-semibold text-slate-200"
          >
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <span>Admin Security & 2FA</span>
          </Link>
        </div>
      </div>

      {/* Recent Activity Timeline Stream */}
      <div className="bg-slate-800/90 rounded-2xl border border-slate-700/80 p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-700/80 pb-4">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-bold text-white">Recent Administrative & Security Events</h3>
          </div>
          <Link to="/admin/audit-logs" className="text-xs font-semibold text-emerald-400 hover:underline flex items-center">
            <span>View All Activity Logs</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {recentLogs.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-sm">
            No recent administrative activity logged yet.
          </div>
        ) : (
          <div className="space-y-3">
            {recentLogs.map(log => (
              <div key={log.id} className="flex items-start justify-between p-3.5 bg-slate-900/60 rounded-xl border border-slate-700/40 text-sm">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-white">{log.admin_name || 'Admin'}</span>
                      <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase rounded bg-slate-800 text-emerald-400 border border-slate-700">
                        {log.action_type}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Resource: <span className="text-slate-300 font-mono">{log.target_resource}</span> {log.target_id ? `(${log.target_id})` : ''}
                    </p>
                  </div>
                </div>
                <div className="text-right text-xs text-slate-500 shrink-0">
                  <p>{new Date(log.created_at).toLocaleTimeString()}</p>
                  <p className="text-[10px] text-slate-600">{new Date(log.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reject Reason Modal */}
      {rejectingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <UserX className="w-5 h-5 text-rose-400" />
                <span>Reject Account Verification</span>
              </h3>
              <button
                onClick={() => setRejectingUser(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-slate-300">
              Please enter the reason for rejecting <strong className="text-white">{rejectingUser.first_name} {rejectingUser.last_name}</strong> ({rejectingUser.role}). This reason will be stored on their profile.
            </p>

            <form onSubmit={handleConfirmReject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Rejection Reason *
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  required
                  rows={3}
                  placeholder="e.g. Uploaded business license is expired or illegible. Please re-upload a clear copy."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:ring-2 focus:ring-rose-500 outline-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectingUser(null)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-sm font-bold transition disabled:opacity-50 shadow"
                >
                  {isProcessing ? 'Processing...' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
