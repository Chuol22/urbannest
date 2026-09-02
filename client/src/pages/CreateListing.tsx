/**
 * CreateListing Page
 *
 * Multi-step property listing creation flow with Chapa payment integration.
 * Users can create property listings and choose between Standard and Premium tiers.
 *
 * Flow:
 * Step 1: Property Details Form
 * Step 2: Choose Listing Plan & Pay
 * Step 3: Redirect to Chapa Payment
 *
 * @author UrbanNEST Team
 * @version 2.0.0
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Home, MapPin, DollarSign, BedDouble, Bath,
  ChevronRight, ChevronLeft, CreditCard, Zap, Star,
  CheckCircle, AlertTriangle, Loader2
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { propertyService } from '../services/propertyService';
import { paymentService } from '../services/paymentService';

/* ==========================================================================
   Types & Interfaces
   ========================================================================== */

interface LocationData {
  country: string;
  city: string;
  subCity: string;
  address: string;
  latitude: string;
  longitude: string;
}

interface FormData {
  title: string;
  description: string;
  property_type: string;
  purpose: string;
  price: string;
  bedrooms: string;
  bathrooms: string;
  currency: string;
  locationData: LocationData;
}

type ListingTier = 'standard' | 'premium';

/* ==========================================================================
   Constants
   ========================================================================== */

/**
 * Listing fee structure based on purpose and tier.
 * Standard: ETB 50 (rent), ETB 100 (sale/lease)
 * Premium: ETB 100 (rent), ETB 200 (sale/lease)
 */
const LISTING_FEES: Record<string, Record<ListingTier, number>> = {
  rent: { standard: 50, premium: 100 },
  short_term_rental: { standard: 50, premium: 100 },
  long_term_rental: { standard: 50, premium: 100 },
  sale: { standard: 100, premium: 200 },
  lease: { standard: 100, premium: 200 },
  other: { standard: 100, premium: 200 },
};

/** Input field styling class */
const INPUT_CLASS = `
  w-full px-4 py-3 bg-slate-50 dark:bg-slate-800
  border border-slate-200 dark:border-slate-700
  rounded-xl text-sm focus:ring-2 focus:ring-emerald-500
  focus:border-transparent outline-none transition dark:text-white
`;

/* ==========================================================================
   Helper Functions
   ========================================================================== */

/**
 * Calculate listing fee based on property purpose and selected tier.
 * Falls back to sale pricing if purpose is not found.
 */
function calculateFee(purpose: string, tier: ListingTier): number {
  return (LISTING_FEES[purpose] ?? LISTING_FEES.sale)[tier];
}

/** Check if purpose is a rental type */
function isRentalPurpose(purpose: string): boolean {
  return ['rent', 'short_term_rental', 'long_term_rental'].includes(purpose);
}

/* ==========================================================================
   UI Components
   ========================================================================== */

/**
 * Step progress indicator showing current position in the listing flow.
 * Displays three steps: Property Details, Choose Plan, Pay & Submit.
 */
