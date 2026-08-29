// client/src/pages/admin/PaymentManagement.tsx
import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/admin.service';
import { PlatformPayment } from '../../types/admin.types';
import { 
  CreditCard, 
  Search, 
  Download, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ChevronLeft, 
  ChevronRight, 
  X,
  Eye,
  CheckCheck,
  DollarSign
} from 'lucide-react';
import { toast } from 'sonner';

export const PaymentManagement: React.FC = () => {
  const [payments, setPayments] = useState<PlatformPayment[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(20);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  // Modals
  const [selectedPayment, setSelectedPayment] = useState<PlatformPayment | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState<boolean>(false);
  const [showCompleteModal, setShowCompleteModal] = useState<boolean>(false);
  const [completeReason, setCompleteReason] = useState<string>('');

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await adminService.getPayments({
        page,
        limit,
        status: statusFilter || undefined,
        from_date: fromDate || undefined,
        to_date: toDate || undefined
      });

      if (res.success && res.data?.payments) {
        setPayments(res.data.payments);
        setTotal(res.data.total || 0);
        setTotalPages(res.data.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to fetch payments:', err);
      toast.error('Failed to load payment transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [page, limit, statusFilter, fromDate, toDate]);

  const openDetails = (payment: PlatformPayment) => {
    setSelectedPayment(payment);
    setShowDetailsModal(true);
  };

  const openCompleteModal = (payment: PlatformPayment) => {
    setSelectedPayment(payment);
    setCompleteReason('');
    setShowCompleteModal(true);
  };

  const handleCompleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayment) return;

    if (!completeReason || !completeReason.trim()) {
      toast.error('Reason for manual payment completion is required.');
      return;
    }

    try {
      const res = await adminService.markPaymentCompleted(selectedPayment.id, completeReason);
      if (res.success) {
        toast.success('Payment marked as COMPLETED and listing fee status updated');
        setShowCompleteModal(false);
        fetchPayments();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Manual payment completion failed');
    }
  };

  const handleExportCSV = () => {
    const exportUrl = adminService.exportPaymentsUrl({
      status: statusFilter || undefined,
      from_date: fromDate || undefined,
      to_date: toDate || undefined
    });
    window.open(exportUrl, '_blank');
    toast.success('Payment records CSV export started');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center space-x-2">
            <CreditCard className="w-7 h-7 text-emerald-400" />
            <span>Payment Reconciliation & Revenue</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Track listing fee payments, inspect transaction references, and perform manual payment completions.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 font-semibold rounded-xl transition text-sm shadow-md"
        >
          <Download className="w-4 h-4" />
          <span>Export Payments CSV</span>
        </button>
      </div>

      {/* Filter Panel */}
      <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Payment Status</label>
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:border-emerald-500"
          >
            <option value="">All Statuses</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="PENDING">PENDING</option>
            <option value="FAILED">FAILED</option>
            <option value="PROCESSING">PROCESSING</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">From Date</label>
          <input
            type="date"
            value={fromDate}
            onChange={e => { setFromDate(e.target.value); setPage(1); }}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">To Date</label>
          <input
            type="date"
            value={toDate}
            onChange={e => { setToDate(e.target.value); setPage(1); }}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-slate-800/90 rounded-2xl border border-slate-700/80 overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-12 text-center text-slate-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-2"></div>
            Loading payments...
          </div>
        ) : payments.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            No payment transactions match current filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/80 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-700">
                <tr>
                  <th className="px-6 py-4">Transaction Ref</th>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Property</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {payments.map(payment => (
                  <tr key={payment.id} className="hover:bg-slate-700/30 transition">
                    <td className="px-6 py-4 font-mono text-xs text-slate-200">
                      {payment.txRef || payment.id.slice(0, 8)}
                    </td>
                    <td className="px-6 py-4 text-xs">
                      <p className="font-semibold text-white">
                        {payment.user ? `${payment.user.first_name} ${payment.user.last_name}` : 'Unknown User'}
                      </p>
                      <p className="text-slate-400">{payment.user?.email}</p>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-300">
                      {payment.property?.title || 'Listing Fee'}
                    </td>
                    <td className="px-6 py-4 font-bold text-emerald-400 text-sm">
                      {payment.currency || 'ETB'} {payment.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        payment.status === 'COMPLETED' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                        payment.status === 'PENDING' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' :
                        'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                      }`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => openDetails(payment)}
                        className="p-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {payment.status !== 'COMPLETED' && (
                        <button
                          onClick={() => openCompleteModal(payment)}
                          className="px-3 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-bold transition"
                          title="Manually Complete Payment"
                        >
                          Mark Complete
                        </button>
                      )}
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
            Showing <span className="font-bold text-white">{payments.length > 0 ? (page - 1) * limit + 1 : 0}</span> to{' '}
            <span className="font-bold text-white">{Math.min(page * limit, total)}</span> of{' '}
            <span className="font-bold text-white">{total}</span> payment records
          </div>

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

      {/* DETAILS MODAL */}
      {showDetailsModal && selectedPayment && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <CreditCard className="w-5 h-5 text-emerald-400" />
                <span>Payment Details</span>
              </h3>
              <button onClick={() => setShowDetailsModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <p><span className="font-semibold text-slate-400">Payment Record ID:</span> {selectedPayment.id}</p>
              <p><span className="font-semibold text-slate-400">Tx Reference:</span> {selectedPayment.txRef || 'N/A'}</p>
              <p><span className="font-semibold text-slate-400">Payer Name:</span> {selectedPayment.user ? `${selectedPayment.user.first_name} ${selectedPayment.user.last_name}` : 'N/A'}</p>
              <p><span className="font-semibold text-slate-400">Payer Email:</span> {selectedPayment.user?.email || 'N/A'}</p>
              <p><span className="font-semibold text-slate-400">Amount Paid:</span> {selectedPayment.currency} {selectedPayment.amount.toLocaleString()}</p>
              <p><span className="font-semibold text-slate-400">Payment Status:</span> {selectedPayment.status}</p>
              <p><span className="font-semibold text-slate-400">Property Title:</span> {selectedPayment.property?.title || 'N/A'}</p>
              <p><span className="font-semibold text-slate-400">Timestamp:</span> {new Date(selectedPayment.createdAt).toLocaleString()}</p>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-semibold text-xs transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MANUAL COMPLETE MODAL */}
      {showCompleteModal && selectedPayment && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <CheckCheck className="w-5 h-5 text-emerald-400" />
                <span>Manually Complete Payment</span>
              </h3>
              <button onClick={() => setShowCompleteModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Manually marking payment of <strong className="text-emerald-400">{selectedPayment.currency} {selectedPayment.amount}</strong> as COMPLETED. Reason required for audit log.
            </p>

            <form onSubmit={handleCompleteSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Audit Log Reason</label>
                <textarea
                  required
                  rows={3}
                  placeholder="State transaction confirmation reference or bank receipt number..."
                  value={completeReason}
                  onChange={e => setCompleteReason(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-emerald-500 text-xs"
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCompleteModal(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl font-semibold transition text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-bold transition text-xs"
                >
                  Confirm Completion
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentManagement;
