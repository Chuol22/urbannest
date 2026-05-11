import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaFilter, FaTh, FaList, FaMapMarkerAlt, FaBed, FaTimes,
  FaChevronDown, FaChevronUp, FaHome, FaSortAmountDown,
} from 'react-icons/fa';
import { ChevronRight, Home as HomeIcon, Search, Filter } from 'lucide-react';
import { type Variants } from 'framer-motion';
import { PropertyGrid } from '../components/property/PropertyGrid';
import { PropertyFilters } from '../components/property/PropertyFilters';
import { useProperties } from '../hooks/useProperties';
import { Loader } from '../components/ui/Loader';

// ─── Animation variants ───────────────────────────────────────────────────────
const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.55, type: "spring", stiffness: 150, damping: 12 } },
};

// ─── Hero background images keyed by property type ───────────────────────────
const HERO_IMAGES: Record<string, string> = {
  Rent:     'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1600&q=80&fit=crop',
  Sale:     'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1600&q=80&fit=crop',
  Commercial: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1600&q=80&fit=crop',
  Luxury:   'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=1600&q=80&fit=crop',
  default:  'https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=1600&q=80&fit=crop',
};

// ─── Quick-filter pill data ───────────────────────────────────────────────────
const QUICK_FILTERS = [
  { label: 'For Rent',    params: { listingType: 'rent' } },
  { label: 'For Sale',    params: { listingType: 'sale' } },
  { label: 'Commercial',  params: { category: 'commercial' } },
  { label: 'Luxury',      params: { category: 'luxury' } },
];