function StepBar({ step }: { step: number }) {
  const steps = ['Property Details', 'Choose Plan', 'Pay & Submit'];

  return (
    <div className="flex items-center justify-center mb-10 gap-0">
      {steps.map((label, index) => {
        const stepNumber = index + 1;
        const isActive = step === stepNumber;
        const isComplete = step > stepNumber;

        return (
          <React.Fragment key={stepNumber}>
            {/* Step Circle */}
            <div className="flex flex-col items-center">
              <div
                className={`
                  w-9 h-9 rounded-full flex items-center justify-center
                  font-bold text-sm transition-all
                  ${isComplete
                    ? 'bg-emerald-600 text-white'
                    : isActive
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                      : 'bg-slate-200 text-slate-400'
                  }
                `}
              >
                {isComplete ? <CheckCircle size={18} /> : stepNumber}
              </div>
              <span
                className={`
                  mt-1.5 text-xs font-semibold
                  ${isActive
                    ? 'text-emerald-600'
                    : isComplete
                      ? 'text-emerald-500'
                      : 'text-slate-400'
                  }
                `}
              >
                {label}
              </span>
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div
                className={`
                  h-0.5 w-16 mx-1 mb-5 transition-all
                  ${isComplete ? 'bg-emerald-500' : 'bg-slate-200'}
                `}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/**
 * Reusable form field wrapper with label and optional required indicator.
 */
function Field({
  label,
  required = false,
  children
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
        {label}
        {required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

/* ==========================================================================
   Main Component
   ========================================================================== */

/**
 * CreateListing Component
 *
 * Handles the complete property listing creation flow including:
 * - Form validation and submission
 * - Draft property creation
 * - Tier selection (Standard/Premium)
 * - Chapa payment initialization
 */
const CreateListing: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  // Refresh user profile on mount to fetch latest verification_status from server
  React.useEffect(() => {
    if (refreshUser) {
      refreshUser();
    }
  }, [refreshUser]);

  /* ----- State Management ----- */

  const [step, setStep] = useState(1);
  const [tier, setTier] = useState<ListingTier>('standard');
  const [submitting, setSubmitting] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [createdPropertyId, setCreatedPropertyId] = useState<string | null>(null);
  const [error, setError] = useState('');

  /** Safely converts any value to a displayable string */
  const toStr = (val: unknown): string => {
    if (!val) return '';
    if (typeof val === 'string') return val;
    if (typeof val === 'object') {
      try {
        return Object.entries(val as Record<string, unknown>)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
          .join(' | ');
      } catch { return JSON.stringify(val); }
    }
    return String(val);
  };

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

  /* ----- Computed Values ----- */

  const fee = calculateFee(form.purpose, tier);
  const isRent = isRentalPurpose(form.purpose);

  /* ----- Event Handlers ----- */

  /**
   * Handle form input changes.
   * Location fields are prefixed with 'loc_' and mapped to locationData.
   */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name.startsWith('loc_')) {
      const locationField = name.replace('loc_', '');
      setForm(prev => ({
        ...prev,
        locationData: { ...prev.locationData, [locationField]: value }
      }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  /**
   * Step 1: Create property draft.
   * Validates form data and saves property to database in 'pending' state.
   */
  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    console.log('[CREATE LISTING] Starting property creation...');
    console.log('[CREATE LISTING] Form data:', form);

    // Validate required fields
    const { title, description, price, locationData } = form;
    if (!title || !description || !price || !locationData.city || !locationData.address) {
      const missingFields = [];
      if (!title) missingFields.push('title');
      if (!description) missingFields.push('description');
      if (!price) missingFields.push('price');
      if (!locationData.city) missingFields.push('city');
      if (!locationData.address) missingFields.push('address');

      console.error('[CREATE LISTING] Missing required fields:', missingFields);
      setError('Please fill in all required fields: ' + missingFields.join(', '));
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        title: title.trim(),
        description: description.trim(),
        property_type: form.property_type,
        purpose: form.purpose,
        price: parseFloat(price),
        bedrooms: parseInt(form.bedrooms) || 0,
        bathrooms: parseFloat(form.bathrooms) || 0,
        sitting_area: 0,
        kitchen: false,
        currency: form.currency,
        location: locationData,
      };

      console.log('[CREATE LISTING] Sending payload:', payload);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response: any = await propertyService.createProperty(payload as any);

      console.log('[CREATE LISTING] Response received:', response);

      const property = response?.data ?? response;

      if (!property?.id) {
        console.error('[CREATE LISTING] No property ID in response:', response);
        throw new Error('Failed to save property draft - no property ID returned.');
      }

      console.log('[CREATE LISTING] Property created successfully:', property.id);
      setCreatedPropertyId(property.id);
      setStep(2);
    } catch (err: any) {
      console.error('[CREATE LISTING] Error creating property:', err);
      console.error('[CREATE LISTING] Error response:', err.response?.data);
      console.error('[CREATE LISTING] Error code:', err.code);

      // Extract error message from server response or use default
      let errorMessage = 'Failed to create property draft.';

      if (err.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout - the server took too long to respond. Please try again.';
      } else if (err.code === 'ERR_NETWORK') {
        errorMessage = 'Network error - please check your internet connection and try again.';
      } else if (err.response?.status === 403) {
        errorMessage = err.response?.data?.message || 'Your account must be verified before creating listings.';
      } else if (err.response?.status === 400) {
        // Parse detailed validation errors from express-validator middleware
        const data = err.response?.data;

        if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
          // Format: "field: message; field2: message2"
          errorMessage = data.errors
            .map((e: any) => `${e.field || e.path || 'Field'}: ${e.message || e.msg}`)
            .join('; ');
        } else if (data.groupedErrors && typeof data.groupedErrors === 'object') {
          // Format grouped errors: "field: msg1, msg2"
          errorMessage = Object.entries(data.groupedErrors)
            .map(([field, messages]: [string, any]) => {
              const msgs = Array.isArray(messages) ? messages.join(', ') : messages;
              return `${field}: ${msgs}`;
            })
            .join('; ');
        } else {
          errorMessage = data.message || 'Invalid property data. Please check all fields.';
        }
      } else if (err.response?.status === 500) {
        errorMessage = err.response?.data?.message || 'Server error occurred. Please try again.';
      } else {
        const serverErrors = err?.response?.data?.errors;
        if (Array.isArray(serverErrors) && serverErrors.length > 0) {
          errorMessage = serverErrors.map((e: any) => e.message || e.msg || e).join('. ');
        } else if (err?.response?.data?.message) {
          errorMessage = err.response.data.message;
        } else if (err?.message) {
          errorMessage = err.message;
        }
      }

      console.error('[CREATE LISTING] Final error message:', errorMessage);
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Step 2: Initialize Chapa payment.
   * Stores payment context in localStorage and redirects to Chapa checkout.
   */
  const handlePayNow = async () => {
    if (!createdPropertyId) return;

    setError('');
    setPaymentLoading(true);

    try {
      const response = await paymentService.initializeListingFee(createdPropertyId, tier);

      if (response?.success && response?.data?.checkout_url) {
        // Persist payment context for post-redirect verification
        localStorage.setItem('pendingListingFee', JSON.stringify({
          property_id: createdPropertyId,
          tx_ref: response.data.tx_ref,
          tier: response.data.tier || tier,
        }));

        // Redirect to Chapa payment page
        window.location.href = response.data.checkout_url;
      } else {
        setError(toStr(response?.message) || 'Could not initialize payment. Please try again.');
      }
    } catch (err: any) {
      const raw = err?.response?.data?.message ?? err?.response?.data?.error ?? err?.message;
      setError(toStr(raw) || 'Failed to initialize payment.');
    } finally {
      setPaymentLoading(false);
    }
  };

  /** Navigate to previous step */
  const goBack = () => setStep(prev => Math.max(1, prev - 1));

  /* ----- Render Guards ----- */

  // Show verification notice for unapproved accounts
  const isApprovedUser = user?.role === 'admin' || user?.is_verified === true || user?.verification_status === 'approved';

  if (user && !isApprovedUser) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex items-center justify-center p-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="text-amber-600" size={32} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Account Not Verified
          </h2>
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

  /* ----- Main Render ----- */

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-emerald-950/10 py-12 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Page Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-emerald-600 rounded-2xl mb-4 shadow-lg shadow-emerald-600/20">
            <Home className="text-white" size={26} />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
            List a Property
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Reach thousands of buyers and tenants across Ethiopia
          </p>
        </div>

        {/* Step Progress */}
        <StepBar step={step} />

        {/* Error Banner */}
        {error && (
          <div className="mb-6 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="text-rose-500 shrink-0 mt-0.5" size={18} />
            <p className="text-sm text-rose-700 dark:text-rose-400">{error}</p>
          </div>
        )}

        {/* ========================================
            STEP 1: Property Details Form
            ======================================== */}
        {step === 1 && (
          <form onSubmit={handleStep1Submit} className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 p-8 space-y-6">

            {/* Section Header */}
            <div className="flex items-center gap-2 mb-2">
              <Home className="text-emerald-600" size={20} />
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Property Details
              </h2>
            </div>

            {/* Title & Description */}
            <Field label="Property Title" required>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                className={INPUT_CLASS}
                placeholder="e.g. Modern 3BR Apartment in Bole"
                required
              />
            </Field>

            <Field label="Description" required>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={4}
                className={INPUT_CLASS}
                placeholder="Describe the property: features, nearby landmarks, condition..."
                required
              />
            </Field>

            {/* Property Type & Purpose */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="Property Type" required>
                <select
                  name="property_type"
                  value={form.property_type}
                  onChange={handleChange}
                  className={INPUT_CLASS}
                >
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
                <select
                  name="purpose"
                  value={form.purpose}
                  onChange={handleChange}
                  className={INPUT_CLASS}
                >
                  <option value="rent">For Rent</option>
                  <option value="sale">For Sale</option>
                  <option value="lease">For Lease</option>
                  <option value="short_term_rental">Short-Term Rental</option>
                  <option value="long_term_rental">Long-Term Rental</option>
                </select>
              </Field>
            </div>

            {/* Price & Currency */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="Asking Price (ETB)" required>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    name="price"
                    type="number"
                    value={form.price}
                    onChange={handleChange}
                    className={`${INPUT_CLASS} pl-9`}
                    placeholder="e.g. 25000"
                    required
                    min="0"
                  />
                </div>
              </Field>

              <Field label="Currency">
                <select
                  name="currency"
                  value={form.currency}
                  onChange={handleChange}
                  className={INPUT_CLASS}
                >
                  <option value="ETB">ETB (Birr)</option>
                  <option value="USD">USD</option>
                  <option value="SSP">SSP</option>
                </select>
              </Field>
            </div>

            {/* Bedrooms & Bathrooms */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="Bedrooms">
                <div className="relative">
                  <BedDouble className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    name="bedrooms"
                    type="number"
                    value={form.bedrooms}
                    onChange={handleChange}
                    className={`${INPUT_CLASS} pl-9`}
                    min="0"
                    max="20"
                  />
                </div>
              </Field>

              <Field label="Bathrooms">
                <div className="relative">
                  <Bath className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    name="bathrooms"
                    type="number"
                    value={form.bathrooms}
                    onChange={handleChange}
                    className={`${INPUT_CLASS} pl-9`}
                    min="0"
                    max="20"
                    step="0.5"
                  />
                </div>
              </Field>
            </div>

            {/* Location Section */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-5 space-y-4">
              <div className="flex items-center gap-2">
                <MapPin className="text-emerald-600" size={18} />
                <span className="font-bold text-gray-800 dark:text-gray-200 text-sm">Location</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="City" required>
                  <input
                    name="loc_city"
                    value={form.locationData.city}
                    onChange={handleChange}
                    className={INPUT_CLASS}
                    placeholder="e.g. Addis Ababa"
                    required
                  />
                </Field>

                <Field label="Sub-City / District">
                  <input
                    name="loc_subCity"
                    value={form.locationData.subCity}
                    onChange={handleChange}
                    className={INPUT_CLASS}
                    placeholder="e.g. Bole, Kirkos..."
                  />
                </Field>
              </div>

              <Field label="Full Address" required>
                <input
                  name="loc_address"
                  value={form.locationData.address}
                  onChange={handleChange}
                  className={INPUT_CLASS}
                  placeholder="e.g. Bole Road, Near Edna Mall"
                  required
                />
              </Field>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-600/20"
            >
              {submitting ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Saving...
                </>
              ) : (
                <>
                  <ChevronRight size={18} />
                  Next: Choose Listing Plan
                </>
              )}
            </button>
          </form>
        )}

        {/* ========================================
            STEP 2: Choose Listing Plan
            ======================================== */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 p-8">

              {/* Section Header */}
              <div className="flex items-center gap-2 mb-6">
                <Star className="text-emerald-600" size={20} />
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Choose Your Listing Plan
                </h2>
              </div>

              {/* How It Works */}
              <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-xl text-sm text-emerald-800 dark:text-emerald-300">
                <strong>How it works:</strong> Pay a small one-time listing fee to host your property on UrbanNEST.
                Buyers and tenants discover you directly, then contact you via phone or WhatsApp for offline
                negotiation and site visit.
              </div>

              {/* Plan Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                {/* Standard Plan */}
                <button
                  type="button"
                  onClick={() => setTier('standard')}
                  className={`
                    relative border-2 rounded-2xl p-6 text-left transition-all
                    ${tier === 'standard'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-emerald-300'
                    }
                  `}
                >
                  {tier === 'standard' && (
                    <div className="absolute top-3 right-3 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                      <CheckCircle className="text-white" size={14} />
                    </div>
                  )}

                  <div className="text-2xl font-extrabold text-gray-900 dark:text-white mb-1">
                    ETB {calculateFee(form.purpose, 'standard')}
                  </div>
                  <div className="font-bold text-gray-700 dark:text-gray-200 mb-3">
                    Standard Listing
                  </div>

                  <ul className="space-y-1.5 text-xs text-gray-500 dark:text-gray-400">
                    <li className="flex items-center gap-1.5">
                      <CheckCircle size={12} className="text-emerald-500 shrink-0" />
                      Listed for 30 days
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle size={12} className="text-emerald-500 shrink-0" />
                      Up to 8 photos
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle size={12} className="text-emerald-500 shrink-0" />
                      Standard search visibility
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle size={12} className="text-emerald-500 shrink-0" />
                      Phone / WhatsApp contact card
                    </li>
                  </ul>

                  <div className="mt-3 text-xs text-gray-400 italic">
                    {isRent ? 'Rent / Short-Term' : 'Sale / Lease'} listing fee
                  </div>
                </button>

                {/* Premium Plan */}
                <button
                  type="button"
                  onClick={() => setTier('premium')}
                  className={`
                    relative border-2 rounded-2xl p-6 text-left transition-all
                    ${tier === 'premium'
                      ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-violet-300'
                    }
                  `}
                >
                  <div className="absolute top-3 left-3 bg-violet-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    FEATURED
                  </div>

                  {tier === 'premium' && (
                    <div className="absolute top-3 right-3 w-5 h-5 bg-violet-500 rounded-full flex items-center justify-center">
                      <CheckCircle className="text-white" size={14} />
                    </div>
                  )}

                  <div className="text-2xl font-extrabold text-gray-900 dark:text-white mb-1 mt-4">
                    ETB {calculateFee(form.purpose, 'premium')}
                  </div>
                  <div className="font-bold text-gray-700 dark:text-gray-200 mb-3">
                    Premium Listing
                  </div>

                  <ul className="space-y-1.5 text-xs text-gray-500 dark:text-gray-400">
                    <li className="flex items-center gap-1.5">
                      <Zap size={12} className="text-violet-500 shrink-0" />
                      Featured badge & top placement
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Zap size={12} className="text-violet-500 shrink-0" />
                      Listed for 60 days
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Zap size={12} className="text-violet-500 shrink-0" />
                      Up to 20 photos
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Zap size={12} className="text-violet-500 shrink-0" />
                      Priority admin review
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Zap size={12} className="text-violet-500 shrink-0" />
                      WhatsApp quick-connect button
                    </li>
                  </ul>
                </button>
              </div>

              {/* Payment Summary */}
              <div className="mt-6 border border-slate-100 dark:border-slate-700 rounded-xl p-5 bg-slate-50/50 dark:bg-slate-800/40">
                <h4 className="font-bold text-sm text-gray-800 dark:text-gray-200 mb-3">
                  Payment Summary
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Listing tier</span>
                    <span className="font-semibold capitalize text-gray-800 dark:text-gray-200">
                      {tier}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Purpose</span>
                    <span className="font-semibold capitalize text-gray-800 dark:text-gray-200">
                      {form.purpose.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-2 mt-2">
                    <span className="font-bold text-gray-800 dark:text-gray-200">Listing Fee</span>
                    <span className="font-extrabold text-emerald-600">ETB {fee}</span>
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="mt-5">
                <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                  Accepted Payment Methods
                </h4>
                <div className="flex flex-wrap gap-2">
                  {['Telebirr', 'CBE Birr', 'Bank Transfer', 'Mobile Money'].map(method => (
                    <span
                      key={method}
                      className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-lg font-medium"
                    >
                      {method}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-8">
                <button
                  type="button"
                  onClick={goBack}
                  className="flex items-center gap-1.5 px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-semibold transition"
                >
                  <ChevronLeft size={16} />
                  Back
                </button>

                <button
                  type="button"
                  onClick={handlePayNow}
                  disabled={paymentLoading}
                  className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition shadow-lg shadow-emerald-600/20"
                >
                  {paymentLoading ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Redirecting to payment...
                    </>
                  ) : (
                    <>
                      <CreditCard size={18} />
                      Pay ETB {fee} & Submit
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Security Notice */}
            <p className="text-xs text-center text-gray-400 dark:text-gray-500">
              🔒 Payment is processed securely via Chapa. After payment, your listing will be
              reviewed by our team within 24 hours.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateListing;
