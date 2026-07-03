import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { CheckCircle } from 'lucide-react';

import { paymentService } from '../services/paymentService';

const PaymentSuccess: React.FC = () => {
  const location = useLocation();
  const [verifying, setVerifying] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState<'success' | 'failed' | null>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      // Get transaction reference from URL or localStorage
      const params = new URLSearchParams(location.search);
      const tx_ref = params.get('tx_ref');

      const pendingTransaction = localStorage.getItem('pendingTransaction');
      const transaction = pendingTransaction ? JSON.parse(pendingTransaction) : null;

      const reference = tx_ref || transaction?.tx_ref;

      if (reference) {
        try {
          const result = await paymentService.verifyPayment(reference);
          if (result.status === 'success') {
            setVerificationStatus('success');
            // Clear pending transaction
            localStorage.removeItem('pendingTransaction');
          } else {
            setVerificationStatus('failed');
          }
        } catch (error) {
          setVerificationStatus('failed');
        }
      } else {
        setVerificationStatus('failed');
      }

      setVerifying(false);
    };

    verifyPayment();
  }, [location]);

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Verifying your payment...</p>
        </div>
      </div>
    );
  }

  if (verificationStatus === 'failed') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">⚠️</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Verification Failed
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            We couldn't verify your payment. Please contact support.
          </p>
          <Link
            to="/contact"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Contact Support
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Payment Successful!
        </h1>

        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Thank you for your payment. Your transaction has been completed successfully.
        </p>

        <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 dark:text-gray-300">Transaction ID:</span>
            <span className="text-gray-900 dark:text-white font-mono text-sm">
              {localStorage.getItem('pendingTransaction') &&
                JSON.parse(localStorage.getItem('pendingTransaction') || '{}').tx_ref}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-300">Date:</span>
            <span className="text-gray-900 dark:text-white">
              {new Date().toLocaleDateString()}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <Link
            to="/dashboard"
            className="block w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </Link>

          <Link
            to="/properties"
            className="block w-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Browse Properties
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;