export default function Properties() {
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    properties,
    loading,
    pagination,
    filters,
    setFilters,
    clearFilters,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
  } = useProperties({ autoFetch: false });

  const [showFilters, setShowFilters]   = useState(false);
  const [viewMode, setViewMode]         = useState<'grid' | 'list'>('grid');
  const [initialLoad, setInitialLoad]   = useState(true);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [sortBy, setSortBy]             = useState('newest');
  const [heroLoaded, setHeroLoaded]     = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0);

  const sortOptions = [
    { value: 'newest',     label: 'Newest First' },
    { value: 'price_low',  label: 'Price: Low to High' },
    { value: 'price_high', label: 'Price: High to Low' },
    { value: 'popular',    label: 'Most Popular' },
    { value: 'rating',     label: 'Highest Rated' },
  ];

  // ── URL → filters on first load ──────────────────────────────────────────
  const mapPropertyType = (type: string | null) => {
    switch (type) {
      case 'rent':       return { listingType: 'rent' };
      case 'sale':       return { listingType: 'sale' };
      case 'commercial': return { category: 'commercial' };
      case 'luxury':     return { category: 'luxury' };
      default:           return {};
    }
  };

  useEffect(() => {
    if (initialLoad) {
      const urlFilters: any = {
        ...mapPropertyType(searchParams.get('type')),
        ...(searchParams.get('location')  && { location:  searchParams.get('location') }),
        ...(searchParams.get('minPrice')  && { minPrice:  parseInt(searchParams.get('minPrice')!) }),
        ...(searchParams.get('maxPrice')  && { maxPrice:  parseInt(searchParams.get('maxPrice')!) }),
        ...(searchParams.get('bedrooms')  && { bedrooms:  parseInt(searchParams.get('bedrooms')!) }),
        ...(searchParams.get('page')      && { page:      parseInt(searchParams.get('page')!) }),
      };
      if (Object.keys(urlFilters).length > 0) setFilters(urlFilters);
      setInitialLoad(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── filters → URL params ─────────────────────────────────────────────────
  useEffect(() => {
    if (!initialLoad) {
      const p: any = {};
      if (filters.listingType)              p.type      = filters.listingType;
      if (filters.category === 'commercial') p.type     = 'commercial';
      if (filters.category === 'luxury')     p.type     = 'luxury';
      if (filters.location)                  p.location  = filters.location;
      if (filters.minPrice)                  p.minPrice  = filters.minPrice;
      if (filters.maxPrice)                  p.maxPrice  = filters.maxPrice;
      if (filters.bedrooms)                  p.bedrooms  = filters.bedrooms;
      if (filters.page && filters.page > 1)  p.page      = filters.page;
      setSearchParams(p, { replace: true });
    }
  }, [filters, setSearchParams, initialLoad]);

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

  // ── Preload hero image ───────────────────────────────────────────────────
  const heroSrc = HERO_IMAGES[getCurrentPropertyType()] ?? HERO_IMAGES.default;
  useEffect(() => {
    setHeroLoaded(false);
    const img = new Image();
    img.src = heroSrc;
    img.onload = () => setHeroLoaded(true);
  }, [heroSrc]);

  // ── Helpers ──────────────────────────────────────────────────────────────
  function getCurrentPropertyType() {
    if (filters.listingType === 'rent') return 'Rent';
    if (filters.listingType === 'sale') return 'Sale';
    if (filters.category === 'commercial') return 'Commercial';
    if (filters.category === 'luxury') return 'Luxury';
    return 'default';
  }

  const getPageTitle = () => {
    const type = getCurrentPropertyType();
    const loc  = filters.location;
    const labels: Record<string, string> = {
      Rent:       'Rental Properties',
      Sale:       'Properties for Sale',
      Commercial: 'Commercial Spaces',
      Luxury:     'Luxury Properties',
      default:    'All Properties',
    };
    const label = labels[type] ?? labels.default;
    return loc ? `${label} in ${loc}` : `Find Your Perfect ${label === 'All Properties' ? 'Home' : label}`;
  };

  const getPageDescription = () => {
    const type  = getCurrentPropertyType();
    const total = pagination.total ?? 0;
    const map: Record<string, string> = {
      Rent:       `${total.toLocaleString()} rental listings — from cozy studios to spacious family homes.`,
      Sale:       `${total.toLocaleString()} properties for sale. Your dream home is waiting.`,
      Commercial: `${total.toLocaleString()} commercial spaces in prime locations across Ethiopia.`,
      Luxury:     `${total.toLocaleString()} premium properties. Elegance and comfort, redefined.`,
      default:    `${total.toLocaleString()} verified listings. Discover your perfect space today.`,
    };
    return map[type] ?? map.default;
  };

  const getFilterCount = () => {
    let n = 0;
    if (filters.listingType)  n++;
    if (filters.category)     n++;
    if (filters.location)     n++;
    if (filters.minPrice)     n++;
    if (filters.maxPrice)     n++;
    if (filters.bedrooms)     n++;
    if (filters.propertyType) n++;
    return n;
  };

  const handleFavoriteToggle = (id: string) =>
    isFavorite(id) ? removeFromFavorites(id) : addToFavorites(id);

  const handleSortChange = (val: string) => {
    setSortBy(val);
    setShowSortMenu(false);
    setFilters({ ...filters, sort: val });
  };

  const activeType = getCurrentPropertyType();

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">

      {/* ═══════════════════════════════════════════════════════════════════
          HERO
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden">
        {/* Background image container */}
        <div className="absolute inset-0">
          {!heroLoaded && (
            <div className="absolute inset-0 bg-blue-600 animate-pulse" />
          )}
          <div
            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${
              heroLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              backgroundImage: `url(${heroSrc})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div className="absolute inset-0 bg-black/60" />
            <div className="absolute inset-0 bg-gray-900/40" />
            <div className="absolute inset-0 bg-black/20" />
          </div>
          <div className="absolute inset-0 bg-[url('/images/pattern.svg')] opacity-10" />
        </div>

        <div
          className="relative"
          style={{
            paddingTop: `${headerHeight + 100}px`,
            paddingBottom: '120px',
          }}
        >
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="max-w-5xl mx-auto text-center"
            >
              {/* Category badge */}
              <motion.div variants={fadeUp} className="mb-6">
                <span className="inline-flex items-center gap-2 px-6 py-2 rounded-2xl bg-white/10 border border-white/20 text-white text-sm font-bold backdrop-blur-md uppercase tracking-wider">
                  
                  {activeType === 'default' ? 'UrbanNEST Listings' : activeType + ' Properties'}
                </span>
              </motion.div>

              {/* Main heading */}
              <motion.h1
                variants={fadeUp}
                className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight drop-shadow-2xl"
              >
                {getPageTitle().split(' ').map((word, i) => (
                  <span key={i} className={word === 'Rental' || word === 'Sale' || word === 'Commercial' || word === 'Luxury' ? 'text-amber-400' : ''}>
                    {word}{' '}
                  </span>
                ))}
              </motion.h1>

              {/* Sub-heading */}
              <motion.p
                variants={fadeUp}
                className="text-xl md:text-2xl text-gray-200 max-w-3xl mx-auto mb-12 leading-relaxed"
              >
                {getPageDescription()}
              </motion.p>

              {/* Quick-filter pills */}
              <motion.div variants={fadeUp} className="flex flex-wrap justify-center gap-4">
                {QUICK_FILTERS.map((qf) => {
                  const isActive =
                    (qf.params as any).listingType === filters.listingType ||
                    (qf.params as any).category    === filters.category;
                  return (
                    <motion.button
                      key={qf.label}
                      whileHover={{ scale: 1.05, y: -4 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setFilters({ ...filters, ...(qf.params as any) })}
                      className={`px-8 py-3 rounded-2xl text-sm font-bold transition-all duration-300 border ${
                        isActive
                          ? 'bg-amber-600 border-amber-600 text-white shadow-xl shadow-amber-600/30'
                          : 'bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/40 backdrop-blur-md'
                      }`}
                    >
                      {qf.label}
                    </motion.button>
                  );
                })}
                {getFilterCount() > 0 && (
                  <motion.button
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={clearFilters}
                    className="px-8 py-3 rounded-2xl text-sm font-bold bg-gray-800/50 border border-gray-600/30 text-white hover:bg-gray-800 transition-all duration-300 backdrop-blur-md"
                  >
                    Clear All
                  </motion.button>
                )}
              </motion.div>
            </motion.div>
          </div>
        </div>

      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          MAIN CONTENT
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Active filter badges ─────────────────────────────────────── */}
        <AnimatePresence>
          {getFilterCount() > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="mb-5"
            >
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mr-1">
                  Active:
                </span>

                {filters.listingType && (
                  <FilterBadge
                    color="green"
                    label={filters.listingType === 'rent' ? 'For Rent' : 'For Sale'}
                    onRemove={() => setFilters({ ...filters, listingType: undefined })}
                  />
                )}
                {filters.category && (
                  <FilterBadge
                    color="purple"
                    label={filters.category === 'commercial' ? 'Commercial' : 'Luxury'}
                    onRemove={() => setFilters({ ...filters, category: undefined })}
                  />
                )}
                {filters.location && (
                  <FilterBadge
                    color="blue"
                    icon={<FaMapMarkerAlt size={10} />}
                    label={filters.location}
                    onRemove={() => setFilters({ ...filters, location: undefined })}
                  />
                )}
                {filters.minPrice && (
                  <FilterBadge
                    color="orange"
                    label={`Min ETB ${(filters.minPrice ?? 0).toLocaleString()}`}
                    onRemove={() => setFilters({ ...filters, minPrice: undefined })}
                  />
                )}
                {filters.maxPrice && (
                  <FilterBadge
                    color="orange"
                    label={`Max ETB ${(filters.maxPrice ?? 0).toLocaleString()}`}
                    onRemove={() => setFilters({ ...filters, maxPrice: undefined })}
                  />
                )}
                {filters.bedrooms && (
                  <FilterBadge
                    color="indigo"
                    icon={<FaBed size={10} />}
                    label={`${filters.bedrooms}+ Beds`}
                    onRemove={() => setFilters({ ...filters, bedrooms: undefined })}
                  />
                )}

                <button
                  onClick={clearFilters}
                  className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium underline underline-offset-2 ml-1 transition-colors"
                >
                  Clear all
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Controls bar ─────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-3">

            {/* Left: filter toggle + sort */}
            <div className="flex items-center gap-3 flex-wrap">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  showFilters
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-500/25'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-amber-50 dark:hover:bg-gray-600 hover:text-amber-700 dark:hover:text-amber-400'
                }`}
              >
                <motion.div
                  animate={{ rotate: showFilters ? 180 : 0 }}
                  transition={{ duration: 0.3, type: "spring", stiffness: 200, damping: 15 }}
                >
                  <FaFilter size={13} />
                </motion.div>
                <span>{showFilters ? 'Hide Filters' : 'Filters'}</span>
                {getFilterCount() > 0 && (
                  <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold ${showFilters ? 'bg-white text-amber-600' : 'bg-amber-600 text-white'}`}>
                    {getFilterCount()}
                  </span>
                )}
              </motion.button>

              {/* Sort dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowSortMenu(!showSortMenu)}
                  className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm hover:border-green-400 dark:hover:border-green-500 transition-colors bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
                >
                  <FaSortAmountDown size={13} className="text-gray-400" />
                  <span className="font-medium">{sortOptions.find(o => o.value === sortBy)?.label}</span>
                  {showSortMenu ? <FaChevronUp size={11} /> : <FaChevronDown size={11} />}
                </button>

                <AnimatePresence>
                  {showSortMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full left-0 mt-2 w-52 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 z-20 overflow-hidden"
                    >
                      {sortOptions.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => handleSortChange(opt.value)}
                          className={`block w-full text-left px-4 py-2.5 text-sm transition-colors ${
                            sortBy === opt.value
                              ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-semibold'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Right: results count + view toggle */}
            <div className="flex items-center gap-4">
              <p className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">
                <span className="font-semibold text-gray-800 dark:text-gray-100">{properties.length}</span>
                {' '}of{' '}
                <span className="font-semibold text-gray-800 dark:text-gray-100">{(pagination.total ?? 0).toLocaleString()}</span>
                {' '}results
              </p>

              <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setViewMode('grid')}
                  title="Grid view"
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    viewMode === 'grid'
                      ? 'bg-white dark:bg-gray-600 text-amber-600 dark:text-amber-400 shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                >
                  <FaTh size={16} />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setViewMode('list')}
                  title="List view"
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    viewMode === 'list'
                      ? 'bg-white dark:bg-gray-600 text-amber-600 dark:text-amber-400 shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                >
                  <FaList size={16} />
                </motion.button>
              </div>
            </div>
          </div>

          {/* Mobile results count */}
          <p className="sm:hidden mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
            <span className="font-semibold text-gray-800 dark:text-gray-100">{properties.length}</span>
            {' '}of{' '}
            <span className="font-semibold text-gray-800 dark:text-gray-100">{(pagination.total ?? 0).toLocaleString()}</span>
            {' '}results
          </p>
        </div>

        {/* ── Filters panel ────────────────────────────────────────────── */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.28 }}
              className="mb-8 overflow-hidden"
            >
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <PropertyFilters
                  filters={filters}
                  onFilterChange={(f) => setFilters(f)}
                  onReset={clearFilters}
                  showAdvanced
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Property grid / list / states ────────────────────────────── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center h-96 gap-4">
            <Loader size="lg" />
            <p className="text-gray-500 dark:text-gray-400 animate-pulse">Loading properties…</p>
          </div>

        ) : properties.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 150, damping: 12 }}
            whileHover={{ y: -4 }}
            className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700"
          >
            <motion.div 
              className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-5"
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <FaHome size={36} className="text-amber-600 dark:text-amber-400" />
            </motion.div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No properties found</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-7 max-w-sm mx-auto text-sm leading-relaxed">
              We couldn't find anything matching your criteria. Try adjusting your filters or browse all listings.
            </p>
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={clearFilters}
              className="inline-flex items-center gap-2 px-7 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold transition-all duration-300 shadow-md shadow-amber-500/20 hover:shadow-lg hover:shadow-amber-500/30 hover:-translate-y-0.5"
            >
              <FaTimes size={13} />
              Clear all filters
            </motion.button>
          </motion.div>

        ) : (
          <motion.div variants={staggerContainer} initial="hidden" animate="visible">
            <PropertyGrid
              properties={properties}
              loading={loading}
              totalItems={pagination.total}
              itemsPerPage={pagination.limit}
              currentPage={pagination.page}
              onPageChange={(page) => setFilters({ ...filters, page })}
              onFavoriteToggle={handleFavoriteToggle}
              gridCols={viewMode === 'grid' ? 3 : 1}
            />
          </motion.div>
        )}
      </div>
    </div>
  );
}

// ─── Reusable filter badge ────────────────────────────────────────────────────
const COLOR_MAP: Record<string, string> = {
  green:  'bg-amber-100  dark:bg-amber-900/40  text-amber-800  dark:text-amber-300  border-amber-200  dark:border-amber-700',
  purple: 'bg-gray-100 dark:bg-gray-800/40 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700',
  blue:   'bg-gray-100   dark:bg-gray-800/40   text-gray-800   dark:text-gray-300   border-gray-200   dark:border-gray-700',
  orange: 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-700',
  indigo: 'bg-gray-100 dark:bg-gray-800/40 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700',
};

function FilterBadge({
  color,
  label,
  icon,
  onRemove,
}: {
  color: string;
  label: string;
  icon?: React.ReactNode;
  onRemove: () => void;
}) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${COLOR_MAP[color] ?? COLOR_MAP.blue}`}>
      {icon}
      {label}
      <button
        onClick={onRemove}
        className="ml-0.5 hover:opacity-70 transition-opacity"
        aria-label={`Remove ${label} filter`}
      >
        <FaTimes size={10} />
      </button>
    </span>
  );
}
