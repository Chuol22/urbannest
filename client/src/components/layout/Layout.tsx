// src/components/layout/Layout.tsx
import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Navbar from './Navbar';
import Footer from './Footer';
import ScrollToTop from './ScrollToTop';
import ChatBot from '../ui/ChatBot';
import { GoogleTranslateScript } from '../GoogleTranslateScript';

interface LayoutProps {
  children?: React.ReactNode;
  showSidebar?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, showSidebar = false }) => {
  const location = useLocation();
  const [showChat, setShowChat] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0);

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

  // Check if we're on the home page to apply different padding
  const isHomePage = location.pathname === '/';
  const mainPaddingTop = isHomePage ? '0' : `${headerHeight}px`;

  // Dynamic meta tags based on current route
  const getMetaTags = () => {
    switch (location.pathname) {
      case '/':
        return {
          title: 'UrbanNEST | Find Your Dream Property',
          description: 'Discover premium properties with UrbanNEST — Your trusted partner in finding the perfect home',
          keywords: 'real estate, property, homes for rent, apartments, houses for sale'
        };
      case '/properties':
        return {
          title: 'Browse Properties | UrbanNEST',
          description: 'Explore thousands of verified properties. Find your dream home, apartment, or investment property.',
          keywords: 'properties for sale, homes for rent, real estate listings'
        };
      case '/create-listing':
        return {
          title: 'List Your Property | UrbanNEST',
          description: 'List your property on UrbanNEST. Reach thousands of potential tenants and buyers.',
          keywords: 'list property, sell home, rent out property'
        };
      default:
        return {
          title: 'UrbanNEST | Property Rental & Sales Platform',
          description: 'Find your perfect property with UrbanNEST - The smart way to rent, buy, or sell',
          keywords: 'real estate, property management, home rental'
        };
    }
  };

  const metaTags = getMetaTags();

  return (
    <>
      <Helmet>
        <title>{metaTags.title}</title>
        <meta name="description" content={metaTags.description} />
        <meta name="keywords" content={metaTags.keywords} />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta property="og:title" content={metaTags.title} />
        <meta property="og:description" content={metaTags.description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={window.location.href} />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href={window.location.href} />
      </Helmet>

      <GoogleTranslateScript />
      <div id="google_translate_element" style={{ display: 'none' }} />

      <div className="min-h-screen flex flex-col bg-white">
        <Navbar />

        <main
          className="flex-grow"
          style={{ paddingTop: mainPaddingTop }}
        >
          {showSidebar ? (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="flex flex-col lg:flex-row gap-8">
                <aside className="lg:w-1/4">
                  <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Navigation</h3>
                    <nav>
                      <ul className="space-y-2">
                        <li>
                          <a href="/dashboard" className="text-gray-600 hover:text-blue-600 transition-colors duration-200">
                            Dashboard
                          </a>
                        </li>
                        <li>
                          <a href="/properties" className="text-gray-600 hover:text-blue-600 transition-colors duration-200">
                            My Properties
                          </a>
                        </li>
                        <li>
                          <a href="/favorites" className="text-gray-600 hover:text-blue-600 transition-colors duration-200">
                            Favorites
                          </a>
                        </li>
                        <li>
                          <a href="/profile" className="text-gray-600 hover:text-blue-600 transition-colors duration-200">
                            Profile
                          </a>
                        </li>
                        <li>
                          <a href="/messages" className="text-gray-600 hover:text-blue-600 transition-colors duration-200">
                            Messages
                          </a>
                        </li>
                      </ul>
                    </nav>
                  </div>
                </aside>

                <div className="lg:w-3/4">
                  <div className="bg-white rounded-lg shadow-md p-6">
                    {children || <Outlet />}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className={isHomePage ? '' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'}>
              {children || <Outlet />}
            </div>
          )}
        </main>

        <Footer />
        <ScrollToTop />
        <ChatBot isOpen={showChat} onToggle={() => setShowChat(!showChat)} />
      </div>
    </>
  );
};

export default Layout;