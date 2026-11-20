import React from 'react';

interface AlertProps {
  type?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  message: string;
  onClose?: () => void;
}

export const Alert: React.FC<AlertProps> = ({ 
  type = 'info', 
  title, 
  message, 
  onClose 
}) => {
  const styles = {
    info: 'bg-[#F0F5FC] dark:bg-[#181B22]/40 border-[#B8D3F5] dark:border-[#262C37] text-[#181B22] dark:text-[#B4BCCB]',
    success: 'bg-[#F0F8F3] dark:bg-[#2E7D4F]/20 border-[#BCE1CA] dark:border-[#2E7D4F]/40 text-[#2E7D4F] dark:text-[#5CAE78]',
    warning: 'bg-[#FCFAF5] dark:bg-[#C9A865]/20 border-[#EDE2C6] dark:border-[#C9A865]/40 text-[#947337] dark:text-[#DFCFA0]',
    error: 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300',
  };

  const icons = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌',
  };

  return (
    <div className={`p-4 rounded-lg border ${styles[type]} relative`}>
      <div className="flex items-start">
        <div className="text-xl mr-3">{icons[type]}</div>
        <div className="flex-1">
          {title && <h3 className="font-semibold mb-1">{title}</h3>}
          <p className="text-sm">{message}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
};