import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Crown, Zap, Shield } from 'lucide-react';
import { SUBSCRIPTION_PRICES, formatPrice } from '../../utils/pricing';
import { Button } from '../ui/Button';

interface SubscriptionPlansProps {
  onSubscribe: (plan: 'basic' | 'pro' | 'premium', price: number) => void;
  currentPlan?: 'basic' | 'pro' | 'premium' | null;
}

const SubscriptionPlans: React.FC<SubscriptionPlansProps> = ({
  onSubscribe,
  currentPlan
}) => {
  const [selectedPlan, setSelectedPlan] = useState<'basic' | 'pro' | 'premium' | null>(null);

  const plans = [
    {
      id: 'basic' as const,
      icon: Shield,
      color: 'blue',
      gradient: 'from-blue-500 to-blue-600',
      ...SUBSCRIPTION_PRICES.basic
    },
    {
      id: 'pro' as const,
      icon: Zap,
      color: 'purple',
      gradient: 'from-purple-500 to-purple-600',
      ...SUBSCRIPTION_PRICES.pro
    },
    {
      id: 'premium' as const,
      icon: Crown,
      color: 'gold',
      gradient: 'from-yellow-500 to-yellow-600',
      ...SUBSCRIPTION_PRICES.premium
    }
  ];

  const handleSubscribe = (plan: 'basic' | 'pro' | 'premium', price: number) => {
    setSelectedPlan(plan);
    onSubscribe(plan, price);
  };

  return (
    <div className="py-12">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">Agent Subscription Plans</h2>
        <p className="text-xl text-gray-600">Choose the perfect plan for your real estate business</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {plans.map((plan) => {
          const Icon = plan.icon;
          const isCurrent = currentPlan === plan.id;
          
          return (
            <motion.div
              key={plan.id}
              whileHover={{ y: -8 }}
              className={`relative rounded-2xl bg-white shadow-xl overflow-hidden ${
                isCurrent ? 'ring-2 ring-green-500' : ''
              }`}
            >
              {plan.id === 'premium' && (
                <div className="absolute top-0 right-0 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-4 py-1 rounded-bl-lg text-sm font-semibold">
                  BEST VALUE
                </div>
              )}
              
              <div className={`bg-gradient-to-r ${plan.gradient} p-6 text-white`}>
                <Icon size={40} className="mb-4" />
                <h3 className="text-2xl font-bold mb-2">{plan.label}</h3>
                <p className="text-4xl font-bold">
                  {formatPrice(plan.price)}
                  <span className="text-lg font-normal">/month</span>
                </p>
              </div>
              
              <div className="p-6">
                <div className="mb-6">
                  <p className="text-2xl font-bold text-gray-900">
                    {plan.listings === -1 ? 'Unlimited' : `${plan.listings}`}
                    <span className="text-sm text-gray-600 font-normal"> listings</span>
                  </p>
                </div>
                
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-gray-600">
                      <Check size={18} className="text-green-500 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button
                  variant={isCurrent ? 'outline' : 'primary'}
                  className={`w-full ${
                    isCurrent
                      ? 'border-green-500 text-green-500'
                      : `bg-gradient-to-r ${plan.gradient} text-white`
                  }`}
                  onClick={() => handleSubscribe(plan.id, plan.price)}
                  disabled={isCurrent}
                >
                  {isCurrent ? 'Current Plan' : `Subscribe to ${plan.label}`}
                </Button>
              </div>
            </motion.div>
          );
        })}
      </div>
      
      <p className="text-center text-gray-500 text-sm mt-8">
        All plans include basic listing analytics and customer support
      </p>
    </div>
  );
};

export default SubscriptionPlans;