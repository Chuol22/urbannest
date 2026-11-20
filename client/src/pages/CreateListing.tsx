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
  CheckCircle, AlertTriangle, Loader2, UploadCloud, Image as ImageIcon,
  Trash2, X, Plus
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
  w-full px-4 py-3 bg-white dark:bg-[#262C37]/30
  border border-slate-200 dark:border-[#2E3543]
  rounded-xl text-sm focus:ring-2 focus:ring-[#C9A865]
  focus:border-[#C9A865] outline-none transition text-[#181B22] dark:text-white
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
                    ? 'bg-[#2E7D4F] text-white shadow-md'
                    : isActive
                      ? 'bg-[#181B22] text-white ring-2 ring-[#C9A865] shadow-lg shadow-[#181B22]/30'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                  }
                `}
              >
                {isComplete ? <CheckCircle size={18} /> : stepNumber}
              </div>
              <span
                className={`
                  mt-1.5 text-xs font-semibold
                  ${isActive
                    ? 'text-[#181B22] dark:text-[#C9A865]'
                    : isComplete
                      ? 'text-[#2E7D4F]'
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
                  ${isComplete ? 'bg-[#2E7D4F]' : 'bg-slate-200 dark:bg-slate-700'}
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

  // Photo Upload States
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [primaryIndex, setPrimaryIndex] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

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

  /**
   * Handle generic input changes for form state
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('loc_')) {
      const locKey = name.replace('loc_', '');
      setForm(prev => ({
        ...prev,
        locationData: {
          ...prev.locationData,
          [locKey]: value,
        },
      }));
    } else {
      setForm(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  /**
   * Handle Photo Selection and Previews
   */
  const handlePhotoFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const validFiles: File[] = [];
    const validPreviews: string[] = [];

    const currentTotal = photos.length;
    const remainingSlots = 10 - currentTotal;

    if (remainingSlots <= 0) {
      setError('You can upload a maximum of 10 photos.');
      return;
    }

    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    for (const file of filesToProcess) {
      if (!file.type.startsWith('image/')) {
        setError(`File "${file.name}" is not an image. Please upload JPG, PNG or WebP files.`);
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError(`Image "${file.name}" exceeds 10MB limit.`);
        continue;
      }
      validFiles.push(file);
      validPreviews.push(URL.createObjectURL(file));
    }

    if (validFiles.length > 0) {
      setError('');
      setPhotos(prev => [...prev, ...validFiles]);
      setPhotoPreviews(prev => [...prev, ...validPreviews]);
    }
  };

  const handleRemovePhoto = (indexToRemove: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== indexToRemove));
    setPhotoPreviews(prev => {
      URL.revokeObjectURL(prev[indexToRemove]);
      return prev.filter((_, i) => i !== indexToRemove);
    });

    if (primaryIndex === indexToRemove) {
      setPrimaryIndex(0);
    } else if (primaryIndex > indexToRemove) {
      setPrimaryIndex(prev => prev - 1);
    }
  };

  const handleSetPrimaryPhoto = (index: number) => {
    setPrimaryIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handlePhotoFiles(e.dataTransfer.files);
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

      // Upload photos if user attached any
      if (photos.length > 0) {
        console.log(`[CREATE LISTING] Uploading ${photos.length} photos for property ${property.id}...`);
        try {
          // Reorder so primary photo is first
          const orderedPhotos = [...photos];
          if (primaryIndex > 0 && primaryIndex < orderedPhotos.length) {
            const [prim] = orderedPhotos.splice(primaryIndex, 1);
            orderedPhotos.unshift(prim);
          }

          const formData = new FormData();
          orderedPhotos.forEach((file) => {
            formData.append('photos', file);
          });

          await propertyService.uploadPropertyPhotos(property.id, formData);
          console.log('[CREATE LISTING] Photos uploaded successfully');
        } catch (photoErr) {
          console.error('[CREATE LISTING] Warning: Failed to upload some photos:', photoErr);
          // Don't fail the whole flow if photos upload fails; user can edit later in dashboard
        }
      }

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
   * Step 2: Navigate to Dashboard to complete manual transfer & upload receipt.
   */
  const handlePayNow = () => {
    if (!createdPropertyId) {
      navigate('/dashboard');
      return;
    }
    navigate(`/dashboard?payProperty=${createdPropertyId}`);
  };

  /** Navigate to previous step */
  const goBack = () => setStep(prev => Math.max(1, prev - 1));

  /* ----- Render Guards ----- */

  // Show verification notice for unapproved accounts
  const isApprovedUser = user?.role === 'admin' || user?.is_verified === true || user?.verification_status === 'approved';

  if (user && !isApprovedUser) {
    return (
      <div className="min-h-screen bg-[#F4F5EF] dark:bg-[#0F1116] flex items-center justify-center p-6">
        <div className="bg-white dark:bg-[#181B22] border border-gray-200 dark:border-[#2E3543] rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-[#C9A865]/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#C9A865]/30">
            <AlertTriangle className="text-[#C9A865]" size={32} />
          </div>
          <h2 className="text-xl font-bold text-[#181B22] dark:text-white mb-2">
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
            className="bg-[#181B22] hover:bg-[#262C37] text-white border border-[#C9A865] font-semibold px-6 py-3 rounded-xl transition shadow-md shadow-[#181B22]/20"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  /* ----- Main Render ----- */

  return (
    <div className="min-h-screen bg-[#F4F5EF] dark:bg-[#0F1116] py-12 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Page Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-[#181B22] border border-[#C9A865] rounded-2xl mb-4 shadow-lg shadow-[#181B22]/20">
            <Home className="text-[#C9A865]" size={26} />
          </div>
          <h1 className="text-3xl font-extrabold text-[#181B22] dark:text-white">
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
          <form onSubmit={handleStep1Submit} className="bg-white dark:bg-[#181B22] rounded-2xl shadow-xl border border-slate-100 dark:border-[#2E3543] p-8 space-y-6">

            {/* Section Header */}
            <div className="flex items-center gap-2 mb-2">
              <Home className="text-[#C9A865]" size={20} />
              <h2 className="text-lg font-bold text-[#181B22] dark:text-white">
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
            <div className="border-t border-slate-100 dark:border-[#2E3543] pt-5 space-y-4">
              <div className="flex items-center gap-2">
                <MapPin className="text-[#C9A865]" size={18} />
                <span className="font-bold text-[#181B22] dark:text-gray-200 text-sm">Location</span>
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

            {/* Property Photos Section */}
            <div className="border-t border-slate-100 dark:border-[#2E3543] pt-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ImageIcon className="text-[#C9A865]" size={18} />
                  <span className="font-bold text-[#181B22] dark:text-gray-200 text-sm">Property Photos</span>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {photos.length}/10 photos selected
                </span>
              </div>

              {/* Drag and Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all
                  ${isDragging
                    ? 'border-[#C9A865] bg-[#C9A865]/10 scale-[1.01]'
                    : 'border-slate-300 dark:border-[#2E3543] hover:border-[#C9A865] hover:bg-[#F4F5EF] dark:hover:bg-[#262C37]/20'
                  }
                `}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  onChange={(e) => handlePhotoFiles(e.target.files)}
                  className="hidden"
                />
                <div className="w-12 h-12 mx-auto rounded-full bg-[#181B22]/10 dark:bg-[#262C37]/50 flex items-center justify-center text-[#181B22] dark:text-[#C9A865] mb-3">
                  <UploadCloud size={24} />
                </div>
                <p className="text-sm font-bold text-[#181B22] dark:text-white">
                  Click to upload or drag & drop property photos
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  High quality JPG, PNG or WebP (up to 10MB each, max 10 photos)
                </p>
              </div>

              {/* Photo Previews Gallery */}
              {photoPreviews.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                  {photoPreviews.map((previewUrl, idx) => {
                    const isPrimary = idx === primaryIndex;
                    return (
                      <div
                        key={idx}
                        className={`
                          relative group rounded-xl overflow-hidden border-2 aspect-video bg-slate-900 shadow-sm transition
                          ${isPrimary ? 'border-[#C9A865] ring-2 ring-[#C9A865]/30' : 'border-slate-200 dark:border-[#2E3543]'}
                        `}
                      >
                        <img
                          src={previewUrl}
                          alt={`Upload preview ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />

                        {/* Badges / Controls Overlay */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                          {!isPrimary && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSetPrimaryPhoto(idx);
                              }}
                              className="px-2 py-1 bg-[#C9A865] hover:bg-[#B6924D] text-white text-[10px] font-bold rounded-md flex items-center gap-1 shadow"
                              title="Set as cover photo"
                            >
                              <Star size={10} />
                              Cover
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemovePhoto(idx);
                            }}
                            className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-md shadow"
                            title="Remove photo"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>

                        {/* Top Banner Tag */}
                        {isPrimary ? (
                          <span className="absolute top-1.5 left-1.5 bg-[#C9A865] text-white text-[10px] font-bold px-2 py-0.5 rounded shadow flex items-center gap-1">
                            <Star size={10} className="fill-white" />
                            Cover Photo
                          </span>
                        ) : (
                          <span className="absolute top-1.5 left-1.5 bg-black/60 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded backdrop-blur-xs">
                            #{idx + 1}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#181B22] hover:bg-[#262C37] disabled:opacity-60 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition border border-[#C9A865] shadow-lg shadow-[#181B22]/20"
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
            <div className="bg-white dark:bg-[#181B22] rounded-2xl shadow-xl border border-slate-100 dark:border-[#2E3543] p-8">

              {/* Section Header */}
              <div className="flex items-center gap-2 mb-6">
                <Star className="text-[#C9A865]" size={20} />
                <h2 className="text-lg font-bold text-[#181B22] dark:text-white">
                  Choose Your Listing Plan
                </h2>
              </div>

              {/* How It Works */}
              <div className="mb-6 p-4 bg-[#F4F5EF] dark:bg-[#262C37]/30 border border-[#2E3543] rounded-xl text-sm text-[#181B22] dark:text-gray-200">
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
                      ? 'border-[#181B22] dark:border-[#C9A865] bg-[#181B22]/5 dark:bg-[#262C37]/30 shadow-md'
                      : 'border-slate-200 dark:border-[#2E3543] hover:border-[#C9A865]/50'
                    }
                  `}
                >
                  {tier === 'standard' && (
                    <div className="absolute top-3 right-3 w-5 h-5 bg-[#2E7D4F] rounded-full flex items-center justify-center">
                      <CheckCircle className="text-white" size={14} />
                    </div>
                  )}

                  <div className="text-2xl font-extrabold text-[#181B22] dark:text-white mb-1">
                    ETB {calculateFee(form.purpose, 'standard')}
                  </div>
                  <div className="font-bold text-gray-700 dark:text-gray-200 mb-3">
                    Standard Listing
                  </div>

                  <ul className="space-y-1.5 text-xs text-gray-500 dark:text-gray-400">
                    <li className="flex items-center gap-1.5">
                      <CheckCircle size={12} className="text-[#2E7D4F] shrink-0" />
                      Listed for 30 days
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle size={12} className="text-[#2E7D4F] shrink-0" />
                      Up to 8 photos
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle size={12} className="text-[#2E7D4F] shrink-0" />
                      Standard search visibility
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle size={12} className="text-[#2E7D4F] shrink-0" />
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
                      ? 'border-[#C9A865] bg-[#C9A865]/10 dark:bg-[#C9A865]/15 shadow-md'
                      : 'border-slate-200 dark:border-[#2E3543] hover:border-[#C9A865]/50'
                    }
                  `}
                >
                  <div className="absolute top-3 left-3 bg-[#C9A865] text-[#181B22] text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                    FEATURED
                  </div>

                  {tier === 'premium' && (
                    <div className="absolute top-3 right-3 w-5 h-5 bg-[#C9A865] rounded-full flex items-center justify-center">
                      <CheckCircle className="text-white" size={14} />
                    </div>
                  )}

                  <div className="text-2xl font-extrabold text-[#181B22] dark:text-white mb-1 mt-4">
                    ETB {calculateFee(form.purpose, 'premium')}
                  </div>
                  <div className="font-bold text-gray-700 dark:text-gray-200 mb-3">
                    Premium Listing
                  </div>

                  <ul className="space-y-1.5 text-xs text-gray-500 dark:text-gray-400">
                    <li className="flex items-center gap-1.5">
                      <Zap size={12} className="text-[#C9A865] shrink-0" />
                      Featured badge & top placement
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Zap size={12} className="text-[#C9A865] shrink-0" />
                      Listed for 60 days
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Zap size={12} className="text-[#C9A865] shrink-0" />
                      Up to 20 photos
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Zap size={12} className="text-[#C9A865] shrink-0" />
                      Priority admin review
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Zap size={12} className="text-[#C9A865] shrink-0" />
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
                    <span className="font-extrabold text-[#2E7D4F]">ETB {fee}</span>
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
                      className="text-xs bg-[#F4F5EF] dark:bg-[#262C37]/30 text-[#181B22] dark:text-gray-300 border border-slate-200 dark:border-[#2E3543] px-3 py-1.5 rounded-lg font-medium"
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
                  className="flex-1 flex items-center justify-center gap-2 bg-[#181B22] hover:bg-[#262C37] text-white font-bold py-3 rounded-xl transition border border-[#C9A865] shadow-lg shadow-[#181B22]/20"
                >
                  <CreditCard size={18} />
                  Proceed to Pay ETB {fee} & Upload Receipt
                </button>
              </div>
            </div>

            {/* Security Notice */}
            <p className="text-xs text-center text-gray-400 dark:text-gray-500">
              🔒 Offline Payment: Transfer via Commercial Bank of Ethiopia (CBE) or Telebirr and upload receipt for admin verification.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateListing;
