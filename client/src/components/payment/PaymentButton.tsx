/**
 * Payment Button Component
 *
 * A reusable button component for initiating Chapa payments.
 * Uses redirect-based payment flow for seamless checkout experience.
 *
 * @author UrbanNEST Team
 * @version 2.0.0
 */

import React from 'react';
import { CreditCard, Loader2 } from 'lucide-react';

/* ==========================================================================
   Types & Interfaces
   ========================================================================== */

interface PaymentButtonProps {
  /** Payment amount in ETB */
  amount: number;
  /** Callback function to initiate payment */
  onPay: () => Promise<void>;
  /** Custom button text */
  buttonText?: string;
  /** Additional CSS classes */
  className?: string;
  /** Disable button interaction */
  disabled?: boolean;
  /** Show loading state */
  isLoading?: boolean;
}

/* ==========================================================================
   Component
   ========================================================================== */

/**
 * PaymentButton Component
 *
 * Renders a styled button that initiates payment when clicked.
 * Automatically shows loading state and displays the amount.
 *
 * @example
 * <PaymentButton
 *   amount={100}
 *   onPay={handlePayment}
 *   isLoading={isProcessing}
 *   buttonText="Pay Now"
 * />
 */
const PaymentButton: React.FC<PaymentButtonProps> = ({
  amount,
  onPay,
  buttonText = 'Pay Now',
  className = '',
  disabled = false,
  isLoading = false,
}) => {
  return (
    <button
      type="button"
      onClick={onPay}
      disabled={disabled || isLoading}
      className={`
        bg-gradient-to-r from-emerald-600 to-emerald-700
        hover:from-emerald-700 hover:to-emerald-800
        text-white font-semibold py-3 px-6 rounded-lg
        transition-all duration-200 flex items-center justify-center gap-2
        shadow-lg hover:shadow-xl
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          Redirecting...
        </>
      ) : (
        <>
          <CreditCard className="w-5 h-5" />
          {buttonText}
          <span className="text-sm opacity-90">(ETB {amount.toLocaleString()})</span>
        </>
      )}
    </button>
  );
};

export default PaymentButton;
