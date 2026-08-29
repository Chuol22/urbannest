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
  Paperclip
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { propertyService } from '../services/propertyService';
import { paymentService } from '../services/paymentService';
import { userService } from '../services/userService';
import { Alert } from '../components/ui/Alert';

// ---- Status helpers ----
function getStatusLabel(property: any): { label: string; color: string; description: string } {
  if (!property.listing_fee_paid) {
    return {
      label: 'Awaiting Payment',
      color: 'bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400',
      description: 'Pay the listing fee to submit for review',
    };
  }
  switch (property.status) {
    case 'available':
      return {
        label: 'Published',
        color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400',
        description: 'Live and visible to the public',
      };
    case 'pending':
      return {
        label: 'Pending Review',
        color: 'bg-amber-100 text-amber-800 dark:bg-amber-950/20 dark:text-amber-400',
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
  const [activeTab, setActiveTab] = useState<'overview' | 'listings' | 'payments' | 'profile' | 'settings'>('overview');
  const [properties, setProperties] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paymentVerifying, setPaymentVerifying] = useState(false);
  const [paymentResult, setPaymentResult] = useState<'success' | 'failed' | null>(null);
  const [payNowLoading, setPayNowLoading] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

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

    if (isPaymentReturn && propertyId) {
      // Clean URL immediately
      window.history.replaceState({}, '', '/dashboard');
      verifyReturnPayment(propertyId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  async function verifyReturnPayment(propertyId: string) {
    setPaymentVerifying(true);
    try {
      const pending = localStorage.getItem('pendingListingFee');
      const txRef = pending ? JSON.parse(pending).tx_ref : null;
      if (!txRef) {
        setPaymentResult('failed');
        return;
      }
      const res = await paymentService.verifyListingFee(propertyId, txRef);
      if (res?.success) {
        localStorage.removeItem('pendingListingFee');
        setPaymentResult('success');
        setSuccessMessage('Payment confirmed! Your listing is now under admin review.');
        setActiveTab('listings');
        // Reload listings to reflect new status
        const propRes = await propertyService.getUserProperties(1, 50);
        setProperties(propRes.data || []);
      } else {
        setPaymentResult('failed');
      }
    } catch {
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
        const propRes = await propertyService.getUserProperties(1, 50);
        setProperties(propRes.data || []);

        try {
          const payRes = await paymentService.getPaymentHistory();
          setPayments(payRes.data || []);
        } catch (payErr) {
          console.warn('Failed to load payment history:', payErr);
        }
      } catch {
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // ---- Pay listing fee inline ----
  const handlePayNow = async (propertyId: string) => {
    setPayNowLoading(propertyId);
    setError('');
    try {
      const res = await paymentService.initializeListingFee(propertyId);
      if (res?.success && res?.data?.checkout_url) {
        localStorage.setItem('pendingListingFee', JSON.stringify({
          property_id: propertyId,
          tx_ref: res.data.tx_ref,
        }));
        window.location.href = res.data.checkout_url;
      } else {
        setError(res?.message || 'Could not initialize payment. Try again.');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to initiate payment.');
    } finally {
      setPayNowLoading(null);
    }
  };

  // ---- Stats ----
  const totalProperties     = properties.length;
  const publishedProperties = properties.filter(p => p.status === 'available').length;
  const pendingProperties   = properties.filter(p => p.status === 'pending' && p.listing_fee_paid).length;
  const awaitingPayment     = properties.filter(p => !p.listing_fee_paid).length;
  const rejectedProperties  = properties.filter(p => p.status === 'withdrawn' || p.listing_rejection_reason).length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex flex-col md:flex-row font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-slate-900 text-white flex flex-col justify-between p-6 md:sticky md:top-0 md:h-screen z-10">
        <div>
          {/* Logo / Brand Header */}
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center font-bold text-xl text-white shadow-md">
              U
            </div>
            <span className="font-extrabold text-xl tracking-wider">My Space</span>
          </div>

          {/* User quick profile */}
          <div className="mb-8 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800 font-bold">
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </div>
              <div className="overflow-hidden">
                <p className="font-bold text-sm truncate">{user?.first_name} {user?.last_name}</p>
                <p className="text-xs text-gray-400 capitalize">{user?.role === 'owner' ? 'Property Owner' : user?.role}</p>
              </div>
            </div>
            {/* Verification status badge */}
            <div className="mt-3 flex items-center justify-between text-xs border-t border-slate-700 pt-2">
              <span className="text-gray-400">Account status:</span>
              {user?.verification_status === 'approved' ? (
                <span className="text-emerald-400 font-medium flex items-center"><CheckCircle size={12} className="mr-1"/> Verified</span>
              ) : user?.verification_status === 'rejected' ? (
                <span className="text-rose-400 font-medium flex items-center"><XCircle size={12} className="mr-1"/> Rejected</span>
              ) : (
                <span className="text-amber-400 font-medium flex items-center"><Clock size={12} className="mr-1"/> Pending</span>
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
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-semibold transition ${
                  activeTab === item.id
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-gray-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {item.icon}
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge !== undefined && (
                  <span className="bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
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
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 text-center shadow-2xl">
              <Loader2 className="animate-spin text-emerald-600 mx-auto mb-3" size={36} />
              <p className="font-bold text-gray-900 dark:text-white">Verifying your payment...</p>
              <p className="text-sm text-gray-500 mt-1">Please wait, do not close this page.</p>
            </div>
          </div>
        )}

        {/* Payment Result Banners */}
        {paymentResult === 'success' && (
          <div className="mb-6 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-xl p-4 flex items-center gap-3">
            <PartyPopper className="text-emerald-600 shrink-0" size={22} />
            <div>
              <p className="font-bold text-emerald-800 dark:text-emerald-300 text-sm">Payment Successful! 🎉</p>
              <p className="text-xs text-emerald-700 dark:text-emerald-400">{successMessage}</p>
            </div>
            <button onClick={() => setPaymentResult(null)} className="ml-auto text-emerald-500 hover:text-emerald-700 text-lg leading-none">×</button>
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
        {user?.verification_status !== 'approved' && (
          <div className="mb-6 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200 dark:border-amber-900 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" size={20} />
              <div>
                <h4 className="font-bold text-amber-900 dark:text-amber-300 text-sm">Account Verification Required</h4>
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                  {user?.verification_status === 'rejected'
                    ? `Your verification document was rejected. Reason: ${user?.verification_rejection_reason || 'Incomplete details'}. Please submit again.`
                    : 'Your registration is pending identity verification by a super admin. Once approved, you can publish listings live.'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('profile')}
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition"
            >
              Upload Credentials
            </button>
          </div>
        )}

        {error && <Alert type="error" message={error} onClose={() => setError('')} />}

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
          </div>
        ) : (
          <>
            {/* TAB 1: OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-8 animate-fadeIn">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Welcome back, {user?.first_name}!</h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Here is a quick glance at your listings performance.</p>
                  </div>
                  <Link
                    to="/create-listing"
                    className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-3 rounded-xl shadow-lg shadow-emerald-600/10 hover:shadow-emerald-600/20 transition self-start sm:self-auto"
                  >
                    <Plus size={18} />
                    <span>List a Property</span>
                  </Link>
                </div>

                {/* Key Metrics Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                  {[
                    { label: 'Total Properties', value: totalProperties, icon: <Home size={22} />, color: 'blue' },
                    { label: 'Published', value: publishedProperties, icon: <CheckCircle size={22} />, color: 'emerald' },
                    { label: 'Pending Review', value: pendingProperties, icon: <Clock size={22} />, color: 'amber' },
                    { label: 'Awaiting Payment', value: awaitingPayment, icon: <DollarSign size={22} />, color: 'orange' },
                  ].map(({ label, value, icon, color }) => (
                    <div key={label} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
                        <h3 className={`text-3xl font-extrabold mt-2 text-${color}-600 dark:text-${color}-400`}>{value}</h3>
                      </div>
                      <div className={`w-12 h-12 bg-${color}-50 dark:bg-${color}-950/30 rounded-xl flex items-center justify-center text-${color}-600 dark:text-${color}-400`}>
                        {icon}
                      </div>
                    </div>
                  ))}
                </div>

                {/* How Platform Works */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                    <TrendingUp className="text-emerald-500 mr-2" size={20} />
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
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Recent Properties</h3>
                  {properties.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-gray-500">You haven't listed any properties yet.</p>
                      <Link to="/create-listing" className="text-emerald-600 hover:underline text-sm font-semibold mt-2 inline-block">List your first property now →</Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {properties.slice(0, 5).map((property: any) => {
                        const status = getStatusLabel(property);
                        return (
                          <div key={property.id} className="flex items-center justify-between p-4 border border-gray-50 dark:border-gray-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-xl transition">
                            <div className="flex items-center space-x-4">
                              <div className="w-16 h-12 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center font-bold text-[10px] text-gray-400 uppercase text-center px-1">
                                {property.property_type || 'house'}
                              </div>
                              <div>
                                <h4 className="font-bold text-sm text-gray-950 dark:text-white">{property.title}</h4>
                                <p className="text-xs text-gray-500">{property.purpose} • ETB {property.price?.toLocaleString()}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${status.color}`}>
                                {status.label}
                              </span>
                              {!property.listing_fee_paid && (
                                <button
                                  onClick={() => handlePayNow(property.id)}
                                  disabled={payNowLoading === property.id}
                                  className="text-xs bg-orange-600 hover:bg-orange-700 text-white px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1 transition"
                                >
                                  {payNowLoading === property.id ? <Loader2 size={12} className="animate-spin" /> : <CreditCard size={12} />}
                                  Pay Now
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
                    <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">My Properties</h1>
                    <p className="text-xs text-gray-500 mt-1">Manage, share, and update your property listings.</p>
                  </div>
                  <Link to="/create-listing" className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded-xl text-sm transition">
                    <Plus size={16} />
                    New Listing
                  </Link>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 dark:bg-slate-800 border-b border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-bold uppercase text-xs">
                        <tr>
                          <th className="px-6 py-4">Property</th>
                          <th className="px-6 py-4">Purpose</th>
                          <th className="px-6 py-4">Price</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {properties.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-gray-500">No properties found. List a new one!</td>
                          </tr>
                        ) : (
                          properties.map((property) => {
                            const status = getStatusLabel(property);
                            return (
                              <tr key={property.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition">
                                <td className="px-6 py-4">
                                  <div className="font-bold text-gray-950 dark:text-white text-sm">{property.title}</div>
                                  <div className="text-xs text-gray-500 capitalize">{property.property_type}</div>
                                </td>
                                <td className="px-6 py-4 text-xs font-semibold capitalize text-gray-600 dark:text-gray-300">
                                  {property.purpose?.replace('_', ' ')}
                                </td>
                                <td className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white">
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
                                    {!property.listing_fee_paid ? (
                                      <button
                                        onClick={() => handlePayNow(property.id)}
                                        disabled={payNowLoading === property.id}
                                        className="inline-flex items-center gap-1 text-xs bg-orange-600 hover:bg-orange-700 text-white px-3 py-1.5 rounded-lg font-semibold transition"
                                      >
                                        {payNowLoading === property.id ? <Loader2 size={12} className="animate-spin" /> : <CreditCard size={12} />}
                                        Pay Now
                                      </button>
                                    ) : (
                                      <>
                                        <Link
                                          to={`/properties/${property.id}`}
                                          className="inline-flex items-center justify-center p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-600 dark:text-gray-200 transition"
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
                                          className="inline-flex items-center justify-center p-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:hover:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 transition"
                                          title="Copy Share Link"
                                        >
                                          <Share2 size={14} />
                                        </button>
                                      </>
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
                  <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900 rounded-xl p-4 flex items-start gap-3">
                    <AlertTriangle className="text-orange-600 shrink-0 mt-0.5" size={18} />
                    <div>
                      <p className="font-bold text-orange-800 dark:text-orange-300 text-sm">
                        {awaitingPayment} listing{awaitingPayment > 1 ? 's' : ''} awaiting payment
                      </p>
                      <p className="text-xs text-orange-700 dark:text-orange-400 mt-0.5">
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
                  <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Listing Payments</h1>
                  <p className="text-xs text-gray-500 mt-1">Overview of your property listing fee transactions.</p>
                </div>

                {/* Fee Info Box */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { label: 'Standard (Rent)', fee: 'ETB 50', icon: <Receipt size={20} /> },
                    { label: 'Standard (Sale)', fee: 'ETB 100', icon: <Receipt size={20} /> },
                    { label: 'Premium Listing', fee: '2x Standard', icon: <TrendingUp size={20} /> },
                  ].map(({ label, fee, icon }) => (
                    <div key={label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 flex items-center gap-3 shadow-sm">
                      <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg flex items-center justify-center text-emerald-600">
                        {icon}
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">{label}</p>
                        <p className="font-bold text-gray-900 dark:text-white text-sm">{fee}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                  <div className="p-5 border-b border-gray-100 dark:border-gray-700 bg-slate-50/50 dark:bg-slate-800/40">
                    <h4 className="font-bold text-sm text-gray-800 dark:text-white">Transaction History</h4>
                    <p className="text-xs text-gray-500 mt-0.5">Listing fees paid to host and promote your properties on UrbanNEST.</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 dark:bg-slate-800 text-gray-600 dark:text-gray-300 font-bold uppercase text-xs">
                        <tr>
                          <th className="px-6 py-4">Transaction Ref</th>
                          <th className="px-6 py-4">Property</th>
                          <th className="px-6 py-4">Amount</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {payments.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-gray-500">No payment transactions yet. Pay a listing fee to see records here.</td>
                          </tr>
                        ) : (
                          payments.map((p) => (
                            <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition">
                              <td className="px-6 py-4 font-mono text-xs text-gray-500">{p.chapaTransactionRef || p.id?.slice(0, 16) + '...'}</td>
                              <td className="px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-300">{p.property?.title || '—'}</td>
                              <td className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white">ETB {p.amount}</td>
                              <td className="px-6 py-4">
                                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                                  p.status === 'COMPLETED'
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400'
                                    : p.status === 'FAILED'
                                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400'
                                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950/20 dark:text-amber-400'
                                }`}>
                                  {p.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-xs text-gray-500">
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
            {activeTab === 'profile' && (
              <div className="space-y-6 animate-fadeIn max-w-2xl">
                <div>
                  <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Identity Verification</h1>
                  <p className="text-xs text-gray-500 mt-1">Submit credentials so the super admin can confirm your identity and approve your account.</p>
                </div>

                {docSuccess && <Alert type="success" message={docSuccess} onClose={() => setDocSuccess('')} />}
                {docError && <Alert type="error" message={docError} onClose={() => setDocError('')} />}

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 space-y-6">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">Current Status</h3>
                    <div className="mt-3 p-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium capitalize text-gray-600 dark:text-gray-300">
                          Status: <strong className="text-gray-900 dark:text-white">{user?.verification_status?.replace('_', ' ') || 'Pending Review'}</strong>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {user?.verification_status === 'approved'
                            ? 'Approved! You can now publish properties publicly.'
                            : user?.verification_status === 'rejected'
                            ? `Rejected: ${user?.verification_rejection_reason || 'Invalid document. Please submit again.'}`
                            : user?.verification_document_url
                            ? 'Your document is uploaded and under review by our admin team.'
                            : 'Upload your commercial registration license or ID card copy below.'}
                        </p>
                      </div>
                      <div>
                        {user?.verification_status === 'approved' ? (
                          <CheckCircle className="text-emerald-500" size={32} />
                        ) : user?.verification_status === 'rejected' ? (
                          <XCircle className="text-rose-500" size={32} />
                        ) : (
                          <Clock className="text-amber-500" size={32} />
                        )}
                      </div>
                    </div>

                    {user?.verification_document_url && (
                      <div className="mt-4 p-3.5 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-xl flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Paperclip className="text-emerald-600 dark:text-emerald-400 shrink-0" size={18} />
                          <div>
                            <span className="text-xs font-semibold text-emerald-900 dark:text-emerald-200">Current Submitted Document</span>
                            <p className="text-[11px] text-emerald-700 dark:text-emerald-400">File uploaded for verification</p>
                          </div>
                        </div>
                        <a
                          href={user.verification_document_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-900 dark:text-emerald-300 dark:hover:text-white underline"
                        >
                          <span>View Document</span>
                          <ExternalLink size={13} />
                        </a>
                      </div>
                    )}
                  </div>

                  {user?.verification_status !== 'approved' && (
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
                              ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20'
                              : 'border-gray-300 dark:border-gray-600 bg-slate-50/50 hover:bg-slate-50 dark:bg-slate-800/40 dark:hover:bg-slate-800'
                          }`}
                        >
                          <UploadCloud className={`mx-auto mb-3 transition-colors ${isDragging ? 'text-emerald-500' : 'text-gray-400 dark:text-gray-500'}`} size={36} />
                          <span className="block text-sm font-bold text-gray-800 dark:text-gray-200">
                            Click to upload license or National ID copy
                          </span>
                          <span className="block text-xs text-gray-500 dark:text-gray-400 mt-1">
                            PDF, PNG, JPG, WEBP – up to 10MB
                          </span>
                          <span className="inline-block mt-3 px-3 py-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-300 shadow-sm">
                            Browse Files from PC / Phone
                          </span>
                        </div>
                      ) : (
                        /* Selected File Preview Box */
                        <div className="border-2 border-emerald-500/40 bg-emerald-50/20 dark:bg-emerald-950/20 rounded-xl p-4 sm:p-5 flex items-center justify-between gap-4">
                          <div className="flex items-center space-x-3 min-w-0">
                            {filePreview ? (
                              <img src={filePreview} alt="Preview" className="w-12 h-12 object-cover rounded-lg border border-emerald-200 dark:border-emerald-800 shrink-0" />
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-300 flex items-center justify-center shrink-0">
                                <FileText size={24} />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                                {selectedFile.name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {formatFileSize(selectedFile.size)} • <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Ready to upload</span>
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition"
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
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/10 hover:shadow-emerald-600/20'
                        }`}
                      >
                        {uploadingDoc ? (
                          <>
                            <Loader2 className="animate-spin" size={18} />
                            <span>Uploading document...</span>
                          </>
                        ) : (
                          <>
                            <UploadCloud size={18} />
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
                  <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Settings</h1>
                  <p className="text-xs text-gray-500 mt-1">Configure notifications, change password, and customize display options.</p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 space-y-6">
                  <div>
                    <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-3">Notification Preferences</h3>
                    <div className="space-y-3">
                      <label className="flex items-center space-x-3 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                        <input type="checkbox" defaultChecked className="rounded text-emerald-600 focus:ring-emerald-500" />
                        <span>Email notifications when listing is approved or rejected</span>
                      </label>
                      <label className="flex items-center space-x-3 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                        <input type="checkbox" defaultChecked className="rounded text-emerald-600 focus:ring-emerald-500" />
                        <span>SMS / WhatsApp alerts for buyer discovery inquiries</span>
                      </label>
                    </div>
                  </div>
                  <div className="border-t border-gray-100 dark:border-gray-700 pt-5">
                    <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-3">Account Info</h3>
                    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex justify-between">
                        <span>Name</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{user?.first_name} {user?.last_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Phone</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{user?.phone || '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Email</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{user?.email || '(not set)'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Role</span>
                        <span className="font-semibold capitalize text-gray-900 dark:text-white">{user?.role}</span>
                      </div>
                    </div>
                  </div>
                  <button className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-2.5 rounded-xl transition text-sm">
                    Save Preferences
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}