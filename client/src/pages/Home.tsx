// client/src/pages/Home.tsx
import { Link, useNavigate } from 'react-router-dom'; // Add useNavigate import
import { motion } from 'framer-motion';
import SearchBar from '../components/ui/SearchBar';
import PropertyCard from "../components/property/PropertyCard";
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import homeBg from '../assets/images/h_photo.jpg';

// Mock data for featured properties
const featuredProperties = [
  {
    id: "1",
    title: "Modern Downtown Apartment",
    location: "Mexico, Addis Ababa",
    price: 3500,
    period: "month",
    beds: 2,
    baths: 2,
    sqft: 1200,
    type: "apartment",
    image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=500",
  },
  {
    id: "2",
    title: "Cozy Suburban House",
    location: "Hayat, Addis Ababa",
    price: 2000,
    period: "month",
    beds: 3,
    baths: 2,
    sqft: 1500,
    type: "house",
    image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=500",
  },
  {
    id: "3",
    title: "Luxury Waterfront Condo",
    location: "Bole Airport, Addis Ababa",
    price: 3500,
    period: "month",
    beds: 2,
    baths: 2,
    sqft: 1400,
    type: "condo",
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=500",
  },
];

export default function Home() {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate(); // Add this line

  // Handle search with navigation
  const handleSearch = (filters: any) => {
    console.log('Searching with filters:', filters);
    
    // Navigate to properties page with search filters in URL params
    const params = new URLSearchParams();
    
    if (filters.searchType) params.append('type', filters.searchType);
    if (filters.location) params.append('location', filters.location);
    if (filters.propertyType) params.append('propertyType', filters.propertyType);
    if (filters.priceRange) params.append('priceRange', filters.priceRange);
    
    navigate(`/properties?${params.toString()}`);
  };

  return (
    <div className="bg-blue-900">
    
      {/* Hero Section with Background Image */}
      <section 
        className="relative h-screen min-h-[900px] bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${homeBg})`,
        }}
      >
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/60"></div>
        
        {/* Content */}
        <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center"> 
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center text-white"
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              Discover. Connect. Move In.
            </h1>
            <p className="text-xl md:text-2xl text-white mb-8 max-w-3xl mx-auto">
              Find your perfect home with UrbanNEST - The smart way to rent/buy/sale your next property
            </p>
            
            <div className="max-w-4xl mx-auto">
              <SearchBar onSearch={handleSearch} /> {/* Updated here */}
            </div>

            {/* Add CTA Buttons under search */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
              <Link to="/properties">
                <Button variant="primary" size="lg" className="bg-green-700 text-white hover:bg-green-800">
                  Browse Properties
                </Button>
              </Link>
              <Link to="/create-listing">
                <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
                  List Your Property
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose UrbanNEST?</h2>
            <p className="text-xl text-gray-600">We make renting/buying/selling simple, fast, and reliable</p>
            <p className="text-xl text-gray-600">No Fake listing. Verified property only.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-green-200 text-center p-6 hover:shadow-lg transition-shadow rounded-lg">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold mb-2">Discover</h3>
              <p className="text-gray-600">Browse thousands of verified properties in your area</p>
            </div>
            <div className="bg-green-200 text-center p-6 hover:shadow-lg transition-shadow rounded-lg">
              <div className="text-4xl mb-4">🤝</div>
              <h3 className="text-xl font-semibold mb-2">Connect</h3>
              <p className="text-gray-600">Chat directly with landlords and schedule viewings</p>
            </div>
            <div className="bg-green-200 text-center p-6 hover:shadow-lg transition-shadow rounded-lg">
              <div className="text-4xl mb-4">🏠</div>
              <h3 className="text-xl font-semibold mb-2">Move In</h3>
              <p className="text-gray-600">Complete paperwork and move into your new home</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-white">Featured Properties</h2>
            <Link to="/properties">
              <Button variant="outline">View All Properties</Button>
            </Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProperties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="bg-green-700 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            {isLoggedIn ? "Ready to List Your Property?" : "Join UrbanNEST Today!"}
          </h2>
          <p className="text-xl text-green-100 mb-8">
            {isLoggedIn 
              ? "Reach thousands of potential tenants and buyers. List your property now!"
              : "Create an account to start listing your properties and reach more customers."}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to={isLoggedIn ? "/create-listing" : "/register"}>
              <Button variant="primary" size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
                {isLoggedIn ? "List Your Property" : "Create Free Account"}
              </Button>
            </Link>
            {!isLoggedIn && (
              <Link to="/login">
                <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}