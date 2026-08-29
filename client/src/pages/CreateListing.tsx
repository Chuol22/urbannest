// client/src/pages/CreateListing.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Home, MapPin, DollarSign, BedDouble, Bath, ChevronRight, ChevronLeft,
  CreditCard, Zap, Star, CheckCircle, AlertTriangle, Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { propertyService } from '../services/propertyService';
import { paymentService } from '../services/paymentService';

// ----- Types -----
interface FormData {
  title: string;
  description: string;
  property_type: string;
  purpose: string;
  price: string;
  bedrooms: string;
  bathrooms: string;
  currency: string;
  locationData: {
    country: string;
    city: string;
    subCity: string;
    address: string;
    latitude: string;
    longitude: string;
  };
}

type ListingTier = 'standard' | 'premium';

// ----- Fee Constants -----
const FEES: Record<string, Record<ListingTier, number>> = {
  rent:             { standard: 50,  premium: 100 },
  short_term_rental:{ standard: 50,  premium: 100 },
  long_term_rental: { standard: 50,  premium: 100 },
  sale:             { standard: 100, premium: 200 },
  lease:            { standard: 100, premium: 200 },
  other:            { standard: 100, premium: 200 },
};

function getFee(purpose: string, tier: ListingTier): number {
  return (FEES[purpose] ?? FEES.sale)[tier];
}

