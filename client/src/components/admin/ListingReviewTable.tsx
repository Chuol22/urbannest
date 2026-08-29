// client/src/components/admin/ListingReviewTable.tsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Alert } from '../ui/Alert';
import { Button } from '../ui/Button';
import { adminService } from '../../services/admin.service';

interface Listing {
  id: string;
  title: string;
  purpose: 'sell' | 'rent' | 'commercial';
  status: string;
  listing_fee_paid: boolean;
  user: { first_name: string; last_name: string; email: string; phone: string };
  created_at: string;
}

export default function ListingReviewTable() {
  const queryClient = useQueryClient();
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);
  const [error, setError] = useState('');

  const { data: listings, isLoading } = useQuery(['pendingListings'], adminService.getPendingListings);

  const approveMutation = useMutation(adminService.approveListing, {
    onSuccess: () => queryClient.invalidateQueries(['pendingListings']),
  });

  const rejectMutation = useMutation(({ id, reason }: { id: string; reason: string }) => adminService.rejectListing(id, reason), {
    onSuccess: () => queryClient.invalidateQueries(['pendingListings']),
  });

  const handleApprove = (id: string) => {
    approveMutation.mutate(id);
  };

  const handleReject = (id: string) => {
    setShowRejectModal(id);
  };

  const submitReject = (id: string) => {
    if (!rejectReason.trim()) {
      setError('Reason is required');
      return;
    }
    rejectMutation.mutate({ id, reason: rejectReason }, {
      onSuccess: () => {
        setShowRejectModal(null);
        setRejectReason('');
        setError('');
      },
    });
  };

  if (isLoading) return <p className="text-gray-400">Loading listings...</p>;

  return (
    <div className="overflow-x-auto">
      {error && <Alert type="error" message={error} onClose={() => setError('')} />}
      <table className="min-w-full table-auto text-sm text-left text-gray-200">
        <thead className="bg-white/10 backdrop-blur-lg">
          <tr>
            <th className="px-4 py-2">Title</th>
            <th className="px-4 py-2">Owner</th>
            <th className="px-4 py-2">Created</th>
            <th className="px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {listings?.map((l: Listing) => (
            <tr key={l.id} className="border-b border-white/20 hover:bg-white/5 transition-colors">
              <td className="px-4 py-2">{l.title}</td>
              <td className="px-4 py-2">{l.user.first_name} {l.user.last_name}</td>
              <td className="px-4 py-2">{new Date(l.created_at).toLocaleDateString()}</td>
              <td className="px-4 py-2 space-x-2">
                <Button size="sm" onClick={() => handleApprove(l.id)} loading={approveMutation.isLoading} className="bg-emerald-600 hover:bg-emerald-500">Approve</Button>
                <Button size="sm" onClick={() => handleReject(l.id)} loading={rejectMutation.isLoading} className="bg-rose-600 hover:bg-rose-500">Reject</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-800 p-6 rounded-lg w-96">
            <h3 className="text-lg font-bold mb-4 text-white">Reject Reason</h3>
            <textarea
              className="w-full p-2 rounded bg-slate-700 text-white mb-4"
              rows={4}
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
            />
            <div className="flex justify-end space-x-2">
              <Button onClick={() => setShowRejectModal(null)} className="bg-gray-600 hover:bg-gray-500">Cancel</Button>
              <Button onClick={() => submitReject(showRejectModal)} className="bg-rose-600 hover:bg-rose-500">Submit</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
