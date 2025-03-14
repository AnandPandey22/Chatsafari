import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, MapPin } from 'lucide-react';
import Footer from '../components/Footer';

const Contact: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Fixed Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm fixed top-0 left-0 right-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left section - Brand */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center text-violet-600 hover:text-violet-700 transition duration-150 ease-in-out">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </div>

            {/* Center section - Brand */}
            <div className="flex-1 flex justify-center">
              <h1 className="text-2xl font-bold text-violet-600" style={{ fontFamily: 'Pacifico, cursive' }}>
                ChatSafari
              </h1>
            </div>

            {/* Right section - Empty for balance */}
            <div className="w-20"></div>
          </div>
        </div>
      </header>

      <div className="flex-1 container mx-auto px-4 py-8 max-w-3xl">
        <Link 
          to="/" 
          className="inline-flex items-center text-violet-600 hover:text-violet-700 mb-6"
        >
          <svg 
            className="w-5 h-5 mr-2" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Home
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-6">Contact Us</h1>
        
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-gray-600 mb-6">
            Have questions or need assistance? We're here to help! Get in touch with us using the information below.
          </p>

          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Email</h2>
              <p className="text-gray-600">support@chatsafari.com</p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Business Hours</h2>
              <p className="text-gray-600">Monday - Friday: 9:00 AM - 6:00 PM (EST)</p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Location</h2>
              <p className="text-gray-600">123 Chat Street<br />Tech City, TC 12345<br />United States</p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Contact; 