// ----- Step indicator -----
function StepBar({ step }: { step: number }) {
  const steps = ['Property Details', 'Choose Plan', 'Pay & Submit'];
  return (
    <div className="flex items-center justify-center mb-10 gap-0">
      {steps.map((label, i) => {
        const idx = i + 1;
        const active = step === idx;
        const done   = step > idx;
        return (
          <React.Fragment key={idx}>
            <div className="flex flex-col items-center">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                done   ? 'bg-emerald-600 text-white' :
                active ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' :
                         'bg-slate-200 text-slate-400'
              }`}>
                {done ? <CheckCircle size={18} /> : idx}
              </div>
              <span className={`mt-1.5 text-xs font-semibold ${active ? 'text-emerald-600' : done ? 'text-emerald-500' : 'text-slate-400'}`}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`h-0.5 w-16 mx-1 mb-5 transition-all ${done ? 'bg-emerald-500' : 'bg-slate-200'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ----- Field helpers -----
function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
        {label}{required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = "w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition dark:text-white";

// ============================
// MAIN COMPONENT
// ============================
const CreateListing: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [tier, setTier] = useState<ListingTier>('standard');
  const [submitting, setSubmitting] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [createdPropertyId, setCreatedPropertyId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const [form, setForm] = useState<FormData>({
    title: '',
    description: '',
    property_type: 'apartment',
    purpose: 'rent',
    price: '',
    bedrooms: '1',
    bathrooms: '1',
    currency: 'ETB',
    locationData: {
      country: 'Ethiopia',
      city: '',
      subCity: '',
      address: '',
      latitude: '9.0054',
      longitude: '38.7636',
    },
  });

  const fee = getFee(form.purpose, tier);
  const isRent = ['rent', 'short_term_rental', 'long_term_rental'].includes(form.purpose);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('loc_')) {
      setForm(f => ({ ...f, locationData: { ...f.locationData, [name.replace('loc_', '')]: value } }));
    } else {
      setForm(f => ({ ...f, [name]: value }));
    }
  };

  // ----- Step 1 → Step 2: Save draft property -----
  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.title || !form.description || !form.price || !form.locationData.city || !form.locationData.address) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      setSubmitting(true);
      const payload: any = {
        title: form.title.trim(),
        description: form.description.trim(),
        property_type: form.property_type,
        purpose: form.purpose,
        price: parseFloat(form.price),
        bedrooms: parseInt(form.bedrooms) || 0,
        bathrooms: parseFloat(form.bathrooms) || 0,
        sitting_area: 0,
        kitchen: false,
        currency: form.currency,
        location: form.locationData,
      };

      const res: any = await propertyService.createProperty(payload);
      const property = res?.data ?? res;
      if (!property?.id) throw new Error('Failed to save property draft.');
      setCreatedPropertyId(property.id);
      setStep(2);
    } catch (err: any) {
      const serverErrors = err?.response?.data?.errors;
      let msg = '';
      if (Array.isArray(serverErrors) && serverErrors.length > 0) {
        msg = serverErrors.map((e: any) => e.message || e.msg || e).join('. ');
      } else {
        msg = err?.response?.data?.message || err?.message || 'Failed to create property draft.';
      }
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ----- Step 2 → Step 3: Choose tier, then pay -----
  const handlePayNow = async () => {
    if (!createdPropertyId) return;
    setError('');
    setPaymentLoading(true);

    try {
      const res = await paymentService.initializeListingFee(createdPropertyId);
      if (res?.success && res?.data?.checkout_url) {
        // Store property ID for verification after redirect
        localStorage.setItem('pendingListingFee', JSON.stringify({
          property_id: createdPropertyId,
          tx_ref: res.data.tx_ref,
          tier,
        }));
        // Redirect to Chapa payment page
        window.location.href = res.data.checkout_url;
      } else {
        setError(res?.message || 'Could not initialize payment. Please try again.');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to initialize payment.';
      setError(msg);
    } finally {
      setPaymentLoading(false);
    }
  };

  const goBack = () => setStep(s => Math.max(1, s - 1));

  // ---- Check if account is verified ----
  if (user && user.verification_status !== 'approved') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex items-center justify-center p-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="text-amber-600" size={32} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Account Not Verified</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Your account must be verified by the admin before you can create property listings.
            {user.verification_status === 'rejected' && (
              <span className="block mt-2 text-rose-600 font-medium">
                Your previous verification was rejected. Please upload a valid document.
              </span>
            )}
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3 rounded-xl transition"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-emerald-950/10 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-emerald-600 rounded-2xl mb-4 shadow-lg shadow-emerald-600/20">
            <Home className="text-white" size={26} />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">List a Property</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Reach thousands of buyers and tenants across Ethiopia</p>
        </div>

        <StepBar step={step} />

        {/* Error Banner */}
        {error && (
          <div className="mb-6 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="text-rose-500 shrink-0 mt-0.5" size={18} />
            <p className="text-sm text-rose-700 dark:text-rose-400">{error}</p>
          </div>
        )}

        {/* ================================ STEP 1: PROPERTY DETAILS ================================ */}
        {step === 1 && (
          <form onSubmit={handleStep1Submit} className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 p-8 space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <Home className="text-emerald-600" size={20} />
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Property Details</h2>
            </div>

            <Field label="Property Title" required>
              <input name="title" value={form.title} onChange={handleChange} className={inputCls}
                placeholder="e.g. Modern 3BR Apartment in Bole" required />
            </Field>

            <Field label="Description" required>
              <textarea name="description" value={form.description} onChange={handleChange} rows={4} className={inputCls}
                placeholder="Describe the property: features, nearby landmarks, condition..." required />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Property Type" required>
                <select name="property_type" value={form.property_type} onChange={handleChange} className={inputCls}>
                  <option value="apartment">Apartment</option>
                  <option value="house">House</option>
                  <option value="office">Office</option>
                  <option value="land">Land</option>
                  <option value="shop_space">Shop Space</option>
                  <option value="warehouse">Warehouse</option>
                  <option value="other">Other</option>
                </select>
              </Field>
              <Field label="Purpose" required>
                <select name="purpose" value={form.purpose} onChange={handleChange} className={inputCls}>
                  <option value="rent">For Rent</option>
                  <option value="sale">For Sale</option>
                  <option value="lease">For Lease</option>
                  <option value="short_term_rental">Short-Term Rental</option>
                  <option value="long_term_rental">Long-Term Rental</option>
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Asking Price (ETB)" required>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input name="price" type="number" value={form.price} onChange={handleChange} className={`${inputCls} pl-9`}
                    placeholder="e.g. 25000" required min="0" />
                </div>
              </Field>
              <Field label="Currency">
                <select name="currency" value={form.currency} onChange={handleChange} className={inputCls}>
                  <option value="ETB">ETB (Birr)</option>
                  <option value="USD">USD</option>
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Bedrooms">
                <div className="relative">
                  <BedDouble className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input name="bedrooms" type="number" value={form.bedrooms} onChange={handleChange} className={`${inputCls} pl-9`}
                    min="0" max="20" />
                </div>
              </Field>
              <Field label="Bathrooms">
                <div className="relative">
                  <Bath className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input name="bathrooms" type="number" value={form.bathrooms} onChange={handleChange} className={`${inputCls} pl-9`}
                    min="0" max="20" step="0.5" />
                </div>
              </Field>
            </div>

            {/* Location */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-5 space-y-4">
              <div className="flex items-center gap-2">
                <MapPin className="text-emerald-600" size={18} />
                <span className="font-bold text-gray-800 dark:text-gray-200 text-sm">Location</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="City" required>
                  <input name="loc_city" value={form.locationData.city} onChange={handleChange} className={inputCls}
                    placeholder="e.g. Addis Ababa" required />
                </Field>
                <Field label="Sub-City / District">
                  <input name="loc_subCity" value={form.locationData.subCity} onChange={handleChange} className={inputCls}
                    placeholder="e.g. Bole, Kirkos..." />
                </Field>
              </div>
              <Field label="Full Address" required>
                <input name="loc_address" value={form.locationData.address} onChange={handleChange} className={inputCls}
                  placeholder="e.g. Bole Road, Near Edna Mall" required />
              </Field>
            </div>

            <button type="submit" disabled={submitting}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-600/20">
              {submitting ? <Loader2 className="animate-spin" size={18} /> : <ChevronRight size={18} />}
              {submitting ? 'Saving...' : 'Next: Choose Listing Plan'}
            </button>
          </form>
        )}

        {/* ================================ STEP 2: CHOOSE PLAN ================================ */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 p-8">
              <div className="flex items-center gap-2 mb-6">
                <Star className="text-emerald-600" size={20} />
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Choose Your Listing Plan</h2>
              </div>

              <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-xl text-sm text-emerald-800 dark:text-emerald-300">
                <strong>How it works:</strong> Pay a small one-time listing fee to host your property on UrbanNEST. Buyers and tenants discover you directly, then contact you via phone or WhatsApp for offline negotiation and site visit.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Standard */}
                <button
                  onClick={() => setTier('standard')}
                  className={`relative border-2 rounded-2xl p-6 text-left transition-all ${
                    tier === 'standard'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-emerald-300'
                  }`}
                >
                  {tier === 'standard' && (
                    <div className="absolute top-3 right-3 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                      <CheckCircle className="text-white" size={14} />
                    </div>
                  )}
                  <div className="text-2xl font-extrabold text-gray-900 dark:text-white mb-1">
                    ETB {getFee(form.purpose, 'standard')}
                  </div>
                  <div className="font-bold text-gray-700 dark:text-gray-200 mb-3">Standard Listing</div>
                  <ul className="space-y-1.5 text-xs text-gray-500 dark:text-gray-400">
                    <li className="flex items-center gap-1.5"><CheckCircle size={12} className="text-emerald-500 shrink-0" /> Listed for 30 days</li>
                    <li className="flex items-center gap-1.5"><CheckCircle size={12} className="text-emerald-500 shrink-0" /> Up to 8 photos</li>
                    <li className="flex items-center gap-1.5"><CheckCircle size={12} className="text-emerald-500 shrink-0" /> Standard search visibility</li>
                    <li className="flex items-center gap-1.5"><CheckCircle size={12} className="text-emerald-500 shrink-0" /> Phone & WhatsApp contact card</li>
                  </ul>
                  <div className="mt-3 text-xs text-gray-400 italic">
                    {isRent ? 'Rent / Short-Term' : 'Sale / Lease'} listing fee
                  </div>
                </button>

                {/* Premium */}
                <button
                  onClick={() => setTier('premium')}
                  className={`relative border-2 rounded-2xl p-6 text-left transition-all ${
                    tier === 'premium'
                      ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-violet-300'
                  }`}
                >
                  <div className="absolute top-3 left-3 bg-violet-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">FEATURED</div>
                  {tier === 'premium' && (
                    <div className="absolute top-3 right-3 w-5 h-5 bg-violet-500 rounded-full flex items-center justify-center">
                      <CheckCircle className="text-white" size={14} />
                    </div>
                  )}
                  <div className="text-2xl font-extrabold text-gray-900 dark:text-white mb-1 mt-4">
                    ETB {getFee(form.purpose, 'premium')}
                  </div>
                  <div className="font-bold text-gray-700 dark:text-gray-200 mb-3">Premium Listing</div>
                  <ul className="space-y-1.5 text-xs text-gray-500 dark:text-gray-400">
                    <li className="flex items-center gap-1.5"><Zap size={12} className="text-violet-500 shrink-0" /> Featured badge & top placement</li>
                    <li className="flex items-center gap-1.5"><Zap size={12} className="text-violet-500 shrink-0" /> Listed for 60 days</li>
                    <li className="flex items-center gap-1.5"><Zap size={12} className="text-violet-500 shrink-0" /> Up to 20 photos</li>
                    <li className="flex items-center gap-1.5"><Zap size={12} className="text-violet-500 shrink-0" /> Priority admin review</li>
                    <li className="flex items-center gap-1.5"><Zap size={12} className="text-violet-500 shrink-0" /> WhatsApp quick-connect button</li>
                  </ul>
                </button>
              </div>

              {/* Fee Breakdown */}
              <div className="mt-6 border border-slate-100 dark:border-slate-700 rounded-xl p-5 bg-slate-50/50 dark:bg-slate-800/40">
                <h4 className="font-bold text-sm text-gray-800 dark:text-gray-200 mb-3">Payment Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Listing tier</span>
                    <span className="font-semibold capitalize text-gray-800 dark:text-gray-200">{tier}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Purpose</span>
                    <span className="font-semibold capitalize text-gray-800 dark:text-gray-200">{form.purpose.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-2 mt-2">
                    <span className="font-bold text-gray-800 dark:text-gray-200">Listing Fee</span>
                    <span className="font-extrabold text-emerald-600">ETB {fee}</span>
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="mt-5">
                <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Accepted Payment Methods</h4>
                <div className="flex flex-wrap gap-2">
                  {['Telebirr', 'CBE Birr', 'Bank Transfer', 'Mobile Money'].map(m => (
                    <span key={m} className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-lg font-medium">
                      {m}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button onClick={goBack}
                  className="flex items-center gap-1.5 px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-semibold transition">
                  <ChevronLeft size={16} /> Back
                </button>
                <button onClick={handlePayNow} disabled={paymentLoading}
                  className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition shadow-lg shadow-emerald-600/20">
                  {paymentLoading ? <Loader2 className="animate-spin" size={18} /> : <CreditCard size={18} />}
                  {paymentLoading ? 'Redirecting to payment...' : `Pay ETB ${fee} & Submit`}
                </button>
              </div>
            </div>

            <p className="text-xs text-center text-gray-400 dark:text-gray-500">
              🔒 Payment is processed securely via Chapa. After payment, your listing will be reviewed by our team within 24 hours.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateListing;