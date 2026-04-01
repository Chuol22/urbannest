// client/src/pages/CreateListing.tsx
import React, { useState } from 'react';
import ListingPricing from '../components/listings/ListingPricing';
import SubscriptionPlans from '../components/subscriptions/SubscriptionPlans';
import BoostOptions from '../components/boosts/BoostOptions';
import AgentDashboard from '../components/subscriptions/AgentDashboard';
import { useListings } from '../hooks/useListings';
import { useSubscription } from '../hooks/useSubscription';
import useBoosts from '../hooks/useBoosts';
import { useAuth } from '../context/AuthContext';

const CreateListing = () => {
  const [step, setStep] = useState(1);
  const [selectedListingType, setSelectedListingType] = useState<'normal' | 'featured' | null>(null);
  const [listingPrice, setListingPrice] = useState(0);
  const [createdListingId, setCreatedListingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    location: '',
    type: ''
  });
  
  const { user } = useAuth();
  const userId = user?.id || 'temp-user-id';
  const { freeListingsCount, createListing, loading: listingsLoading } = useListings(userId);
  const { subscription, subscribe, loading: subscriptionLoading } = useSubscription(userId);
  const { applyBoost, loading: boostLoading } = useBoosts();

  const handleListingSelect = (type: 'normal' | 'featured', price: number) => {
    setSelectedListingType(type);
    setListingPrice(price);
    setStep(2);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubscribe = async (plan: 'basic' | 'pro' | 'premium', price: number) => {
    try {
      await subscribe(plan, price);
      alert(`Successfully subscribed to ${plan} plan!`);
    } catch (error) {
      console.error('Subscription error:', error);
      alert('Failed to subscribe. Please try again.');
    }
  };

  const handleApplyBoost = async (listingId: string, boostType: 'top_search' | 'urgent_badge', price: number) => {
    try {
      await applyBoost(listingId, boostType, price);
      alert(`${boostType === 'top_search' ? 'Top of Search' : 'Urgent Badge'} boost applied!`);
    } catch (error) {
      console.error('Boost error:', error);
      alert('Failed to apply boost. Please try again.');
    }
  };

  const handleCreateListing = async () => {
    if (!selectedListingType) return;
    
    try {
      // Validate form data
      if (!formData.title || !formData.description || !formData.price || !formData.location) {
        alert('Please fill in all required fields');
        return;
      }

      const listingData = {
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        location: formData.location,
        type: formData.type as 'sale' | 'rent',
        images: []
      };
      
      const newListing = await createListing(listingData, selectedListingType);
      
      // Check if newListing exists before accessing its id
      if (newListing && newListing.id) {
        setCreatedListingId(newListing.id);
        alert('Listing created successfully!');
        setStep(3);
      } else {
        alert('Failed to create listing. Please try again.');
      }
    } catch (error) {
      console.error('Create listing error:', error);
      alert('Failed to create listing. Please try again.');
    }
  };

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-md mx-auto">
            <div className={`flex-1 h-2 rounded-full transition-all ${step >= 1 ? 'bg-green-500' : 'bg-gray-300'}`} />
            <div className={`flex-1 h-2 rounded-full transition-all ${step >= 2 ? 'bg-green-500' : 'bg-gray-300'}`} />
            <div className={`flex-1 h-2 rounded-full transition-all ${step >= 3 ? 'bg-green-500' : 'bg-gray-300'}`} />
          </div>
          <div className="flex justify-between max-w-md mx-auto mt-2 text-sm text-gray-600">
            <span>Choose Plan</span>
            <span>Details</span>
            <span>Boost</span>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between mb-6 max-w-2xl mx-auto">
          {step > 1 && (
            <button
              onClick={handleBack}
              className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              ← Back
            </button>
          )}
          {step === 2 && (
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors ml-auto"
            >
              Next →
            </button>
          )}
        </div>

        {/* Step 1: Listing Pricing */}
        {step === 1 && (
          <ListingPricing
            onSelect={handleListingSelect}
            userFreeListingsLeft={Math.max(0, 10 - freeListingsCount)}
            isAgent={!!subscription}
          />
        )}

        {/* Step 2: Create Listing Form */}
        {step === 2 && (
          <div className="bg-white rounded-2xl p-8 shadow-lg max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold mb-6">Listing Details</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter property title"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter property description"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price (ETB) *
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter price"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location *
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter location"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Listing Type *
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="sale">For Sell</option>
                  <option value="rent">For Rent</option>
                </select>
              </div>
            </div>
            
            <button
              onClick={handleCreateListing}
              disabled={listingsLoading || !formData.title || !formData.description || !formData.price || !formData.location}
              className="w-full bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed mt-6 transition-colors"
            >
              {listingsLoading ? 'Creating...' : `Create Listing - ${listingPrice === 0 ? 'FREE' : `ETB ${listingPrice}`}`}
            </button>
          </div>
        )}

        {/* Step 3: Boost Options */}
        {step === 3 && createdListingId && (
          <div className="max-w-2xl mx-auto">
            <BoostOptions
              listingId={createdListingId}
              onApplyBoost={handleApplyBoost}
              existingBoosts={[]}
            />
          </div>
        )}

        {/* Agent Dashboard */}
        {subscription && (
          <div className="mt-12 max-w-2xl mx-auto">
            <AgentDashboard
              subscription={subscription}
              listingsCount={freeListingsCount}
              stats={{
                totalViews: 0,
                totalInquiries: 0,
                totalFavorites: 0
              }}
              onUpgrade={() => setStep(1)}
            />
          </div>
        )}

        {/* Subscription Plans */}
        <div className="mt-12">
          <SubscriptionPlans
            onSubscribe={handleSubscribe}
            currentPlan={subscription?.plan}
          />
        </div>
      </div>
    </div>
  );
};

export default CreateListing;