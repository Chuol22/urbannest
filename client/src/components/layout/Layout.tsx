import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

interface LayoutProps {
  children?: React.ReactNode;
  showSidebar?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, showSidebar = false }) => {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      
      <div className="flex-grow">
        {showSidebar ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col lg:flex-row gap-8">
              <aside className="lg:w-1/4">
                <div className="bg-transparent rounded-lg shadow-md p-6 sticky top-24">
                  <h3 className="text-lg font-semibold mb-4">Navigation</h3>
                  <nav>
                    <ul className="space-y-2">
                      <li><a href="/dashboard" className="text-gray-600 hover:text-[#10B981]">Dashboard</a></li>
                      <li><a href="/properties" className="text-gray-600 hover:text-[#10B981]">My Properties</a></li>
                      <li><a href="/favorites" className="text-gray-600 hover:text-[#10B981]">Favorites</a></li>
                      <li><a href="/profile" className="text-gray-600 hover:text-[#10B981]">Profile</a></li>
                    </ul>
                  </nav>
                </div>
              </aside>
              <main className="lg:w-3/4">
                <div className="bg-transparent rounded-lg shadow-md p-6">
                  {children || <Outlet />}
                </div>
              </main>
            </div>
          </div>
        ) : (
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-transparent rounded-lg shadow-md p-6">
              {children || <Outlet />}
            </div>
          </main>
        )}
      </div>
      
      <Footer />
    </div>
  );
};

export default Layout;