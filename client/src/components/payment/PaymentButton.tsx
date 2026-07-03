// client/src/components/payment/PaymentButton.tsx

import React, { useState } from 'react';

import { CreditCard, Loader2 } from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { paymentService, type PaymentData } from '../../services/paymentService';

interface PaymentButtonProps {
  amount: number;
  title?: string;
  description?: string;
  onSuccess?: (transactionRef: string) => void;
  onFailure?: (error: any) => void;
  buttonText?: string;
  className?: string;
  disabled?: boolean;
}

const PaymentButton: React.FC<PaymentButtonProps> = ({
  amount,
  title = 'UrbanNest Payment',
  description = 'Payment for UrbanNest service',
  onSuccess,
  onFailure,
  buttonText = 'Pay Now',
  className = '',
  disabled = false
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  // Get current user info from your auth context
  // This assumes you have a useAuth hook
  const { user } = useAuth(); // You'll need to import this

  const handlePaymentClick = () => {
    setShowPaymentForm(true);
  };

  const handleConfirmPayment = async () => {
    setIsProcessing(true);

    // Prepare payment data
    const paymentData: PaymentData = {
      amount: amount,
      email: user?.email || '',
      phoneNumber: user?.phoneNumber || '',
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      title: title,
      description: description
    };

    // Initialize payment
    const result = await paymentService.initializePayment(paymentData);

    if (result.success && onSuccess) {
      onSuccess(result.transactionReference || '');
    } else if (!result.success && onFailure) {
      onFailure(result.error);
    }

    setIsProcessing(false);
    setShowPaymentForm(false);
  };

  // Listen for payment events
  React.useEffect(() => {
    const handlePaymentSuccess = (event: any) => {
      console.log('Payment success event received:', event.detail);
      if (onSuccess) {
        onSuccess(event.detail.tx_ref);
      }
    };

    const handlePaymentFailure = (event: any) => {
      console.log('Payment failure event received:', event.detail);
      if (onFailure) {
        onFailure(event.detail.error);
      }
    };

    window.addEventListener('paymentSuccess', handlePaymentSuccess);
    window.addEventListener('paymentFailure', handlePaymentFailure);

    return () => {
      window.removeEventListener('paymentSuccess', handlePaymentSuccess);
      window.removeEventListener('paymentFailure', handlePaymentFailure);
    };
  }, [onSuccess, onFailure]);

  return (
    <>
      <button
        onClick={handlePaymentClick}
        disabled={disabled || isProcessing}
        className={`bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 
                   text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 
                   flex items-center justify-center gap-2 shadow-lg hover:shadow-xl
                   disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5" />
            {buttonText}
          </>
        )}
      </button>

      {/* Payment Modal */}
      {showPaymentForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                Complete Payment
              </h3>
              <button
                onClick={() => setShowPaymentForm(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400"
              >
                ✕
              </button>
            </div>

            <div className="mb-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-300">Amount to Pay</p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  ETB {(amount ?? 0).toLocaleString()}
                </p>
              </div>

              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {description}
              </p>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg mb-4">
                <p className="text-sm text-yellow-800 dark:text-yellow-300">
                  <strong>Available Payment Methods:</strong>
                </p>
                <ul className="text-sm text-yellow-700 dark:text-yellow-400 mt-1 space-y-1">
                  <li>• Telebirr</li>
                  <li>• CBE Birr</li>
                  <li>• eBirr</li>
                  <li>• Bank Cards</li>
                </ul>
              </div>
            </div>

            {/* Chapa payment container - The form will be injected here */}
            <div id="chapa-payment-container"></div>

            <button
              onClick={handleConfirmPayment}
              disabled={isProcessing}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors mt-4"
            >
              {isProcessing ? 'Processing...' : 'Proceed to Payment'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default PaymentButton;