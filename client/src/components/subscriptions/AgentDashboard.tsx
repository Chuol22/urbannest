import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Eye, MessageCircle, Heart, Calendar, Crown } from 'lucide-react';
import { Subscription } from '../../types';
import { formatPrice } from '../../utils/pricing';
import { Button } from '../ui/Button';

interface AgentDashboardProps {
  subscription?: Subscription;
  listingsCount: number;
  stats: {
    totalViews: number;
    totalInquiries: number;
    totalFavorites: number;
  };
  onUpgrade: () => void;
}

const AgentDashboard: React.FC<AgentDashboardProps> = ({
  subscription,
  listingsCount,
  stats,
  onUpgrade
}) => {
  const getPlanColor = () => {
    switch (subscription?.plan) {
      case 'basic': return 'blue';
      case 'pro': return 'purple';
      case 'premium': return 'yellow';
      default: return 'gray';
    }
  };

  const getListingsRemaining = () => {
    if (!subscription) return 10 - listingsCount;
    if (subscription.plan === 'premium') return 'Unlimited';
    return subscription.listingsLimit - listingsCount;
  };

  return (
    <div className="space-y-6">
      {/* Subscription Status Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-6 text-white"
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-sm opacity-90">Current Plan</p>
            <h3 className="text-3xl font-bold mt-1">
              {subscription ? subscription.plan.toUpperCase() : 'FREE'}
            </h3>
            {subscription && (
              <p className="text-sm mt-1 opacity-90">
                Renews on {new Date(subscription.endDate).toLocaleDateString()}
              </p>
            )}
          </div>
          <div className="bg-white/20 p-3 rounded-full">
            <Crown size={32} />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div>
            <p className="text-sm opacity-90">Listings Used</p>
            <p className="text-2xl font-bold">
              {listingsCount} / {subscription?.listingsLimit === -1 ? '∞' : (subscription?.listingsLimit || 10)}
            </p>
          </div>
          <div>
            <p className="text-sm opacity-90">Remaining</p>
            <p className="text-2xl font-bold">{getListingsRemaining()}</p>
          </div>
        </div>
        
        {!subscription && (
          <Button
            onClick={onUpgrade}
            className="mt-6 w-full bg-white text-primary-600 hover:bg-gray-100"
          >
            Upgrade to Pro
          </Button>
        )}
      </motion.div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <Eye className="text-blue-500" size={24} />
            <span className="text-2xl font-bold text-gray-900">{stats.totalViews}</span>
          </div>
          <p className="text-gray-600 text-sm">Total Views</p>
        </div>
        
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <MessageCircle className="text-green-500" size={24} />
            <span className="text-2xl font-bold text-gray-900">{stats.totalInquiries}</span>
          </div>
          <p className="text-gray-600 text-sm">Inquiries</p>
        </div>
        
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <Heart className="text-red-500" size={24} />
            <span className="text-2xl font-bold text-gray-900">{stats.totalFavorites}</span>
          </div>
          <p className="text-gray-600 text-sm">Favorites</p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h4 className="font-semibold text-gray-900 mb-4">Recent Activity</h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Total earnings this month</span>
            <span className="font-semibold text-green-600">ETB 0</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Featured listings active</span>
            <span className="font-semibold">0</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Response rate</span>
            <span className="font-semibold">-</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentDashboard;