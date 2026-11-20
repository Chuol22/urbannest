// client/src/components/admin/PaymentsTable.tsx
import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { adminService } from '../../services/admin.service';
import {
  Receipt,
  CheckCircle,
  Clock,
  XCircle,
  TrendingUp,
  CreditCard,
  Smartphone,
  ExternalLink,
  ZoomIn,
  X
} from 'lucide-react';
import { Alert } from '../ui/Alert';

interface ListingFeePayment {
  id: string;
  amount: number;
  currency: string;
  status: string; // PENDING | PENDING_VERIFICATION | COMPLETED | REJECTED | FAILED
  paymentMethod?: string;
  accountNumber?: string;
  receiptUrl?: string;
  referenceCode?: string;
  adminNotes?: string;
  chapaTransactionRef?: string;
  paidAt?: string;
  createdAt: string;
  user?: { first_name: string; last_name: string; phone: string; email?: string };
  property?: { title: string; purpose: string; status: string };
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  COMPLETED: {
    label: 'Paid & Approved',
    color: 'bg-[#2E7D4F]/20 text-[#2E7D4F] border border-[#2E7D4F]/30',
    icon: <CheckCircle size={13} />,
  },
  PENDING_VERIFICATION: {
    label: 'Pending Verification',
    color: 'bg-[#C9A865]/20 text-[#C9A865] border border-[#C9A865]/30',
    icon: <Clock size={13} />,
  },
  PENDING: {
    label: 'Awaiting Transfer',
    color: 'bg-[#C9A865]/20 text-[#C9A865] border border-[#C9A865]/30',
    icon: <Clock size={13} />,
  },
  REJECTED: {
    label: 'Rejected',
    color: 'bg-rose-900/30 text-rose-400 border border-rose-800/40',
    icon: <XCircle size={13} />,
  },
  FAILED: {
    label: 'Failed',
    color: 'bg-rose-900/30 text-rose-400 border border-rose-800/40',
    icon: <XCircle size={13} />,
  },
};

