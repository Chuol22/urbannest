// client/src/components/admin/PaymentsTable.tsx
import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { adminService } from '../../services/admin.service';
import { Receipt, CheckCircle, Clock, XCircle, TrendingUp } from 'lucide-react';
import { Alert } from '../ui/Alert';

interface ListingFeePayment {
  id: string;
  amount: number;
  currency: string;
  status: string;         // PENDING | COMPLETED | FAILED
  chapaTransactionRef?: string;
  paidAt?: string;
  createdAt: string;
  user?: { first_name: string; last_name: string; phone: string; email?: string };
  property?: { title: string; purpose: string; status: string };
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  COMPLETED: {
    label: 'Paid',
    color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400',
    icon: <CheckCircle size={13} />,
  },
  PENDING: {
    label: 'Pending',
    color: 'bg-amber-100 text-amber-800 dark:bg-amber-950/20 dark:text-amber-400',
    icon: <Clock size={13} />,
  },
  FAILED: {
    label: 'Failed',
    color: 'bg-rose-100 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400',
    icon: <XCircle size={13} />,
  },
};

export default function PaymentsTable() {
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const { data: raw, isLoading } = useQuery(['adminPayments'], () => adminService.getPayments());

  const payments: ListingFeePayment[] = Array.isArray(raw) ? raw : (raw?.data ?? []);

  const filtered = payments
    .filter(p => filterStatus === 'ALL' || p.status === filterStatus)
    .filter(p => {
      const term = searchTerm.toLowerCase();
      if (!term) return true;
      return (
        p.property?.title?.toLowerCase().includes(term) ||
        p.user?.first_name?.toLowerCase().includes(term) ||
        p.user?.last_name?.toLowerCase().includes(term) ||
        p.chapaTransactionRef?.toLowerCase().includes(term)
      );
    });

  const totalRevenue = payments
    .filter(p => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40 text-gray-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mr-3" />
        Loading payments...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Revenue', value: `ETB ${totalRevenue.toLocaleString()}`, icon: <TrendingUp size={18} />, color: 'emerald' },
          { label: 'Paid Listings', value: payments.filter(p => p.status === 'COMPLETED').length, icon: <CheckCircle size={18} />, color: 'blue' },
          { label: 'Pending Payments', value: payments.filter(p => p.status === 'PENDING').length, icon: <Clock size={18} />, color: 'amber' },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className={`bg-slate-800/60 border border-white/10 rounded-xl p-4 flex items-center gap-3`}>
            <div className={`w-10 h-10 bg-${color}-600/20 rounded-lg flex items-center justify-center text-${color}-400`}>
              {icon}
            </div>
            <div>
              <p className="text-xs text-gray-400">{label}</p>
              <p className="font-bold text-white text-sm">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search broker, property, or ref..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="px-4 py-2 rounded-lg bg-slate-800 border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-4 py-2 rounded-lg bg-slate-800 border border-white/10 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="ALL">All Statuses</option>
          <option value="COMPLETED">Paid</option>
          <option value="PENDING">Pending</option>
          <option value="FAILED">Failed</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="min-w-full table-auto text-sm text-left text-gray-300">
          <thead className="bg-white/10 text-xs uppercase text-gray-400 font-bold">
            <tr>
              <th className="px-5 py-3">Transaction Ref</th>
              <th className="px-5 py-3">Broker</th>
              <th className="px-5 py-3">Property</th>
              <th className="px-5 py-3">Amount</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-gray-500">
                  No payment records found.
                </td>
              </tr>
            ) : (
              filtered.map((p) => {
                const st = STATUS_CONFIG[p.status] ?? STATUS_CONFIG.PENDING;
                return (
                  <tr key={p.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-5 py-3 font-mono text-xs text-gray-400">
                      {p.chapaTransactionRef ? p.chapaTransactionRef.slice(0, 24) + '...' : p.id.slice(0, 12) + '...'}
                    </td>
                    <td className="px-5 py-3">
                      <div className="font-semibold text-white text-sm">
                        {p.user?.first_name} {p.user?.last_name}
                      </div>
                      <div className="text-xs text-gray-500">{p.user?.phone}</div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="font-semibold text-white text-sm">{p.property?.title || '—'}</div>
                      <div className="text-xs text-gray-500 capitalize">{p.property?.purpose?.replace('_', ' ')}</div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="font-bold text-emerald-400">ETB {p.amount}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold ${st.color}`}>
                        {st.icon} {st.label}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-400">
                      {new Date(p.paidAt || p.createdAt).toLocaleDateString('en-ET', {
                        year: 'numeric', month: 'short', day: 'numeric'
                      })}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
