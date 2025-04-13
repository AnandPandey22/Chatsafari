import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BarChart, Users, Globe, Mail } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

const Advertise: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Helmet>
  <title>Advertise with ChatSafari - Reach Global Audience At Low Cost</title>
  <meta name="description" content="Advertise your brand or service on ChatSafari, the free, anonymous chat platform. Reach a wide, engaged global audience. No sign-up required!" />
  <meta name="keywords" content="advertise, advertising, brand promotion, online advertising, digital marketing, target audience, free chat platform, global reach, no signup advertising" />
  <link rel="canonical" href="https://chatsafari.com/advertise" />
      </Helmet>

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
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Advertise with ChatSafari</h1>
            <p className="text-xl text-gray-600">Reach thousands of active users worldwide</p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <Users className="h-12 w-12 text-violet-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Large User Base</h3>
              <p className="text-gray-600">Connect with our growing community of active users from around the world.</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <BarChart className="h-12 w-12 text-violet-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">High Engagement</h3>
              <p className="text-gray-600">Our users are highly engaged, providing better visibility for your brand.</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <Globe className="h-12 w-12 text-violet-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Global Reach</h3>
              <p className="text-gray-600">Target audiences across different regions and demographics.</p>
            </div>
          </div>

          {/* Ad Formats */}
          <div className="bg-white rounded-xl shadow-sm p-8 mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Available Ad Formats</h2>
            <div className="space-y-6">
              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Banner Ads</h3>
                <p className="text-gray-600 mb-4">High-visibility banner placements across our platform.</p>
                <ul className="list-disc list-inside text-gray-600 space-y-2">
                  <li>728x90 Leaderboard</li>
                  <li>300x250 Medium Rectangle</li>
                  <li>160x600 Wide Skyscraper</li>
                </ul>
              </div>
              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Sponsored Content</h3>
                <p className="text-gray-600">Native advertising opportunities that blend seamlessly with our platform.</p>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Custom Solutions</h3>
                <p className="text-gray-600">Tailored advertising solutions to meet your specific needs.</p>
              </div>
            </div>
          </div>

          {/* Contact Section */}
          <div className="bg-white rounded-xl shadow-sm p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Get Started</h2>
            <p className="text-gray-600 mb-6">Ready to advertise with ChatSafari? Contact us to discuss your campaign.</p>
            <div className="flex flex-col items-center space-y-4">
              <a
                href="mailto:contact@chatsafari.com"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-violet-600 hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 transition duration-150 ease-in-out"
              >
                <Mail className="h-5 w-5 mr-2" />
                Contact Us
              </a>
              <p className="text-sm text-gray-500">contact@chatsafari.com</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Advertise; 
