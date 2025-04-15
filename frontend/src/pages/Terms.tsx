import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Footer from '../components/Footer';
import { Helmet } from 'react-helmet-async';

const Terms: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Helmet>
  <title>Terms of Service - ChatSafari</title>
  <meta name="description" content="Read ChatSafari's Terms of Service to understand our policies, rules, and guidelines for using our free chat platform. Learn about our service terms and responsibilities." />
  <meta name="keywords" content="terms of service, ChatSafari terms, terms and conditions, chat platform rules, service guidelines" />
  <link rel="canonical" href="https://chatsafari.com/terms" />
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
              <span className="text-2xl font-bold text-violet-600" style={{ fontFamily: 'Pacifico, cursive' }}>
                ChatSafari
              </span>
            </div>

            {/* Right section - Empty for balance */}
            <div className="w-20"></div>
          </div>
        </div>
      </header>

      <div className="flex-1 container mx-auto px-4 py-8 max-w-3xl pt-24">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Terms of Service</h1>
        
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Acceptance of Terms</h2>
            <p className="text-gray-600">
              By accessing or using ChatSafari, you agree to be bound by these Terms of Service and our Privacy Policy. 
              If you do not agree to these terms, please do not use our services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Advertising and Third-Party Content</h2>
            <p className="text-gray-600">
              Our service includes third-party advertising, including Google AdSense advertisements. By using our service, you agree to:
            </p>
            <ul className="list-disc list-inside text-gray-600 ml-4 mt-2 space-y-1">
              <li>The display of personalized advertisements based on your interests</li>
              <li>The use of cookies and similar technologies for advertising purposes</li>
              <li>Not interfere with or block the proper display of advertisements</li>
              <li>Not use ad-blocking software while using our services</li>
            </ul>
            <p className="text-gray-600 mt-3">
              We are not responsible for the content of third-party advertisements. Any interaction with advertisers is solely between you and the advertiser.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Prohibited Content and Activities</h2>
            <p className="text-gray-600">
              You agree not to post, share, or promote:
            </p>
            <ul className="list-disc list-inside text-gray-600 ml-4 mt-2 space-y-1">
              <li>Adult, explicit, or pornographic content</li>
              <li>Violence, gore, or shocking material</li>
              <li>Hate speech or discriminatory content</li>
              <li>Illegal goods, services, or activities</li>
              <li>Malware, viruses, or harmful code</li>
              <li>Spam, scams, or fraudulent content</li>
              <li>Content that infringes on intellectual property rights</li>
              <li>Misleading or false information</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">User Conduct</h2>
            <p className="text-gray-600">
              You agree to use our services responsibly and in compliance with all applicable laws. Users must:
            </p>
            <ul className="list-disc list-inside text-gray-600 ml-4 mt-2 space-y-1">
              <li>Be at least 18 years old</li>
              <li>Provide accurate registration information</li>
              <li>Maintain the security of their account</li>
              <li>Not harass or harm other users</li>
              <li>Not use automated systems or bots</li>
              <li>Not attempt to circumvent our security measures</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Intellectual Property Rights</h2>
            <p className="text-gray-600">
              All content and materials available on ChatSafari, including but not limited to text, graphics, logos, icons, images, audio clips, and software, are the property of ChatSafari or its licensors and are protected by copyright, trademark, and other intellectual property laws.
            </p>
            <p className="text-gray-600 mt-2">
              You may not use, reproduce, distribute, or create derivative works from this content without explicit permission from ChatSafari or the respective rights holders.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Account Termination</h2>
            <p className="text-gray-600">
              We reserve the right to suspend or terminate accounts that:
            </p>
            <ul className="list-disc list-inside text-gray-600 ml-4 mt-2 space-y-1">
              <li>Violate these terms of service</li>
              <li>Engage in fraudulent or illegal activities</li>
              <li>Post prohibited content</li>
              <li>Interfere with our advertising systems</li>
              <li>Pose a risk to our community or platform</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Limitation of Liability</h2>
            <p className="text-gray-600">
              ChatSafari is provided "as is" without any warranties. We are not liable for any damages arising from your use of our services or third-party content, including advertisements.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Changes to Terms</h2>
            <p className="text-gray-600">
              We may update these terms from time to time. Continued use of our services after changes constitutes acceptance of the new terms. We will notify users of significant changes via email or platform notifications.
            </p>
          </section>

          <div className="text-sm text-gray-500 mt-6">
            Last Updated: {new Date().toLocaleDateString()}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Terms; 