export default function PaymentsTable() {
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [previewReceipt, setPreviewReceipt] = useState<{ url: string; title: string; ref?: string } | null>(null);

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
        p.referenceCode?.toLowerCase().includes(term) ||
        p.paymentMethod?.toLowerCase().includes(term) ||
        p.chapaTransactionRef?.toLowerCase().includes(term)
      );
    });

  const totalRevenue = payments
    .filter(p => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const pendingVerificationCount = payments.filter(
    p => p.status === 'PENDING_VERIFICATION' || (p.status === 'PENDING' && p.receiptUrl)
  ).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40 text-gray-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C9A865] mr-3" />
        Loading payment transactions...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Verified Revenue', value: `ETB ${totalRevenue.toLocaleString()}`, icon: <TrendingUp size={18} className="text-[#C9A865]" />, iconBg: 'bg-[#C9A865]/15' },
          { label: 'Published & Paid Listings', value: payments.filter(p => p.status === 'COMPLETED').length, icon: <CheckCircle size={18} className="text-[#2E7D4F]" />, iconBg: 'bg-[#2E7D4F]/15' },
          { label: 'Pending Verification', value: pendingVerificationCount, icon: <Clock size={18} className="text-[#C9A865]" />, iconBg: 'bg-[#C9A865]/15' },
        ].map(({ label, value, icon, iconBg }) => (
          <div key={label} className="bg-[#262C37]/30 border border-[#2E3543] rounded-xl p-4 flex items-center gap-3">
            <div className={`w-10 h-10 ${iconBg} rounded-lg flex items-center justify-center`}>
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
          placeholder="Search broker, property, or ref code..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="px-4 py-2 rounded-lg bg-[#262C37]/30 border border-[#2E3543] text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C9A865]"
        />
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-4 py-2 rounded-lg bg-[#181B22] border border-[#2E3543] text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#C9A865]"
        >
          <option value="ALL">All Statuses</option>
          <option value="PENDING_VERIFICATION">Pending Verification</option>
          <option value="COMPLETED">Paid & Approved</option>
          <option value="PENDING">Pending Transfer</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-[#2E3543]">
        <table className="min-w-full table-auto text-sm text-left text-gray-300">
          <thead className="bg-[#262C37]/40 text-xs uppercase text-gray-300 font-bold border-b border-[#2E3543]">
            <tr>
              <th className="px-5 py-3">Reference / Code</th>
              <th className="px-5 py-3">Broker / Landlord</th>
              <th className="px-5 py-3">Property</th>
              <th className="px-5 py-3">Method</th>
              <th className="px-5 py-3">Amount</th>
              <th className="px-5 py-3">Proof Receipt</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2E3543]/50">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-5 py-12 text-center text-gray-400">
                  No payment records found.
                </td>
              </tr>
            ) : (
              filtered.map((p) => {
                const st = STATUS_CONFIG[p.status] ?? STATUS_CONFIG.PENDING;
                const method = (p.paymentMethod || 'CBE').toUpperCase();
                const isCBE = method.includes('CBE') || method.includes('BANK');

                return (
                  <tr key={p.id} className="hover:bg-[#262C37]/20 transition-colors">
                    <td className="px-5 py-3 font-mono text-xs text-gray-400">
                      {p.referenceCode || p.chapaTransactionRef?.slice(0, 18) || p.id.slice(0, 12)}
                    </td>
                    <td className="px-5 py-3">
                      <div className="font-semibold text-white text-sm">
                        {p.user?.first_name} {p.user?.last_name}
                      </div>
                      <div className="text-xs text-gray-400">{p.user?.phone}</div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="font-semibold text-white text-sm">{p.property?.title || '—'}</div>
                      <div className="text-xs text-gray-400 capitalize">{p.property?.purpose?.replace('_', ' ')}</div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded font-semibold ${
                        isCBE
                          ? 'bg-purple-950/40 text-purple-300 border border-purple-800/40'
                          : 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/40'
                      }`}>
                        {isCBE ? <CreditCard size={12} /> : <Smartphone size={12} />}
                        {isCBE ? 'CBE Account' : 'Telebirr'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="font-bold text-[#2E7D4F]">ETB {p.amount}</span>
                    </td>
                    <td className="px-5 py-3">
                      {p.receiptUrl ? (
                        <button
                          type="button"
                          onClick={() => setPreviewReceipt({
                            url: p.receiptUrl!,
                            title: p.property?.title || 'Payment Receipt',
                            ref: p.referenceCode
                          })}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#262C37]/40 hover:bg-[#262C37] text-amber-300 text-xs font-semibold border border-[#2E3543] transition"
                        >
                          <Receipt size={13} className="text-[#C9A865]" />
                          <span>View Proof</span>
                        </button>
                      ) : (
                        <span className="text-xs text-gray-500 italic">No receipt</span>
                      )}
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

      {/* Receipt Preview Lightbox */}
      {previewReceipt && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-50 p-4 animate-fadeIn">
          <div className="bg-[#181B22] border border-[#2E3543] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="px-5 py-3 border-b border-[#2E3543] flex items-center justify-between bg-[#262C37]/30">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <Receipt size={16} className="text-[#C9A865]" />
                Payment Proof Receipt
              </h4>
              <button
                onClick={() => setPreviewReceipt(null)}
                className="text-gray-400 hover:text-white p-1"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4 bg-black/30 flex items-center justify-center min-h-[250px]">
              {previewReceipt.url.endsWith('.pdf') ? (
                <div className="text-center p-6 space-y-3">
                  <Receipt size={40} className="text-[#C9A865] mx-auto" />
                  <a
                    href={previewReceipt.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs bg-[#C9A865] text-white px-3 py-1.5 rounded-lg font-semibold"
                  >
                    <ExternalLink size={13} /> Open PDF
                  </a>
                </div>
              ) : (
                <img
                  src={previewReceipt.url}
                  alt="Payment Receipt"
                  className="max-h-[450px] w-auto max-w-full object-contain rounded-lg shadow-lg cursor-pointer"
                  onClick={() => window.open(previewReceipt.url, '_blank')}
                  title="Click to open original in new tab"
                />
              )}
            </div>
            <div className="p-3 border-t border-[#2E3543] bg-[#262C37]/20 flex justify-between items-center text-xs text-gray-400">
              <span>{previewReceipt.title}</span>
              <a
                href={previewReceipt.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#C9A865] hover:underline inline-flex items-center gap-1"
              >
                <ExternalLink size={12} /> Full Screen
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

