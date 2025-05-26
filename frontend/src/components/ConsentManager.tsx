import React, { useEffect, useState } from 'react';

// Add type declarations for gtag and adsbygoogle
declare global {
  interface Window {
    gtag: (
      command: string,
      action: string,
      params?: {
        [key: string]: string | boolean;
      }
    ) => void;
    adsbygoogle: any[];
  }
}

interface ConsentState {
  analytics: boolean;
  ads: boolean;
  functionality: boolean;
  personalization: boolean;
}

// List of EU country codes
const EU_COUNTRIES = [
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU',
  'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE'
];

// US state codes (for CCPA compliance)
const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL',
  'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT',
  'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI',
  'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

const ConsentManager: React.FC = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [showPrivacyDetails, setShowPrivacyDetails] = useState(false);
  const [consent, setConsent] = useState<ConsentState>({
    analytics: false,
    ads: false,
    functionality: false,
    personalization: false
  });

  useEffect(() => {
    const checkUserLocation = async () => {
      try {
        // First check if consent was previously given
        const savedConsent = localStorage.getItem('consent');
        if (savedConsent) {
          const parsedConsent = JSON.parse(savedConsent);
          setConsent(parsedConsent);
          updateConsentState(parsedConsent);
          return;
        }

        // If no consent saved, check user's location
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        
        const countryCode = data.country_code;
        const region = data.region_code;

        // Show banner only for EU countries or US states
        const shouldShowBanner = 
          EU_COUNTRIES.includes(countryCode) || 
          (countryCode === 'US' && US_STATES.includes(region));

        if (shouldShowBanner) {
          setShowBanner(true);
        } else {
          // For non-EU/US users, automatically grant consent
          updateConsentState({
            analytics: true,
            ads: true,
            functionality: true,
            personalization: true
          });
        }
      } catch (error) {
        console.error('Error checking user location:', error);
        // In case of error, show the banner to be safe
        setShowBanner(true);
      }
    };

    checkUserLocation();
  }, []);

  const updateConsentState = (newConsent: ConsentState) => {
    // Update Google Analytics consent state
    if (window.gtag) {
      window.gtag('consent', 'update', {
        'analytics_storage': newConsent.analytics ? 'granted' : 'denied',
        'ad_storage': newConsent.ads ? 'granted' : 'denied',
        'functionality_storage': newConsent.functionality ? 'granted' : 'denied',
        'personalization_storage': newConsent.personalization ? 'granted' : 'denied'
      });
    }

    // Update AdSense consent state
    if (window.adsbygoogle) {
      window.adsbygoogle.push({
        'consent_mode_enabled': true,
        'consent_state': {
          'analytics_storage': newConsent.analytics ? 'granted' : 'denied',
          'ad_storage': newConsent.ads ? 'granted' : 'denied',
          'functionality_storage': newConsent.functionality ? 'granted' : 'denied',
          'personalization_storage': newConsent.personalization ? 'granted' : 'denied'
        }
      });
    }

    // Save consent to localStorage
    localStorage.setItem('consent', JSON.stringify(newConsent));
    setConsent(newConsent);
    setShowBanner(false);
  };

  const handleAcceptAll = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    updateConsentState({
      analytics: true,
      ads: true,
      functionality: true,
      personalization: true
    });
  };

  const handleRejectAll = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    updateConsentState({
      analytics: false,
      ads: false,
      functionality: false,
      personalization: false
    });
  };

  const handleSavePreferences = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    updateConsentState(consent);
  };

  const togglePrivacyDetails = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowPrivacyDetails(!showPrivacyDetails);
  };

  if (!showBanner) return null;

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200 p-4 z-[99999] pointer-events-auto"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Cookie Preferences</h3>
            <p className="text-sm text-gray-600">
              We use cookies to enhance your browsing experience, serve personalized ads or content, and analyze our traffic. 
              By clicking "Accept All", you consent to our use of cookies.
            </p>
            <button
              onClick={togglePrivacyDetails}
              className="text-sm text-violet-600 hover:text-violet-700 mt-2 pointer-events-auto"
            >
              {showPrivacyDetails ? 'Hide Details' : 'Show Details'}
            </button>
            
            {showPrivacyDetails && (
              <div className="mt-4 space-y-4 text-sm text-gray-600">
                <div>
                  <h4 className="font-medium text-gray-900">Analytics Cookies</h4>
                  <p>Help us understand how visitors interact with our website by collecting and reporting information anonymously.</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Advertising Cookies</h4>
                  <p>Used by Google AdSense to serve personalized advertisements based on your interests and browsing behavior.</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Functionality Cookies</h4>
                  <p>Enable enhanced functionality and personalization, such as remembering your chat preferences.</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Personalization Cookies</h4>
                  <p>Help us deliver a more personalized experience by remembering your preferences and settings.</p>
                </div>
                <div className="pt-2">
                  <p>For more information about how we use cookies and your data, please read our <a href="/privacy" className="text-violet-600 hover:underline">Privacy Policy</a>.</p>
                </div>
              </div>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-2 pointer-events-auto">
            <button
              onClick={handleRejectAll}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 pointer-events-auto"
            >
              Reject All
            </button>
            <button
              onClick={handleAcceptAll}
              className="px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-md hover:bg-violet-700 pointer-events-auto"
            >
              Accept All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsentManager;
