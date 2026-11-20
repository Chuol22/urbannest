// client/src/components/admin/ListingReviewTable.tsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Alert } from '../ui/Alert';
import { Button } from '../ui/Button';
import { adminService } from '../../services/admin.service';
import {
  Eye,
  CheckCircle,
  XCircle,
  CreditCard,
  Smartphone,
  ExternalLink,
  Receipt as ReceiptIcon,
  Clock,
  AlertTriangle,
  ZoomIn,
  X
} from 'lucide-react';

interface ListingFeePayment {
  id: string;
  amount: number;
  currency: string;
  paymentMethod?: string;
  accountNumber?: string;
  receiptUrl?: string;
  referenceCode?: string;
  status: string;
  createdAt: string;
}

interface Listing {
  id: string;
  title: string;
  purpose: 'sale' | 'rent' | 'commercial' | 'short_term_rental' | 'long_term_rental';
  property_type: string;
  price: number;
  status: string;
  listing_fee_paid: boolean;
  listing_payment_status?: string;
  listing_receipt_url?: string;
  listing_payment_method?: string;
  listing_rejection_reason?: string;
  user: { id: string; first_name: string; last_name: string; email: string; phone: string };
  created_at: string;
  photos?: Array<{ id: string; photoUrl?: string; url?: string; isPrimary: boolean }>;
  listing_fee_payments?: ListingFeePayment[];
}

