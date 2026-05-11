export const LISTING_PRICES = {
  normal: {
    price: 0,
    label: 'Free',
    duration: 'Forever',
    limit: 10
  },
  featured: {
    price: 200,
    pricePremium: 500,
    label: 'Featured',
    duration: '7 days',
    currency: 'ETB'
  }
};

export const SUBSCRIPTION_PRICES = {
  basic: {
    price: 150,
    label: 'Basic',
    listings: 10,
    features: ['10 active listings', 'Basic analytics', 'Email support']
  },
  pro: {
    price: 300,
    label: 'Pro',
    listings: 30,
    features: ['30 active listings', 'Advanced analytics', 'Priority support', 'Listing insights']
  },
  premium: {
    price: 600,
    label: 'Premium',
    listings: -1, // Unlimited
    features: ['Unlimited listings', 'Featured priority', 'Advanced analytics', '24/7 priority support', 'Dedicated account manager']
  }
};

export const BOOST_PRICES = {
  top_search: {
    price: 20,
    label: 'Top of Search',
    description: 'Boost your listing to the top of search results',
    duration: '7 days',
    color: 'bg-blue-600'
  },
  urgent_badge: {
    price: 20,
    label: 'Urgent Sale',
    description: 'Add "Urgent" badge to attract quick buyers',
    duration: '7 days',
    color: 'bg-red-500'
  }
};

export const formatPrice = (price: number, currency: string = 'ETB') => {
  if (price === undefined || price === null) return `${currency} 0`;
  return `${currency} ${price.toLocaleString()}`;
};

export const calculateDiscount = (price: number, discountPercent: number) => {
  return price - (price * discountPercent / 100);
};