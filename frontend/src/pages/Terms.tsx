import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Footer from '../components/Footer';

const Terms: React.FC = () => {
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
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Terms of Service</h1>
        
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Acceptance of Terms</h2>
            <p className="text-gray-600">
              By accessing or using ChatSafari, you agree to be bound by these Terms of Service. 
              If you do not agree to these terms, please do not use our services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">User Conduct</h2>
            <p className="text-gray-600">
              You agree to use our services responsibly and in compliance with all applicable laws. 
              Prohibited activities include harassment, spam, hate speech, and any form of illegal content.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Content Guidelines</h2>
            <p className="text-gray-600">
              You are responsible for all content you post or share through our platform. Content must not 
              violate any laws, infringe on intellectual property rights, or contain harmful material.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Account Termination</h2>
            <p className="text-gray-600">
              We reserve the right to suspend or terminate accounts that violate these terms, engage in 
              fraudulent activity, or pose a risk to our community.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Changes to Terms</h2>
            <p className="text-gray-600">
              We may update these terms from time to time. Continued use of our services after changes 
              constitutes acceptance of the new terms.
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Terms; 