export default function ListingReviewTable() {
  const queryClient = useQueryClient();
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<{
    url: string;
    listingTitle: string;
    ownerName: string;
    method?: string;
    amount?: number;
    refCode?: string;
    listingId: string;
  } | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { data: rawListings, isLoading, refetch } = useQuery(
    ['pendingListings'],
    adminService.getPendingListings
  );

  const listings: Listing[] = Array.isArray(rawListings)
    ? rawListings
    : rawListings?.data ?? [];

  const approveMutation = useMutation(adminService.approveListing, {
    onSuccess: () => {
      setSuccess('Listing approved! The property is now published live and notification has been sent.');
      setSelectedReceipt(null);
      queryClient.invalidateQueries(['pendingListings']);
      queryClient.invalidateQueries(['adminPayments']);
    },
    onError: (err: any) => {
      setError(err?.response?.data?.message || 'Failed to approve listing');
    }
  });

  const rejectMutation = useMutation(
    ({ id, reason }: { id: string; reason: string }) => adminService.rejectListing(id, reason),
    {
      onSuccess: () => {
        setSuccess('Listing and receipt rejected. The owner was notified with your reason.');
        setShowRejectModal(null);
        setSelectedReceipt(null);
        setRejectReason('');
        queryClient.invalidateQueries(['pendingListings']);
        queryClient.invalidateQueries(['adminPayments']);
      },
      onError: (err: any) => {
        setError(err?.response?.data?.message || 'Failed to reject listing');
      }
    }
  );

  const handleApprove = (id: string) => {
    setError('');
    setSuccess('');
    approveMutation.mutate(id);
  };

  const handleReject = (id: string) => {
    setShowRejectModal(id);
  };

  const submitReject = (id: string) => {
    if (!rejectReason.trim() || rejectReason.trim().length < 5) {
      setError('Please provide a reason with at least 5 characters');
      return;
    }
    setError('');
    rejectMutation.mutate({ id, reason: rejectReason.trim() });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C9A865] mr-3" />
        Loading pending listing verification requests...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && <Alert type="error" message={error} onClose={() => setError('')} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

      {listings.length === 0 ? (
        <div className="bg-[#262C37]/20 border border-[#2E3543] rounded-2xl p-12 text-center">
          <div className="w-14 h-14 bg-[#2E7D4F]/20 text-[#2E7D4F] rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle size={28} />
          </div>
          <h3 className="text-lg font-bold text-white">All Caught Up!</h3>
          <p className="text-sm text-gray-400 mt-1 max-w-md mx-auto">
            There are no pending property listings awaiting payment transfer verification at this time.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#2E3543] bg-[#181B22]">
          <table className="min-w-full table-auto text-sm text-left text-gray-200">
            <thead className="bg-[#262C37]/40 text-xs uppercase font-bold text-gray-300 border-b border-[#2E3543]">
              <tr>
                <th className="px-4 py-3.5">Property Listing</th>
                <th className="px-4 py-3.5">Broker / Landlord</th>
                <th className="px-4 py-3.5">Payment Method</th>
                <th className="px-4 py-3.5">Proof of Payment</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Verification Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2E3543]/50">
              {listings.map((l: Listing) => {
                const latestPayment = l.listing_fee_payments?.[0];
                const receiptUrl = l.listing_receipt_url || latestPayment?.receiptUrl;
                const method = (l.listing_payment_method || latestPayment?.paymentMethod || 'CBE').toUpperCase();
                const isCBE = method.includes('CBE') || method.includes('BANK');

                return (
                  <tr key={l.id} className="hover:bg-[#262C37]/20 transition-colors">
                    {/* Property info */}
                    <td className="px-4 py-4">
                      <div className="font-semibold text-white text-sm hover:text-[#C9A865] transition">
                        {l.title}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-2">
                        <span className="capitalize">{l.property_type || 'Property'}</span>
                        <span>•</span>
                        <span className="capitalize text-amber-300 font-medium">{l.purpose?.replace('_', ' ')}</span>
                        <span>•</span>
                        <span className="text-gray-300 font-medium">ETB {Number(l.price).toLocaleString()}</span>
                      </div>
                    </td>

                    {/* Owner info */}
                    <td className="px-4 py-4">
                      <div className="font-medium text-white text-sm">
                        {l.user?.first_name} {l.user?.last_name}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5 font-mono">{l.user?.phone}</div>
                      <div className="text-xs text-gray-500">{l.user?.email}</div>
                    </td>

                    {/* Payment Method */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${
                          isCBE
                            ? 'bg-purple-950/40 text-purple-300 border border-purple-800/40'
                            : 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/40'
                        }`}>
                          {isCBE ? <CreditCard size={13} /> : <Smartphone size={13} />}
                          {isCBE ? 'CBE Bank Transfer' : 'Telebirr Transfer'}
                        </span>
                      </div>
                      {latestPayment?.referenceCode && (
                        <div className="text-[11px] font-mono text-gray-400 mt-1">
                          Ref: {latestPayment.referenceCode}
                        </div>
                      )}
                    </td>

                    {/* Proof of Payment / Receipt */}
                    <td className="px-4 py-4">
                      {receiptUrl ? (
                        <button
                          type="button"
                          onClick={() => setSelectedReceipt({
                            url: receiptUrl,
                            listingTitle: l.title,
                            ownerName: `${l.user?.first_name} ${l.user?.last_name}`,
                            method,
                            amount: latestPayment?.amount,
                            refCode: latestPayment?.referenceCode,
                            listingId: l.id
                          })}
                          className="group relative inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#262C37]/60 hover:bg-[#262C37] text-amber-300 hover:text-amber-200 border border-[#2E3543] text-xs font-semibold transition shadow-sm"
                        >
                          <ReceiptIcon size={14} className="text-[#C9A865]" />
                          <span>View Receipt</span>
                          <ZoomIn size={12} className="opacity-70 group-hover:scale-110 transition-transform" />
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-gray-400 italic">
                          <AlertTriangle size={13} className="text-amber-400" />
                          No receipt uploaded
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-4">
                      {l.listing_fee_paid ? (
                        <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold bg-[#2E7D4F]/20 text-[#2E7D4F] border border-[#2E7D4F]/30">
                          <CheckCircle size={12} /> Fee Paid
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold bg-[#C9A865]/20 text-[#C9A865] border border-[#C9A865]/30">
                          <Clock size={12} /> Verification Pending
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-4 text-right space-x-2 whitespace-nowrap">
                      <Button
                        size="sm"
                        onClick={() => handleApprove(l.id)}
                        loading={approveMutation.isLoading}
                        className="bg-[#2E7D4F] hover:bg-[#256841] text-white shadow-sm font-semibold"
                      >
                        <CheckCircle size={14} className="mr-1.5" />
                        Approve & Publish
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleReject(l.id)}
                        loading={rejectMutation.isLoading}
                        className="bg-rose-600 hover:bg-rose-500 text-white font-semibold"
                      >
                        <XCircle size={14} className="mr-1.5" />
                        Reject
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Full-Screen Receipt Preview Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-md z-50 p-4 animate-fadeIn">
          <div className="bg-[#181B22] border border-[#2E3543] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#2E3543] flex items-center justify-between bg-[#262C37]/30">
              <div className="flex items-center gap-2">
                <ReceiptIcon className="text-[#C9A865]" size={20} />
                <h3 className="font-bold text-white text-base">Payment Transfer Proof</h3>
              </div>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body - Receipt Image & Details */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {/* Summary Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-[#262C37]/20 border border-[#2E3543] rounded-xl text-xs">
                <div>
                  <span className="text-gray-400 block">Listing:</span>
                  <span className="font-semibold text-white truncate block">{selectedReceipt.listingTitle}</span>
                </div>
                <div>
                  <span className="text-gray-400 block">Sender:</span>
                  <span className="font-semibold text-white block">{selectedReceipt.ownerName}</span>
                </div>
                <div>
                  <span className="text-gray-400 block">Method:</span>
                  <span className="font-semibold text-amber-300 block">{selectedReceipt.method || 'CBE'}</span>
                </div>
                <div>
                  <span className="text-gray-400 block">Reference:</span>
                  <span className="font-mono text-gray-300 block">{selectedReceipt.refCode || 'N/A'}</span>
                </div>
              </div>

              {/* Receipt Image Display */}
              <div className="border border-[#2E3543] rounded-xl overflow-hidden bg-black/40 flex items-center justify-center p-2 min-h-[300px]">
                {selectedReceipt.url.endsWith('.pdf') ? (
                  <div className="p-8 text-center space-y-3">
                    <ReceiptIcon size={48} className="text-[#C9A865] mx-auto" />
                    <p className="text-sm text-gray-300">PDF Document Uploaded</p>
                    <a
                      href={selectedReceipt.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs bg-[#C9A865] hover:bg-[#B6924D] text-white px-4 py-2 rounded-lg font-semibold transition"
                    >
                      <ExternalLink size={14} /> Open PDF in New Tab
                    </a>
                  </div>
                ) : (
                  <img
                    src={selectedReceipt.url}
                    alt="Payment Receipt Screenshot"
                    className="max-h-[500px] w-auto max-w-full object-contain rounded-lg shadow-lg cursor-zoom-in"
                    onClick={() => window.open(selectedReceipt.url, '_blank')}
                    title="Click to view full resolution in new tab"
                  />
                )}
              </div>
              <p className="text-center text-xs text-gray-400">
                Click the image to open full-resolution in a separate tab if needed.
              </p>
            </div>

            {/* Modal Footer with Verification Actions */}
            <div className="px-6 py-4 border-t border-[#2E3543] bg-[#262C37]/30 flex flex-wrap items-center justify-between gap-3">
              <a
                href={selectedReceipt.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-gray-300 hover:text-white transition"
              >
                <ExternalLink size={14} /> Open Original File
              </a>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => {
                    setShowRejectModal(selectedReceipt.listingId);
                  }}
                  className="bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs"
                >
                  <XCircle size={14} className="mr-1" /> Reject Receipt
                </Button>
                <Button
                  onClick={() => handleApprove(selectedReceipt.listingId)}
                  loading={approveMutation.isLoading}
                  className="bg-[#2E7D4F] hover:bg-[#256841] text-white font-semibold text-xs shadow-md"
                >
                  <CheckCircle size={14} className="mr-1" /> Confirm Funds & Publish
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-50 p-4 animate-fadeIn">
          <div className="bg-[#181B22] border border-[#2E3543] p-6 rounded-2xl w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <XCircle className="text-rose-400" size={20} />
                Specify Rejection Reason
              </h3>
              <button
                onClick={() => setShowRejectModal(null)}
                className="text-gray-400 hover:text-white p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-xs text-gray-300">
              The owner will receive this feedback via email and on their dashboard so they can verify their transaction and re-upload.
            </p>
            <textarea
              className="w-full p-3 rounded-xl bg-[#262C37]/30 border border-[#2E3543] text-white placeholder-gray-400 text-sm focus:ring-2 focus:ring-[#C9A865] outline-none"
              rows={4}
              placeholder="e.g. Transaction reference not found on Commercial Bank statement. Please check the account number and re-upload."
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
            />
            <div className="flex justify-end space-x-2 pt-2">
              <Button
                onClick={() => {
                  setShowRejectModal(null);
                  setRejectReason('');
                }}
                className="bg-gray-700 hover:bg-gray-600 text-white text-xs"
              >
                Cancel
              </Button>
              <Button
                onClick={() => submitReject(showRejectModal)}
                loading={rejectMutation.isLoading}
                className="bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs"
              >
                Confirm Rejection & Send Feedback
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

