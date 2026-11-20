import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'gold' | 'outline' | 'verified' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses = 'rounded-xl font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center justify-center';
  
  const variants = {
    // 🔵 Navy CTA (#181B22) with Gold (#C9A865) hover accents
    primary: 'bg-[#181B22] text-white hover:bg-[#262C37] hover:ring-2 hover:ring-[#C9A865]/50 focus:ring-[#181B22] shadow-md shadow-[#181B22]/20 hover:shadow-lg dark:bg-[#181B22] dark:hover:bg-[#262C37] dark:border dark:border-[#C9A865]/50',
    // 🟡 Gold Action / Accent
    gold: 'bg-[#C9A865] text-white hover:bg-[#B6924D] focus:ring-[#C9A865] shadow-md shadow-[#C9A865]/25 hover:shadow-lg',
    secondary: 'bg-[#C9A865] text-white hover:bg-[#B6924D] focus:ring-[#C9A865] shadow-md shadow-[#C9A865]/25 hover:shadow-lg',
    // Outline Navy with Gold hover
    outline: 'border-2 border-[#181B22] text-[#181B22] hover:bg-[#181B22] hover:text-white focus:ring-[#181B22] dark:border-[#C9A865] dark:text-[#C9A865] dark:hover:bg-[#C9A865] dark:hover:text-[#0F1116]',
    // 🟢 Verified / Trust Green (#2E7D4F)
    verified: 'bg-[#2E7D4F] text-white hover:bg-[#25663F] focus:ring-[#2E7D4F] shadow-md shadow-[#2E7D4F]/20',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-md shadow-red-600/20',
  };
  
  const sizes = {
    sm: 'px-3.5 py-1.5 text-xs md:text-sm',
    md: 'px-5 py-2.5 text-sm md:text-base',
    lg: 'px-7 py-3.5 text-base md:text-lg',
  };
  
  const widthClass = fullWidth ? 'w-full' : '';
  
  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${widthClass} ${className} ${
        loading || disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
      disabled={loading || disabled}
      {...props}
    >
      {loading ? (
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
        </div>
      ) : (
        children
      )}
    </button>
  );
};