// client/src/pages/admin/AdminManagement.tsx
import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/admin.service';
import { AdminUser } from '../../types/admin.types';
import { 
  ShieldCheck, 
  UserPlus, 
  Search, 
  RefreshCw, 
  KeyRound, 
  UserX, 
  UserCheck, 
  QrCode, 
  Lock, 
  Edit3, 
  AlertCircle,
  X,
  CheckCircle2,
  LockKeyhole
} from 'lucide-react';
import { toast } from 'sonner';

export const AdminManagement: React.FC = () => {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<string>('all');

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showPasswordModal, setShowPasswordModal] = useState<boolean>(false);
  const [show2FAEnableModal, setShow2FAEnableModal] = useState<boolean>(false);
  const [show2FADisableModal, setShow2FADisableModal] = useState<boolean>(false);

  const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null);

  // Form states
  const [createForm, setCreateForm] = useState({ email: '', phone: '', password: '', first_name: '', last_name: '' });
  const [editForm, setEditForm] = useState({ email: '', phone: '', first_name: '', last_name: '' });
  const [passwordForm, setPasswordForm] = useState({ newPassword: '', currentPassword: '' });
  const [totpSetupData, setTotpSetupData] = useState<{ secret: string; qrCodeUrl: string } | null>(null);
  const [totpCodeInput, setTotpCodeInput] = useState<string>('');
  const [disable2FAPassword, setDisable2FAPassword] = useState<string>('');

  // Load current admin from storage
  const currentUserString = localStorage.getItem('user') || sessionStorage.getItem('user');
  const currentUser = currentUserString ? JSON.parse(currentUserString) : null;

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const activeParam = activeFilter === 'active' ? true : activeFilter === 'inactive' ? false : undefined;
      const res = await adminService.listAdmins({ search, active: activeParam });
      if (res.success && res.data?.admins) {
        setAdmins(res.data.admins);
      }
    } catch (err) {
      console.error('Failed to fetch admins:', err);
      toast.error('Failed to load admin accounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, [activeFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAdmins();
  };

  // Create Admin
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await adminService.createAdmin(createForm);
      if (res.success) {
        toast.success('Admin user created successfully');
        setShowCreateModal(false);
        setCreateForm({ email: '', phone: '', password: '', first_name: '', last_name: '' });
        fetchAdmins();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create admin');
    }
  };

  // Edit Admin
  const openEdit = (admin: AdminUser) => {
    setSelectedAdmin(admin);
    setEditForm({ email: admin.email, phone: admin.phone, first_name: admin.first_name, last_name: admin.last_name });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdmin) return;
    try {
      const res = await adminService.updateAdmin(selectedAdmin.id, editForm);
      if (res.success) {
        toast.success('Admin profile updated successfully');
        setShowEditModal(false);
        fetchAdmins();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update admin');
    }
  };

  // Password Reset
  const openPasswordModal = (admin: AdminUser) => {
    setSelectedAdmin(admin);
    setPasswordForm({ newPassword: '', currentPassword: '' });
    setShowPasswordModal(true);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdmin) return;
    try {
      const res = await adminService.updateAdminPassword(selectedAdmin.id, passwordForm);
      if (res.success) {
        toast.success('Password updated successfully');
        setShowPasswordModal(false);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update password');
    }
  };

  // Deactivate / Activate
  const toggleStatus = async (admin: AdminUser) => {
    if (admin.id === currentUser?.id) {
      toast.error('Cannot deactivate your own account.');
      return;
    }

    try {
      if (admin.is_active) {
        await adminService.deactivateAdmin(admin.id);
        toast.success(`Deactivated ${admin.first_name}'s account`);
      } else {
        await adminService.activateAdmin(admin.id);
        toast.success(`Activated ${admin.first_name}'s account`);
      }
      fetchAdmins();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  // Enable 2FA Setup
  const openEnable2FA = async (admin: AdminUser) => {
    setSelectedAdmin(admin);
    setTotpCodeInput('');
    try {
      const res = await adminService.enable2FA(admin.id);
      if (res.success && res.data) {
        setTotpSetupData(res.data);
        setShow2FAEnableModal(true);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to initiate 2FA setup');
    }
  };

  const handleVerify2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdmin || !totpSetupData) return;
    try {
      const res = await adminService.verify2FA(selectedAdmin.id, {
        code: totpCodeInput,
        secret: totpSetupData.secret
      });
      if (res.success) {
        toast.success('Two-Factor Authentication enabled successfully!');
        setShow2FAEnableModal(false);
        fetchAdmins();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid 2FA code');
    }
  };

  // Disable 2FA
  const openDisable2FA = (admin: AdminUser) => {
    setSelectedAdmin(admin);
    setDisable2FAPassword('');
    setShow2FADisableModal(true);
  };

  const handleDisable2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdmin) return;
    try {
      const res = await adminService.disable2FA(selectedAdmin.id, disable2FAPassword);
      if (res.success) {
        toast.success('2FA has been disabled');
        setShow2FADisableModal(false);
        fetchAdmins();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to disable 2FA');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center space-x-2">
            <ShieldCheck className="w-7 h-7 text-emerald-400" />
            <span>Admin Lifecycle Management</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Create administrators, manage credentials, toggle 2FA security, and control active status.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold rounded-xl shadow-lg shadow-emerald-500/20 transition"
        >
          <UserPlus className="w-5 h-5" />
          <span>Create New Admin</span>
        </button>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 flex flex-col md:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full md:w-auto relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Search admins by name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-emerald-500"
          />
        </form>

        <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
          {['all', 'active', 'inactive'].map(filter => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition ${
                activeFilter === filter
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-700'
              }`}
            >
              {filter}
            </button>
          ))}
          <button
            onClick={fetchAdmins}
            className="p-2 bg-slate-900 text-slate-400 hover:text-white rounded-xl border border-slate-700"
            title="Refresh List"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Admin Users Table */}
      <div className="bg-slate-800/90 rounded-2xl border border-slate-700/80 overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-12 text-center text-slate-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-2"></div>
            Loading admin accounts...
          </div>
        ) : admins.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            No admin users found matching criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/80 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-700">
                <tr>
                  <th className="px-6 py-4">Admin Name</th>
                  <th className="px-6 py-4">Contact Info</th>
                  <th className="px-6 py-4">Account Status</th>
                  <th className="px-6 py-4">2FA Protection</th>
                  <th className="px-6 py-4">Created Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {admins.map(admin => {
                  const isSelf = admin.id === currentUser?.id;
                  return (
                    <tr key={admin.id} className="hover:bg-slate-700/30 transition">
                      <td className="px-6 py-4 font-semibold text-white">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-bold text-xs">
                            {admin.first_name ? admin.first_name[0] : 'A'}
                          </div>
                          <div>
                            <p>{admin.first_name} {admin.last_name}</p>
                            {isSelf && <span className="text-[10px] text-emerald-400 font-bold">(You)</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs space-y-0.5">
                        <p className="text-slate-200">{admin.email}</p>
                        <p className="text-slate-400 font-mono">{admin.phone}</p>
                      </td>
                      <td className="px-6 py-4">
                        {admin.is_active ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            Active
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                            Deactivated
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {admin.two_factor_enabled ? (
                          <button
                            onClick={() => openDisable2FA(admin)}
                            className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30 hover:bg-blue-500/25 transition flex items-center space-x-1"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>2FA Enabled</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => openEnable2FA(admin)}
                            className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-700 text-slate-400 hover:text-white border border-slate-600 transition flex items-center space-x-1"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                            <span>Enable 2FA</span>
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400">
                        {new Date(admin.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => openEdit(admin)}
                          className="p-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition"
                          title="Edit Profile"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openPasswordModal(admin)}
                          className="p-1.5 bg-slate-700 hover:bg-slate-600 text-amber-400 rounded-lg transition"
                          title="Reset Password"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleStatus(admin)}
                          disabled={isSelf}
                          className={`p-1.5 rounded-lg transition ${
                            isSelf 
                              ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                              : admin.is_active 
                                ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400' 
                                : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400'
                          }`}
                          title={admin.is_active ? 'Deactivate Account' : 'Activate Account'}
                        >
                          {admin.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE ADMIN MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <UserPlus className="w-5 h-5 text-emerald-400" />
                <span>Create New Admin Account</span>
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={createForm.first_name}
                    onChange={e => setCreateForm({ ...createForm, first_name: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={createForm.last_name}
                    onChange={e => setCreateForm({ ...createForm, last_name: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={createForm.email}
                  onChange={e => setCreateForm({ ...createForm, email: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Phone Number (e.g. +251911234567)</label>
                <input
                  type="text"
                  required
                  value={createForm.phone}
                  onChange={e => setCreateForm({ ...createForm, phone: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Password (Min 8 chars, uppercase, lowercase, number, symbol)</label>
                <input
                  type="password"
                  required
                  value={createForm.password}
                  onChange={e => setCreateForm({ ...createForm, password: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-emerald-500"
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-bold transition"
                >
                  Create Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT ADMIN MODAL */}
      {showEditModal && selectedAdmin && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="text-lg font-bold text-white">Update Admin Profile</h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={editForm.first_name}
                    onChange={e => setEditForm({ ...editForm, first_name: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={editForm.last_name}
                    onChange={e => setEditForm({ ...editForm, last_name: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={editForm.email}
                  onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Phone Number</label>
                <input
                  type="text"
                  required
                  value={editForm.phone}
                  onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-emerald-500"
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-bold transition"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {showPasswordModal && selectedAdmin && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <KeyRound className="w-5 h-5 text-amber-400" />
                <span>Reset Password ({selectedAdmin.first_name})</span>
              </h3>
              <button onClick={() => setShowPasswordModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4 text-sm">
              {selectedAdmin.id === currentUser?.id && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Current Password (Required for self-update)</label>
                  <input
                    type="password"
                    required
                    value={passwordForm.currentPassword}
                    onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-amber-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">New Strong Password</label>
                <input
                  type="password"
                  required
                  value={passwordForm.newPassword}
                  onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-amber-500"
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold transition"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ENABLE 2FA MODAL */}
      {show2FAEnableModal && selectedAdmin && totpSetupData && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 text-center">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <QrCode className="w-5 h-5 text-emerald-400" />
                <span>Set Up Two-Factor Authentication</span>
              </h3>
              <button onClick={() => setShow2FAEnableModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Scan this QR code with Google Authenticator or Authy app, then enter the 6-digit code.
            </p>

            <div className="flex justify-center bg-white p-3 rounded-xl max-w-[200px] mx-auto shadow-md">
              <img src={totpSetupData.qrCodeUrl} alt="2FA QR Code" className="w-full h-auto" />
            </div>

            <p className="text-[11px] font-mono text-slate-400 bg-slate-900 p-2 rounded border border-slate-700 select-all">
              Key: {totpSetupData.secret}
            </p>

            <form onSubmit={handleVerify2FASubmit} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Enter 6-Digit Code</label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  placeholder="123456"
                  value={totpCodeInput}
                  onChange={e => setTotpCodeInput(e.target.value)}
                  className="w-full text-center text-lg tracking-widest bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-emerald-400 font-mono focus:border-emerald-500"
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShow2FAEnableModal(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl font-semibold transition text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-bold transition text-sm"
                >
                  Verify & Enable
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DISABLE 2FA MODAL */}
      {show2FADisableModal && selectedAdmin && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <LockKeyhole className="w-5 h-5 text-rose-400" />
                <span>Disable Two-Factor Authentication</span>
              </h3>
              <button onClick={() => setShow2FADisableModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-rose-300 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
              Warning: Disabling 2FA reduces account security. Password confirmation is required.
            </p>

            <form onSubmit={handleDisable2FASubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Confirm Account Password</label>
                <input
                  type="password"
                  required
                  value={disable2FAPassword}
                  onChange={e => setDisable2FAPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-rose-500"
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShow2FADisableModal(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-rose-500 hover:bg-rose-400 text-white rounded-xl font-bold transition"
                >
                  Disable 2FA
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminManagement;
