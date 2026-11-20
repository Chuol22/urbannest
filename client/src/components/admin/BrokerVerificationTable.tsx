// client/src/components/admin/BrokerVerificationTable.tsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Alert } from '../ui/Alert';
import { Button } from '../ui/Button';
import { adminService } from '../../services/admin.service';

interface Broker {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  verification_document_url: string | null;
  verification_status: string;
  created_at: string;
}

export default function BrokerVerificationTable() {
  const queryClient = useQueryClient();
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);
  const [error, setError] = useState('');

  const { data: brokers, isLoading } = useQuery(['pendingBrokers'], adminService.getPendingBrokers);

  const approveMutation = useMutation(adminService.approveBroker, {
    onSuccess: () => queryClient.invalidateQueries(['pendingBrokers']),
  });

  const rejectMutation = useMutation(({ id, reason }: { id: string; reason: string }) => adminService.rejectBroker(id, reason), {
    onSuccess: () => queryClient.invalidateQueries(['pendingBrokers']),
  });

  const deleteMutation = useMutation(adminService.deleteUser, {
    onSuccess: () => queryClient.invalidateQueries(['pendingBrokers']),
  });

  const handleApprove = (id: string) => {
    approveMutation.mutate(id);
  };

  const handleReject = (id: string) => {
    setShowRejectModal(id);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to permanently delete this broker account from the platform?')) {
      deleteMutation.mutate(id);
    }
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

  if (isLoading) return <p className="text-gray-400">Loading brokers...</p>;

  return (
    <div className="overflow-x-auto">
      {error && <Alert type="error" message={error} onClose={() => setError('')} />}
      <table className="min-w-full table-auto text-sm text-left text-gray-200">
        <thead className="bg-[#262C37]/40 text-xs uppercase font-bold text-gray-300 border-b border-[#2E3543]">
          <tr>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Phone</th>
            <th className="px-4 py-3">Document</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#2E3543]/50">
          {brokers?.map((b: Broker) => (
            <tr key={b.id} className="hover:bg-[#262C37]/20 transition-colors">
              <td className="px-4 py-3 font-medium text-white">{b.first_name} {b.last_name}</td>
              <td className="px-4 py-3 text-gray-300">{b.email}</td>
              <td className="px-4 py-3 text-gray-300">{b.phone}</td>
              <td className="px-4 py-3">
                {b.verification_document_url ? (
                  <a href={b.verification_document_url} target="_blank" rel="noopener noreferrer" className="underline text-[#C9A865] hover:text-amber-300 font-medium">View</a>
                ) : (
                  <span className="text-gray-500">N/A</span>
                )}
              </td>
              <td className="px-4 py-3 space-x-2">
                <Button size="sm" onClick={() => handleApprove(b.id)} loading={approveMutation.isLoading} className="bg-[#2E7D4F] hover:bg-[#256841] text-white">Approve</Button>
                <Button size="sm" onClick={() => handleReject(b.id)} loading={rejectMutation.isLoading} className="bg-[#C9A865] hover:bg-[#b88210] text-[#181B22] font-semibold">Reject</Button>
                <Button size="sm" onClick={() => handleDelete(b.id)} loading={deleteMutation.isLoading} className="bg-rose-700 hover:bg-rose-600 text-white">Delete</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50">
          <div className="bg-[#181B22] border border-[#2E3543] p-6 rounded-xl w-96 shadow-2xl">
            <h3 className="text-lg font-bold mb-4 text-white">Reject Reason</h3>
            <textarea
              className="w-full p-3 rounded-lg bg-[#262C37]/30 border border-[#2E3543] text-white mb-4 focus:ring-2 focus:ring-[#C9A865] outline-none"
              rows={4}
              placeholder="State reason for rejecting broker verification..."
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
            />
            <div className="flex justify-end space-x-2">
              <Button onClick={() => setShowRejectModal(null)} className="bg-gray-600 hover:bg-gray-500 text-white">Cancel</Button>
              <Button onClick={() => submitReject(showRejectModal)} className="bg-rose-600 hover:bg-rose-500 text-white">Submit</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
