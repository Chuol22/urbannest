import { Link } from 'react-router-dom';

import logo from '../../assets/images/unlogo.png';

const Footer = () => {
  return (
    <footer className="bg-[#181B22] text-white mt-auto border-t border-[#262C37]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Logo and Description */}
          <div>
            <div className="flex items-center mb-5">
              <div className="bg-white/95 rounded-2xl px-3 py-2 shadow-md border border-[#C9A865]/30 flex items-center justify-center max-w-[210px]">
                <img
                  src={logo}
                  alt="UrbanNest Logo"
                  className="h-11 w-auto object-contain"
                />
              </div>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              Ethiopia's premier trusted property marketplace. Discover verified homes, apartments, commercial spaces, and land with 100% confidence.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-lg mb-4 text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#C9A865]"></span> Quick Links
            </h4>
            <ul className="space-y-2.5 text-gray-300 text-sm">
              <li>
                <Link to="/about" className="hover:text-[#C9A865] transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-[#C9A865] transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/properties" className="hover:text-[#C9A865] transition-colors">
                  Properties
                </Link>
              </li>
              <li>
                <Link to="/properties?type=rent" className="hover:text-[#C9A865] transition-colors">
                  Properties for Rent
                </Link>
              </li>
              <li>
                <Link to="/properties?type=sell" className="hover:text-[#C9A865] transition-colors">
                  Properties for Sale
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-bold text-lg mb-4 text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#C9A865]"></span> Support & Trust
            </h4>
            <ul className="space-y-2.5 text-gray-300 text-sm">
              <li>
                <Link to="/verify" className="hover:text-[#C9A865] transition-colors flex items-center gap-1.5">
                  <span className="text-[#2E7D4F] font-bold">✓</span> Verification Guide
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-[#C9A865] transition-colors">
                  Support Center
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-[#C9A865] transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-[#C9A865] transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-bold text-lg mb-4 text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#C9A865]"></span> Contact Us
            </h4>
            <ul className="space-y-3 text-gray-300 text-sm">
              <li className="flex items-center space-x-3">
                <svg className="w-5 h-5 text-[#C9A865] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>support@urbannest.com</span>
              </li>
              <li className="flex items-center space-x-3">
                <svg className="w-5 h-5 text-[#C9A865] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>+251 (715) 43-2223</span>
              </li>
              <li className="flex items-center space-x-3">
                <svg className="w-5 h-5 text-[#C9A865] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Bole Main Road, Addis Ababa</span>
              </li>
            </ul>

            {/* Social Media Links */}
            <div className="flex space-x-4 mt-6">
              <a href="#" className="text-gray-400 hover:text-[#C9A865] transition-colors p-2 bg-[#0F1116] rounded-lg">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879v-6.99h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.99C18.343 21.128 22 16.991 22 12z" />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-[#C9A865] transition-colors p-2 bg-[#0F1116] rounded-lg">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 0021.455-12.22c0-.21-.005-.422-.014-.63A9.935 9.935 0 0024 4.59z" />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-[#C9A865] transition-colors p-2 bg-[#0F1116] rounded-lg">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1112.324 0 6.162 6.162 0 01-12.324 0zM12 16a4 4 0 110-8 4 4 0 010 8zm4.965-10.405a1.44 1.44 0 112.881.001 1.44 1.44 0 01-2.881-.001z" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-[#262C37] mt-10 pt-8 text-center text-gray-400 text-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>&copy; {new Date().getFullYear()} UrbanNest. All rights reserved.</p>
          <div className="flex items-center gap-4 text-xs">
            <span className="inline-flex items-center gap-1.5 text-[#5CAE78]">
              <span className="w-2 h-2 rounded-full bg-[#2E7D4F]"></span> 100% Verified Listings
            </span>
            <span className="text-[#C9A865] font-semibold">
              Trusted by 10,000+ Ethiopians
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;