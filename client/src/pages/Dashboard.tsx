import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Home,
  Plus,
  List,
  CreditCard,
  User,
  Settings,
  LogOut,
  Share2,
  CheckCircle,
  Clock,
  XCircle,
  ExternalLink,
  TrendingUp,
  Eye,
  AlertTriangle,
  Loader2,
  DollarSign,
  Receipt,
  PartyPopper,
  UploadCloud,
  FileText,
  Trash2,
  Paperclip,
  Edit3,
  Image as ImageIcon,
  Star,
  Copy,
  Check,
  Building2,
  Smartphone,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { propertyService } from '../services/propertyService';
import { paymentService } from '../services/paymentService';
import { userService } from '../services/userService';
import { Alert } from '../components/ui/Alert';
import logo from '../assets/images/unlogo.png';

// ---- Status helpers ----
function getStatusLabel(property: any): { label: string; color: string; description: string } {
  if (property.listing_payment_status === 'pending_verification') {
    return {
      label: 'Pending Verification',
      color: 'bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300 border border-amber-300 dark:border-amber-700/50',
      description: 'Proof of payment uploaded. Admin is verifying funds in CBE / Telebirr.',
    };
  }
  if (!property.listing_fee_paid) {
    if (property.listing_payment_status === 'rejected') {
      return {
        label: 'Receipt Rejected',
        color: 'bg-rose-100 text-rose-800 dark:bg-rose-950/20 dark:text-rose-400 border border-rose-300 dark:border-rose-800',
        description: property.listing_rejection_reason || 'Receipt rejected. Please re-upload proof of payment.',
      };
    }
    return {
      label: 'Awaiting Payment',
      color: 'bg-[#FCFAF5] text-[#947337] border border-[#EDE2C6]',
      description: 'Transfer listing fee to submit for review',
    };
  }
  switch (property.status) {
    case 'available':
      return {
        label: 'Published',
        color: 'bg-[#F0F8F3] text-[#2E7D4F] border border-[#BCE1CA]',
        description: 'Live and visible to the public',
      };
    case 'pending':
      return {
        label: 'Pending Review',
        color: 'bg-[#FCFAF5] text-[#947337] border border-[#EDE2C6]',
        description: 'Under admin review',
      };
    case 'withdrawn':
      return {
        label: 'Rejected',
        color: 'bg-rose-100 text-rose-800 dark:bg-rose-950/20 dark:text-rose-400',
        description: property.listing_rejection_reason || 'Rejected by admin',
      };
    default:
      return {
        label: property.status,
        color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
        description: '',
      };
  }
}

