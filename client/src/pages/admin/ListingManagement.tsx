// client/src/pages/admin/ListingManagement.tsx
import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/admin.service';
import { PlatformListing } from '../../types/admin.types';
import { 
  Building2, 
  Search, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  ChevronLeft, 
  ChevronRight, 
  X,
  Eye,
  Check,
  Ban,
  DollarSign
} from 'lucide-react';
import { toast } from 'sonner';

export const ListingManagement: React.FC = () => {
  const [listings, setListings] = useState<PlatformListing[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(20);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('pending');

  // Checkbox selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Single Rejection Modal
  const [showRejectModal, setShowRejectModal] = useState<boolean>(false);
  const [selectedListing, setSelectedListing] = useState<PlatformListing | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');

  // Bulk Rejection Modal
  const [showBulkRejectModal, setShowBulkRejectModal] = useState<boolean>(false);
  const [bulkRejectReason, setBulkRejectReason] = useState<string>('');

  const fetchListings = async () => {
    setLoading(true);
    try {
      const res = await adminService.getAllListings({
        page,
        limit,
        status: statusFilter || undefined
      });

      if (res.success && res.data?.listings) {
        setListings(res.data.listings);
        setTotal(res.data.total || 0);
        setTotalPages(res.data.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to fetch listings:', err);
      toast.error('Failed to load listing records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [page, limit, statusFilter]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(listings.map(l => l.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Single Approve
  const handleApproveSingle = async (listing: PlatformListing) => {
    if (!listing.listing_fee_paid) {
      toast.error('Cannot approve listing: Listing fee has not been paid.');
      return;
    }
    try {
      const res = await adminService.approveListing(listing.id);
      if (res.success) {
        toast.success(`Approved "${listing.title}"`);
        fetchListings();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Approve failed');
    }
  };

  // Single Reject
  const openRejectSingle = (listing: PlatformListing) => {
    setSelectedListing(listing);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const handleRejectSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedListing) return;

    if (!rejectReason || rejectReason.trim().length < 10) {
      toast.error('Rejection reason must be at least 10 characters.');
      return;
    }

    try {
      const res = await adminService.rejectListing(selectedListing.id, rejectReason);
      if (res.success) {
        toast.success(`Listing rejected`);
        setShowRejectModal(false);
        fetchListings();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Rejection failed');
    }
  };

  // Bulk Approve
  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) return;
    try {
      const res = await adminService.bulkApproveListings(selectedIds);
      if (res.success) {
        toast.success(res.message);
        setSelectedIds([]);
        fetchListings();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Bulk approve failed');
    }
  };

  // Bulk Reject
  const openBulkReject = () => {
    if (selectedIds.length === 0) return;
    setBulkRejectReason('');
    setShowBulkRejectModal(true);
  };

  const handleBulkRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkRejectReason || bulkRejectReason.trim().length < 10) {
      toast.error('Bulk rejection reason must be at least 10 characters.');
      return;
    }

    try {
      const res = await adminService.bulkRejectListings(selectedIds, bulkRejectReason);
      if (res.success) {
        toast.success(res.message);
        setShowBulkRejectModal(false);
        setSelectedIds([]);
        fetchListings();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Bulk reject failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center space-x-2">
            <Building2 className="w-7 h-7 text-teal-400" />
            <span>Listing Moderation & Approvals</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Review property listings, verify fee payments, approve submissions, and reject listings with feedback.
          </p>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="bg-teal-500/15 border border-teal-500/40 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center space-x-2 text-sm font-bold text-teal-300">
            <CheckCircle2 className="w-5 h-5 text-teal-400" />
            <span>{selectedIds.length} listing(s) selected</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleBulkApprove}
              className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold rounded-xl text-xs transition shadow-md"
            >
              Bulk Approve Listings
            </button>
            <button
              onClick={openBulkReject}
              className="px-4 py-2 bg-rose-500 hover:bg-rose-400 text-white font-extrabold rounded-xl text-xs transition shadow-md"
            >
              Bulk Reject Listings
            </button>
          </div>
        </div>
      )}

      {/* Status Tabs */}
      <div className="flex space-x-2 border-b border-slate-700 pb-2">
        {['pending', 'available', 'withdrawn', 'rented', 'sold'].map(status => (
          <button
            key={status}
            onClick={() => { setStatusFilter(status); setPage(1); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition ${
              statusFilter === status
                ? 'bg-teal-500/20 text-teal-400 border border-teal-500/40 shadow-inner'
                : 'text-slate-400 hover:text-white bg-slate-800/50'
            }`}
          >
            {status} listings
          </button>
        ))}
      </div>

      {/* Listings Table */}
      <div className="bg-slate-800/90 rounded-2xl border border-slate-700/80 overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-12 text-center text-slate-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500 mx-auto mb-2"></div>
            Loading listings...
          </div>
        ) : listings.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            No listings found with status "{statusFilter}".
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
                      checked={listings.length > 0 && selectedIds.length === listings.length}
                      className="rounded bg-slate-900 border-slate-700 text-teal-500 focus:ring-0"
                    />
                  </th>
                  <th className="px-6 py-4">Property</th>
                  <th className="px-6 py-4">Owner / Agent</th>
                  <th className="px-6 py-4">Fee Payment</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Submitted Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {listings.map(listing => {
                  const isChecked = selectedIds.includes(listing.id);
                  const primaryPhoto = listing.photos && listing.photos.length > 0 ? listing.photos[0].url : null;
                  return (
                    <tr key={listing.id} className={`hover:bg-slate-700/30 transition ${isChecked ? 'bg-teal-500/5' : ''}`}>
                      <td className="px-4 py-4 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleSelectOne(listing.id)}
                          className="rounded bg-slate-900 border-slate-700 text-teal-500 focus:ring-0"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 overflow-hidden shrink-0">
                            {primaryPhoto ? (
                              <img src={primaryPhoto} alt={listing.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xs text-slate-500 font-bold">
                                NO IMG
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-white max-w-xs truncate">{listing.title}</p>
                            <p className="text-xs text-slate-400 capitalize">
                              {listing.purpose} • {listing.property_type} • ETB {listing.price.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs">
                        <p className="font-semibold text-slate-200">
                          {listing.user ? `${listing.user.first_name} ${listing.user.last_name}` : 'Unknown Owner'}
                        </p>
                        <p className="text-slate-400">{listing.user?.email}</p>
                      </td>
                      <td className="px-6 py-4">
                        {listing.listing_fee_paid ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center w-max space-x-1">
                            <Check className="w-3.5 h-3.5" />
                            <span>Fee Paid</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center w-max space-x-1">
                            <DollarSign className="w-3.5 h-3.5" />
                            <span>Unpaid</span>
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${
                          listing.status === 'available' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                          listing.status === 'pending' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' :
                          'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        }`}>
                          {listing.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400">
                        {new Date(listing.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {listing.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApproveSingle(listing)}
                              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg text-xs font-bold transition"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => openRejectSingle(listing)}
                              className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 rounded-lg text-xs font-bold transition"
                            >
                              Reject
                            </button>
                          </>
                        )}
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
            Showing <span className="font-bold text-white">{listings.length > 0 ? (page - 1) * limit + 1 : 0}</span> to{' '}
            <span className="font-bold text-white">{Math.min(page * limit, total)}</span> of{' '}
            <span className="font-bold text-white">{total}</span> listings
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

      {/* SINGLE REJECT MODAL */}
      {showRejectModal && selectedListing && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <Ban className="w-5 h-5 text-rose-400" />
                <span>Reject Listing</span>
              </h3>
              <button onClick={() => setShowRejectModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Rejecting "<strong className="text-white">{selectedListing.title}</strong>". Rejection reason will be sent to owner.
            </p>

            <form onSubmit={handleRejectSingleSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Rejection Reason (Min 10 chars)</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Explain why this property listing cannot be published..."
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-rose-500 text-xs"
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl font-semibold transition text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-rose-500 hover:bg-rose-400 text-white rounded-xl font-bold transition text-xs"
                >
                  Submit Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BULK REJECT MODAL */}
      {showBulkRejectModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <Ban className="w-5 h-5 text-rose-400" />
                <span>Bulk Reject Listings ({selectedIds.length})</span>
              </h3>
              <button onClick={() => setShowBulkRejectModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBulkRejectSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Rejection Reason for All Selected (Min 10 chars)</label>
                <textarea
                  required
                  rows={4}
                  value={bulkRejectReason}
                  onChange={e => setBulkRejectReason(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-rose-500 text-xs"
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBulkRejectModal(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl font-semibold transition text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-rose-500 hover:bg-rose-400 text-white rounded-xl font-bold transition text-xs"
                >
                  Confirm Bulk Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListingManagement;
