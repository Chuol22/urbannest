// client/src/components/layout/Navbar.tsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import logo from '../../assets/images/Urbanestlogo.png';

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const { isLoggedIn, logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsOpen(false);
    setOpenDropdown(null);
  };

  const handleDropdownToggle = (dropdown: string) => {
    setOpenDropdown(openDropdown === dropdown ? null : dropdown);
  };

  // Close dropdown when clicking outside
  const handleMouseLeave = () => {
    setOpenDropdown(null);
  };

  const navLinks = [
    { 
      to: '/properties', 
      label: 'Properties',
      dropdown: true,
      items: [
        { to: '/properties?type=rent', label: 'For Rent', icon: '🏠' },
        { to: '/properties?type=sale', label: 'For Sale', icon: '💰' },
        { to: '/properties?type=commercial', label: 'Commercial', icon: '🏢' },
        { to: '/properties?type=luxury', label: 'Luxury', icon: '✨' },
      ]
    },
    { to: '/about', label: 'About', dropdown: false },
    { to: '/contact', label: 'Contact', dropdown: false },
  ];

  const authLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: '📊' },
    { to: '/mynest', label: 'My Nest', icon: '🏡' },
    { to: '/create-listing', label: 'Create Listing', icon: '➕' },
    { to: '/profile', label: 'Profile', icon: '👤' },
    { to: '/subscription-plans', label: 'Plans', icon: '⭐' },
  ];

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <Link to="/" className="flex items-center space-x-2">
              <img src={logo} alt="UrbanNEST Logo" className="h-20 w-auto" />
              <span className="text-xl font-bold text-green-600 hidden sm:inline-block">
                Home
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {navLinks.map((link) => (
              link.dropdown ? (
                <div 
                  key={link.to}
                  className="relative group"
                  onMouseLeave={handleMouseLeave}
                >
                  <button
                    onClick={() => handleDropdownToggle(link.label)}
                    className="text-gray-700 hover:text-green-600 px-3 py-2 rounded-md text-sm font-medium transition-colors inline-flex items-center"
                  >
                    {link.label}
                    <svg 
                      className={`ml-1 h-4 w-4 transition-transform duration-200 ${openDropdown === link.label ? 'rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {/* Dropdown Menu */}
                  {openDropdown === link.label && (
                    <div className="absolute left-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                      <div className="py-1" role="menu">
                        {link.items?.map((item) => (
                          <Link
                            key={item.to}
                            to={item.to}
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors"
                            onClick={() => setOpenDropdown(null)}
                          >
                            <span className="mr-2">{item.icon}</span>
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link 
                  key={link.to}
                  to={link.to} 
                  className="text-gray-700 hover:text-green-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  {link.label}
                </Link>
              )
            ))}
            
            {isLoggedIn ? (
              <>
                {/* User Menu Dropdown */}
                <div className="relative group" onMouseLeave={handleMouseLeave}>
                  <button
                    onClick={() => handleDropdownToggle('user-menu')}
                    className="flex items-center space-x-2 text-gray-700 hover:text-green-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    <span className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                      {user?.name?.charAt(0) || 'U'}
                    </span>
                    <span>{user?.name || 'Account'}</span>
                    <svg 
                      className={`h-4 w-4 transition-transform duration-200 ${openDropdown === 'user-menu' ? 'rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {openDropdown === 'user-menu' && (
                    <div className="absolute right-0 mt-2 w-64 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                      <div className="py-1">
                        {authLinks.map((link) => (
                          <Link
                            key={link.to}
                            to={link.to}
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors"
                            onClick={() => setOpenDropdown(null)}
                          >
                            <span className="mr-2">{link.icon}</span>
                            {link.label}
                          </Link>
                        ))}
                        <div className="border-t border-gray-200"></div>
                        <button
                          onClick={handleLogout}
                          className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <span className="mr-2">🚪</span>
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => navigate('/login')}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  Sign In
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Register
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-700 hover:text-green-600 focus:outline-none"
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
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {/* Properties Dropdown in Mobile */}
              <div className="space-y-1">
                <button
                  onClick={() => handleDropdownToggle('mobile-properties')}
                  className="w-full flex justify-between items-center text-gray-700 hover:text-green-600 px-3 py-2 rounded-md text-base font-medium"
                >
                  Properties
                  <svg 
                    className={`h-4 w-4 transition-transform duration-200 ${openDropdown === 'mobile-properties' ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openDropdown === 'mobile-properties' && (
                  <div className="pl-4 space-y-1">
                    <Link
                      to="/properties?type=rent"
                      className="flex items-center text-gray-600 hover:text-green-600 px-3 py-2 rounded-md text-sm"
                      onClick={() => setIsOpen(false)}
                    >
                      <span className="mr-2">🏠</span> For Rent
                    </Link>
                    <Link
                      to="/properties?type=sale"
                      className="flex items-center text-gray-600 hover:text-green-600 px-3 py-2 rounded-md text-sm"
                      onClick={() => setIsOpen(false)}
                    >
                      <span className="mr-2">💰</span> For Sale
                    </Link>
                    <Link
                      to="/properties?type=commercial"
                      className="flex items-center text-gray-600 hover:text-green-600 px-3 py-2 rounded-md text-sm"
                      onClick={() => setIsOpen(false)}
                    >
                      <span className="mr-2">🏢</span> Commercial
                    </Link>
                    <Link
                      to="/properties?type=luxury"
                      className="flex items-center text-gray-600 hover:text-green-600 px-3 py-2 rounded-md text-sm"
                      onClick={() => setIsOpen(false)}
                    >
                      <span className="mr-2">✨</span> Luxury
                    </Link>
                  </div>
                )}
              </div>
              
              <Link
                to="/about"
                className="block text-gray-700 hover:text-green-600 px-3 py-2 rounded-md text-base font-medium"
                onClick={() => setIsOpen(false)}
              >
                About
              </Link>
              
              <Link
                to="/contact"
                className="block text-gray-700 hover:text-green-600 px-3 py-2 rounded-md text-base font-medium"
                onClick={() => setIsOpen(false)}
              >
                Contact
              </Link>
              
              {isLoggedIn ? (
                <>
                  <div className="border-t border-gray-200 my-2"></div>
                  {authLinks.map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      className="flex items-center text-gray-700 hover:text-green-600 px-3 py-2 rounded-md text-base font-medium"
                      onClick={() => setIsOpen(false)}
                    >
                      <span className="mr-2">{link.icon}</span>
                      {link.label}
                    </Link>
                  ))}
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full text-left bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 text-base font-medium mt-2"
                  >
                    <span className="mr-2">🚪</span>
                    Logout
                  </button>
                </>
              ) : (
                <div className="space-y-2 mt-4">
                  <button
                    onClick={() => {
                      navigate('/login');
                      setIsOpen(false);
                    }}
                    className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-base font-medium"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => {
                      navigate('/register');
                      setIsOpen(false);
                    }}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-base font-medium"
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