// client/src/pages/admin/UserManagement.tsx
import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/admin.service';
import { PlatformUser } from '../../types/admin.types';
import { 
  Users, 
  Search, 
  Download, 
  CheckCircle2, 
  XCircle, 
  UserCheck, 
  UserX, 
  ChevronLeft, 
  ChevronRight, 
  X,
  FileCheck,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(20);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);

  // Selection state for bulk actions
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // Filters
  const [role, setRole] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [verificationStatus, setVerificationStatus] = useState<string>('');
  const [search, setSearch] = useState<string>('');

  // Modals
  const [showVerifyModal, setShowVerifyModal] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<PlatformUser | null>(null);
  const [verifyDecision, setVerifyDecision] = useState<'approved' | 'rejected'>('approved');
  const [rejectionReason, setRejectionReason] = useState<string>('');

  // Bulk action confirmation modal
  const [showBulkModal, setShowBulkModal] = useState<boolean>(false);
  const [pendingBulkAction, setPendingBulkAction] = useState<'approve' | 'reject' | 'activate' | 'deactivate' | null>(null);
  const [bulkReason, setBulkReason] = useState<string>('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await adminService.getAllUsers({
        page,
        limit,
        role: role || undefined,
        status: status || undefined,
        verification_status: verificationStatus || undefined,
        search: search || undefined
      });

      if (res.success && res.data?.users) {
        setUsers(res.data.users);
        setTotal(res.data.total || 0);
        setTotalPages(res.data.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to fetch platform users:', err);
      toast.error('Failed to load user records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, limit, role, status, verificationStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  // Select all checkboxes
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedUserIds(users.map(u => u.id));
    } else {
      setSelectedUserIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedUserIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Open Verify Modal
  const openVerify = (user: PlatformUser) => {
    setSelectedUser(user);
    setVerifyDecision('approved');
    setRejectionReason('');
    setShowVerifyModal(true);
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    if (verifyDecision === 'rejected' && (!rejectionReason || rejectionReason.trim().length < 10)) {
      toast.error('Rejection reason must be at least 10 characters.');
      return;
    }

    try {
      const res = await adminService.verifyUser(selectedUser.id, {
        verification_status: verifyDecision,
        rejection_reason: verifyDecision === 'rejected' ? rejectionReason : undefined
      });
      if (res.success) {
        toast.success(`User verification updated to ${verifyDecision}`);
        setShowVerifyModal(false);
        fetchUsers();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Verification update failed');
    }
  };

  // Single Activate / Deactivate
  const toggleUserStatus = async (user: PlatformUser) => {
    try {
      if (user.is_active) {
        await adminService.deactivateUser(user.id, 'Deactivated by admin');
        toast.success(`Deactivated ${user.first_name}'s account`);
      } else {
        await adminService.activateUser(user.id);
        toast.success(`Activated ${user.first_name}'s account`);
      }
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  // Bulk Actions
  const openBulkAction = (action: 'approve' | 'reject' | 'activate' | 'deactivate') => {
    if (selectedUserIds.length === 0) return;
    setPendingBulkAction(action);
    setBulkReason('');
    setShowBulkModal(true);
  };

  const executeBulkAction = async () => {
    if (!pendingBulkAction) return;

    if (pendingBulkAction === 'reject' && (!bulkReason || bulkReason.trim().length < 10)) {
      toast.error('Bulk rejection reason must be at least 10 characters.');
      return;
    }

    try {
      const res = await adminService.bulkUserAction({
        action: pendingBulkAction,
        user_ids: selectedUserIds,
        reason: bulkReason
      });

      if (res.success) {
        toast.success(res.message);
        setShowBulkModal(false);
        setSelectedUserIds([]);
        fetchUsers();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Bulk operation failed');
    }
  };

  const handleExportCSV = () => {
    const exportUrl = adminService.exportUsersUrl({
      role: role || undefined,
      status: status || undefined,
      verification_status: verificationStatus || undefined
    });
    window.open(exportUrl, '_blank');
    toast.success('User records CSV export started');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center space-x-2">
            <Users className="w-7 h-7 text-emerald-400" />
            <span>Platform User Moderation</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage seekers, property owners, and brokers. Moderate identity verification and manage account access.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 font-semibold rounded-xl transition text-sm shadow-md"
        >
          <Download className="w-4 h-4" />
          <span>Export Users CSV</span>
        </button>
      </div>

      {/* Bulk Action Toolbar Bar (Shows when checkboxes selected) */}
      {selectedUserIds.length > 0 && (
        <div className="bg-emerald-500/15 border border-emerald-500/40 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center space-x-2 text-sm font-bold text-emerald-300">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>{selectedUserIds.length} user(s) selected for bulk operation</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => openBulkAction('approve')}
              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs transition"
            >
              Bulk Approve Verification
            </button>
            <button
              onClick={() => openBulkAction('reject')}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition"
            >
              Bulk Reject
            </button>
            <button
              onClick={() => openBulkAction('activate')}
              className="px-3 py-1.5 bg-blue-500 hover:bg-blue-400 text-white font-bold rounded-lg text-xs transition"
            >
              Bulk Activate
            </button>
            <button
              onClick={() => openBulkAction('deactivate')}
              className="px-3 py-1.5 bg-rose-500 hover:bg-rose-400 text-white font-bold rounded-lg text-xs transition"
            >
              Bulk Deactivate
            </button>
          </div>
        </div>
      )}

      {/* Filters Toolbar */}
      <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <form onSubmit={handleSearchSubmit} className="relative">
          <label className="block text-xs font-semibold text-slate-400 mb-1">Search Users</label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Name, email, phone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:border-emerald-500"
            />
          </div>
        </form>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Filter Role</label>
          <select
            value={role}
            onChange={e => { setRole(e.target.value); setPage(1); }}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:border-emerald-500"
          >
            <option value="">All Roles</option>
            <option value="owner">Owner / Landlord</option>
            <option value="agent">Broker / Agent</option>
            <option value="seeker">Seeker</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Verification Status</label>
          <select
            value={verificationStatus}
            onChange={e => { setVerificationStatus(e.target.value); setPage(1); }}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:border-emerald-500"
          >
            <option value="">All Verification States</option>
            <option value="pending_review">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="unverified">Unverified</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Account Active Status</label>
          <select
            value={status}
            onChange={e => { setStatus(e.target.value); setPage(1); }}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:border-emerald-500"
          >
            <option value="">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Deactivated Only</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-800/90 rounded-2xl border border-slate-700/80 overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-12 text-center text-slate-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-2"></div>
            Loading platform users...
          </div>
        ) : users.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            No platform users found matching current filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/80 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-700">
                <tr>
                  <th className="px-4 py-4 w-10 text-center">
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={users.length > 0 && selectedUserIds.length === users.length}
                      className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-0"
                    />
                  </th>
                  <th className="px-6 py-4">User Details</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Verification</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Activity</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {users.map(user => {
                  const isChecked = selectedUserIds.includes(user.id);
                  return (
                    <tr key={user.id} className={`hover:bg-slate-700/30 transition ${isChecked ? 'bg-emerald-500/5' : ''}`}>
                      <td className="px-4 py-4 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleSelectOne(user.id)}
                          className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-0"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-white">{user.first_name} {user.last_name}</p>
                        <p className="text-xs text-slate-400">{user.email}</p>
                        <p className="text-[11px] font-mono text-slate-500">{user.phone}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold capitalize bg-slate-900 text-slate-300 border border-slate-700">
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1.5">
                          <div>
                            {user.verification_status === 'approved' ? (
                              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 inline-block">
                                Approved
                              </span>
                            ) : user.verification_status === 'pending_review' ? (
                              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 inline-block">
                                Pending Review
                              </span>
                            ) : user.verification_status === 'rejected' ? (
                              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 inline-block">
                                Rejected
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-700 text-slate-400 inline-block">
                                Unverified
                              </span>
                            )}
                          </div>
                          {user.verification_document_url && (
                            <div>
                              <a
                                href={user.verification_document_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 hover:underline"
                                title="Open submitted license or ID document"
                              >
                                <FileCheck className="w-3 h-3 mr-1 shrink-0" />
                                <span>View Document</span>
                                <ExternalLink className="w-2.5 h-2.5 ml-1 shrink-0" />
                              </a>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {user.is_active ? (
                          <span className="text-xs font-semibold text-emerald-400">Active</span>
                        ) : (
                          <span className="text-xs font-semibold text-rose-400">Deactivated</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400">
                        <p>Props: {user._count?.properties || 0}</p>
                        <p>Bookings: {user._count?.bookings || 0}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {user.verification_status !== 'approved' && (
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setVerifyDecision('approved');
                                setRejectionReason('');
                                setShowVerifyModal(true);
                              }}
                              className="px-2.5 py-1.5 bg-emerald-500/15 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 border border-emerald-500/30 rounded-lg text-xs font-bold transition flex items-center space-x-1"
                              title="Approve Account"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                          )}

                          {user.verification_status !== 'rejected' && user.role !== 'admin' && (
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setVerifyDecision('rejected');
                                setRejectionReason('');
                                setShowVerifyModal(true);
                              }}
                              className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-lg text-xs font-semibold transition flex items-center space-x-1"
                              title="Reject Account"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          )}

                          <button
                            onClick={() => toggleUserStatus(user)}
                            className={`p-1.5 rounded-lg border transition ${
                              user.is_active
                                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                                : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            }`}
                            title={user.is_active ? 'Deactivate Account' : 'Activate Account'}
                          >
                            {user.is_active ? <UserX className="w-4 h-4 text-slate-400" /> : <UserCheck className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="bg-slate-900/80 px-6 py-4 border-t border-slate-700/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div>
            Showing <span className="font-bold text-white">{users.length > 0 ? (page - 1) * limit + 1 : 0}</span> to{' '}
            <span className="font-bold text-white">{Math.min(page * limit, total)}</span> of{' '}
            <span className="font-bold text-white">{total}</span> platform users
          </div>

          <div className="flex items-center space-x-3">
            <select
              value={limit}
              onChange={e => { setLimit(Number(e.target.value)); setPage(1); }}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-slate-300"
            >
              <option value={20}>20 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </select>

            <div className="flex items-center space-x-1">
              <button
                onClick={() => setPage(p => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="p-1.5 bg-slate-800 rounded-lg border border-slate-700 disabled:opacity-40 hover:text-white"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 font-semibold text-slate-200">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
                className="p-1.5 bg-slate-800 rounded-lg border border-slate-700 disabled:opacity-40 hover:text-white"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* VERIFY USER MODAL */}
      {showVerifyModal && selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <FileCheck className="w-5 h-5 text-emerald-400" />
                <span>Verify User ({selectedUser.first_name})</span>
              </h3>
              <button onClick={() => setShowVerifyModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {selectedUser.verification_document_url && (
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-700 text-xs">
                <p className="font-semibold text-slate-300 mb-1">Uploaded Verification Document:</p>
                <a
                  href={selectedUser.verification_document_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-400 hover:underline flex items-center space-x-1 font-mono"
                >
                  <span>View Document</span>
                </a>
              </div>
            )}

            <form onSubmit={handleVerifySubmit} className="space-y-4 text-sm">
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-400">Decision</label>
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="decision"
                      value="approved"
                      checked={verifyDecision === 'approved'}
                      onChange={() => setVerifyDecision('approved')}
                      className="text-emerald-500 focus:ring-0"
                    />
                    <span className="text-emerald-400 font-bold">Approve Verification</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="decision"
                      value="rejected"
                      checked={verifyDecision === 'rejected'}
                      onChange={() => setVerifyDecision('rejected')}
                      className="text-rose-500 focus:ring-0"
                    />
                    <span className="text-rose-400 font-bold">Reject Verification</span>
                  </label>
                </div>
              </div>

              {verifyDecision === 'rejected' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Rejection Reason (Min 10 chars)</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="State clear reasons why verification document was rejected..."
                    value={rejectionReason}
                    onChange={e => setRejectionReason(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-rose-500 text-xs"
                  />
                </div>
              )}

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowVerifyModal(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl font-semibold transition text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`flex-1 px-4 py-2.5 rounded-xl font-bold transition text-xs ${
                    verifyDecision === 'approved' 
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950' 
                      : 'bg-rose-500 hover:bg-rose-400 text-white'
                  }`}
                >
                  Submit Decision
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BULK ACTION CONFIRMATION MODAL */}
      {showBulkModal && pendingBulkAction && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <span>Confirm Bulk Operation</span>
              </h3>
              <button onClick={() => setShowBulkModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Are you sure you want to perform <strong className="uppercase text-amber-400">{pendingBulkAction}</strong> on{' '}
              <strong className="text-white">{selectedUserIds.length}</strong> selected user(s)?
            </p>

            {pendingBulkAction === 'reject' && (
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Bulk Rejection Reason (Min 10 chars)</label>
                <textarea
                  required
                  rows={3}
                  value={bulkReason}
                  onChange={e => setBulkReason(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-amber-500 text-xs"
                />
              </div>
            )}

            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl font-semibold transition text-xs"
              >
                Cancel
              </button>
              <button
                onClick={executeBulkAction}
                className="flex-1 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold transition text-xs"
              >
                Confirm Bulk Action
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
