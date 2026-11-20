import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { ArrowRight, ChevronRight, MapPin, Plus, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import SearchBar from '../components/ui/SearchBar';
import PropertyCard from '../components/property/PropertyCard';
import { Button } from '../components/ui/Button';
import { propertyService } from '../services/propertyService';
import type { Property } from '../types';
import ctaBg from '../assets/images/bg.jpg';
import homeBg from '../assets/images/h_photo.jpg';

// Popular Locations Component (Integrated - Map Removed)
const PopularLocations = () => {
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>('all');
  const navigate = useNavigate();

  const popularCitiesList = [
    { name: 'Addis Ababa', slug: 'addis-ababa', properties: '1,234', image: 'https://images.unsplash.com/photo-1524661135-423995f22d0f?w=400&h=300&fit=crop' },
    { name: 'Dire Dawa', slug: 'dire-dawa', properties: '432', image: 'https://images.unsplash.com/photo-1591779051696-1c3fa1469a79?w=400&h=300&fit=crop' },
    { name: 'Gambella', slug: 'Gambella', properties: '512', image: 'https://images.unsplash.com/photo-1591779051696-1c3fa1469a79?w=400&h=300&fit=crop' },
    { name: 'Hawassa', slug: 'hawassa', properties: '456', image: 'https://images.unsplash.com/photo-1576479094293-533c00d9b5fc?w=400&h=300&fit=crop' },
    { name: 'Adama', slug: 'adama', properties: '345', image: 'https://images.unsplash.com/photo-1590077428593-55c4ae1fd254?w=400&h=300&fit=crop' },
    { name: 'Jimma', slug: 'jimma', properties: '278', image: 'https://images.unsplash.com/photo-1590077428593-55c4ae1fd254?w=400&h=300&fit=crop' },
  ];

  const neighborhoods = ['Newland', 'Dipo Downtown', 'Agarpa', 'New University side', 'Dipo Mamarathiel', 'Dalkoch', 'Nyangora', 'Arat Kilo', 'Jap Jap', 'Yawere', 'Yechuey', 'Kality'];

  const handleCityClick = (slug: string) => {
    navigate(`/properties?city=${slug}`);
  };

  const handleNeighborhoodClick = (neighborhood: string) => {
    setSelectedNeighborhood(neighborhood === selectedNeighborhood ? 'all' : neighborhood);
    const propertiesSection = document.getElementById('properties-section');
    if (propertiesSection) {
      propertiesSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="popular-locations py-16 bg-[#F4F5EF] dark:bg-[#0F1116] transition-colors border-y border-gray-100 dark:border-[#2E3543]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-[#181B22] dark:text-white mb-3">
            Popular Locations
          </h2>
          <div className="w-20 h-1.5 bg-[#C9A865] mx-auto rounded-full mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Your new home might be waiting for you in one of these popular cities.
            <br />
            Select a city to find available homes.
          </p>
        </motion.div>

        {/* Cities Horizontal Scroll with Animation */}
        <div className="relative mb-12">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="flex overflow-x-auto gap-6 pb-4 scrollbar-hide"
            style={{ scrollBehavior: 'smooth' }}
          >
            {popularCitiesList.map((city, index) => (
              <motion.div
                key={city.slug}
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                viewport={{ once: true }}
                whileHover="hover"
                onClick={() => handleCityClick(city.slug)}
                className="group cursor-pointer flex-shrink-0 w-80"
              >
                <div className="relative bg-white dark:bg-[#181B22] rounded-2xl shadow-md overflow-hidden transition-all duration-500 hover:shadow-2xl border border-gray-100 dark:border-[#2E3543]">
                  {/* City Image */}
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={city.image}
                      alt={city.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                    />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors duration-500"></div>
                  </div>

                  {/* City Info */}
                  <div className="p-5">
                    <motion.div
                      className="flex items-center gap-2 mb-2"
                      whileHover={{ x: 5 }}
                      transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    >
                      <MapPin className="w-4 h-4 text-[#C9A865]" />
                      <h3 className="text-xl font-bold text-[#181B22] dark:text-white group-hover:text-[#C9A865] dark:group-hover:text-[#C9A865] transition-colors duration-300">
                        {city.name}
                      </h3>
                    </motion.div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{city.properties} properties</p>

                    {/* Animated Arrow Button */}
                    <motion.div
                      className="flex items-center text-[#C9A865] font-semibold group"
                      initial={false}
                    >
                      <span className="text-sm">Explore City</span>
                      <motion.span
                        initial={{ x: 0 }}
                        animate={{ x: 0 }}
                        whileHover={{ x: 8 }}
                        whileTap={{ scale: 0.9 }}
                        transition={{ type: "spring", stiffness: 400, damping: 20 }}
                        className="ml-2"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </motion.span>
                    </motion.div>

                    {/* Walking Arrow Animation (sequential) */}
                    <motion.div
                      className="absolute bottom-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      initial={{ x: -10 }}
                      whileInView={{ x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <div className="flex gap-1">
                        <motion.div
                          animate={{ x: [0, 5, 0] }}
                          transition={{ repeat: Infinity, duration: 1, delay: index * 0.1 }}
                        >
                          <ChevronRight className="w-4 h-4 text-[#C9A865]" />
                        </motion.div>
                        <motion.div
                          animate={{ x: [0, 8, 0] }}
                          transition={{ repeat: Infinity, duration: 1, delay: index * 0.1 + 0.2 }}
                        >
                          <ChevronRight className="w-4 h-4 text-[#C9A865]" />
                        </motion.div>
                        <motion.div
                          animate={{ x: [0, 12, 0] }}
                          transition={{ repeat: Infinity, duration: 1, delay: index * 0.1 + 0.4 }}
                        >
                          <ChevronRight className="w-4 h-4 text-[#C9A865]" />
                        </motion.div>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Scroll Indicators */}
          <div className="flex justify-center gap-2 mt-4">
            {popularCitiesList.map((_, index) => (
              <div
                key={index}
                className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"
              />
            ))}
          </div>
        </div>

        {/* Popular Neighborhoods - Addis Ababa */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-10 pt-6 border-t border-gray-200 dark:border-gray-700"
        >
          <div className="flex flex-wrap gap-3 items-center">
            <span className="text-sm text-[#181B22] dark:text-gray-300 font-semibold bg-white dark:bg-[#181B22] px-3.5 py-1.5 rounded-xl border border-gray-200 dark:border-[#2E3543]">
              📍 Popular Neighborhoods:
            </span>
            <div className="flex flex-wrap gap-2">
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleNeighborhoodClick('all')}
                className={`text-sm px-4 py-1.5 rounded-full transition-all duration-300 font-medium ${selectedNeighborhood === 'all'
                  ? 'bg-[#181B22] text-white shadow-md shadow-[#181B22]/20 border border-[#C9A865]'
                  : 'bg-white dark:bg-[#181B22] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-[#C9A865] hover:text-[#181B22] dark:hover:text-[#C9A865]'
                  }`}
              >
                All
              </motion.button>
              {neighborhoods.map((neighborhood, index) => (
                <motion.button
                  key={neighborhood}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.03, type: "spring", stiffness: 200, damping: 15 }}
                  viewport={{ once: true }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleNeighborhoodClick(neighborhood)}
                  className={`text-sm px-4 py-1.5 rounded-full transition-all duration-300 font-medium ${selectedNeighborhood === neighborhood
                    ? 'bg-[#181B22] text-white shadow-md shadow-[#181B22]/20 border border-[#C9A865]'
                    : 'bg-white dark:bg-[#181B22] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-[#C9A865] hover:text-[#181B22] dark:hover:text-[#C9A865]'
                    }`}
                >
                  {neighborhood}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Selected Neighborhood Info */}
          {selectedNeighborhood !== 'all' && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="mt-4 p-4 bg-[#FCFAF5] dark:bg-[#181B22]/80 rounded-xl border border-[#EDE2C6] dark:border-[#C9A865]/40 shadow-sm"
            >
              <p className="text-sm text-[#947337] dark:text-[#DFCFA0] flex items-center justify-between">
                <span>Showing properties in <strong className="text-[#181B22] dark:text-white">{selectedNeighborhood}</strong> neighborhood.</span>
                <motion.button
                  whileHover={{ x: 6 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleCityClick(selectedNeighborhood.toLowerCase())}
                  className="text-[#C9A865] hover:text-[#B6924D] font-bold underline inline-flex items-center gap-1 text-sm"
                >
                  Browse all
                  <ArrowRight className="w-3.5 h-3.5" />
                </motion.button>
              </p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  );
};

// Main Home Component
export default function Home() {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [showChat, setShowChat] = useState(false);
  const [featuredProperties, setFeaturedProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [typedText, setTypedText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopIndex, setLoopIndex] = useState(0);

  // Typing animation words
  const words = [
    'Your Dream Property Awaits',
    'Safe & Secure Homes',
    'Commercial Buildings Available',
    'Verified Property Listings'
  ];
  const typingSpeed = 100;
  const deletingSpeed = 50;
  const pauseTime = 1500;

  // Typing animation effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    const currentWord = words[loopIndex % words.length];

    if (isDeleting) {
      timer = setTimeout(() => {
        setTypedText((prev) => prev.slice(0, -1));
        if (typedText === '') {
          setIsDeleting(false);
          setLoopIndex((prev) => prev + 1);
        }
      }, deletingSpeed);
    } else {
      timer = setTimeout(() => {
        setTypedText(currentWord.slice(0, typedText.length + 1));
        if (typedText === currentWord) {
          timer = setTimeout(() => setIsDeleting(true), pauseTime);
        }
      }, typingSpeed);
    }

    return () => clearTimeout(timer);
  }, [typedText, isDeleting, loopIndex, words]);

  // Detect navbar height dynamically
  useEffect(() => {
    const updateHeaderHeight = () => {
      const navElement = document.querySelector('nav') || document.querySelector('header');
      if (navElement) {
        setHeaderHeight((navElement as HTMLElement).offsetHeight);
      }
    };

    updateHeaderHeight();
    window.addEventListener('resize', updateHeaderHeight);

    const navElement = document.querySelector('nav') || document.querySelector('header');
    const observer = new ResizeObserver(updateHeaderHeight);
    if (navElement) {
      observer.observe(navElement);
    }

    return () => {
      window.removeEventListener('resize', updateHeaderHeight);
      observer.disconnect();
    };
  }, []);

  // Preload background image
  useEffect(() => {
    const img = new Image();
    img.src = homeBg;
    img.onload = () => setImageLoaded(true);
  }, []);

  // Fetch featured properties on component mount
  useEffect(() => {
    const fetchFeaturedProperties = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await propertyService.getFeaturedProperties(6);
        // Defensive: ensure we always get an array even if API shape changes
        setFeaturedProperties(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error fetching featured properties:', err);
        setError('Failed to load featured properties');
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedProperties();
  }, []);

  const handleSearch = (filters: any) => {
    console.log('Searching with filters:', filters);
    const params = new URLSearchParams();
    if (filters.searchType) params.append('type', filters.searchType);
    if (filters.location) params.append('location', filters.location);
    if (filters.propertyType) params.append('propertyType', filters.propertyType);
    if (filters.priceRange) params.append('priceRange', filters.priceRange);
    navigate(`/properties?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Hero Section */}
      <section className="relative min-h-[82vh] lg:min-h-[88vh] flex items-center justify-center overflow-hidden">
        {/* Background Image Container */}
        <div className="absolute inset-0 z-0">
          {!imageLoaded && (
            <div className="absolute inset-0 bg-[#0F1116] animate-pulse" />
          )}

          <div
            className={`absolute inset-0 bg-cover bg-no-repeat transition-opacity duration-1000 ease-out ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              backgroundImage: `url(${homeBg})`,
              backgroundPosition: 'center 35%',
            }}
          >
            {/* Clean, clear gradient scrim - preserves Addis Ababa city lights while ensuring crisp text contrast */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#0F1116]/80 via-[#0F1116]/40 to-[#0F1116]/90" />
            <div className="absolute inset-0 bg-black/20" />
            {/* Subtle warm champagne gold ambient highlight matching the logo */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'radial-gradient(circle at 50% 30%, rgba(201, 168, 101, 0.15) 0%, transparent 70%)',
              }}
            />
          </div>
        </div>

        {/* Hero Content */}
        <div
          className="relative z-10 w-full py-16 md:py-20 lg:py-24 flex flex-col justify-center"
          style={{
            paddingTop: headerHeight ? `${headerHeight + 24}px` : undefined,
          }}
        >
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="max-w-5xl mx-auto text-center"
            >
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6, type: "spring", stiffness: 100, damping: 15 }}
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white mb-3 leading-tight tracking-tight drop-shadow-md"
              >
                Let's Find Your
                <span className="block text-[#C9A865]">Place</span>

                {/* Typing Animation Component - Gold Accent #C9A865 */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                  className="text-[#C9A865] text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold mt-3 h-12 md:h-14 drop-shadow-lg"
                >
                  <span>{typedText}</span>
                  <motion.span
                    className="typed-cursor inline-block w-[3px] h-6 sm:h-7 md:h-8 ml-1 bg-[#C9A865]"
                    animate={{ opacity: [1, 0, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    aria-hidden="true"
                  >
                    |
                  </motion.span>
                </motion.div>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6, type: "spring", stiffness: 100, damping: 15 }}
                className="text-lg md:text-xl lg:text-2xl text-gray-200 max-w-3xl mx-auto leading-relaxed mt-4 mb-6 font-normal"
              >
                Whether you're looking to buy, rent, sell, or invest, UrbanNest helps you find the right place with less stress.
                Browse verified listings and connect with trusted landlords and licensed brokers.
              </motion.p>

              {/* Primary CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6, type: "spring", stiffness: 100, damping: 15 }}
                className="flex flex-wrap gap-4 sm:gap-6 mt-8 justify-center"
              >
                <Link to="/properties">
                  <motion.button
                    whileHover={{ scale: 1.04, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="group relative px-8 sm:px-10 py-4 bg-[#181B22] 
                               text-white font-bold rounded-2xl transition-all duration-300 
                               uppercase text-sm sm:text-base tracking-wider shadow-2xl shadow-black/40
                               border-2 border-[#C9A865] hover:bg-[#262C37] hover:border-[#C9A865]
                               hover:shadow-2xl hover:shadow-[#C9A865]/30
                               min-w-[200px] sm:min-w-[240px]
                               overflow-hidden"
                  >
                    <span className="relative flex items-center justify-center gap-3">
                      Find a Property
                      <motion.div
                        whileHover={{ x: 5 }}
                        transition={{ type: "spring", stiffness: 400, damping: 20 }}
                      >
                        <ChevronRight className="w-5 h-5 text-[#C9A865]" />
                      </motion.div>
                    </span>
                  </motion.button>
                </Link>

                <Link to="/create-listing">
                  <motion.button
                    whileHover={{ scale: 1.04, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="group relative px-8 sm:px-10 py-4 bg-white/10 backdrop-blur-md 
                               border-2 border-white/60 text-white font-bold rounded-2xl 
                               transition-all duration-300 uppercase text-sm sm:text-base tracking-wider
                               hover:bg-white hover:text-[#181B22] hover:border-white 
                               hover:shadow-2xl hover:-translate-y-0.5 active:translate-y-0
                               min-w-[200px] sm:min-w-[240px]
                               overflow-hidden"
                  >
                    <span className="relative flex items-center justify-center gap-3 z-10">
                      List Your Property
                      <motion.div
                        whileHover={{ rotate: 90 }}
                        transition={{ type: "spring", stiffness: 200, damping: 15 }}
                      >
                        <Plus className="w-5 h-5 text-[#C9A865]" />
                      </motion.div>
                    </span>
                  </motion.button>
                </Link>
              </motion.div>

              {/* Search Bar Integration */}
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.6, duration: 0.6, type: "spring", stiffness: 100, damping: 15 }}
                className="mt-10 md:mt-12 max-w-3xl mx-auto"
              >
                <div className="bg-white/95 dark:bg-[#0F1116]/95 backdrop-blur-md rounded-2xl p-2.5 shadow-2xl border border-white/20 dark:border-[#2E3543]">
                  <SearchBar onSearch={handleSearch} />
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* What Are You Looking For Section */}
      <section className="lg:px-16 md:px-6 px-4 md:pt-14 py-10 bg-white dark:bg-[#0F1116] transition-colors">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, type: "spring", stiffness: 100, damping: 15 }}
          viewport={{ once: true }}
        >
          <h2 className="lg:text-3xl text-2xl font-bold leading-none tracking-tighter text-[#181B22] dark:text-white lg:mb-3">What Are You Looking For?</h2>
          <div className="w-20 h-1.5 bg-[#C9A865] rounded-full mb-8"></div>
        </motion.div>

        <div className="flex justify-center">
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3 md:gap-6 lg:gap-6 items-center w-full">
            {[
              { title: "Apartment For Rent", image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop", link: "/properties?type=apartment&status=rent" },
              { title: "Apartment For Sale", image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop", link: "/properties?type=apartment&status=sale" },
              { title: "House For Rent", image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop", link: "/properties?type=house&status=rent" },
              { title: "House For Sale", image: "https://images.unsplash.com/photo-1580587771525-78b9dba3b91d?w=800&h=600&fit=crop", link: "/properties?type=house&status=sale" },
              { title: "Land For Sale", image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&h=600&fit=crop", link: "/properties?type=land&status=sale" },
              { title: "Condominium", image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop", link: "/properties?type=condo" },
              { title: "New Development", image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=600&fit=crop", link: "/properties?type=new-development" },
              { title: "Furnished", image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop", link: "/properties?label=furnished" },
              { title: "Unfurnished", image: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&h=600&fit=crop", link: "/properties?label=unfurnished" }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.4, type: "spring", stiffness: 150, damping: 12 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.03, y: -5 }}
                whileTap={{ scale: 0.98 }}
                className="relative flex flex-col rounded-2xl cursor-pointer group overflow-hidden border border-gray-100 dark:border-[#2E3543] shadow-md"
              >
                <Link to={item.link}>
                  <div className="relative overflow-hidden">
                    <motion.img
                      alt={item.title}
                      title={item.title}
                      src={item.image}
                      loading="lazy"
                      className="w-full h-64 sm:h-44 object-cover"
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                    <motion.div
                      className="bg-black/50 absolute top-0 left-0 h-full w-full group-hover:bg-[#181B22]/60 transition-colors duration-300"
                    ></motion.div>
                  </div>
                  <div className="absolute p-5 bottom-0 z-30">
                    <h3 className="w-full text-lg sm:text-base font-bold text-white group-hover:text-[#C9A865] transition-colors">{item.title}</h3>
                    <motion.p
                      className="text-xs font-semibold text-[#C9A865] mt-1 flex items-center gap-1"
                      whileHover={{ x: 5 }}
                      transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    >
                      Discover Properties →
                    </motion.p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Locations Section */}
      <PopularLocations />

      {/* Features Section - Warm Cream Background #F4F5EF */}
      <section className="py-20 bg-[#F4F5EF] dark:bg-[#0F1116] transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, type: "spring", stiffness: 100, damping: 15 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-[#181B22] dark:text-white mb-2">
              Why Choose UrbanNEST?
            </h2>
            <div className="w-20 h-1.5 bg-[#C9A865] mx-auto rounded-full mb-4"></div>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Simple, fast, and reliable property solutions with 100% verification
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: "🔍",
                title: "Discover Verified Homes",
                description: "Browse thousands of authentic, strictly verified properties with verified landlord certificates.",
                badge: "100% Verified",
                badgeColor: "bg-[#F0F8F3] text-[#2E7D4F] border-[#BCE1CA]"
              },
              {
                icon: "🤝",
                title: "Connect Securely",
                description: "Chat directly with vetted landlords and accredited brokers in a transparent, zero-scam environment.",
                badge: "Direct Chat",
                badgeColor: "bg-[#FCFAF5] text-[#947337] border-[#EDE2C6]"
              },
              {
                icon: "🏠",
                title: "Seamless Move In",
                description: "Instant Telebirr & Chapa digital payments, hassle-free paperwork, and guaranteed move-in support.",
                badge: "Fast & Safe",
                badgeColor: "bg-[#F0F5FC] text-[#181B22] border-[#B8D3F5]"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: index * 0.1, duration: 0.5, type: "spring", stiffness: 150, damping: 12 }}
                viewport={{ once: true }}
                whileHover={{ y: -8, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white dark:bg-[#181B22] rounded-2xl shadow-md p-8 text-center hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-[#2E3543] relative"
              >
                <div className="flex justify-center mb-4">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full border ${feature.badgeColor}`}>
                    {feature.badge}
                  </span>
                </div>
                <motion.div
                  className="text-4xl mb-4"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 2, delay: index * 0.2 }}
                >
                  {feature.icon}
                </motion.div>
                <h3 className="text-xl font-bold mb-3 text-[#181B22] dark:text-white">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Properties Section */}
      <section id="properties-section" className="py-20 bg-white dark:bg-[#0F1116] transition-colors border-t border-gray-100 dark:border-[#2E3543]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, type: "spring", stiffness: 100, damping: 15 }}
            viewport={{ once: true }}
            className="flex justify-between items-center mb-12 flex-wrap gap-4"
          >
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-[#181B22] dark:text-white mb-2">Featured Properties</h2>
              <div className="w-20 h-1.5 bg-[#C9A865] rounded-full mt-2"></div>
              <p className="text-gray-600 dark:text-gray-300 mt-2">Hand-picked verified properties just for you</p>
            </div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link to="/properties">
                <Button
                  variant="outline"
                  className="border-2 border-[#181B22] text-[#181B22] hover:bg-[#181B22] hover:text-white dark:border-[#C9A865] dark:text-[#C9A865] dark:hover:bg-[#C9A865] dark:hover:text-[#0F1116] transition-all duration-300 font-bold"
                >
                  View All Properties →
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {loading ? (
              // Loading skeletons
              [1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-gray-100 dark:bg-[#181B22] rounded-2xl animate-pulse p-4">
                  <div className="h-48 bg-gray-200 dark:bg-[#262C37] rounded-xl mb-4"></div>
                  <div className="space-y-3">
                    <div className="h-5 bg-gray-200 dark:bg-[#262C37] rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 dark:bg-[#262C37] rounded w-1/2"></div>
                  </div>
                </div>
              ))
            ) : error ? (
              <div className="col-span-3 text-center py-12">
                <p className="text-red-500 dark:text-red-400">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-4 text-[#181B22] dark:text-[#C9A865] font-bold hover:underline"
                >
                  Try Again
                </button>
              </div>
            ) : (
              featuredProperties.map((property, index) => (
                <motion.div
                  key={property.id}
                  initial={{ opacity: 0, y: 30, scale: 0.95 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: index * 0.1, duration: 0.5, type: "spring", stiffness: 150, damping: 12 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -8 }}
                >
                  <PropertyCard property={property} />
                </motion.div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Testimonials Section - Warm Cream Background #F4F5EF */}
      <section className="py-20 bg-[#F4F5EF] dark:bg-[#0F1116] transition-colors border-t border-gray-100 dark:border-[#2E3543]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, type: "spring", stiffness: 100, damping: 15 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-[#181B22] dark:text-white mb-4">What Our Clients Say</h2>
            <div className="w-20 h-1.5 bg-[#C9A865] mx-auto rounded-full mb-4"></div>
            <p className="text-xl text-gray-600 dark:text-gray-300">Real stories from verified customers in Ethiopia</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Sarah Johnson",
                role: "Home Buyer in Bole",
                content: "UrbanNEST made finding my dream home so easy! The verification badges gave me complete confidence in the property authenticity.",
                rating: 5,
                image: "https://randomuser.me/api/portraits/women/1.jpg"
              },
              {
                name: "Michael Chen",
                role: "Property Owner in CMC",
                content: "Listed my apartment and connected with a verified tenant within 48 hours. The Chapa listing fee payment was instantaneous!",
                rating: 5,
                image: "https://randomuser.me/api/portraits/men/2.jpg"
              },
              {
                name: "Emily Rodriguez",
                role: "Renter in Kazanchis",
                content: "The best real estate platform in Addis Ababa. Clean layout, zero fake middlemen, and great customer support.",
                rating: 5,
                image: "https://randomuser.me/api/portraits/women/3.jpg"
              }
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5, type: "spring", stiffness: 150, damping: 12 }}
                viewport={{ once: true }}
                whileHover={{ y: -8, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white dark:bg-[#181B22] rounded-2xl shadow-md p-7 hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-[#2E3543]"
              >
                <motion.div
                  className="flex items-center mb-4"
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                >
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover mr-4 border-2 border-[#C9A865]"
                  />
                  <div>
                    <h4 className="font-bold text-[#181B22] dark:text-white">{testimonial.name}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{testimonial.role}</p>
                  </div>
                </motion.div>
                <div className="flex mb-3">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0, rotate: -180 }}
                      whileInView={{ scale: 1, rotate: 0 }}
                      transition={{ delay: index * 0.1 + i * 0.05, type: "spring", stiffness: 200, damping: 15 }}
                      viewport={{ once: true }}
                    >
                      <Star className="w-4 h-4 text-[#C9A865] fill-[#C9A865]" />
                    </motion.div>
                  ))}
                </div>
                <p className="text-gray-600 dark:text-gray-300 italic text-sm leading-relaxed">"{testimonial.content}"</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Dominant Navy #181B22 with Gold CTA Button #C9A865 */}
      <section className="py-20 relative bg-[#181B22] text-white">
        <div
          className="absolute inset-0 bg-cover bg-center bg-fixed opacity-15"
          style={{ backgroundImage: `url(${ctaBg})` }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#0F1116] via-[#181B22]/95 to-[#0F1116]"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, type: "spring", stiffness: 100, damping: 15 }}
            viewport={{ once: true }}
          >
            <span className="inline-flex items-center gap-2 bg-[#F0F8F3] text-[#2E7D4F] px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-6 shadow-md">
              <span className="w-2 h-2 rounded-full bg-[#2E7D4F]"></span> 100% Trust & Verification Guaranteed
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              {isLoggedIn ? "Ready to List Your Property?" : "Join UrbanNEST Today"}
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
              {isLoggedIn
                ? "Reach thousands of potential tenants and verified buyers across Ethiopia. List your property now!"
                : "Create a free account to start your property journey. Buy, rent, or sell with complete confidence."}
            </p>
            <div className="flex flex-col sm:flex-row gap-5 justify-center">
              <Link to={isLoggedIn ? "/create-listing" : "/register"}>
                <motion.button
                  whileHover={{ scale: 1.05, y: -4 }}
                  whileTap={{ scale: 0.97 }}
                  className="bg-[#C9A865] hover:bg-[#B6924D] text-white px-8 py-4 rounded-xl font-bold tracking-wide min-w-[220px] transition-all duration-300 shadow-xl shadow-[#C9A865]/30 text-base"
                >
                  {isLoggedIn ? "LIST YOUR PROPERTY" : "CREATE FREE ACCOUNT"}
                </motion.button>
              </Link>
              {!isLoggedIn && (
                <Link to="/login">
                  <motion.button
                    whileHover={{ scale: 1.05, y: -4 }}
                    whileTap={{ scale: 0.97 }}
                    className="border-2 border-white/80 hover:border-white text-white hover:bg-white/10 px-8 py-4 rounded-xl font-bold tracking-wide min-w-[220px] transition-all duration-300 text-base"
                  >
                    SIGN IN
                  </motion.button>
                </Link>
              )}
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}