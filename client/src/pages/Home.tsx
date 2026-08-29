import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { ArrowRight, ChevronRight, MapPin, Plus, Star } from 'lucide-react';
import { motion } from 'framer-motion';

import { useAuth } from '../context/AuthContext';

import ChatBot from '../components/ui/ChatBot';
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

  const neighborhoods = ['Newland', 'Dipo Downtown', 'Agarpa', 'New University side', 'Dipo Mamaratal', 'Dalkoch', 'Nyangora', 'Arat Kilo', 'Jap Jap', 'Yawere', 'Yechuey', 'Kality'];

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
    <section className="popular-locations py-16 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
            Popular locations
          </h2>
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
                <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden transition-all duration-500 hover:shadow-2xl">
                  {/* City Image */}
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={city.image}
                      alt={city.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                    />
                    <div className="absolute inset-0 bg-black/50 group-hover:bg-black/40 transition-colors duration-500"></div>
                  </div>

                  {/* City Info */}
                  <div className="p-5">
                    <motion.div
                      className="flex items-center gap-2 mb-2"
                      whileHover={{ x: 5 }}
                      transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    >
                      <MapPin className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors duration-300">
                        {city.name}
                      </h3>
                    </motion.div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{city.properties} properties</p>

                    {/* Animated Arrow Button */}
                    <motion.div
                      className="flex items-center text-amber-600 dark:text-amber-400 font-medium group"
                      initial={false}
                    >
                      <span className="text-sm">Find</span>
                      <motion.span
                        initial={{ x: 0 }}
                        animate={{ x: 0 }}
                        whileHover={{ x: 10 }}
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
                          <ChevronRight className="w-4 h-4 text-amber-500" />
                        </motion.div>
                        <motion.div
                          animate={{ x: [0, 8, 0] }}
                          transition={{ repeat: Infinity, duration: 1, delay: index * 0.1 + 0.2 }}
                        >
                          <ChevronRight className="w-4 h-4 text-amber-500" />
                        </motion.div>
                        <motion.div
                          animate={{ x: [0, 12, 0] }}
                          transition={{ repeat: Infinity, duration: 1, delay: index * 0.1 + 0.4 }}
                        >
                          <ChevronRight className="w-4 h-4 text-amber-500" />
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
            <span className="text-sm text-gray-500 dark:text-gray-400 font-medium bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-lg">
              📍 Popular Neighborhoods (Addis Ababa):
            </span>
            <div className="flex flex-wrap gap-2">
              <motion.button
                whileHover={{ scale: 1.08, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleNeighborhoodClick('all')}
                className={`text-sm px-3 py-1.5 rounded-full transition-all duration-300 ${selectedNeighborhood === 'all'
                  ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-amber-100 dark:hover:bg-amber-900 hover:text-amber-700 dark:hover:text-amber-300'
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
                  whileHover={{ scale: 1.08, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleNeighborhoodClick(neighborhood)}
                  className={`text-sm px-3 py-1.5 rounded-full transition-all duration-300 ${selectedNeighborhood === neighborhood
                    ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30 scale-105'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-amber-100 dark:hover:bg-amber-900 hover:text-amber-700 dark:hover:text-amber-300'
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
              className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800"
            >
              <p className="text-sm text-amber-800 dark:text-amber-300">
                Showing properties in <strong>{selectedNeighborhood}</strong> neighborhood.
                <motion.button
                  whileHover={{ x: 8 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleCityClick(selectedNeighborhood.toLowerCase())}
                  className="ml-2 text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 font-medium underline inline-flex items-center gap-1"
                >
                  Browse all
                  <ArrowRight className="w-3 h-3" />
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

  // Detect header height dynamically
  useEffect(() => {
    const updateHeaderHeight = () => {
      const header = document.querySelector('header');
      if (header) {
        setHeaderHeight(header.offsetHeight);
      }
    };

    updateHeaderHeight();
    window.addEventListener('resize', updateHeaderHeight);

    const observer = new ResizeObserver(updateHeaderHeight);
    const header = document.querySelector('header');
    if (header) {
      observer.observe(header);
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
      <div className="relative overflow-hidden">
        {/* Background Image Container */}
        <div className="absolute inset-0">
          {!imageLoaded && (
            <div className="absolute inset-0 bg-blue-600 animate-pulse" />
          )}

          <div
            className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000 ${imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            style={{
              backgroundImage: `url(${homeBg})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div className="absolute inset-0 bg-black/40" />
            <div className="absolute inset-0 bg-blue-900/30" />
            <div className="absolute inset-0 bg-black/20" />
          </div>

          {!imageLoaded && (
            <div className="absolute inset-0 bg-blue-400" />
          )}

          <div className="absolute inset-0 bg-[url('/images/pattern.svg')] opacity-10" />
        </div>

        <div
          className="relative"
          style={{
            paddingTop: `${headerHeight + 80}px`,
            paddingBottom: '100px',
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
                className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-white mb-4 leading-tight"
              >
                Find Your Dream
                <span className="block text-amber-400">Property</span>

                {/* Typing Animation Component */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                  className="text-amber-400 text-2xl md:text-3xl lg:text-4xl font-black mt-4 h-20 md:h-24 drop-shadow-md"
                >
                  <span>{typedText}</span>
                  <motion.span
                    className="typed-cursor inline-block w-[3px] h-8 md:h-10 ml-1 bg-amber-400"
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
                className="text-xl md:text-2xl lg:text-2xl text-gray-200 max-w-4xl mx-auto leading-relaxed mt-6 mb-8"
              >
                Discover safe, secure and trusted properties with UrbanNest, Your trusted partner in finding the perfect home.
                Browse verified listings and connect with trusted landlords or Broker/ agents.
              </motion.p>

              {/* Professional Wide Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6, type: "spring", stiffness: 100, damping: 15 }}
                className="flex flex-wrap gap-6 mt-12 justify-center"
              >
                <Link to="/properties">
                  <motion.button
                    whileHover={{ scale: 1.05, y: -4 }}
                    whileTap={{ scale: 0.97 }}
                    className="group relative px-12 py-5 bg-amber-600 
                               text-white font-bold rounded-2xl transition-all duration-300 
                               uppercase text-base tracking-wider shadow-2xl shadow-amber-600/30
                               hover:shadow-2xl hover:shadow-amber-600/50
                               min-w-[220px] md:min-w-[260px]
                               overflow-hidden"
                  >
                    <span className="relative flex items-center justify-center gap-3">
                      Browse Properties
                      <motion.div
                        whileHover={{ x: 5 }}
                        transition={{ type: "spring", stiffness: 400, damping: 20 }}
                      >
                        <ChevronRight className="w-5 h-5" />
                      </motion.div>
                    </span>
                  </motion.button>
                </Link>

                <Link to="/create-listing">
                  <motion.button
                    whileHover={{ scale: 1.05, y: -4 }}
                    whileTap={{ scale: 0.97 }}
                    className="group relative px-12 py-5 bg-white/10 backdrop-blur-md 
                               border-2 border-white/60 text-white font-bold rounded-2xl 
                               transition-all duration-300 uppercase text-base tracking-wider
                               hover:bg-white hover:text-gray-900 hover:border-white 
                               hover:shadow-2xl hover:-translate-y-1 active:translate-y-0
                               min-w-[220px] md:min-w-[260px]
                               overflow-hidden"
                  >
                    <span className="relative flex items-center justify-center gap-3 z-10">
                      List Your Property
                      <motion.div
                        whileHover={{ rotate: 90 }}
                        transition={{ type: "spring", stiffness: 200, damping: 15 }}
                      >
                        <Plus className="w-5 h-5" />
                      </motion.div>
                    </span>
                  </motion.button>
                </Link>
              </motion.div>

              {/* Search Bar Integration - Below buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.6, duration: 0.6, type: "spring", stiffness: 100, damping: 15 }}
                className="mt-16 max-w-3xl mx-auto"
              >
                <div className="bg-white/40 backdrop-blur-md rounded-2xl p-2 shadow-xl">
                  <SearchBar onSearch={handleSearch} />
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* What Are You Looking For Section */}
      <section className="lg:px-16 md:px-6 px-4 md:pt-12 py-8 bg-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, type: "spring", stiffness: 100, damping: 15 }}
          viewport={{ once: true }}
        >
          <h2 className="lg:text-3xl text-2xl font-bold leading-none tracking-tighter text-gray-900 lg:mb-10">What Are You Looking For?</h2>
          <div className="w-20 h-1.5 bg-amber-600 rounded-full mt-2"></div>
        </motion.div>

        <div className="flex justify-center">
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3 md:gap-6 lg:gap-6 lg:mt-12 md:mt-8 mt-4 items-center w-full">
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
                className="relative flex flex-col rounded-md cursor-pointer group"
              >
                <Link to={item.link}>
                  <div className="relative overflow-hidden rounded-md">
                    <motion.img
                      alt={item.title}
                      title={item.title}
                      src={item.image}
                      loading="lazy"
                      className="w-full h-64 sm:h-32 object-cover"
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                    <motion.div
                      className="bg-black/60 absolute top-0 left-0 h-full w-full rounded-md group-hover:bg-black/50 transition-colors duration-300"
                    ></motion.div>
                  </div>
                  <div className="absolute md:m-6 sm:m-3 bottom-0 z-30">
                    <h2 className="w-full text-xl sm:text-sm font-semibold leading-8 mt-2 text-white">{item.title}</h2>
                    <motion.p
                      className="sm:hidden mt-4 text-base font-medium cursor-pointer leading-4 underline text-white"
                      whileHover={{ x: 5 }}
                      transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    >
                      Discover
                    </motion.p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Locations Section - Integrated (Map Removed) */}
      <PopularLocations />

      {/* Features Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, type: "spring", stiffness: 100, damping: 15 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Why Choose UrbanNEST?
            </h2>
            <div className="w-20 h-1.5 bg-amber-600 mx-auto rounded-full mb-4"></div>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Simple, fast, and reliable property solutions
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: "🔍",
                title: "Discover",
                description: "Browse thousands of verified properties in your area with detailed information.",
              },
              {
                icon: "🤝",
                title: "Connect",
                description: "Chat directly with landlords and schedule viewings all in one platform.",
              },
              {
                icon: "🏠",
                title: "Move In",
                description: "Complete paperwork and move into your new home hassle-free.",
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
                className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-8 text-center hover:shadow-xl transition-all duration-300"
              >
                <motion.div
                  className="text-4xl mb-4"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 2, delay: index * 0.2 }}
                >
                  {feature.icon}
                </motion.div>
                <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Properties Section */}
      <section id="properties-section" className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, type: "spring", stiffness: 100, damping: 15 }}
            viewport={{ once: true }}
            className="flex justify-between items-center mb-12 flex-wrap gap-4"
          >
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">Featured Properties</h2>
              <div className="w-20 h-1.5 bg-amber-600 rounded-full mt-2"></div>
              <p className="text-gray-600 dark:text-gray-300 mt-2">Hand-picked properties just for you</p>
            </div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link to="/properties">
                <Button
                  variant="outline"
                  className="border-amber-600 text-amber-600 hover:bg-amber-600 hover:text-white transition-all duration-300 dark:border-amber-400 dark:text-amber-400 dark:hover:bg-amber-400 dark:hover:text-gray-900"
                >
                  View All →
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {loading ? (
              // Loading skeletons
              [1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse">
                  <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-t-lg"></div>
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  </div>
                </div>
              ))
            ) : error ? (
              <div className="col-span-3 text-center py-12">
                <p className="text-red-500 dark:text-red-400">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-4 text-blue-900 dark:text-blue-700 hover:text-blue-950 underline"
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

      {/* Testimonials Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, type: "spring", stiffness: 100, damping: 15 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">What Our Clients Say</h2>
            <div className="w-20 h-1.5 bg-amber-600 mx-auto rounded-full mb-4"></div>
            <p className="text-xl text-gray-600 dark:text-gray-300">Real stories from real customers</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Sarah Johnson",
                role: "Home Buyer",
                content: "UrbanNEST made finding my dream home so easy! The platform is intuitive and the support team is amazing.",
                rating: 5,
                image: "https://randomuser.me/api/portraits/women/1.jpg"
              },
              {
                name: "Michael Chen",
                role: "Property Owner",
                content: "Listed my property and found a tenant within a week. Highly recommended for property owners!",
                rating: 5,
                image: "https://randomuser.me/api/portraits/men/2.jpg"
              },
              {
                name: "Emily Rodriguez",
                role: "Renter",
                content: "The platform is amazing! Found my perfect apartment in Addis Ababa in just 3 days.",
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
                className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 hover:shadow-xl transition-all duration-300"
              >
                <motion.div
                  className="flex items-center mb-4"
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                >
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover mr-4"
                  />
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">{testimonial.name}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{testimonial.role}</p>
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
                      <Star className="w-5 h-5 text-amber-500 fill-current" />
                    </motion.div>
                  ))}
                </div>
                <p className="text-gray-600 dark:text-gray-300 italic">"{testimonial.content}"</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative">
        <div
          className="absolute inset-0 bg-cover bg-center bg-fixed"
          style={{ backgroundImage: `url(${ctaBg})` }}
        ></div>
        <div className="absolute inset-0 bg-gray-900/80"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, type: "spring", stiffness: 100, damping: 15 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              {isLoggedIn ? "Ready to List Your Property?" : "Join UrbanNEST Today"}
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              {isLoggedIn
                ? "Reach thousands of potential tenants and buyers. List your property now!"
                : "Create a free account to start your property journey. Buy, rent, or sell with confidence."}
            </p>
            <div className="flex flex-col sm:flex-row gap-5 justify-center">
              <Link to={isLoggedIn ? "/create-listing" : "/register"}>
                <motion.button
                  whileHover={{ scale: 1.05, y: -4 }}
                  whileTap={{ scale: 0.97 }}
                  className="bg-amber-600 text-white hover:bg-amber-700 px-8 py-3 rounded-lg font-semibold tracking-wide min-w-[200px] transition-all duration-300 shadow-xl shadow-amber-600/30"
                >
                  {isLoggedIn ? "LIST YOUR PROPERTY" : "CREATE FREE ACCOUNT"}
                </motion.button>
              </Link>
              {!isLoggedIn && (
                <Link to="/login">
                  <motion.button
                    whileHover={{ scale: 1.05, y: -4 }}
                    whileTap={{ scale: 0.97 }}
                    className="border-2 border-white text-white hover:bg-white/10 px-8 py-3 rounded-lg font-semibold tracking-wide min-w-[200px] transition-all duration-300"
                  >
                    SIGN IN
                  </motion.button>
                </Link>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      <ChatBot isOpen={showChat} onToggle={() => setShowChat(!showChat)} />
    </div>
  );
}