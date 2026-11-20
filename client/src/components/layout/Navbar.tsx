// client/src/components/layout/Navbar.tsx

import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useDarkMode } from '../../context/DarkModeContext';
import { useAuth } from '../../context/AuthContext';

import { LanguageSelector } from '../LanguageSelector';

import logo from '../../assets/images/unlogo.png';
import logoDark from '../../assets/images/unlogo.png';

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const { isLoggedIn, logout, user } = useAuth();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const navigate = useNavigate();
  const dropdownTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Navigation structure
  const navItems = [
    {
      label: 'For Rent',
      dropdown: [
        { to: '/properties?type=rent&category=house', label: 'Houses/Home' },
        { to: '/properties?type=rent&category=pension', label: 'Pension/Hotel' },
        { to: '/properties?type=rent&category=apartment', label: 'Apartment' },
      ]
    },
    {
      label: 'For Sell',
      dropdown: [
        { to: '/properties?type=sell&category=house', label: 'Houses/Home' },
        { to: '/properties?type=sell&category=land', label: 'Land' },
        { to: '/properties?type=sell&category=apartment', label: 'Apartment' },
      ]
    },
    {
      label: 'Commercial',
      dropdown: [
        { to: '/properties?type=commercial&category=shop-rent', label: 'Shop Rent' },
        { to: '/properties?type=commercial&category=shop-sell', label: 'Shop Sell' },
        { to: '/properties?type=commercial&category=office-rent', label: 'Office Rent' },
        { to: '/properties?type=commercial&category=office-sell', label: 'Office Sell' },
        { to: '/properties?type=commercial&category=land-rent', label: 'Land/Farm Rent' },
        { to: '/properties?type=commercial&category=land-sell', label: 'Land/Farm Sell' },
      ]
    },
    {
      label: 'Find Agent',
      dropdown: [
        { to: '/agents?type=pension', label: 'Pension/Hotel Agent' },
        { to: '/agents?type=commercial', label: 'Commercial Agent' },
        { to: '/agents?type=land', label: 'Land Agent' },
      ]
    },
    {
      label: 'About Us',
      dropdown: null,
      to: '/about'
    },
    {
      label: 'Contact',
      dropdown: null,
      to: '/contact'
    }
  ];

  return (
    <nav className="bg-transparent shadow-md sticky top-0 z-50 transition-colors duration-300 border-b border-gray-100 dark:border-[#2E3543]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center group py-1" aria-label="UrbanNest Home">
              <div className="flex items-center dark:bg-white/95 dark:px-2.5 dark:py-1.5 dark:rounded-xl dark:shadow-sm dark:border dark:border-[#C9A865]/30 transition-all">
                <img
                  src={isDarkMode ? logoDark : logo}
                  alt="UrbanNest Logo"
                  className="h-11 sm:h-12 w-auto object-contain transition-transform duration-200 group-hover:scale-105 drop-shadow-sm"
                />
              </div>
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
                      className="text-[#181B22] dark:text-gray-200 hover:text-[#C9A865] dark:hover:text-[#C9A865] px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors inline-flex items-center"
                    >
                      {item.label}
                      <svg
                        className={`ml-1 h-4 w-4 transition-transform duration-200 ${openDropdown === item.label ? 'rotate-180 text-[#C9A865]' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Dropdown Menu */}
                    {openDropdown === item.label && (
                      <div className="absolute left-0 mt-2 w-56 rounded-xl shadow-xl bg-white dark:bg-[#181B22] ring-1 ring-black/5 dark:ring-white/10 z-50 border border-gray-100 dark:border-[#2E3543] overflow-hidden">
                        <div className="py-2" role="menu">
                          {item.dropdown.map((dropdownItem) => (
                            <Link
                              key={dropdownItem.to}
                              to={dropdownItem.to}
                              className="block px-4 py-2.5 text-sm text-[#181B22] dark:text-gray-200 hover:bg-[#F4F5EF] dark:hover:bg-[#262C37] hover:text-[#C9A865] dark:hover:text-[#C9A865] transition-colors font-medium"
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
                    className="text-[#181B22] dark:text-gray-200 hover:text-[#C9A865] dark:hover:text-[#C9A865] px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors"
                  >
                    {item.label}
                  </Link>
                )}
              </div>
            ))}

            {user?.role === 'admin' && (
              <Link to="/admin" className="text-[#181B22] dark:text-gray-200 hover:text-[#C9A865] dark:hover:text-[#C9A865] px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors">
                Admin
              </Link>
            )}

            {/* Language Selector */}
            <LanguageSelector />

            {/* Theme Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg text-[#181B22] dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#181B22] transition-colors"
              aria-label="Toggle theme"
            >
              {isDarkMode ? (
                <svg className="h-5 w-5 text-[#C9A865]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="h-5 w-5 text-[#181B22]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {/* Auth Buttons */}
            {isLoggedIn ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <span className="w-8 h-8 bg-[#F0F8F3] dark:bg-[#2E7D4F]/30 border border-[#2E7D4F]/40 rounded-full flex items-center justify-center text-[#2E7D4F] dark:text-[#5CAE78] text-sm font-bold shadow-sm">
                    {user?.first_name?.charAt(0) || 'U'}
                  </span>
                  <span className="text-sm font-semibold text-[#181B22] dark:text-gray-200">
                    {user?.first_name || 'User'}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => navigate('/login')}
                  className="text-[#181B22] dark:text-gray-200 hover:text-[#C9A865] dark:hover:text-[#C9A865] px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                >
                  Login
                </button>
                {/* 🏛️ Charcoal CTA (#181B22) with Gold (#C9A865) accents */}
                <button
                  onClick={() => navigate('/register')}
                  className="bg-[#181B22] hover:bg-[#262C37] text-white px-5 py-2.5 rounded-xl transition-all text-sm font-bold shadow-md shadow-[#181B22]/20 hover:ring-2 hover:ring-[#C9A865] hover:shadow-lg"
                >
                  Register
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden flex items-center space-x-2">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg text-[#181B22] dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#181B22]"
            >
              {isDarkMode ? (
                <svg className="h-5 w-5 text-[#C9A865]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="h-5 w-5 text-[#181B22]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-[#181B22] dark:text-gray-200 hover:text-[#C9A865] dark:hover:text-[#C9A865] focus:outline-none p-2"
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
          <div className="lg:hidden pb-4">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-[#F4F5EF] dark:bg-[#181B22] rounded-2xl p-4 border border-gray-100 dark:border-[#2E3543] shadow-lg">
              {/* Mobile Navigation Items */}
              {navItems.map((item) => (
                <div key={item.label} className="space-y-1">
                  {item.dropdown ? (
                    <>
                      <button
                        onClick={() => handleDropdownToggle(`mobile-${item.label}`)}
                        className="w-full flex justify-between items-center text-[#181B22] dark:text-gray-200 hover:text-[#C9A865] dark:hover:text-[#C9A865] px-3 py-2 rounded-lg text-base font-semibold"
                      >
                        {item.label}
                        <svg
                          className={`h-4 w-4 transition-transform duration-200 ${openDropdown === `mobile-${item.label}` ? 'rotate-180 text-[#C9A865]' : ''}`}
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
                              className="block text-[#181B22] dark:text-gray-300 hover:text-[#C9A865] dark:hover:text-[#C9A865] px-3 py-2 rounded-lg text-sm font-medium"
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
                      className="block text-[#181B22] dark:text-gray-200 hover:text-[#C9A865] dark:hover:text-[#C9A865] px-3 py-2 rounded-lg text-base font-semibold"
                      onClick={() => setIsOpen(false)}
                    >
                      {item.label}
                    </Link>
                  )}
                </div>
              ))}

              {/* Mobile Language Selector */}
              <div className="pt-2 pb-2">
                <LanguageSelector />
              </div>

              {/* Mobile Auth */}
              {isLoggedIn ? (
                <div className="space-y-2 pt-4 border-t border-gray-200 dark:border-[#2E3543]">
                  <div className="flex items-center space-x-2 px-3 py-2">
                    <span className="w-8 h-8 bg-[#F0F8F3] dark:bg-[#2E7D4F]/30 border border-[#2E7D4F]/40 rounded-full flex items-center justify-center text-[#2E7D4F] dark:text-[#5CAE78] text-sm font-bold">
                      {user?.first_name?.charAt(0) || 'U'}
                    </span>
                    <span className="text-sm font-semibold text-[#181B22] dark:text-gray-200">
                      {user?.first_name || 'User'}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left text-red-600 dark:text-red-400 px-3 py-2 rounded-lg text-base font-small"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="space-y-2 pt-4 border-t border-gray-200 dark:border-[#2E3543]">
                  <button
                    onClick={() => {
                      navigate('/login');
                      setIsOpen(false);
                    }}
                    className="w-full text-left text-[#181B22] dark:text-gray-200 hover:text-[#C9A865] dark:hover:text-[#C9A865] px-3 py-2 rounded-lg text-base font-semibold"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => {
                      navigate('/register');
                      setIsOpen(false);
                    }}
                    className="w-full bg-[#181B22] hover:bg-[#262C37] text-white px-4 py-2.5 rounded-xl text-base font-bold shadow-md hover:ring-2 hover:ring-[#C9A865]"
                  >
                    Register
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