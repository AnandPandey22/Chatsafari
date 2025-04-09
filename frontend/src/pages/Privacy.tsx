import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Footer from '../components/Footer';

const Privacy: React.FC = () => {
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

      <div className="flex-1 container mx-auto px-4 py-8 max-w-3xl pt-24">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
        
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Introduction</h2>
            <p className="text-gray-600">
              At ChatSafari, we take your privacy seriously. This Privacy Policy explains how we collect, 
              use, disclose, and safeguard your information when you use our chat platform. Please read this 
              privacy policy carefully. By using ChatSafari, you consent to the practices described in this policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Information We Collect</h2>
            <div className="space-y-2">
              <p className="text-gray-600 font-medium">Personal Information:</p>
              <ul className="list-disc list-inside text-gray-600 ml-4 space-y-1">
                <li>Username and profile information</li>
                <li>Age and gender (for user matching)</li>
                <li>IP address and device information</li>
                <li>Chat messages and communication data</li>
                <li>Usage data and interaction patterns</li>
                <li>Browser type and settings</li>
                <li>Operating system information</li>
                <li>Referring URLs and website interactions</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Advertising</h2>
            <p className="text-gray-600">
              We use Google AdSense to display advertisements on our platform. Google AdSense uses cookies and similar technologies to:
            </p>
            <ul className="list-disc list-inside text-gray-600 ml-4 mt-2 space-y-1">
              <li>Show personalized ads based on your interests</li>
              <li>Measure ad performance and effectiveness</li>
              <li>Prevent duplicate ads from being shown</li>
              <li>Detect and prevent fraudulent advertising activity</li>
            </ul>
            <p className="text-gray-600 mt-3">
              Third-party vendors, including Google, use cookies to serve ads based on your prior visits to our website or other websites. Google's use of advertising cookies enables it and its partners to serve ads based on your visit to our site and/or other sites on the Internet.
            </p>
            <p className="text-gray-600 mt-3">
              You can opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads" className="text-violet-600 hover:underline" target="_blank" rel="noopener noreferrer">Google's Ads Settings</a>. Alternatively, you can opt out of third-party vendors' use of cookies by visiting <a href="http://www.aboutads.info/choices/" className="text-violet-600 hover:underline" target="_blank" rel="noopener noreferrer">www.aboutads.info</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Cookies and Tracking Technologies</h2>
            <p className="text-gray-600">
              We and our advertising partners use cookies and similar tracking technologies to:
            </p>
            <ul className="list-disc list-inside text-gray-600 ml-4 mt-2 space-y-1">
              <li>Remember your preferences and settings</li>
              <li>Understand how you interact with our services</li>
              <li>Provide personalized content and advertisements</li>
              <li>Analyze and improve our services</li>
              <li>Measure the effectiveness of our advertising</li>
            </ul>
            <p className="text-gray-600 mt-3">
              You can control cookie preferences through your browser settings. Please note that blocking certain cookies may impact the functionality of our services and the advertisements you see.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Data Retention and Deletion</h2>
            <p className="text-gray-600">
              We retain your personal information only for as long as necessary to provide our services and fulfill the purposes outlined in this Privacy Policy. When your data is no longer required, it will be securely deleted or anonymized.
            </p>
            <p className="text-gray-600 mt-2">
              You can request deletion of your account and associated data at any time. However, some information may be retained for legal, security, or business purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">How We Use Your Information</h2>
            <div className="space-y-2">
              <p className="text-gray-600">We use the collected information for:</p>
              <ul className="list-disc list-inside text-gray-600 ml-4 space-y-1">
                <li>Providing and maintaining our chat services</li>
                <li>Matching you with appropriate chat partners</li>
                <li>Improving user experience and platform functionality</li>
                <li>Ensuring platform safety and preventing abuse</li>
                <li>Analyzing usage patterns to enhance our services</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Data Security</h2>
            <p className="text-gray-600">
              We implement industry-standard security measures to protect your information:
            </p>
            <ul className="list-disc list-inside text-gray-600 ml-4 mt-2 space-y-1">
              <li>End-to-end encryption for chat messages</li>
              <li>Secure data storage and transmission</li>
              <li>Regular security audits and updates</li>
              <li>Access controls and authentication measures</li>
              <li>Data backup and recovery procedures</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Data Sharing and Disclosure</h2>
            <p className="text-gray-600">
              We do not sell your personal information. We may share your information only in the following circumstances:
            </p>
            <ul className="list-disc list-inside text-gray-600 ml-4 mt-2 space-y-1">
              <li>With your explicit consent</li>
              <li>To comply with legal obligations</li>
              <li>To protect our rights and safety</li>
              <li>With service providers who assist our operations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Your Rights and Choices</h2>
            <p className="text-gray-600">You have the right to:</p>
            <ul className="list-disc list-inside text-gray-600 ml-4 mt-2 space-y-1">
              <li>Access your personal information</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Opt-out of certain data collection</li>
              <li>Export your data</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Children's Privacy</h2>
            <p className="text-gray-600">
              ChatSafari is not intended for users under 18 years of age. We do not knowingly collect or 
              maintain information from children under 18.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Changes to This Policy</h2>
            <p className="text-gray-600">
              We may update this Privacy Policy from time to time. We will notify you of any changes by 
              posting the new Privacy Policy on this page and updating the "Last Updated" date.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Contact Us</h2>
            <p className="text-gray-600">
              If you have any questions about this Privacy Policy, please contact us at:
            </p>
            <p className="text-violet-600 mt-1">contact@chatsafari.com</p>
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

export default Privacy; 