export default function Dashboard() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'listings' | 'payments' | 'profile' | 'verification' | 'settings'>('overview');
  const [payNowLoading, setPayNowLoading] = useState<string | null>(null);

  // Edit Property State
  const [editingProperty, setEditingProperty] = useState<any | null>(null);
  const [editForm, setEditForm] = useState<{
    title: string;
    description: string;
    property_type: string;
    purpose: string;
    price: string;
    currency: string;
    bedrooms: string;
    bathrooms: string;
    sitting_area: string;
    kitchen: boolean;
    city: string;
    subCity: string;
    address: string;
  }>({
    title: '',
    description: '',
    property_type: 'apartment',
    purpose: 'rent',
    price: '',
    currency: 'ETB',
    bedrooms: '1',
    bathrooms: '1',
    sitting_area: '0',
    kitchen: false,
    city: '',
    subCity: '',
    address: '',
  });

  const [existingPhotos, setExistingPhotos] = useState<any[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [newPhotos, setNewPhotos] = useState<File[]>([]);
  const [newPhotoPreviews, setNewPhotoPreviews] = useState<string[]>([]);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editModalTab, setEditModalTab] = useState<'details' | 'photos'>('details');
  const editFileInputRef = useRef<HTMLInputElement | null>(null);

  // Delete Property State
  const [propertyToDelete, setPropertyToDelete] = useState<any | null>(null);
  const [deletingProperty, setDeletingProperty] = useState(false);
  const [properties, setProperties] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paymentVerifying, setPaymentVerifying] = useState(false);
  const [paymentResult, setPaymentResult] = useState<'success' | 'failed' | null>(null);

  // Manual Offline Payment Modal State
  const [paymentModalProperty, setPaymentModalProperty] = useState<any | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'CBE' | 'TELEBIRR'>('CBE');
  const [selectedTier, setSelectedTier] = useState<'standard' | 'premium'>('standard');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptFilePreview, setReceiptFilePreview] = useState<string | null>(null);
  const [referenceCodeInput, setReferenceCodeInput] = useState('');
  const [paymentNotesInput, setPaymentNotesInput] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [paymentModalError, setPaymentModalError] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const paymentReceiptInputRef = useRef<HTMLInputElement | null>(null);
  const [transferInfo, setTransferInfo] = useState<any>(null);

  // Verification document upload states
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docSuccess, setDocSuccess] = useState('');
  const [docError, setDocError] = useState('');

  const handleFileChange = (file: File | null) => {
    setDocError('');
    setDocSuccess('');
    if (!file) {
      setSelectedFile(null);
      setFilePreview(null);
      return;
    }

    // 10MB limit
    if (file.size > 10 * 1024 * 1024) {
      setDocError('File size exceeds 10MB limit. Please select a smaller file.');
      return;
    }

    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'application/pdf'];
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];
    const isMimeAllowed = allowedMimeTypes.includes(file.type);
    const isExtAllowed = allowedExtensions.some(ext => file.name.toLowerCase().endsWith(ext));

    if (!isMimeAllowed && !isExtAllowed) {
      setDocError('Invalid file type. Please upload a PDF, PNG, JPG, or WEBP file.');
      return;
    }

    setSelectedFile(file);
    if (file.type.startsWith('image/')) {
      const previewUrl = URL.createObjectURL(file);
      setFilePreview(previewUrl);
    } else {
      setFilePreview(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleUploadDocument = async () => {
    if (!selectedFile) {
      setDocError('Please select a file first.');
      return;
    }
    setUploadingDoc(true);
    setDocError('');
    setDocSuccess('');
    try {
      const res = await userService.uploadVerificationDocument(selectedFile);
      if (res?.success) {
        setDocSuccess(res.message || 'Verification document uploaded successfully. Your account is pending admin review.');
        setSelectedFile(null);
        setFilePreview(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        await refreshUser();
      } else {
        setDocError(res?.message || 'Failed to upload document. Please try again.');
      }
    } catch (err: any) {
      console.error('Document upload error:', err);
      setDocError(err?.response?.data?.message || err?.message || 'Failed to upload document. Please try again.');
    } finally {
      setUploadingDoc(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  // ---- Handle Chapa return redirect ----
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const isPaymentReturn = params.get('payment') === 'success';
    const propertyId = params.get('property');
    const urlTxRef = params.get('tx_ref') || params.get('trx_ref');

    if (isPaymentReturn && propertyId) {
      // Clean URL immediately while passing urlTxRef to verify
      window.history.replaceState({}, '', '/dashboard');
      verifyReturnPayment(propertyId, urlTxRef);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  // ---- Handle auto-opening manual payment modal from URL (e.g. after CreateListing) ----
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const payPropId = params.get('payProperty') || params.get('pay');
    if (payPropId && properties.length > 0) {
      const target = properties.find(p => p.id === payPropId);
      if (target) {
        openPaymentModal(target);
        window.history.replaceState({}, '', '/dashboard');
      }
    }
  }, [location.search, properties]);

  async function verifyReturnPayment(propertyId: string, urlTxRef?: string | null) {
    setPaymentVerifying(true);
    try {
      let txRef = urlTxRef;
      if (!txRef) {
        const pending = localStorage.getItem('pendingListingFee');
        if (pending) {
          try {
            const parsed = JSON.parse(pending);
            if (!parsed.property_id || parsed.property_id === propertyId) {
              txRef = parsed.tx_ref;
            }
          } catch (e) {
            console.error('Error parsing pendingListingFee:', e);
          }
        }
      }

      const res = await paymentService.verifyListingFee(propertyId, txRef || '');
      if (res?.success) {
        localStorage.removeItem('pendingListingFee');
        setPaymentResult('success');
        setSuccessMessage(res.message || 'Payment confirmed! Your listing is now under admin review.');
        setActiveTab('listings');
        // Reload listings and payment history to reflect new status
        const propRes = await propertyService.getUserProperties(1, 50);
        setProperties(propRes.data || []);
        const payRes = await paymentService.getPaymentHistory().catch(() => null);
        if (payRes && payRes.data) {
          const payList = Array.isArray(payRes.data)
            ? payRes.data
            : payRes.data.transactions || payRes.data.payments || [];
          setPayments(payList);
        }
      } else {
        setPaymentResult('failed');
      }
    } catch (err) {
      console.error('Verify return payment error:', err);
      setPaymentResult('failed');
    } finally {
      setPaymentVerifying(false);
    }
  }

  // ---- Fetch dashboard data ----
  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        setError('');

        console.log('[Dashboard] Loading dashboard data...');

        // Fetch user properties
        try {
          const propRes = await propertyService.getUserProperties(1, 50);
          console.log('[Dashboard] Properties response:', propRes);

          if (propRes && propRes.data) {
            setProperties(propRes.data);
            console.log('[Dashboard] Loaded', propRes.data.length, 'properties');
          } else {
            console.warn('[Dashboard] Unexpected properties response format:', propRes);
            setProperties([]);
          }
        } catch (propErr: any) {
          console.error('[Dashboard] Failed to load properties:', propErr);
          console.error('[Dashboard] Properties error response:', propErr.response?.data);

          // Still try to load payments even if properties fail
          setProperties([]);

          // Only show error if it's a critical auth issue
          if (propErr.response?.status === 401 || propErr.response?.status === 403) {
            throw propErr;
          }
        }

        // Fetch payment history (non-critical, show warning but don't fail)
        try {
          const payRes = await paymentService.getPaymentHistory();
          console.log('[Dashboard] Payments response:', payRes);

          if (payRes && payRes.data) {
            const payList = Array.isArray(payRes.data)
              ? payRes.data
              : payRes.data.transactions || payRes.data.payments || [];
            setPayments(payList);
            console.log('[Dashboard] Loaded', payList.length, 'payments');
          } else {
            setPayments([]);
          }
        } catch (payErr: any) {
          console.warn('[Dashboard] Failed to load payment history:', payErr);
          console.warn('[Dashboard] Payment error response:', payErr.response?.data);
          // Don't fail the whole dashboard if payments fail
          setPayments([]);
        }

        console.log('[Dashboard] Dashboard data loaded successfully');
      } catch (err: any) {
        console.error('[Dashboard] Critical error loading dashboard:', err);
        console.error('[Dashboard] Error response:', err.response?.data);

        const errorMessage = err.response?.data?.message || err.message || 'Failed to load dashboard data. Please try again.';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      console.log('[Dashboard] User authenticated, loading data for:', user.email);
      loadDashboardData();
    } else {
      console.log('[Dashboard] No authenticated user');
    }
  }, [user]);

  // Refresh user profile on mount to update account status (e.g. admin approval)
  useEffect(() => {
    if (refreshUser) {
      refreshUser();
    }
  }, [refreshUser]);

  // Fetch manual transfer account details on mount
  useEffect(() => {
    paymentService.getManualTransferInfo()
      .then(res => {
        if (res?.data) {
          setTransferInfo(res.data);
        }
      })
      .catch(err => {
        console.warn('[Dashboard] Could not fetch manual transfer info:', err);
      });
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // ---- Pay listing fee inline ----

  /** Safely converts any error value to a displayable string */
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

  const handlePayNow = async (propertyId: string, tier: 'standard' | 'premium' = 'standard') => {
    setPayNowLoading(propertyId);
    setError('');
    try {
      const res = await paymentService.initializeListingFee(propertyId, tier);
      if (res?.success && res?.data?.checkout_url) {
        localStorage.setItem('pendingListingFee', JSON.stringify({
          property_id: propertyId,
          tx_ref: res.data.tx_ref,
          tier: res.data.tier || tier,
        }));
        window.location.href = res.data.checkout_url;
      } else {
        setError(toStr(res?.message) || 'Could not initialize payment. Try again.');
      }
    } catch (err: any) {
      const raw = err?.response?.data?.message ?? err?.response?.data?.error ?? err?.message;
      setError(toStr(raw) || 'Failed to initiate payment.');
    } finally {
      setPayNowLoading(null);
    }
  };

  // ---- Manual Transfer / Payment Modal Handlers ----
  const openPaymentModal = (property: any) => {
    setPaymentModalProperty(property);
    setSelectedPaymentMethod('CBE');
    setSelectedTier(property.listing_tier === 'premium' ? 'premium' : 'standard');
    setReceiptFile(null);
    if (receiptFilePreview) {
      URL.revokeObjectURL(receiptFilePreview);
    }
    setReceiptFilePreview(null);
    setReferenceCodeInput('');
    setPaymentNotesInput('');
    setPaymentModalError('');
    setCopiedField(null);
  };

  const closePaymentModal = () => {
    if (receiptFilePreview) {
      URL.revokeObjectURL(receiptFilePreview);
    }
    setReceiptFile(null);
    setReceiptFilePreview(null);
    setPaymentModalProperty(null);
    setPaymentModalError('');
    setCopiedField(null);
  };

  const handleCopyText = (text: string, fieldId: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => {
      setCopiedField(null);
    }, 2500);
  };

  const handleReceiptFileSelect = (file: File | null) => {
    setPaymentModalError('');
    if (!file) {
      setReceiptFile(null);
      if (receiptFilePreview) URL.revokeObjectURL(receiptFilePreview);
      setReceiptFilePreview(null);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setPaymentModalError('Receipt image size exceeds 10MB limit. Please select a smaller file.');
      return;
    }

    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'application/pdf'];
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];
    const isMimeOk = allowedMimeTypes.includes(file.type);
    const isExtOk = allowedExtensions.some(ext => file.name.toLowerCase().endsWith(ext));

    if (!isMimeOk && !isExtOk) {
      setPaymentModalError('Please upload an image screenshot (PNG, JPG, WEBP) or PDF receipt.');
      return;
    }

    setReceiptFile(file);
    if (file.type.startsWith('image/')) {
      const previewUrl = URL.createObjectURL(file);
      setReceiptFilePreview(previewUrl);
    } else {
      setReceiptFilePreview(null);
    }
  };

  const calculateFee = (prop: any, tier: 'standard' | 'premium') => {
    const isRent = prop?.purpose === 'rent';
    if (isRent) {
      return tier === 'premium' ? 100 : 50;
    }
    return tier === 'premium' ? 200 : 100;
  };

  const handleSubmitManualPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalProperty) return;

    if (!receiptFile) {
      setPaymentModalError('Please upload an image or screenshot of your transfer receipt.');
      return;
    }

    setSubmittingPayment(true);
    setPaymentModalError('');

    try {
      const res = await paymentService.submitManualPayment(
        paymentModalProperty.id,
        receiptFile,
        {
          paymentMethod: selectedPaymentMethod,
          tier: selectedTier,
          referenceCode: referenceCodeInput.trim(),
          notes: paymentNotesInput.trim(),
        }
      );

      if (res?.success) {
        setSuccessMessage('Receipt submitted successfully! Your listing status is now Pending Verification.');
        closePaymentModal();

        // Refresh properties and payments
        const propRes = await propertyService.getUserProperties(1, 50).catch(() => null);
        if (propRes?.data) setProperties(propRes.data);

        const payRes = await paymentService.getPaymentHistory().catch(() => null);
        if (payRes?.data) {
          const payList = Array.isArray(payRes.data)
            ? payRes.data
            : payRes.data.transactions || payRes.data.payments || [];
          setPayments(payList);
        }
        setTimeout(() => setSuccessMessage(''), 6000);
      } else {
        setPaymentModalError(toStr(res?.message) || 'Failed to submit payment. Please try again.');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.response?.data?.error || err?.message || 'Error uploading receipt.';
      setPaymentModalError(toStr(msg));
    } finally {
      setSubmittingPayment(false);
    }
  };

  // ---- Edit Property Handlers ----
  const openEditModal = async (property: any) => {
    setEditingProperty(property);
    setEditForm({
      title: property.title || '',
      description: property.description || '',
      property_type: property.property_type || 'apartment',
      purpose: property.purpose || 'rent',
      price: property.price ? String(property.price) : '',
      currency: property.currency || 'ETB',
      bedrooms: property.bedrooms !== undefined ? String(property.bedrooms) : '1',
      bathrooms: property.bathrooms !== undefined ? String(property.bathrooms) : '1',
      sitting_area: property.sitting_area !== undefined ? String(property.sitting_area) : '0',
      kitchen: Boolean(property.kitchen),
      city: property.location?.city || '',
      subCity: property.location?.subCity || '',
      address: property.location?.address || '',
    });
    setNewPhotos([]);
    setNewPhotoPreviews([]);
    setEditModalTab('details');

    // Load property photos
    try {
      setLoadingPhotos(true);
      const photosData = await propertyService.getPropertyPhotos(property.id);
      setExistingPhotos(photosData);
    } catch (err) {
      console.error('Failed to load photos for edit:', err);
      setExistingPhotos(property.photos || []);
    } finally {
      setLoadingPhotos(false);
    }
  };

  const closeEditModal = () => {
    setEditingProperty(null);
    newPhotoPreviews.forEach(url => URL.revokeObjectURL(url));
    setNewPhotos([]);
    setNewPhotoPreviews([]);
  };

  const handleNewPhotoFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const currentTotal = existingPhotos.length + newPhotos.length;
    const remainingSlots = 10 - currentTotal;
    if (remainingSlots <= 0) {
      setError('Maximum of 10 photos reached.');
      return;
    }
    const filesToAdd = Array.from(files).slice(0, remainingSlots);
    const validFiles: File[] = [];
    const validPreviews: string[] = [];
    for (const f of filesToAdd) {
      if (!f.type.startsWith('image/')) continue;
      validFiles.push(f);
      validPreviews.push(URL.createObjectURL(f));
    }
    setNewPhotos(prev => [...prev, ...validFiles]);
    setNewPhotoPreviews(prev => [...prev, ...validPreviews]);
  };

  const handleDeleteExistingPhoto = async (photoId: string) => {
    if (!editingProperty) return;
    try {
      await propertyService.deletePropertyPhoto(editingProperty.id, photoId);
      setExistingPhotos(prev => prev.filter(p => p.id !== photoId));
      setSuccessMessage('Photo removed successfully.');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      console.error('Delete photo error:', err);
      setError('Failed to delete photo.');
    }
  };

  const handleSetPrimaryExistingPhoto = async (photoId: string) => {
    if (!editingProperty) return;
    try {
      await propertyService.setPrimaryPhoto(editingProperty.id, photoId);
      setExistingPhotos(prev => prev.map(p => ({ ...p, isPrimary: p.id === photoId })));
      setSuccessMessage('Primary cover photo updated.');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      console.error('Set primary photo error:', err);
      setError('Failed to set primary photo.');
    }
  };

  const handleSavePropertyEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProperty) return;
    setSavingEdit(true);
    setError('');
    try {
      const payload = {
        title: editForm.title.trim(),
        description: editForm.description.trim(),
        property_type: editForm.property_type,
        purpose: editForm.purpose,
        price: parseFloat(editForm.price),
        currency: editForm.currency,
        bedrooms: parseInt(editForm.bedrooms) || 0,
        bathrooms: parseFloat(editForm.bathrooms) || 0,
        sitting_area: parseInt(editForm.sitting_area) || 0,
        kitchen: editForm.kitchen,
        location: {
          city: editForm.city.trim(),
          subCity: editForm.subCity.trim(),
          address: editForm.address.trim(),
          country: 'Ethiopia'
        }
      };

      await propertyService.updateProperty(editingProperty.id, payload as any);

      // Upload new photos if any
      if (newPhotos.length > 0) {
        const formData = new FormData();
        newPhotos.forEach(file => formData.append('photos', file));
        await propertyService.uploadPropertyPhotos(editingProperty.id, formData);
      }

      // Refresh properties list
      const propRes = await propertyService.getUserProperties(1, 50);
      setProperties(propRes.data || []);

      closeEditModal();
      setSuccessMessage('Property updated successfully!');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err: any) {
      console.error('Failed to update property:', err);
      setError(err?.response?.data?.message || 'Failed to update property details.');
    } finally {
      setSavingEdit(false);
    }
  };

  // ---- Delete Property Handlers ----
  const handleInitiateDelete = (property: any) => {
    setPropertyToDelete(property);
  };

  const handleCancelDelete = () => {
    setPropertyToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!propertyToDelete) return;
    setDeletingProperty(true);
    setError('');
    try {
      await propertyService.deleteProperty(propertyToDelete.id);
      setProperties(prev => prev.filter(p => p.id !== propertyToDelete.id));
      setSuccessMessage(`"${propertyToDelete.title}" has been permanently deleted from the platform.`);
      setTimeout(() => setSuccessMessage(''), 4000);
      setPropertyToDelete(null);
      if (editingProperty?.id === propertyToDelete.id) {
        closeEditModal();
      }
    } catch (err: any) {
      console.error('Delete property error:', err);
      setError(err?.response?.data?.message || 'Failed to delete property.');
    } finally {
      setDeletingProperty(false);
    }
  };

  // ---- Stats ----
  const totalProperties = properties.length;
  const publishedProperties = properties.filter(p => p.status === 'available').length;
  const pendingProperties = properties.filter(p => p.status === 'pending' || p.listing_payment_status === 'pending_verification').length;
  const awaitingPayment = properties.filter(p => !p.listing_fee_paid && p.listing_payment_status !== 'pending_verification').length;
  const rejectedProperties = properties.filter(p => p.status === 'withdrawn' || p.listing_rejection_reason || p.listing_payment_status === 'rejected').length;

  return (
    <div className="min-h-screen bg-[#F4F5EF] dark:bg-[#0F1116] flex flex-col md:flex-row font-sans">
      {/* Sidebar Navigation - Dominant Charcoal #181B22 */}
      <aside className="w-full md:w-64 bg-[#181B22] text-white flex flex-col justify-between p-6 md:sticky md:top-0 md:h-screen z-10 border-r border-[#2E3543]">
        <div>
          {/* Logo / Brand Header */}
          <div className="flex flex-col mb-8">
            <Link to="/" className="inline-block group mb-2.5">
              <div className="bg-white/95 px-3 py-2 rounded-xl shadow-md border border-[#C9A865]/30 inline-flex items-center justify-center max-w-[190px]">
                <img src={logo} alt="UrbanNest Logo" className="h-8 w-auto object-contain transition-transform group-hover:scale-105" />
              </div>
            </Link>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#C9A865] animate-pulse"></span>
              <span className="font-bold text-xs uppercase tracking-widest text-[#C9A865]">Broker & Agent Portal</span>
            </div>
          </div>

          {/* User quick profile */}
          <div className="mb-8 p-4 bg-[#262C37]/50 rounded-xl border border-[#2E3543]">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-[#2E7D4F] flex items-center justify-center text-white font-bold">
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </div>
              <div className="overflow-hidden">
                <p className="font-bold text-sm truncate">{user?.first_name} {user?.last_name}</p>
                <p className="text-xs text-gray-400 capitalize">{user?.role === 'owner' ? 'Property Owner' : user?.role}</p>
              </div>
            </div>
            {/* Verification status badge */}
            <div className="mt-3 flex items-center justify-between text-xs border-t border-[#2E3543] pt-2">
              <span className="text-gray-400">Account status:</span>
              {user?.verification_status === 'approved' ? (
                <span className="text-[#2E7D4F] font-medium flex items-center"><CheckCircle size={12} className="mr-1" /> Verified</span>
              ) : user?.verification_status === 'rejected' ? (
                <span className="text-rose-400 font-medium flex items-center"><XCircle size={12} className="mr-1" /> Rejected</span>
              ) : (
                <span className="text-[#C9A865] font-medium flex items-center"><Clock size={12} className="mr-1" /> Pending</span>
              )}
            </div>
          </div>

          {/* Menu Links */}
          <nav className="space-y-1">
            {[
              { id: 'overview', icon: <Home size={18} />, label: 'Overview' },
              { id: 'listings', icon: <List size={18} />, label: 'My Properties', badge: awaitingPayment > 0 ? awaitingPayment : undefined },
              { id: 'payments', icon: <CreditCard size={18} />, label: 'Payment History' },
              { id: 'profile', icon: <User size={18} />, label: 'Identity Verification' },
              { id: 'settings', icon: <Settings size={18} />, label: 'Settings' },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-semibold transition ${(activeTab === item.id || (item.id === 'profile' && activeTab === 'verification'))
                  ? 'bg-[#C9A865] text-[#181B22] font-bold shadow-md'
                  : 'text-gray-300 hover:bg-[#262C37] hover:text-white'
                  }`}
              >
                {item.icon}
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge !== undefined && (
                  <span className="bg-[#181B22] text-[#C9A865] text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Logout button at bottom */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-semibold text-rose-400 hover:bg-rose-950/30 hover:text-rose-300 transition mt-6"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">

        {/* Payment Verifying overlay */}
        {paymentVerifying && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-[#181B22] rounded-2xl p-8 text-center shadow-2xl border border-gray-100 dark:border-[#2E3543]">
              <Loader2 className="animate-spin text-[#C9A865] mx-auto mb-3" size={36} />
              <p className="font-bold text-gray-900 dark:text-white">Verifying your payment...</p>
              <p className="text-sm text-gray-500 mt-1">Please wait, do not close this page.</p>
            </div>
          </div>
        )}

        {/* Payment Result Banners */}
        {paymentResult === 'success' && (
          <div className="mb-6 bg-[#F0F8F3] dark:bg-[#2E7D4F]/20 border border-[#BCE1CA] dark:border-[#2E7D4F]/40 rounded-xl p-4 flex items-center gap-3">
            <PartyPopper className="text-[#2E7D4F] shrink-0" size={22} />
            <div>
              <p className="font-bold text-[#2E7D4F] dark:text-[#5CAE78] text-sm">Payment Successful! 🎉</p>
              <p className="text-xs text-[#2E7D4F]/80 dark:text-[#5CAE78]/80">{successMessage}</p>
            </div>
            <button onClick={() => setPaymentResult(null)} className="ml-auto text-[#2E7D4F] hover:text-[#1D5132] text-lg leading-none">×</button>
          </div>
        )}
        {paymentResult === 'failed' && (
          <div className="mb-6 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 rounded-xl p-4 flex items-center gap-3">
            <AlertTriangle className="text-rose-500 shrink-0" size={22} />
            <div>
              <p className="font-bold text-rose-800 dark:text-rose-300 text-sm">Payment Verification Failed</p>
              <p className="text-xs text-rose-700 dark:text-rose-400">We couldn't confirm your payment. If you paid, please contact support with your transaction reference.</p>
            </div>
            <button onClick={() => setPaymentResult(null)} className="ml-auto text-rose-500 hover:text-rose-700 text-lg leading-none">×</button>
          </div>
        )}

        {/* Verification Alert Banner */}
        {!(user?.role === 'admin' || user?.is_verified === true || user?.verification_status === 'approved') && (
          <div className="mb-6 bg-[#FCFAF5] dark:bg-[#C9A865]/10 border border-[#EDE2C6] dark:border-[#C9A865]/30 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="text-[#C9A865] shrink-0 mt-0.5" size={20} />
              <div>
                <h4 className="font-bold text-[#947337] dark:text-[#DFCFA0] text-sm">Account Verification Required</h4>
                <p className="text-xs text-[#947337]/80 dark:text-[#DFCFA0]/80 mt-1">
                  {user?.verification_status === 'rejected'
                    ? `Your verification document was rejected. Reason: ${user?.verification_rejection_reason || 'Incomplete details'}. Please submit again.`
                    : 'Your registration is pending identity verification by a super admin. Once approved, you can publish listings live.'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('profile')}
              className="bg-[#C9A865] hover:bg-[#B6924D] text-white text-xs font-semibold px-4 py-2 rounded-lg transition"
            >
              Upload Credentials
            </button>
          </div>
        )}

        {error && <Alert type="error" message={error} onClose={() => setError('')} />}

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#C9A865]"></div>
          </div>
        ) : (
          <>
            {/* TAB 1: OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-8 animate-fadeIn">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-extrabold text-[#181B22] dark:text-white">Welcome back, {user?.first_name}!</h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Here is a quick glance at your listings performance.</p>
                  </div>
                  <Link
                    to="/create-listing"
                    className="inline-flex items-center space-x-2 bg-[#181B22] hover:bg-[#262C37] text-white font-semibold px-5 py-3 rounded-xl shadow-lg shadow-[#181B22]/20 border border-[#C9A865] transition self-start sm:self-auto"
                  >
                    <Plus size={18} className="text-[#C9A865]" />
                    <span>List a Property</span>
                  </Link>
                </div>

                {/* Key Metrics Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                  {[
                    { label: 'Total Properties', value: totalProperties, icon: <Home size={22} />, iconBg: 'bg-[#F0F5FC]', iconColor: 'text-[#181B22]', valColor: 'text-[#181B22] dark:text-white' },
                    { label: 'Published', value: publishedProperties, icon: <CheckCircle size={22} />, iconBg: 'bg-[#F0F8F3]', iconColor: 'text-[#2E7D4F]', valColor: 'text-[#2E7D4F]' },
                    { label: 'Pending Review', value: pendingProperties, icon: <Clock size={22} />, iconBg: 'bg-[#FCFAF5]', iconColor: 'text-[#C9A865]', valColor: 'text-[#C9A865]' },
                    { label: 'Awaiting Payment', value: awaitingPayment, icon: <DollarSign size={22} />, iconBg: 'bg-[#FCFAF5]', iconColor: 'text-[#947337]', valColor: 'text-[#947337]' },
                  ].map(({ label, value, icon, iconBg, iconColor, valColor }) => (
                    <div key={label} className="bg-white dark:bg-[#181B22] rounded-2xl shadow-sm border border-gray-100 dark:border-[#2E3543] p-6 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
                        <h3 className={`text-3xl font-extrabold mt-2 ${valColor}`}>{value}</h3>
                      </div>
                      <div className={`w-12 h-12 ${iconBg} dark:bg-white/10 rounded-xl flex items-center justify-center ${iconColor} dark:text-white`}>
                        {icon}
                      </div>
                    </div>
                  ))}
                </div>

                {/* How Platform Works */}
                <div className="bg-white dark:bg-[#181B22] rounded-2xl p-6 border border-gray-100 dark:border-[#2E3543] shadow-sm space-y-4">
                  <h3 className="text-lg font-bold text-[#181B22] dark:text-white flex items-center">
                    <TrendingUp className="text-[#C9A865] mr-2" size={20} />
                    How Your Listings Get Discovered
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-600 dark:text-gray-300">
                    <div className="space-y-2">
                      <h4 className="font-bold text-gray-800 dark:text-gray-200">1. Create & Pay</h4>
                      <p>Fill in your property details, choose Standard or Premium plan, and pay a small one-time listing fee to go live.</p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-bold text-gray-800 dark:text-gray-200">2. Admin Reviews</h4>
                      <p>Our team reviews your listing within 24 hours to ensure quality. Once approved, it's publicly visible to all users.</p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-bold text-gray-800 dark:text-gray-200">3. Buyers Contact You</h4>
                      <p>Interested buyers call or WhatsApp you directly. Negotiate and close deals offline at your own pace.</p>
                    </div>
                  </div>
                </div>

                {/* Recent Properties Quick View */}
                <div className="bg-white dark:bg-[#181B22] rounded-2xl shadow-sm border border-gray-100 dark:border-[#2E3543] p-6">
                  <h3 className="text-lg font-bold text-[#181B22] dark:text-white mb-4">Recent Properties</h3>
                  {properties.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-gray-500">You haven't listed any properties yet.</p>
                      <Link to="/create-listing" className="text-[#181B22] dark:text-[#C9A865] hover:underline text-sm font-semibold mt-2 inline-block">List your first property now →</Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {properties.slice(0, 5).map((property: any) => {
                        const status = getStatusLabel(property);
                        return (
                          <div key={property.id} className="flex items-center justify-between p-4 border border-gray-50 dark:border-[#2E3543]/50 hover:bg-[#F4F5EF] dark:hover:bg-[#262C37]/40 rounded-xl transition">
                            <div className="flex items-center space-x-4">
                              <div className="w-16 h-12 rounded-lg bg-[#F0F5FC] dark:bg-[#262C37] flex items-center justify-center font-bold text-[10px] text-[#181B22] dark:text-gray-300 uppercase text-center px-1">
                                {property.property_type || 'house'}
                              </div>
                              <div>
                                <h4 className="font-bold text-sm text-[#181B22] dark:text-white">{property.title}</h4>
                                <p className="text-xs text-gray-500">{property.purpose} • ETB {property.price?.toLocaleString()}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${status.color}`}>
                                {status.label}
                              </span>
                              <button
                                onClick={() => openEditModal(property)}
                                className="p-1.5 rounded-lg bg-[#181B22]/10 hover:bg-[#181B22]/20 dark:bg-[#262C37] dark:hover:bg-[#1E4F96] text-[#181B22] dark:text-[#C9A865] transition"
                                title="Edit Property"
                              >
                                <Edit3 size={14} />
                              </button>
                              <button
                                onClick={() => handleInitiateDelete(property)}
                                className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 transition"
                                title="Delete Property"
                              >
                                <Trash2 size={14} />
                              </button>
                              {property.listing_fee_paid ? (
                                <Link
                                  to={`/properties/${property.id}`}
                                  className="p-1.5 rounded-lg bg-[#F0F5FC] hover:bg-[#E0ECF8] dark:bg-[#262C37] dark:hover:bg-[#1E4F96] text-[#181B22] dark:text-gray-200 transition"
                                  title="View Public Listing"
                                >
                                  <ExternalLink size={14} />
                                </Link>
                              ) : property.listing_payment_status === 'pending_verification' ? (
                                <span className="text-xs bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 px-2.5 py-1.5 rounded-lg font-semibold flex items-center gap-1">
                                  <Clock size={12} className="animate-spin text-amber-500" />
                                  Verifying
                                </span>
                              ) : property.listing_payment_status === 'rejected' ? (
                                <button
                                  onClick={() => openPaymentModal(property)}
                                  className="text-xs bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1 transition shadow-sm"
                                  title="Re-upload payment proof"
                                >
                                  <UploadCloud size={12} />
                                  Re-upload
                                </button>
                              ) : (
                                <button
                                  onClick={() => openPaymentModal(property)}
                                  className="text-xs bg-[#C9A865] hover:bg-[#B6924D] text-white px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition shadow-sm"
                                >
                                  <CreditCard size={12} />
                                  Pay to Publish
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: MY PROPERTIES */}
            {activeTab === 'listings' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex justify-between items-center">
                  <div>
                    <h1 className="text-2xl font-extrabold text-[#181B22] dark:text-white">My Properties</h1>
                    <p className="text-xs text-gray-500 mt-1">Manage, share, and update your property listings.</p>
                  </div>
                  <Link to="/create-listing" className="inline-flex items-center gap-1.5 bg-[#181B22] hover:bg-[#262C37] text-white font-semibold px-4 py-2 rounded-xl text-sm border border-[#C9A865] transition">
                    <Plus size={16} className="text-[#C9A865]" />
                    New Listing
                  </Link>
                </div>

                <div className="bg-white dark:bg-[#181B22] rounded-2xl shadow-sm border border-gray-100 dark:border-[#2E3543] overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-[#F0F5FC] dark:bg-[#181B22] border-b border-gray-100 dark:border-[#2E3543] text-[#181B22] dark:text-gray-300 font-bold uppercase text-xs">
                        <tr>
                          <th className="px-6 py-4">Property</th>
                          <th className="px-6 py-4">Purpose</th>
                          <th className="px-6 py-4">Price</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-[#2E3543]">
                        {properties.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-gray-500">No properties found. List a new one!</td>
                          </tr>
                        ) : (
                          properties.map((property) => {
                            const status = getStatusLabel(property);
                            return (
                              <tr key={property.id} className="hover:bg-[#F4F5EF] dark:hover:bg-[#262C37]/20 transition">
                                <td className="px-6 py-4">
                                  <div className="font-bold text-[#181B22] dark:text-white text-sm">{property.title}</div>
                                  <div className="text-xs text-gray-500 capitalize">{property.property_type}</div>
                                </td>
                                <td className="px-6 py-4 text-xs font-semibold capitalize text-gray-600 dark:text-gray-300">
                                  {property.purpose?.replace('_', ' ')}
                                </td>
                                <td className="px-6 py-4 text-sm font-bold text-[#181B22] dark:text-white">
                                  ETB {property.price?.toLocaleString()}
                                </td>
                                <td className="px-6 py-4">
                                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${status.color}`} title={status.description}>
                                    {status.label}
                                  </span>
                                  {property.listing_rejection_reason && (
                                    <p className="text-[10px] text-rose-500 mt-1 max-w-[200px]">{property.listing_rejection_reason}</p>
                                  )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      onClick={() => openEditModal(property)}
                                      className="inline-flex items-center gap-1 text-xs bg-[#181B22] hover:bg-[#262C37] text-white border border-[#C9A865]/50 px-3 py-1.5 rounded-lg font-semibold transition"
                                      title="Edit Property Details & Photos"
                                    >
                                      <Edit3 size={12} className="text-[#C9A865]" />
                                      Edit
                                    </button>

                                    <button
                                      onClick={() => handleInitiateDelete(property)}
                                      className="inline-flex items-center gap-1 text-xs bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 px-2.5 py-1.5 rounded-lg font-semibold transition"
                                      title="Delete Property"
                                    >
                                      <Trash2 size={12} />
                                      Delete
                                    </button>

                                    {property.listing_fee_paid ? (
                                      <>
                                        <Link
                                          to={`/properties/${property.id}`}
                                          className="inline-flex items-center justify-center p-2 rounded-lg bg-[#F0F5FC] hover:bg-[#E0ECF8] dark:bg-[#262C37] dark:hover:bg-[#1E4F96] text-[#181B22] dark:text-gray-200 transition"
                                          title="View Public Page"
                                        >
                                          <ExternalLink size={14} />
                                        </Link>
                                        <button
                                          onClick={() => {
                                            const shareUrl = `${window.location.origin}/properties/${property.id}`;
                                            navigator.clipboard.writeText(shareUrl);
                                            setSuccessMessage('Property link copied to clipboard!');
                                            setTimeout(() => setSuccessMessage(''), 3000);
                                          }}
                                          className="inline-flex items-center justify-center p-2 rounded-lg bg-[#F0F8F3] hover:bg-[#DCF0E4] dark:bg-[#2E7D4F]/20 dark:hover:bg-[#2E7D4F]/30 text-[#2E7D4F] transition"
                                          title="Copy Share Link"
                                        >
                                          <Share2 size={14} />
                                        </button>
                                      </>
                                    ) : property.listing_payment_status === 'pending_verification' ? (
                                      <span className="inline-flex items-center gap-1.5 text-xs bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 px-3 py-1.5 rounded-lg font-semibold">
                                        <Clock size={13} className="text-amber-600 dark:text-amber-400 animate-spin" />
                                        Pending Verification
                                      </span>
                                    ) : property.listing_payment_status === 'rejected' ? (
                                      <button
                                        onClick={() => openPaymentModal(property)}
                                        className="inline-flex items-center gap-1.5 text-xs bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-lg font-semibold transition shadow-sm"
                                        title="Re-upload payment proof"
                                      >
                                        <UploadCloud size={13} />
                                        Re-upload Proof
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => openPaymentModal(property)}
                                        className="inline-flex items-center gap-1.5 text-xs bg-[#C9A865] hover:bg-[#B6924D] text-white px-3.5 py-1.5 rounded-lg font-semibold transition shadow-sm"
                                      >
                                        <CreditCard size={13} />
                                        Pay to Publish
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Payment pending notice */}
                {awaitingPayment > 0 && (
                  <div className="bg-[#FCFAF5] dark:bg-[#C9A865]/10 border border-[#EDE2C6] dark:border-[#C9A865]/30 rounded-xl p-4 flex items-start gap-3">
                    <AlertTriangle className="text-[#C9A865] shrink-0 mt-0.5" size={18} />
                    <div>
                      <p className="font-bold text-[#947337] dark:text-[#DFCFA0] text-sm">
                        {awaitingPayment} listing{awaitingPayment > 1 ? 's' : ''} awaiting payment
                      </p>
                      <p className="text-xs text-[#947337]/80 dark:text-[#DFCFA0]/80 mt-0.5">
                        Click "Pay Now" on the listing above to complete the listing fee and submit for admin review.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: PAYMENTS HISTORY */}
            {activeTab === 'payments' && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <h1 className="text-2xl font-extrabold text-[#181B22] dark:text-white">Listing Payments</h1>
                  <p className="text-xs text-gray-500 mt-1">Overview of your property listing fee transactions.</p>
                </div>

                {/* Fee Info Box */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { label: 'Standard (Rent)', fee: 'ETB 50', icon: <Receipt size={20} /> },
                    { label: 'Standard (Sale)', fee: 'ETB 100', icon: <Receipt size={20} /> },
                    { label: 'Premium Listing', fee: '2x Standard', icon: <TrendingUp size={20} /> },
                  ].map(({ label, fee, icon }) => (
                    <div key={label} className="bg-white dark:bg-[#181B22] rounded-xl border border-gray-100 dark:border-[#2E3543] p-4 flex items-center gap-3 shadow-sm">
                      <div className="w-10 h-10 bg-[#FCFAF5] dark:bg-[#C9A865]/20 rounded-lg flex items-center justify-center text-[#C9A865]">
                        {icon}
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">{label}</p>
                        <p className="font-bold text-[#181B22] dark:text-white text-sm">{fee}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-white dark:bg-[#181B22] rounded-2xl shadow-sm border border-gray-100 dark:border-[#2E3543] overflow-hidden">
                  <div className="p-5 border-b border-gray-100 dark:border-[#2E3543] bg-[#F0F5FC]/50 dark:bg-[#262C37]/20">
                    <h4 className="font-bold text-sm text-[#181B22] dark:text-white">Transaction History</h4>
                    <p className="text-xs text-gray-500 mt-0.5">Listing fees paid to host and promote your properties on UrbanNEST.</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-[#F0F5FC] dark:bg-[#262C37]/30 text-[#181B22] dark:text-gray-300 font-bold uppercase text-xs">
                        <tr>
                          <th className="px-5 py-3.5">Reference / Ref</th>
                          <th className="px-5 py-3.5">Property</th>
                          <th className="px-5 py-3.5">Method</th>
                          <th className="px-5 py-3.5">Amount</th>
                          <th className="px-5 py-3.5">Status</th>
                          <th className="px-5 py-3.5">Receipt</th>
                          <th className="px-5 py-3.5">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-[#2E3543]">
                        {payments.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="px-6 py-12 text-center text-gray-500">No payment transactions yet. Transfer listing fee and upload receipt to see records here.</td>
                          </tr>
                        ) : (
                          payments.map((p) => (
                            <tr key={p.id} className="hover:bg-[#F4F5EF] dark:hover:bg-[#262C37]/20 transition">
                              <td className="px-5 py-4 font-mono text-xs text-gray-600 dark:text-gray-300 font-medium">
                                {p.referenceCode || p.chapaTransactionRef || p.id?.slice(0, 12) + '...'}
                              </td>
                              <td className="px-5 py-4 text-sm font-semibold text-gray-700 dark:text-gray-300 max-w-[180px] truncate">
                                {p.property?.title || '—'}
                              </td>
                              <td className="px-5 py-4">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-[#181B22]/10 dark:bg-[#262C37] text-[#181B22] dark:text-[#C9A865]">
                                  {p.paymentMethod === 'TELEBIRR' ? <Smartphone size={11} /> : <Building2 size={11} />}
                                  {p.paymentMethod || 'Manual'}
                                </span>
                              </td>
                              <td className="px-5 py-4 text-sm font-bold text-[#181B22] dark:text-white">ETB {p.amount}</td>
                              <td className="px-5 py-4">
                                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                                  p.status === 'COMPLETED'
                                    ? 'bg-[#F0F8F3] text-[#2E7D4F] border border-[#BCE1CA]'
                                    : p.status === 'PENDING_VERIFICATION'
                                      ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300 border border-amber-300'
                                      : p.status === 'REJECTED' || p.status === 'FAILED'
                                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400'
                                        : 'bg-[#FCFAF5] text-[#947337] border border-[#EDE2C6]'
                                }`}>
                                  {p.status === 'PENDING_VERIFICATION' ? 'Pending Review' : p.status}
                                </span>
                              </td>
                              <td className="px-5 py-4">
                                {p.receiptUrl ? (
                                  <a
                                    href={p.receiptUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-xs text-[#181B22] dark:text-[#C9A865] hover:underline font-semibold"
                                  >
                                    <Receipt size={12} />
                                    View
                                  </a>
                                ) : (
                                  <span className="text-xs text-gray-400">—</span>
                                )}
                              </td>
                              <td className="px-5 py-4 text-xs text-gray-500 whitespace-nowrap">
                                {new Date(p.createdAt || p.created_at).toLocaleDateString('en-ET', { year: 'numeric', month: 'short', day: 'numeric' })}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: IDENTITY VERIFICATION */}
            {(activeTab === 'profile' || activeTab === 'verification') && (
              <div className="space-y-6 animate-fadeIn max-w-2xl">
                <div>
                  <h1 className="text-2xl font-extrabold text-[#181B22] dark:text-white">Identity Verification</h1>
                  <p className="text-xs text-gray-500 mt-1">Submit credentials so the super admin can confirm your identity and approve your account.</p>
                </div>

                {docSuccess && <Alert type="success" message={docSuccess} onClose={() => setDocSuccess('')} />}
                {docError && <Alert type="error" message={docError} onClose={() => setDocError('')} />}

                <div className="bg-white dark:bg-[#181B22] rounded-2xl shadow-sm border border-gray-100 dark:border-[#2E3543] p-6 space-y-6">
                  <div>
                    <h3 className="font-bold text-lg text-[#181B22] dark:text-white">Current Status</h3>
                    <div className="mt-3 p-4 bg-[#F0F5FC] dark:bg-[#262C37]/30 rounded-xl flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium capitalize text-gray-600 dark:text-gray-300">
                          Status: <strong className="text-[#181B22] dark:text-white">
                            {(user?.role === 'admin' || user?.is_verified === true || user?.verification_status === 'approved')
                              ? 'Approved'
                              : (user?.verification_status?.replace('_', ' ') || 'Pending Review')}
                          </strong>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {(user?.role === 'admin' || user?.is_verified === true || user?.verification_status === 'approved')
                            ? 'Approved! You can now publish properties publicly.'
                            : user?.verification_status === 'rejected'
                              ? `Rejected: ${user?.verification_rejection_reason || 'Invalid document. Please submit again.'}`
                              : user?.verification_document_url
                                ? 'Your document is uploaded and under review by our admin team.'
                                : 'Upload your commercial registration license or ID card copy below.'}
                        </p>
                      </div>
                      <div>
                        {(user?.role === 'admin' || user?.is_verified === true || user?.verification_status === 'approved') ? (
                          <CheckCircle className="text-[#2E7D4F]" size={32} />
                        ) : user?.verification_status === 'rejected' ? (
                          <XCircle className="text-rose-500" size={32} />
                        ) : (
                          <Clock className="text-[#C9A865]" size={32} />
                        )}
                      </div>
                    </div>

                    {user?.verification_document_url && (
                      <div className="mt-4 p-3.5 bg-[#F0F8F3] dark:bg-[#2E7D4F]/20 border border-[#BCE1CA] dark:border-[#2E7D4F]/30 rounded-xl flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Paperclip className="text-[#2E7D4F] shrink-0" size={18} />
                          <div>
                            <span className="text-xs font-semibold text-[#2E7D4F] dark:text-[#5CAE78]">Current Submitted Document</span>
                            <p className="text-[11px] text-[#2E7D4F]/70 dark:text-[#5CAE78]/70">File uploaded for verification</p>
                          </div>
                        </div>
                        <a
                          href={user.verification_document_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#2E7D4F] hover:text-[#1D5132] dark:text-[#5CAE78] dark:hover:text-white underline"
                        >
                          <span>View Document</span>
                          <ExternalLink size={13} />
                        </a>
                      </div>
                    )}
                  </div>

                  {!(user?.role === 'admin' || user?.is_verified === true || user?.verification_status === 'approved') && (
                    <div className="border-t border-gray-100 dark:border-gray-700 pt-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                          {user?.verification_document_url ? 'Upload New / Updated Document' : 'Upload Verification Document'}
                        </h4>
                        {selectedFile && (
                          <button
                            type="button"
                            onClick={() => handleFileChange(null)}
                            className="text-xs text-rose-500 hover:text-rose-700 font-medium inline-flex items-center gap-1"
                          >
                            <Trash2 size={13} />
                            <span>Remove File</span>
                          </button>
                        )}
                      </div>

                      {/* Hidden File Input */}
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                        accept=".pdf,.png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp,application/pdf"
                        className="hidden"
                      />

                      {/* Dashed Clickable Upload Dropzone */}
                      {!selectedFile ? (
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                          className={`border-2 border-dashed rounded-xl p-8 text-center transition cursor-pointer ${
                            isDragging
                              ? 'border-[#2E7D4F] bg-[#F0F8F3] dark:bg-[#2E7D4F]/10'
                              : 'border-gray-300 dark:border-[#2E3543] bg-[#F4F5EF] hover:bg-[#F0F5FC] dark:bg-[#262C37]/20 dark:hover:bg-[#262C37]/30'
                          }`}
                        >
                          <UploadCloud className={`mx-auto mb-3 transition-colors ${isDragging ? 'text-[#2E7D4F]' : 'text-gray-400 dark:text-gray-500'}`} size={36} />
                          <span className="block text-sm font-bold text-gray-800 dark:text-gray-200">
                            Click to upload license or National ID copy
                          </span>
                          <span className="block text-xs text-gray-500 dark:text-gray-400 mt-1">
                            PDF, PNG, JPG, WEBP – up to 10MB
                          </span>
                          <span className="inline-block mt-3 px-3 py-1 bg-white dark:bg-[#262C37] border border-gray-200 dark:border-[#2E3543] rounded-lg text-xs font-medium text-[#181B22] dark:text-gray-300 shadow-sm">
                            Browse Files from PC / Phone
                          </span>
                        </div>
                      ) : (
                        /* Selected File Preview Box */
                        <div className="border-2 border-[#2E7D4F]/40 bg-[#F0F8F3] dark:bg-[#2E7D4F]/10 rounded-xl p-4 sm:p-5 flex items-center justify-between gap-4">
                          <div className="flex items-center space-x-3 min-w-0">
                            {filePreview ? (
                              <img src={filePreview} alt="Preview" className="w-12 h-12 object-cover rounded-lg border border-[#BCE1CA] dark:border-[#2E7D4F]/50 shrink-0" />
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-[#DCF0E4] dark:bg-[#2E7D4F]/30 text-[#2E7D4F] flex items-center justify-center shrink-0">
                                <FileText size={24} />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                                {selectedFile.name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {formatFileSize(selectedFile.size)} • <span className="text-[#2E7D4F] dark:text-[#5CAE78] font-semibold">Ready to upload</span>
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-[#262C37] border border-gray-200 dark:border-[#2E3543] rounded-lg hover:bg-gray-50 dark:hover:bg-[#1E4F96] transition"
                            >
                              Change
                            </button>
                            <button
                              type="button"
                              onClick={() => handleFileChange(null)}
                              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition"
                              title="Remove file"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={handleUploadDocument}
                        disabled={!selectedFile || uploadingDoc}
                        className={`w-full font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-sm ${
                          !selectedFile || uploadingDoc
                            ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                            : 'bg-[#181B22] hover:bg-[#262C37] text-white border border-[#C9A865]'
                        }`}
                      >
                        {uploadingDoc ? (
                          <>
                            <Loader2 className="animate-spin" size={18} />
                            <span>Uploading document...</span>
                          </>
                        ) : (
                          <>
                            <UploadCloud size={18} className="text-[#C9A865]" />
                            <span>Submit Verification Document</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 5: SETTINGS */}
            {activeTab === 'settings' && (
              <div className="space-y-6 animate-fadeIn max-w-2xl">
                <div>
                  <h1 className="text-2xl font-extrabold text-[#181B22] dark:text-white">Settings</h1>
                  <p className="text-xs text-gray-500 mt-1">Configure notifications, change password, and customize display options.</p>
                </div>

                <div className="bg-white dark:bg-[#181B22] rounded-2xl shadow-sm border border-gray-100 dark:border-[#2E3543] p-6 space-y-6">
                  <div>
                    <h3 className="font-bold text-sm text-[#181B22] dark:text-white mb-3">Notification Preferences</h3>
                    <div className="space-y-3">
                      <label className="flex items-center space-x-3 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                        <input type="checkbox" defaultChecked className="rounded accent-[#181B22]" />
                        <span>Email notifications when listing is approved or rejected</span>
                      </label>
                      <label className="flex items-center space-x-3 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                        <input type="checkbox" defaultChecked className="rounded accent-[#181B22]" />
                        <span>SMS / WhatsApp alerts for buyer discovery inquiries</span>
                      </label>
                    </div>
                  </div>
                  <div className="border-t border-gray-100 dark:border-[#2E3543] pt-5">
                    <h3 className="font-bold text-sm text-[#181B22] dark:text-white mb-3">Account Info</h3>
                    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex justify-between">
                        <span>Name</span>
                        <span className="font-semibold text-[#181B22] dark:text-white">{user?.first_name} {user?.last_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Phone</span>
                        <span className="font-semibold text-[#181B22] dark:text-white">{user?.phone || '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Email</span>
                        <span className="font-semibold text-[#181B22] dark:text-white">{user?.email || '(not set)'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Role</span>
                        <span className="font-semibold capitalize text-[#181B22] dark:text-white">{user?.role}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t border-gray-100 dark:border-[#2E3543] pt-5">
                    <button className="bg-[#181B22] hover:bg-[#262C37] text-white font-semibold px-6 py-2.5 rounded-xl border border-[#C9A865] transition text-sm">
                      Save Preferences
                    </button>
                  </div>

                  {/* Account Session / Logout Section */}
                  <div className="border-t border-gray-100 dark:border-[#2E3543] pt-5 space-y-3">
                    <h3 className="font-bold text-sm text-rose-600 dark:text-rose-400">Account Session</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Sign out of your agent/owner session on this device.</p>
                    <button
                      onClick={handleLogout}
                      className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-rose-600 hover:bg-rose-700 text-white font-bold px-6 py-3 rounded-xl transition text-sm shadow-md shadow-rose-600/20"
                    >
                      <LogOut size={18} />
                      <span>Log Out of Account</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* =========================================================================
          EDIT PROPERTY MODAL
          ========================================================================= */}
      {editingProperty && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#181B22] border border-slate-200 dark:border-[#2E3543] rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-8 max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#2E3543] pb-4 shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-[#181B22]/10 dark:bg-[#262C37]/60 flex items-center justify-center text-[#181B22] dark:text-[#C9A865]">
                  <Edit3 size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#181B22] dark:text-white">Edit Property</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Update property specs, pricing, address, or photos.</p>
                </div>
              </div>
              <button onClick={closeEditModal} className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg transition">
                <X size={20} />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-slate-100 dark:border-[#2E3543] shrink-0">
              <button
                type="button"
                onClick={() => setEditModalTab('details')}
                className={`flex-1 py-2.5 text-sm font-bold text-center border-b-2 transition ${
                  editModalTab === 'details'
                    ? 'border-[#C9A865] text-[#181B22] dark:text-[#C9A865]'
                    : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                }`}
              >
                Property Details
              </button>
              <button
                type="button"
                onClick={() => setEditModalTab('photos')}
                className={`flex-1 py-2.5 text-sm font-bold text-center border-b-2 transition flex items-center justify-center gap-1.5 ${
                  editModalTab === 'photos'
                    ? 'border-[#C9A865] text-[#181B22] dark:text-[#C9A865]'
                    : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                }`}
              >
                <ImageIcon size={16} />
                Photos ({existingPhotos.length + newPhotos.length})
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
              {editModalTab === 'details' ? (
                <form id="edit-property-form" onSubmit={handleSavePropertyEdit} className="space-y-4">
                  {/* Title & Description */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Property Title *</label>
                    <input
                      type="text"
                      required
                      value={editForm.title}
                      onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                      className="w-full px-4 py-2.5 bg-[#F4F5EF] dark:bg-[#0F1116] border border-slate-200 dark:border-[#2E3543] rounded-xl text-sm text-[#181B22] dark:text-white focus:ring-2 focus:ring-[#C9A865] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Description *</label>
                    <textarea
                      required
                      rows={3}
                      value={editForm.description}
                      onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                      className="w-full px-4 py-2.5 bg-[#F4F5EF] dark:bg-[#0F1116] border border-slate-200 dark:border-[#2E3543] rounded-xl text-sm text-[#181B22] dark:text-white focus:ring-2 focus:ring-[#C9A865] outline-none"
                    />
                  </div>

                  {/* Type, Purpose & Price */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Property Type</label>
                      <select
                        value={editForm.property_type}
                        onChange={e => setEditForm({ ...editForm, property_type: e.target.value })}
                        className="w-full px-3 py-2 bg-[#F4F5EF] dark:bg-[#0F1116] border border-slate-200 dark:border-[#2E3543] rounded-xl text-sm text-[#181B22] dark:text-white focus:ring-2 focus:ring-[#C9A865] outline-none"
                      >
                        <option value="apartment">Apartment</option>
                        <option value="house">House</option>
                        <option value="office">Office</option>
                        <option value="land">Land</option>
                        <option value="shop_space">Shop Space</option>
                        <option value="warehouse">Warehouse</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Purpose</label>
                      <select
                        value={editForm.purpose}
                        onChange={e => setEditForm({ ...editForm, purpose: e.target.value })}
                        className="w-full px-3 py-2 bg-[#F4F5EF] dark:bg-[#0F1116] border border-slate-200 dark:border-[#2E3543] rounded-xl text-sm text-[#181B22] dark:text-white focus:ring-2 focus:ring-[#C9A865] outline-none"
                      >
                        <option value="rent">For Rent</option>
                        <option value="sale">For Sale</option>
                        <option value="lease">For Lease</option>
                        <option value="short_term_rental">Short-Term Rental</option>
                        <option value="long_term_rental">Long-Term Rental</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Price ({editForm.currency}) *</label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={editForm.price}
                        onChange={e => setEditForm({ ...editForm, price: e.target.value })}
                        className="w-full px-3 py-2 bg-[#F4F5EF] dark:bg-[#0F1116] border border-slate-200 dark:border-[#2E3543] rounded-xl text-sm text-[#181B22] dark:text-white focus:ring-2 focus:ring-[#C9A865] outline-none font-bold"
                      />
                    </div>
                  </div>

                  {/* Rooms & Specs */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Bedrooms</label>
                      <input
                        type="number"
                        min="0"
                        value={editForm.bedrooms}
                        onChange={e => setEditForm({ ...editForm, bedrooms: e.target.value })}
                        className="w-full px-3 py-2 bg-[#F4F5EF] dark:bg-[#0F1116] border border-slate-200 dark:border-[#2E3543] rounded-xl text-sm text-[#181B22] dark:text-white focus:ring-2 focus:ring-[#C9A865] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Bathrooms</label>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={editForm.bathrooms}
                        onChange={e => setEditForm({ ...editForm, bathrooms: e.target.value })}
                        className="w-full px-3 py-2 bg-[#F4F5EF] dark:bg-[#0F1116] border border-slate-200 dark:border-[#2E3543] rounded-xl text-sm text-[#181B22] dark:text-white focus:ring-2 focus:ring-[#C9A865] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Sitting Area</label>
                      <input
                        type="number"
                        min="0"
                        value={editForm.sitting_area}
                        onChange={e => setEditForm({ ...editForm, sitting_area: e.target.value })}
                        className="w-full px-3 py-2 bg-[#F4F5EF] dark:bg-[#0F1116] border border-slate-200 dark:border-[#2E3543] rounded-xl text-sm text-[#181B22] dark:text-white focus:ring-2 focus:ring-[#C9A865] outline-none"
                      />
                    </div>

                    <div className="flex items-center pt-5">
                      <label className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editForm.kitchen}
                          onChange={e => setEditForm({ ...editForm, kitchen: e.target.checked })}
                          className="rounded accent-[#C9A865] w-4 h-4"
                        />
                        <span>Has Kitchen</span>
                      </label>
                    </div>
                  </div>

                  {/* Location Details */}
                  <div className="border-t border-slate-100 dark:border-[#2E3543] pt-3 space-y-3">
                    <p className="text-xs font-bold text-[#181B22] dark:text-[#C9A865] uppercase tracking-wider">Location & Address</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">City *</label>
                        <input
                          type="text"
                          required
                          value={editForm.city}
                          onChange={e => setEditForm({ ...editForm, city: e.target.value })}
                          className="w-full px-3 py-2 bg-[#F4F5EF] dark:bg-[#0F1116] border border-slate-200 dark:border-[#2E3543] rounded-xl text-sm text-[#181B22] dark:text-white focus:ring-2 focus:ring-[#C9A865] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Sub-City / District</label>
                        <input
                          type="text"
                          value={editForm.subCity}
                          onChange={e => setEditForm({ ...editForm, subCity: e.target.value })}
                          className="w-full px-3 py-2 bg-[#F4F5EF] dark:bg-[#0F1116] border border-slate-200 dark:border-[#2E3543] rounded-xl text-sm text-[#181B22] dark:text-white focus:ring-2 focus:ring-[#C9A865] outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Full Street Address *</label>
                      <input
                        type="text"
                        required
                        value={editForm.address}
                        onChange={e => setEditForm({ ...editForm, address: e.target.value })}
                        className="w-full px-3 py-2 bg-[#F4F5EF] dark:bg-[#0F1116] border border-slate-200 dark:border-[#2E3543] rounded-xl text-sm text-[#181B22] dark:text-white focus:ring-2 focus:ring-[#C9A865] outline-none"
                      />
                    </div>
                  </div>
                </form>
              ) : (
                <div className="space-y-5">
                  {/* Current Photos Gallery */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-bold text-[#181B22] dark:text-white uppercase tracking-wider">Current Photos ({existingPhotos.length})</h4>
                      <span className="text-[11px] text-gray-400">Click star to set as cover</span>
                    </div>

                    {loadingPhotos ? (
                      <div className="py-8 text-center text-xs text-gray-400">
                        <Loader2 className="animate-spin mx-auto mb-2" size={20} />
                        Loading photos...
                      </div>
                    ) : existingPhotos.length === 0 ? (
                      <div className="py-6 text-center text-xs text-gray-400 bg-slate-50 dark:bg-[#0F1116] rounded-xl border border-dashed border-slate-200 dark:border-[#2E3543]">
                        No photos currently uploaded for this property.
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {existingPhotos.map((photo, idx) => (
                          <div
                            key={photo.id || idx}
                            className={`relative group rounded-xl overflow-hidden border-2 aspect-video bg-slate-900 shadow-sm transition ${
                              photo.isPrimary ? 'border-[#C9A865] ring-2 ring-[#C9A865]/30' : 'border-slate-200 dark:border-[#2E3543]'
                            }`}
                          >
                            <img
                              src={photo.photoUrl || photo.photo_url || photo.thumbnailUrl}
                              alt={`Property photo ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />

                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                              {!photo.isPrimary && (
                                <button
                                  type="button"
                                  onClick={() => handleSetPrimaryExistingPhoto(photo.id)}
                                  className="px-2 py-1 bg-[#C9A865] hover:bg-[#B6924D] text-white text-[10px] font-bold rounded-md flex items-center gap-1 shadow"
                                  title="Set as cover photo"
                                >
                                  <Star size={10} />
                                  Cover
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleDeleteExistingPhoto(photo.id)}
                                className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-md shadow"
                                title="Delete photo"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>

                            {photo.isPrimary && (
                              <span className="absolute top-1.5 left-1.5 bg-[#C9A865] text-white text-[10px] font-bold px-2 py-0.5 rounded shadow flex items-center gap-1">
                                <Star size={10} className="fill-white" />
                                Cover
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Add New Photos */}
                  <div className="border-t border-slate-100 dark:border-[#2E3543] pt-4 space-y-3">
                    <h4 className="text-xs font-bold text-[#181B22] dark:text-white uppercase tracking-wider">Upload New Photos</h4>
                    
                    <div
                      onClick={() => editFileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-300 dark:border-[#2E3543] hover:border-[#C9A865] hover:bg-[#F4F5EF] dark:hover:bg-[#262C37]/20 rounded-2xl p-5 text-center cursor-pointer transition"
                    >
                      <input
                        ref={editFileInputRef}
                        type="file"
                        multiple
                        accept="image/jpeg,image/png,image/webp,image/jpg"
                        onChange={e => handleNewPhotoFiles(e.target.files)}
                        className="hidden"
                      />
                      <UploadCloud size={24} className="mx-auto text-[#C9A865] mb-1.5" />
                      <p className="text-xs font-bold text-[#181B22] dark:text-white">Click to select more photos</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">JPG, PNG, WebP up to 10MB each</p>
                    </div>

                    {newPhotoPreviews.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2">Selected new photos ({newPhotoPreviews.length})</p>
                        <div className="grid grid-cols-3 gap-2">
                          {newPhotoPreviews.map((url, i) => (
                            <div key={i} className="relative rounded-lg overflow-hidden border border-slate-200 dark:border-[#2E3543] aspect-video group">
                              <img src={url} alt="New upload preview" className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => {
                                  setNewPhotos(prev => prev.filter((_, idx) => idx !== i));
                                  setNewPhotoPreviews(prev => prev.filter((_, idx) => idx !== i));
                                }}
                                className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-md opacity-0 group-hover:opacity-100 transition"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-slate-100 dark:border-[#2E3543] pt-4 shrink-0">
              <button
                type="button"
                onClick={() => handleInitiateDelete(editingProperty)}
                className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center gap-1.5"
              >
                <Trash2 size={14} />
                Delete Property
              </button>

              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={closeEditModal}
                  disabled={savingEdit}
                  className="px-5 py-2.5 bg-slate-100 dark:bg-[#262C37]/40 hover:bg-slate-200 dark:hover:bg-[#262C37] text-slate-700 dark:text-slate-200 font-semibold rounded-xl text-sm transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSavePropertyEdit}
                  disabled={savingEdit}
                  className="px-6 py-2.5 bg-[#181B22] hover:bg-[#262C37] text-white font-bold rounded-xl border border-[#C9A865] transition text-sm flex items-center gap-2 shadow-lg shadow-[#181B22]/30 disabled:opacity-60"
                >
                  {savingEdit ? (
                    <>
                      <Loader2 size={16} className="animate-spin text-[#C9A865]" />
                      Saving Changes...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} className="text-[#C9A865]" />
                      Save & Update Property
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* =========================================================================
          DELETE CONFIRMATION MODAL
          ========================================================================= */}
      {propertyToDelete && (
        <div className="fixed inset-0 z-[60] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#181B22] border border-rose-200 dark:border-rose-900/60 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-scaleIn">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 dark:text-rose-400 mx-auto">
              <Trash2 size={24} />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-[#181B22] dark:text-white">Delete Property Listing?</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Are you sure you want to delete <span className="font-bold text-[#181B22] dark:text-white">"{propertyToDelete.title}"</span>?
              </p>
              <p className="text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 p-2.5 rounded-xl border border-rose-200 dark:border-rose-900/40">
                ⚠️ This action cannot be undone. This property, along with all its uploaded photos and inquiries, will be permanently removed from UrbanNEST.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleCancelDelete}
                disabled={deletingProperty}
                className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-[#262C37]/40 hover:bg-slate-200 dark:hover:bg-[#262C37] text-slate-700 dark:text-slate-200 font-semibold rounded-xl text-sm transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deletingProperty}
                className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-sm transition shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {deletingProperty ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Yes, Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MANUAL TRANSFER & RECEIPT VERIFICATION MODAL
          ========================================================================= */}
      {paymentModalProperty && (
        <div className="fixed inset-0 z-[60] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white dark:bg-[#181B22] border border-gray-100 dark:border-[#2E3543] rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl space-y-6 my-auto animate-scaleIn max-h-[92vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-gray-100 dark:border-[#2E3543] pb-4 shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-11 h-11 rounded-2xl bg-[#C9A865]/10 dark:bg-[#C9A865]/20 border border-[#C9A865]/30 flex items-center justify-center text-[#C9A865]">
                  <CreditCard size={22} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#181B22] dark:text-white">Pay to Publish Listing</h3>
                  <p className="text-xs text-gray-500 truncate max-w-md">
                    {paymentModalProperty.title} • <span className="capitalize">{paymentModalProperty.purpose}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closePaymentModal}
                disabled={submittingPayment}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-xl transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body Scrollable */}
            <div className="overflow-y-auto pr-1 space-y-5 flex-1">
              
              {/* Step indicator */}
              <div className="grid grid-cols-3 gap-2 p-1 bg-[#F4F5EF] dark:bg-[#0F1116] rounded-xl border border-gray-100 dark:border-[#2E3543]/50 text-center text-xs font-semibold">
                <div className="py-2 rounded-lg bg-[#181B22] text-white shadow-sm flex items-center justify-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-[#C9A865] text-[10px] font-bold flex items-center justify-center text-white">1</span>
                  <span>Choose Method</span>
                </div>
                <div className="py-2 rounded-lg bg-[#181B22] text-white shadow-sm flex items-center justify-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-[#C9A865] text-[10px] font-bold flex items-center justify-center text-white">2</span>
                  <span>Transfer Offline</span>
                </div>
                <div className="py-2 rounded-lg bg-[#181B22] text-white shadow-sm flex items-center justify-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-[#C9A865] text-[10px] font-bold flex items-center justify-center text-white">3</span>
                  <span>Upload Proof</span>
                </div>
              </div>

              {/* Step 1: Select Plan / Tier */}
              <div>
                <label className="block text-xs font-bold text-[#181B22] dark:text-gray-300 uppercase tracking-wider mb-2">
                  Select Listing Tier
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    onClick={() => setSelectedTier('standard')}
                    className={`cursor-pointer p-4 rounded-2xl border-2 transition ${
                      selectedTier === 'standard'
                        ? 'border-[#C9A865] bg-[#FCFAF5] dark:bg-[#C9A865]/10 shadow-sm'
                        : 'border-gray-200 dark:border-[#2E3543] hover:border-gray-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-[#181B22] dark:text-white">Standard</span>
                      <span className="text-sm font-extrabold text-[#C9A865]">
                        ETB {calculateFee(paymentModalProperty, 'standard')}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1">Active for 30 days • Standard visibility</p>
                  </div>

                  <div
                    onClick={() => setSelectedTier('premium')}
                    className={`cursor-pointer p-4 rounded-2xl border-2 transition ${
                      selectedTier === 'premium'
                        ? 'border-[#C9A865] bg-[#FCFAF5] dark:bg-[#C9A865]/10 shadow-sm'
                        : 'border-gray-200 dark:border-[#2E3543] hover:border-gray-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-[#181B22] dark:text-white flex items-center gap-1">
                        <Star size={13} className="text-[#C9A865] fill-[#C9A865]" /> Premium
                      </span>
                      <span className="text-sm font-extrabold text-[#C9A865]">
                        ETB {calculateFee(paymentModalProperty, 'premium')}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1">Active for 60 days • Featured priority</p>
                  </div>
                </div>
              </div>

              {/* Step 2: Choose Payment Method */}
              <div>
                <label className="block text-xs font-bold text-[#181B22] dark:text-gray-300 uppercase tracking-wider mb-2">
                  Choose Transfer Method
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {/* Commercial Bank of Ethiopia */}
                  <button
                    type="button"
                    onClick={() => setSelectedPaymentMethod('CBE')}
                    className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 text-left transition ${
                      selectedPaymentMethod === 'CBE'
                        ? 'border-[#8A2B59] bg-[#8A2B59]/10 dark:bg-[#8A2B59]/20 ring-1 ring-[#8A2B59]'
                        : 'border-gray-200 dark:border-[#2E3543] hover:bg-gray-50 dark:hover:bg-[#262C37]/30'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#8A2B59] text-white flex items-center justify-center shrink-0 shadow-sm">
                      <Building2 size={20} />
                    </div>
                    <div>
                      <div className="font-bold text-xs sm:text-sm text-[#181B22] dark:text-white">CBE Account</div>
                      <div className="text-[11px] text-gray-500">Commercial Bank of Ethiopia</div>
                    </div>
                  </button>

                  {/* Telebirr */}
                  <button
                    type="button"
                    onClick={() => setSelectedPaymentMethod('TELEBIRR')}
                    className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 text-left transition ${
                      selectedPaymentMethod === 'TELEBIRR'
                        ? 'border-[#0072CE] bg-[#0072CE]/10 dark:bg-[#0072CE]/20 ring-1 ring-[#0072CE]'
                        : 'border-gray-200 dark:border-[#2E3543] hover:bg-gray-50 dark:hover:bg-[#262C37]/30'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#0072CE] text-white flex items-center justify-center shrink-0 shadow-sm">
                      <Smartphone size={20} />
                    </div>
                    <div>
                      <div className="font-bold text-xs sm:text-sm text-[#181B22] dark:text-white">Telebirr</div>
                      <div className="text-[11px] text-gray-500">Mobile Transfer / USSD</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Step 3: Copy Account Details & Transfer Externally */}
              <div className="bg-[#F0F5FC]/80 dark:bg-[#262C37]/30 rounded-2xl p-4 sm:p-5 border border-[#BCE1CA]/30 dark:border-[#2E3543] space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#181B22] dark:text-gray-200 uppercase tracking-wider">
                    {selectedPaymentMethod === 'CBE' ? 'Bank Account Details' : 'Telebirr Transfer Details'}
                  </h4>
                  <span className="text-xs font-extrabold text-[#2E7D4F] dark:text-[#5CAE78] bg-white dark:bg-[#181B22] px-2.5 py-1 rounded-full border border-[#BCE1CA] dark:border-[#2E7D4F]/40">
                    Amount: ETB {calculateFee(paymentModalProperty, selectedTier)}
                  </span>
                </div>

                {selectedPaymentMethod === 'CBE' ? (
                  <div className="space-y-2.5">
                    {/* Account Number with Copy */}
                    <div className="flex items-center justify-between bg-white dark:bg-[#181B22] p-3 rounded-xl border border-gray-200 dark:border-[#2E3543]">
                      <div>
                        <span className="text-[11px] text-gray-400 block">CBE Account Number</span>
                        <span className="text-base sm:text-lg font-mono font-bold text-[#181B22] dark:text-white tracking-wide">
                          {transferInfo?.cbe?.accountNumber || '1000284759281'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyText(transferInfo?.cbe?.accountNumber || '1000284759281', 'cbe_acc')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                          copiedField === 'cbe_acc'
                            ? 'bg-[#2E7D4F] text-white shadow-sm'
                            : 'bg-[#181B22] hover:bg-[#262C37] text-white dark:bg-[#262C37] dark:hover:bg-[#1E4F96]'
                        }`}
                      >
                        {copiedField === 'cbe_acc' ? <Check size={14} /> : <Copy size={14} />}
                        <span>{copiedField === 'cbe_acc' ? 'Copied!' : 'Copy'}</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="bg-white/60 dark:bg-[#181B22]/60 p-2.5 rounded-xl border border-gray-100 dark:border-[#2E3543]/50">
                        <span className="text-gray-400 block text-[10px]">Account Name</span>
                        <span className="font-semibold text-gray-800 dark:text-gray-200">
                          {transferInfo?.cbe?.accountName || 'UrbanNEST Real Estate PLC'}
                        </span>
                      </div>
                      <div className="bg-white/60 dark:bg-[#181B22]/60 p-2.5 rounded-xl border border-gray-100 dark:border-[#2E3543]/50">
                        <span className="text-gray-400 block text-[10px]">Bank / Branch</span>
                        <span className="font-semibold text-gray-800 dark:text-gray-200">
                          {transferInfo?.cbe?.bankName || 'Commercial Bank of Ethiopia'} ({transferInfo?.cbe?.branch || 'Finfinnee Branch'})
                        </span>
                      </div>
                    </div>

                    <p className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1.5 pt-1">
                      <span>💡 <strong>Quick Step:</strong> Open your CBE Birr or CBE Mobile Banking app, transfer <strong>ETB {calculateFee(paymentModalProperty, selectedTier)}</strong> to the account above, and take a screenshot of the receipt.</span>
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {/* Phone Number with Copy */}
                    <div className="flex items-center justify-between bg-white dark:bg-[#181B22] p-3 rounded-xl border border-gray-200 dark:border-[#2E3543]">
                      <div>
                        <span className="text-[11px] text-gray-400 block">Telebirr Phone Number</span>
                        <span className="text-base sm:text-lg font-mono font-bold text-[#181B22] dark:text-white tracking-wide">
                          {transferInfo?.telebirr?.phoneNumber || '0911478291'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyText(transferInfo?.telebirr?.phoneNumber || '0911478291', 'tb_phone')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                          copiedField === 'tb_phone'
                            ? 'bg-[#2E7D4F] text-white shadow-sm'
                            : 'bg-[#0072CE] hover:bg-[#005FA8] text-white'
                        }`}
                      >
                        {copiedField === 'tb_phone' ? <Check size={14} /> : <Copy size={14} />}
                        <span>{copiedField === 'tb_phone' ? 'Copied!' : 'Copy'}</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="bg-white/60 dark:bg-[#181B22]/60 p-2.5 rounded-xl border border-gray-100 dark:border-[#2E3543]/50">
                        <span className="text-gray-400 block text-[10px]">Account Name</span>
                        <span className="font-semibold text-gray-800 dark:text-gray-200">
                          {transferInfo?.telebirr?.accountName || 'UrbanNEST Real Estate'}
                        </span>
                      </div>
                      <div className="bg-white/60 dark:bg-[#181B22]/60 p-2.5 rounded-xl border border-gray-100 dark:border-[#2E3543]/50">
                        <span className="text-gray-400 block text-[10px]">USSD Code</span>
                        <span className="font-mono font-semibold text-gray-800 dark:text-gray-200">
                          {transferInfo?.telebirr?.ussd || '*127#'}
                        </span>
                      </div>
                    </div>

                    <p className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1.5 pt-1">
                      <span>💡 <strong>Quick Step:</strong> Open the Telebirr app or dial *127#, transfer <strong>ETB {calculateFee(paymentModalProperty, selectedTier)}</strong> to the phone number above, and screenshot the confirmation SMS/screen.</span>
                    </p>
                  </div>
                )}
              </div>

              {/* Step 4: Upload Proof of Payment */}
              <form onSubmit={handleSubmitManualPayment} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#181B22] dark:text-gray-300 uppercase tracking-wider mb-2">
                    Upload Proof of Payment (Receipt / Screenshot) *
                  </label>

                  <input
                    ref={paymentReceiptInputRef}
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={(e) => handleReceiptFileSelect(e.target.files?.[0] || null)}
                  />

                  {!receiptFile ? (
                    <div
                      onClick={() => paymentReceiptInputRef.current?.click()}
                      className="border-2 border-dashed border-gray-300 dark:border-[#2E3543] hover:border-[#C9A865] dark:hover:border-[#C9A865] rounded-2xl p-6 text-center cursor-pointer transition bg-gray-50/50 dark:bg-[#0F1116]/50 group"
                    >
                      <div className="w-12 h-12 rounded-full bg-[#FCFAF5] dark:bg-[#C9A865]/10 text-[#C9A865] flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition">
                        <UploadCloud size={24} />
                      </div>
                      <p className="font-bold text-xs sm:text-sm text-[#181B22] dark:text-white">
                        Click or drag & drop receipt screenshot here
                      </p>
                      <p className="text-[11px] text-gray-400 mt-1">
                        PNG, JPG, WEBP, or PDF up to 10MB
                      </p>
                    </div>
                  ) : (
                    <div className="bg-[#F0F8F3] dark:bg-[#2E7D4F]/10 border border-[#BCE1CA] dark:border-[#2E7D4F]/30 rounded-2xl p-4 flex items-center justify-between">
                      <div className="flex items-center space-x-3 overflow-hidden">
                        {receiptFilePreview ? (
                          <img
                            src={receiptFilePreview}
                            alt="Receipt Preview"
                            className="w-14 h-14 object-cover rounded-xl border border-[#BCE1CA] shrink-0"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-xl bg-[#2E7D4F]/20 text-[#2E7D4F] flex items-center justify-center shrink-0">
                            <FileText size={24} />
                          </div>
                        )}
                        <div className="overflow-hidden">
                          <p className="text-xs font-bold text-[#181B22] dark:text-white truncate">
                            {receiptFile.name}
                          </p>
                          <p className="text-[10px] text-gray-500">
                            {(receiptFile.size / 1024).toFixed(1)} KB • Ready to submit
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleReceiptFileSelect(null)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition"
                        title="Remove file"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Optional inputs: Transaction Ref & Notes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-300 mb-1">
                      Transaction Reference / ID <span className="font-normal text-gray-400">(optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. FT26019..., Ref #, or ID"
                      value={referenceCodeInput}
                      onChange={(e) => setReferenceCodeInput(e.target.value)}
                      className="w-full px-3 py-2 bg-[#F4F5EF] dark:bg-[#0F1116] border border-gray-200 dark:border-[#2E3543] rounded-xl text-xs text-[#181B22] dark:text-white focus:ring-2 focus:ring-[#C9A865] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-300 mb-1">
                      Sender Name / Account Name <span className="font-normal text-gray-400">(optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Name on bank / Telebirr account"
                      value={paymentNotesInput}
                      onChange={(e) => setPaymentNotesInput(e.target.value)}
                      className="w-full px-3 py-2 bg-[#F4F5EF] dark:bg-[#0F1116] border border-gray-200 dark:border-[#2E3543] rounded-xl text-xs text-[#181B22] dark:text-white focus:ring-2 focus:ring-[#C9A865] outline-none"
                    />
                  </div>
                </div>

                {paymentModalError && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
                    <AlertTriangle size={16} className="shrink-0" />
                    <span>{paymentModalError}</span>
                  </div>
                )}

                {/* Modal Footer Actions */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-[#2E3543]">
                  <button
                    type="button"
                    onClick={closePaymentModal}
                    disabled={submittingPayment}
                    className="px-4 py-2.5 bg-gray-100 dark:bg-[#262C37]/40 hover:bg-gray-200 dark:hover:bg-[#262C37] text-gray-700 dark:text-gray-200 font-semibold rounded-xl text-xs sm:text-sm transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingPayment || !receiptFile}
                    className="px-6 py-2.5 bg-[#2E7D4F] hover:bg-[#256640] text-white font-bold rounded-xl text-xs sm:text-sm transition shadow-lg shadow-[#2E7D4F]/30 flex items-center gap-2 disabled:opacity-50"
                  >
                    {submittingPayment ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Submitting Proof...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={16} />
                        Submit Proof of Payment
                      </>
                    )}
                  </button>
                </div>
              </form>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}