// client/src/components/admin/PaymentConfig.tsx
import React, { useEffect, useState } from 'react';
import { Alert } from '../ui/Alert';
import { Button } from '../ui/Button';
import { adminService } from '../../services/admin.service';

export default function PaymentConfig() {
  const [sellFee, setSellFee] = useState<number>(0);
  const [rentFee, setRentFee] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Load current configuration
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const data = await adminService.getPaymentConfig();
        setSellFee(data.sell_fee);
        setRentFee(data.rent_fee);
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Failed to load payment configuration');
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await adminService.updatePaymentConfig({ sell_fee: sellFee, rent_fee: rentFee });
      setSuccess('Payment configuration saved successfully');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to save payment configuration');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-gray-400">Loading payment configuration...</p>;
  }

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-white">Payment Configuration</h2>
      {error && <Alert type="error" message={error} onClose={() => setError('')} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-200 mb-1">Sell Listing Fee (ETB)</label>
          <input
            type="number"
            min={0}
            value={sellFee}
            onChange={e => setSellFee(Number(e.target.value))}
            className="w-full p-2 rounded bg-white/20 text-white focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-200 mb-1">Rent Listing Fee (ETB)</label>
          <input
            type="number"
            min={0}
            value={rentFee}
            onChange={e => setRentFee(Number(e.target.value))}
            className="w-full p-2 rounded bg-white/20 text-white focus:outline-none"
          />
        </div>
      </div>
      <Button onClick={handleSave} loading={saving} className="bg-emerald-600 hover:bg-emerald-500">
        Save Configuration
      </Button>
    </div>
  );
}
