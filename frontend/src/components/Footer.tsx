import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8 md:py-12">
          <div className="flex flex-col md:flex-row items-center justify-between">
            {/* Branding - Hidden on mobile */}
            <div className="hidden md:block mb-6 md:mb-0">
              <div className="text-center">
                <span className="text-3xl font-bold text-violet-600" style={{ fontFamily: 'Pacifico, cursive' }}>
                  ChatSafari
                </span>
                <p className="text-violet-600 mt-1" style={{ fontFamily: 'Georgia, serif' }}>
                  Free Chat
                </p>
              </div>
            </div>

            {/* Links - Vertical on mobile, horizontal on desktop */}
            <div className="flex flex-col md:flex-row items-center space-y-3 md:space-y-0 md:space-x-6 mb-6 md:mb-0">
              <Link to="/privacy" className="text-gray-600 hover:text-violet-600 transition duration-150 ease-in-out">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-gray-600 hover:text-violet-600 transition duration-150 ease-in-out">
                Terms of Service
              </Link>
              <Link to="/contact" className="text-gray-600 hover:text-violet-600 transition duration-150 ease-in-out">
                Contact Us
              </Link>
              <Link to="/advertise" className="text-gray-600 hover:text-violet-600 transition duration-150 ease-in-out">
                Advertise with us
              </Link>
            </div>

            {/* Copyright */}
            <div className="w-full md:w-auto text-center text-sm text-gray-500 mt-6 md:mt-0">
              © 2025 ChatSafari.com
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 
