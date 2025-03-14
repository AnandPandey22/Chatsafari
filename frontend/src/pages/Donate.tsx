import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Heart, CreditCard, Shield, Gift } from 'lucide-react';

const Donate: React.FC = () => {
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

      {/* Main Content */}
      <div className="flex-1 pt-24 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Support ChatSafari</h1>
            <p className="text-xl text-gray-600">Help us keep the platform free and improve our services</p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <Heart className="h-12 w-12 text-violet-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Keep It Free</h3>
              <p className="text-gray-600">Help us maintain a free platform for everyone to connect.</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <Shield className="h-12 w-12 text-violet-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Enhanced Security</h3>
              <p className="text-gray-600">Support our efforts to improve platform security and user protection.</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <Gift className="h-12 w-12 text-violet-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">New Features</h3>
              <p className="text-gray-600">Help us develop new features and improve user experience.</p>
            </div>
          </div>

          {/* Donation Section */}
          <div className="bg-white rounded-xl shadow-sm p-8 mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Make a Donation</h2>
            <div className="space-y-6">
              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Choose Your Donation Amount</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[5, 10, 20, 50].map((amount) => (
                    <button
                      key={amount}
                      className="p-4 border border-gray-200 rounded-lg hover:border-violet-500 hover:bg-violet-50 transition duration-150 ease-in-out"
                    >
                      <span className="text-lg font-semibold text-gray-900">${amount}</span>
                    </button>
                  ))}
                </div>
                <div className="mt-4">
                  <input
                    type="number"
                    placeholder="Custom amount"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Method</h3>
                <div className="flex items-center space-x-4">
                  <CreditCard className="h-8 w-8 text-gray-400" />
                  <span className="text-gray-600">Secure payment via PayPal</span>
                </div>
              </div>

              <div>
                <button
                  className="w-full flex justify-center items-center py-4 px-6 border border-transparent text-base font-medium rounded-lg text-white bg-violet-600 hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 transition duration-150 ease-in-out"
                >
                  <img
                    src="https://www.paypalobjects.com/webstatic/en_US/i/buttons/checkout-logo-large.png"
                    alt="PayPal"
                    className="h-8 mr-2"
                  />
                  Donate Now
                </button>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="bg-white rounded-xl shadow-sm p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Frequently Asked Questions</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Is my donation secure?</h3>
                <p className="text-gray-600">Yes, all donations are processed securely through PayPal's payment system.</p>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Can I donate anonymously?</h3>
                <p className="text-gray-600">Yes, you can choose to make your donation anonymous during the PayPal checkout process.</p>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">How will my donation be used?</h3>
                <p className="text-gray-600">Your donation helps us maintain and improve the platform, enhance security, and develop new features.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Donate; 