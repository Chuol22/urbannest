// client/src/components/layout/Navbar.tsx
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useDarkMode } from '../../context/DarkModeContext';
import logo from '../../assets/images/tl.png';
import logoDark from '../../assets/images/tl.png';

// Language translations
const translations = {
  en: {
    forRent: 'For Rent',
    forSell: 'For Sell',
    commercial: 'Commercial',
    findAgent: 'Find Agent',
    aboutUs: 'About Us',
    contact: 'Contact',
    signIn: 'Login',
    register: 'Register',
    houses: 'Houses/Home',
    pensionHotel: 'Pension/Hotel',
    apartment: 'Apartment',
    land: 'Land',
    shopRent: 'Shop for Rent',
    shopSell: 'Shop for Sell',
    officeRent: 'Office Building for Rent',
    officeSell: 'Office Building for Sell',
    landFarmRent: 'Land/Farm for Rent',
    landFarmSell: 'Land/Farm for Sell',
    pensionHotelAgent: 'Pension/Hotel Agent',
    commercialAgent: 'Commercial Agent',
    landAgent: 'Land Agent',
  },
  am: {
    forRent: 'ለኪራይ',
    forSell: 'ለሽያጭ',
    commercial: 'ንግድ',
    findAgent: 'ኤጀንት ያግኙ',
    aboutUs: 'ስለእኛ',
    contact: 'አግኙን',
    signIn: 'ግባ',
    register: 'ተመዝገብ',
    houses: 'ቤቶች/ቤት',
    pensionHotel: 'ፔንሽን/ሆቴል',
    apartment: 'አፓርታማንት',
    land: 'መሬት',
    shopRent: 'ሱቅ ለኪራይ',
    shopSell: 'ሱቅ ለሽያጭ',
    officeRent: 'ኦፊስ ለኪራይ',
    officeSell: 'ኦፊስ ለሽያጭ',
    landFarmRent: 'መሬት/እርሻን ለኪራይ',
    landFarmSell: 'መሬት/እርሻን ለሽያጭ',
    pensionHotelAgent: 'ፔንሽን/ሆቴል ኤጀንት',
    commercialAgent: 'ንግድ ኤጀንት',
    landAgent: 'መሬት ኤጀንት',
  }
};

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [language, setLanguage] = useState<'en' | 'am'>('en');
  const { isLoggedIn, logout, user } = useAuth();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const navigate = useNavigate();
  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Language initialization
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as 'en' | 'am' | null;
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'am')) {
      setLanguage(savedLanguage);
    } else {
      // Clear invalid language and default to English
      localStorage.removeItem('language');
      setLanguage('en');
    }
  }, []);

  const t = translations[language] || translations['en'];

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsOpen(false);
    setOpenDropdown(null);
  };

  const handleDropdownToggle = (dropdown: string) => {
    setOpenDropdown(openDropdown === dropdown ? null : dropdown);
  };

  const handleMouseEnter = (dropdown: string) => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
      dropdownTimeoutRef.current = null;
    }
    setOpenDropdown(dropdown);
  };

  const handleMouseLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setOpenDropdown(null);
    }, 200);
  };

  const changeLanguage = (lang: 'en' | 'am') => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
    setOpenDropdown(null);
  };

  // Navigation structure
  const navItems = [
    {
      label: t.forRent,
      dropdown: [
        { to: '/properties?type=rent&category=house', label: t.houses },
        { to: '/properties?type=rent&category=pension', label: t.pensionHotel },
        { to: '/properties?type=rent&category=apartment', label: t.apartment },
      ]
    },
    {
      label: t.forSell,
      dropdown: [
        { to: '/properties?type=sell&category=house', label: t.houses },
        { to: '/properties?type=sell&category=land', label: t.land },
        { to: '/properties?type=sell&category=apartment', label: t.apartment },
      ]
    },
    {
      label: t.commercial,
      dropdown: [
        { to: '/properties?type=commercial&category=shop-rent', label: t.shopRent },
        { to: '/properties?type=commercial&category=shop-sell', label: t.shopSell },
        { to: '/properties?type=commercial&category=office-rent', label: t.officeRent },
        { to: '/properties?type=commercial&category=office-sell', label: t.officeSell },
        { to: '/properties?type=commercial&category=land-rent', label: t.landFarmRent },
        { to: '/properties?type=commercial&category=land-sell', label: t.landFarmSell },
      ]
    },
    {
      label: t.findAgent,
      dropdown: [
        { to: '/agents?type=pension', label: t.pensionHotelAgent },
        { to: '/agents?type=commercial', label: t.commercialAgent },
        { to: '/agents?type=land', label: t.landAgent },
      ]
    },
    {
      label: t.aboutUs,
      dropdown: null,
      to: '/about'
    },
    {
      label: t.contact,
      dropdown: null,
      to: '/contact'
    }
  ];

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-md sticky top-0 z-50 transition-colors duration-300 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10">
        <div className="flex justify-between items-center h-18">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center">
              <img 
                src={isDarkMode ? logoDark : logo} 
                alt="TIIPLONGHA Logo" 
                className="h-12 w-auto"
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-2">
            {navItems.map((item) => (
              <div 
                key={item.label}
                className="relative"
                onMouseEnter={() => item.dropdown && handleMouseEnter(item.label)}
                onMouseLeave={handleMouseLeave}
              >
                {item.dropdown ? (
                  <>
                    <button
                      onClick={() => handleDropdownToggle(item.label)}
                      className="text-gray-900 dark:text-gray-300 hover:text-amber-600 dark:hover:text-amber-500 px-3 py-2 rounded-md text-sm font-medium transition-colors inline-flex items-center"
                    >
                      {item.label}
                      <svg 
                        className={`ml-1 h-4 w-4 transition-transform duration-200 ${openDropdown === item.label ? 'rotate-180' : ''}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {/* Dropdown Menu */}
                    {openDropdown === item.label && (
                      <div className="absolute left-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 dark:ring-gray-700 z-50">
                        <div className="py-1" role="menu">
                          {item.dropdown.map((dropdownItem) => (
                            <Link
                              key={dropdownItem.to}
                              to={dropdownItem.to}
                              className="block px-4 py-2 text-sm text-gray-900 dark:text-gray-300 hover:bg-amber-50 dark:hover:bg-gray-700 hover:text-amber-600 dark:hover:text-amber-500 transition-colors"
                              onClick={() => setOpenDropdown(null)}
                            >
                              {dropdownItem.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <Link 
                    to={item.to}
                    className="text-gray-900 dark:text-gray-300 hover:text-amber-600 dark:hover:text-amber-500 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    {item.label}
                  </Link>
                )}
              </div>
            ))}

            {/* Theme Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-md text-gray-900 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle theme"
            >
              {isDarkMode ? (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {/* Language Dropdown */}
            <div className="relative">
              <button
                onClick={() => handleDropdownToggle('language')}
                className="flex items-center space-x-1 text-gray-900 dark:text-gray-300 hover:text-amber-600 dark:hover:text-amber-500 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                <span className="text-lg">🌐</span>
                <span className="hidden md:inline">{language === 'en' ? 'EN' : 'AM'}</span>
                <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {openDropdown === 'language' && (
                <div className="absolute right-0 mt-2 w-32 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-50">
                  <div className="py-1">
                    <button
                      onClick={() => changeLanguage('en')}
                      className={`block w-full text-left px-4 py-2 text-sm transition-colors ${
                        language === 'en' 
                          ? 'bg-amber-50 dark:bg-gray-700 text-amber-600 dark:text-amber-500' 
                          : 'text-gray-900 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      English
                    </button>
                    <button
                      onClick={() => changeLanguage('am')}
                      className={`block w-full text-left px-4 py-2 text-sm transition-colors ${
                        language === 'am' 
                          ? 'bg-amber-50 dark:bg-gray-700 text-amber-600 dark:text-amber-500' 
                          : 'text-gray-900 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      አማርኛ
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Auth Buttons */}
            {isLoggedIn ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <span className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 text-sm font-medium">
                    {user?.first_name?.charAt(0) || 'U'}
                  </span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {user?.first_name || 'User'}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => navigate('/login')}
                  className="text-gray-900 dark:text-gray-300 hover:text-amber-600 dark:hover:text-amber-500 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  {t.signIn}
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="bg-amber-600 text-white px-4 py-2 rounded-md hover:bg-amber-700 transition-colors text-sm font-medium"
                >
                  {t.register}
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden flex items-center space-x-2">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {isDarkMode ? (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 focus:outline-none"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="lg:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {/* Mobile Language Selector */}
              <div className="mb-2 space-y-1 bg-gray-50 dark:bg-gray-800 rounded-md p-2">
                <button
                  onClick={() => {
                    changeLanguage('en');
                    setIsOpen(false);
                  }}
                  className={`block w-full text-left px-3 py-2 rounded-md text-sm ${
                    language === 'en' 
                      ? 'bg-amber-100 dark:bg-gray-700 text-amber-600' 
                      : 'text-gray-900 dark:text-gray-300'
                  }`}
                >
                  English
                </button>
                <button
                  onClick={() => {
                    changeLanguage('am');
                    setIsOpen(false);
                  }}
                  className={`block w-full text-left px-3 py-2 rounded-md text-sm ${
                    language === 'am' 
                      ? 'bg-amber-100 dark:bg-gray-700 text-amber-600' 
                      : 'text-gray-900 dark:text-gray-300'
                  }`}
                >
                  አማርኛ
                </button>
              </div>

              {/* Mobile Navigation Items */}
              {navItems.map((item) => (
                <div key={item.label} className="space-y-1">
                  {item.dropdown ? (
                    <>
                      <button
                        onClick={() => handleDropdownToggle(`mobile-${item.label}`)}
                        className="w-full flex justify-between items-center text-gray-900 dark:text-gray-300 hover:text-amber-600 dark:hover:text-amber-500 px-3 py-2 rounded-md text-base font-medium"
                      >
                        {item.label}
                        <svg 
                          className={`h-4 w-4 transition-transform duration-200 ${openDropdown === `mobile-${item.label}` ? 'rotate-180' : ''}`} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {openDropdown === `mobile-${item.label}` && (
                        <div className="pl-4 space-y-1">
                          {item.dropdown.map((dropdownItem) => (
                            <Link
                              key={dropdownItem.to}
                              to={dropdownItem.to}
                              className="block text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 px-3 py-2 rounded-md text-sm"
                              onClick={() => setIsOpen(false)}
                            >
                              {dropdownItem.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <Link
                      to={item.to}
                      className="block text-gray-900 dark:text-gray-300 hover:text-amber-600 dark:hover:text-amber-500 px-3 py-2 rounded-md text-base font-medium"
                      onClick={() => setIsOpen(false)}
                    >
                      {item.label}
                    </Link>
                  )}
                </div>
              ))}

              {/* Mobile Auth */}
              {isLoggedIn ? (
                <div className="space-y-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-2 px-3 py-2">
                    <span className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 text-sm font-medium">
                      {user?.first_name?.charAt(0) || 'U'}
                    </span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {user?.first_name || 'User'}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left text-red-600 dark:text-red-400 px-3 py-2 rounded-md text-base font-medium"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="space-y-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => {
                      navigate('/login');
                      setIsOpen(false);
                    }}
                    className="w-full text-left text-gray-900 dark:text-gray-300 hover:text-amber-600 dark:hover:text-amber-500 px-3 py-2 rounded-md text-base font-medium"
                  >
                    {t.signIn}
                  </button>
                  <button
                    onClick={() => {
                      navigate('/register');
                      setIsOpen(false);
                    }}
                    className="w-full bg-amber-600 text-white px-4 py-2 rounded-md hover:bg-amber-700 text-base font-medium"
                  >
                    {t.register}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;