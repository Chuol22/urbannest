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
        <thead className="bg-white/10 backdrop-blur-lg">
          <tr>
            <th className="px-4 py-2">Name</th>
            <th className="px-4 py-2">Email</th>
            <th className="px-4 py-2">Phone</th>
            <th className="px-4 py-2">Document</th>
            <th className="px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {brokers?.map((b: Broker) => (
            <tr key={b.id} className="border-b border-white/20 hover:bg-white/5 transition-colors">
              <td className="px-4 py-2">{b.first_name} {b.last_name}</td>
              <td className="px-4 py-2">{b.email}</td>
              <td className="px-4 py-2">{b.phone}</td>
              <td className="px-4 py-2">
                {b.verification_document_url ? (
                  <a href={b.verification_document_url} target="_blank" rel="noopener noreferrer" className="underline text-amber-300">View</a>
                ) : (
                  'N/A'
                )}
              </td>
              <td className="px-4 py-2 space-x-2">
                <Button size="sm" onClick={() => handleApprove(b.id)} loading={approveMutation.isLoading} className="bg-emerald-600 hover:bg-emerald-500">Approve</Button>
                <Button size="sm" onClick={() => handleReject(b.id)} loading={rejectMutation.isLoading} className="bg-amber-600 hover:bg-amber-500">Reject</Button>
                <Button size="sm" onClick={() => handleDelete(b.id)} loading={deleteMutation.isLoading} className="bg-rose-700 hover:bg-rose-600">Delete</Button>
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
