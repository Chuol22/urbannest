// client/src/pages/admin/AuditLogs.tsx
import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/admin.service';
import { AuditLog, AuditLogFilters } from '../../types/admin.types';
import { 
  FileText, 
  Search, 
  Download, 
  Filter, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  ShieldAlert, 
  Code,
  RefreshCw,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(50);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters state
  const [actionType, setActionType] = useState<string>('');
  const [resource, setResource] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');

  // Selected Log for metadata viewer
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // Debounce search input (300ms - Requirement 15.3)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);

    return () => clearTimeout(handler);
  }, [search]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const filters: AuditLogFilters = {
        page,
        limit,
        action_type: actionType || undefined,
        resource: resource || undefined,
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
        search: debouncedSearch || undefined
      };

      const res = await adminService.getAuditLogs(filters);
      if (res.success && res.data) {
        setLogs(res.data.logs || []);
        setTotal(res.data.total || 0);
        setTotalPages(res.data.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
      toast.error('Failed to load audit log entries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, limit, actionType, resource, fromDate, toDate, debouncedSearch]);

  const clearAllFilters = () => {
    setActionType('');
    setResource('');
    setFromDate('');
    setToDate('');
    setSearch('');
    setDebouncedSearch('');
    setPage(1);
  };

  const handleExportCSV = () => {
    if (total > 10000) {
      toast.warning('Export limited to first 10,000 records. Please refine filters if needed.');
    }
    const exportUrl = adminService.exportAuditLogsUrl({
      action_type: actionType || undefined,
      resource: resource || undefined,
      from_date: fromDate || undefined,
      to_date: toDate || undefined,
      search: debouncedSearch || undefined
    });

    window.open(exportUrl, '_blank');
    toast.success('Audit log CSV download initiated');
  };

  const hasActiveFilters = Boolean(actionType || resource || fromDate || toDate || search);

  // Search term highlight helper (Requirement 15.4)
  const highlightText = (text: string | null | undefined, query: string) => {
    if (!text) return '-';
    if (!query.trim()) return text;

    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className="bg-amber-400/30 text-amber-200 px-0.5 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center space-x-2">
            <FileText className="w-7 h-7 text-emerald-400" />
            <span>Activity Audit Trail</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Immutable log of all administrative actions, data changes, and security operations.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 font-semibold rounded-xl transition text-sm shadow-md"
        >
          <Download className="w-4 h-4" />
          <span>Export to CSV</span>
        </button>
      </div>

      {/* Filter Panel */}
      <div className="bg-slate-800/90 p-5 rounded-2xl border border-slate-700/80 space-y-4 shadow-xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* Search Box */}
          <div className="relative">
            <label className="block text-xs font-semibold text-slate-400 mb-1">Search ID/Details</label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Target ID or query..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Action Type Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Action Type</label>
            <select
              value={actionType}
              onChange={e => { setActionType(e.target.value); setPage(1); }}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:border-emerald-500"
            >
              <option value="">All Actions</option>
              <option value="CREATE_ADMIN">CREATE_ADMIN</option>
              <option value="UPDATE_ADMIN">UPDATE_ADMIN</option>
              <option value="DEACTIVATE_ADMIN">DEACTIVATE_ADMIN</option>
              <option value="ENABLE_2FA">ENABLE_2FA</option>
              <option value="DISABLE_2FA">DISABLE_2FA</option>
              <option value="APPROVE_LISTING">APPROVE_LISTING</option>
              <option value="REJECT_LISTING">REJECT_LISTING</option>
              <option value="VERIFY_USER">VERIFY_USER</option>
              <option value="MANUAL_PAYMENT_COMPLETED">MANUAL_PAYMENT_COMPLETED</option>
            </select>
          </div>

          {/* Target Resource Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Resource</label>
            <select
              value={resource}
              onChange={e => { setResource(e.target.value); setPage(1); }}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:border-emerald-500"
            >
              <option value="">All Resources</option>
              <option value="USER">USER</option>
              <option value="PROPERTY">PROPERTY</option>
              <option value="PAYMENT">PAYMENT</option>
            </select>
          </div>

          {/* Date Range Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Date Range</label>
            <div className="flex space-x-2">
              <input
                type="date"
                value={fromDate}
                onChange={e => { setFromDate(e.target.value); setPage(1); }}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2 py-1.5 text-[11px] text-white focus:border-emerald-500"
              />
              <input
                type="date"
                value={toDate}
                onChange={e => { setToDate(e.target.value); setPage(1); }}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2 py-1.5 text-[11px] text-white focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Active Filter Tags */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-700/50">
            <span className="text-xs text-slate-400 font-semibold">Active Filters:</span>
            {actionType && (
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs flex items-center space-x-1">
                <span>Action: {actionType}</span>
                <X className="w-3 h-3 cursor-pointer" onClick={() => setActionType('')} />
              </span>
            )}
            {resource && (
              <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/30 text-xs flex items-center space-x-1">
                <span>Resource: {resource}</span>
                <X className="w-3 h-3 cursor-pointer" onClick={() => setResource('')} />
              </span>
            )}
            {search && (
              <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs flex items-center space-x-1">
                <span>Search: {search}</span>
                <X className="w-3 h-3 cursor-pointer" onClick={() => setSearch('')} />
              </span>
            )}
            <button
              onClick={clearAllFilters}
              className="text-xs text-rose-400 hover:underline font-semibold ml-auto"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      {/* Audit Log Table */}
      <div className="bg-slate-800/90 rounded-2xl border border-slate-700/80 overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-12 text-center text-slate-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-2"></div>
            Fetching audit logs...
          </div>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            No audit log entries match your filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/80 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-700">
                <tr>
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4">Admin User</th>
                  <th className="px-6 py-4">Action</th>
                  <th className="px-6 py-4">Target Resource</th>
                  <th className="px-6 py-4">IP Address</th>
                  <th className="px-6 py-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-700/30 transition">
                    <td className="px-6 py-4 text-xs text-slate-400">
                      <p className="font-semibold text-slate-200">{new Date(log.created_at).toLocaleTimeString()}</p>
                      <p className="text-[11px]">{new Date(log.created_at).toLocaleDateString()}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-white">{log.admin_name}</p>
                      <p className="text-xs text-slate-400">{log.admin_email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        {log.action_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-slate-300">
                      <p><span className="text-slate-400">{log.target_resource}:</span> {highlightText(log.target_id, debouncedSearch)}</p>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-slate-400">
                      {log.ip_address || '127.0.0.1'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-1.5 bg-slate-700 hover:bg-slate-600 text-emerald-400 rounded-lg transition"
                        title="View Full Metadata JSON"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="bg-slate-900/80 px-6 py-4 border-t border-slate-700/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div>
            Showing <span className="font-bold text-white">{logs.length > 0 ? (page - 1) * limit + 1 : 0}</span> to{' '}
            <span className="font-bold text-white">{Math.min(page * limit, total)}</span> of{' '}
            <span className="font-bold text-white">{total}</span> records
          </div>

          <div className="flex items-center space-x-3">
            <select
              value={limit}
              onChange={e => { setLimit(Number(e.target.value)); setPage(1); }}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-slate-300"
            >
              <option value={25}>25 per page</option>
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

      {/* METADATA JSON INSPECTOR MODAL */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <Code className="w-5 h-5 text-emerald-400" />
                <span>Audit Log Entry Details</span>
              </h3>
              <button onClick={() => setSelectedLog(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <p><span className="font-semibold text-slate-400">Log ID:</span> {selectedLog.id}</p>
              <p><span className="font-semibold text-slate-400">Admin:</span> {selectedLog.admin_name} ({selectedLog.admin_email})</p>
              <p><span className="font-semibold text-slate-400">Action:</span> {selectedLog.action_type}</p>
              <p><span className="font-semibold text-slate-400">Resource:</span> {selectedLog.target_resource} ({selectedLog.target_id || 'N/A'})</p>
              <p><span className="font-semibold text-slate-400">IP Address:</span> {selectedLog.ip_address || 'N/A'}</p>
              <p><span className="font-semibold text-slate-400">User Agent:</span> {selectedLog.user_agent || 'N/A'}</p>
              <p><span className="font-semibold text-slate-400">Timestamp:</span> {new Date(selectedLog.created_at).toLocaleString()}</p>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-400 mb-1">Metadata JSON Context:</p>
              <pre className="bg-slate-950 p-4 rounded-xl text-xs font-mono text-emerald-400 overflow-x-auto border border-slate-800 max-h-60">
                {JSON.stringify(selectedLog.metadata || {}, null, 2)}
              </pre>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-semibold text-xs transition"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogs;
