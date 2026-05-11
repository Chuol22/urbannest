// src/utils/formatters.ts
export const formatCurrency = (amount: number, currency: string = 'ETB'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

export const formatDate = (date: string | Date, format: string = 'MMM DD, YYYY'): string => {
  const d = new Date(date);
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  };
  
  if (format === 'full') {
    options.weekday = 'long';
    options.year = 'numeric';
    options.month = 'long';
    options.day = 'numeric';
  }
  
  return new Intl.DateTimeFormat('en-US', options).format(d);
};

export const formatRelativeTime = (date: string | Date): string => {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);
  
  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
    second: 1
  };
  
  for (const [unit, seconds] of Object.entries(intervals)) {
    const interval = Math.floor(diffInSeconds / seconds);
    if (interval >= 1) {
      return `${interval} ${unit}${interval === 1 ? '' : 's'} ago`;
    }
  }
  
  return 'just now';
};

export const formatAddress = (address: string): string => {
  if (address.length > 50) {
    return address.substring(0, 47) + '...';
  }
  return address;
};

export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return '(' + match[1] + ') ' + match[2] + '-' + match[3];
  }
  return phone;
};

export const formatSquareFeet = (sqft: number): string => {
  if (sqft === undefined || sqft === null) return '0 sq ft';
  return `${sqft.toLocaleString()} sq ft`;
};

export const formatBedrooms = (count: number): string => {
  return `${count} ${count === 1 ? 'Bedroom' : 'Bedrooms'}`;
};

export const formatBathrooms = (count: number): string => {
  return `${count} ${count === 1 ? 'Bathroom' : 'Bathrooms'}`;
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const formatListingStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    available: 'Available',
    rented: 'Rented',
    pending: 'Pending',
    sold: 'Sold'
  };
  return statusMap[status] || status;
};