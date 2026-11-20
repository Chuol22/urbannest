// client/src/components/admin/PaymentConfig.tsx
import { useEffect, useState } from 'react';
import { Alert } from '../ui/Alert';
import { Button } from '../ui/Button';
import { adminService } from '../../services/admin.service';
import { Building2, Smartphone, DollarSign, CheckCircle2 } from 'lucide-react';

export default function PaymentConfig() {
  const [sellFee, setSellFee] = useState<number>(500);
  const [rentFee, setRentFee] = useState<number>(300);
  const [cbeAccountNumber, setCbeAccountNumber] = useState<string>('1000284759281');
  const [cbeAccountName, setCbeAccountName] = useState<string>('UrbanNEST Real Estate PLC');
  const [cbeBankName, setCbeBankName] = useState<string>('Commercial Bank of Ethiopia (CBE)');
  const [cbeBranch, setCbeBranch] = useState<string>('Finfinnee Branch, Addis Ababa');
  const [telebirrPhone, setTelebirrPhone] = useState<string>('0911478291');
  const [telebirrName, setTelebirrName] = useState<string>('UrbanNEST Real Estate');

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Load current configuration
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const data = await adminService.getPaymentConfig();
        if (data) {
          if (data.sell_fee !== undefined) setSellFee(data.sell_fee);
          if (data.rent_fee !== undefined) setRentFee(data.rent_fee);
          if (data.cbe_account_number) setCbeAccountNumber(data.cbe_account_number);
          if (data.cbe_account_name) setCbeAccountName(data.cbe_account_name);
          if (data.cbe_bank_name) setCbeBankName(data.cbe_bank_name);
          if (data.cbe_branch) setCbeBranch(data.cbe_branch);
          if (data.telebirr_phone) setTelebirrPhone(data.telebirr_phone);
          if (data.telebirr_name) setTelebirrName(data.telebirr_name);
        }
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Failed to load payment configuration');
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await adminService.updatePaymentConfig({
        sell_fee: sellFee,
        rent_fee: rentFee,
        cbe_account_number: cbeAccountNumber,
        cbe_account_name: cbeAccountName,
        cbe_bank_name: cbeBankName,
        cbe_branch: cbeBranch,
        telebirr_phone: telebirrPhone,
        telebirr_name: telebirrName
      });
      setSuccess('Payment transfer accounts & fees updated successfully!');
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
    <div className="space-y-6">
      {error && <Alert type="error" message={error} onClose={() => setError('')} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

      {/* Listing Fees Card */}
      <div className="bg-[#181B22] border border-[#2E3543] rounded-2xl p-6 shadow-lg space-y-4">
        <div className="flex items-center gap-2 border-b border-[#2E3543] pb-3">
          <DollarSign className="text-[#C9A865]" size={20} />
          <h2 className="text-lg font-bold text-white">Listing Publication Fees (ETB)</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">
              For Sale / Lease Listing Fee (ETB)
            </label>
            <input
              type="number"
              min={0}
              value={sellFee}
              onChange={e => setSellFee(Number(e.target.value))}
              className="w-full p-2.5 rounded-xl bg-[#262C37]/30 text-white focus:outline-none border border-[#2E3543] focus:ring-2 focus:ring-[#C9A865]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">
              For Rent Listing Fee (ETB)
            </label>
            <input
              type="number"
              min={0}
              value={rentFee}
              onChange={e => setRentFee(Number(e.target.value))}
              className="w-full p-2.5 rounded-xl bg-[#262C37]/30 text-white focus:outline-none border border-[#2E3543] focus:ring-2 focus:ring-[#C9A865]"
            />
          </div>
        </div>
      </div>

      {/* Commercial Bank of Ethiopia (CBE) Details */}
      <div className="bg-[#181B22] border border-[#2E3543] rounded-2xl p-6 shadow-lg space-y-4">
        <div className="flex items-center gap-2 border-b border-[#2E3543] pb-3">
          <Building2 className="text-purple-400" size={20} />
          <h2 className="text-lg font-bold text-white">Commercial Bank of Ethiopia (CBE) Transfer Details</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">
              CBE Account Number
            </label>
            <input
              type="text"
              value={cbeAccountNumber}
              onChange={e => setCbeAccountNumber(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-[#262C37]/30 text-white font-mono focus:outline-none border border-[#2E3543] focus:ring-2 focus:ring-[#C9A865]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">
              Account Holder Name
            </label>
            <input
              type="text"
              value={cbeAccountName}
              onChange={e => setCbeAccountName(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-[#262C37]/30 text-white focus:outline-none border border-[#2E3543] focus:ring-2 focus:ring-[#C9A865]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">
              Bank Name
            </label>
            <input
              type="text"
              value={cbeBankName}
              onChange={e => setCbeBankName(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-[#262C37]/30 text-white focus:outline-none border border-[#2E3543] focus:ring-2 focus:ring-[#C9A865]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">
              Branch Name
            </label>
            <input
              type="text"
              value={cbeBranch}
              onChange={e => setCbeBranch(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-[#262C37]/30 text-white focus:outline-none border border-[#2E3543] focus:ring-2 focus:ring-[#C9A865]"
            />
          </div>
        </div>
      </div>

      {/* Telebirr Details */}
      <div className="bg-[#181B22] border border-[#2E3543] rounded-2xl p-6 shadow-lg space-y-4">
        <div className="flex items-center gap-2 border-b border-[#2E3543] pb-3">
          <Smartphone className="text-emerald-400" size={20} />
          <h2 className="text-lg font-bold text-white">Telebirr Mobile Account Details</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">
              Telebirr Phone Number
            </label>
            <input
              type="text"
              value={telebirrPhone}
              onChange={e => setTelebirrPhone(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-[#262C37]/30 text-white font-mono focus:outline-none border border-[#2E3543] focus:ring-2 focus:ring-[#C9A865]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">
              Telebirr Account Name
            </label>
            <input
              type="text"
              value={telebirrName}
              onChange={e => setTelebirrName(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-[#262C37]/30 text-white focus:outline-none border border-[#2E3543] focus:ring-2 focus:ring-[#C9A865]"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button
          onClick={handleSave}
          loading={saving}
          className="bg-[#C9A865] hover:bg-[#B6924D] text-white font-bold px-6 py-2.5 rounded-xl shadow-lg transition"
        >
          Save All Payment Settings
        </Button>
      </div>
    </div>
  );
}

