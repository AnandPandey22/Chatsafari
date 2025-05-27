import React, { useState, useEffect } from 'react';

interface ConsentPreferences {
  analytics: boolean;
  personalizedAds: boolean;
}

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

const ConsentBanner: React.FC = () => {
  const [preferences, setPreferences] = useState<ConsentPreferences>(() => {
    const savedPreferences = localStorage.getItem('consentPreferences');
    if (savedPreferences) {
      return JSON.parse(savedPreferences);
    }
    return {
      analytics: false,
      personalizedAds: false,
    };
  });

  const [showCustomize, setShowCustomize] = useState(false);
  const [isVisible, setIsVisible] = useState(() => {
    return !localStorage.getItem('consentPreferences');
  });

   useEffect(() => {
    window.gtag('consent', 'default', {
      'analytics_storage': preferences.analytics ? 'granted' : 'denied',
      'ad_storage': preferences.personalizedAds ? 'granted' : 'denied',
      'ad_user_data': preferences.personalizedAds ? 'granted' : 'denied',
      'ad_personalization': preferences.personalizedAds ? 'granted' : 'denied',
      'wait_for_update': 500
    });
  }, [preferences]);

  const updateConsentState = (newPreferences: ConsentPreferences) => {
    window.gtag('consent', 'update', {
      'analytics_storage': newPreferences.analytics ? 'granted' : 'denied',
      'ad_storage': newPreferences.personalizedAds ? 'granted' : 'denied',
      'ad_user_data': newPreferences.personalizedAds ? 'granted' : 'denied',
      'ad_personalization': newPreferences.personalizedAds ? 'granted' : 'denied',
    });
    localStorage.setItem('consentPreferences', JSON.stringify(newPreferences));
    setPreferences(newPreferences);
    setIsVisible(false);
    setShowCustomize(false);
  };

  const handleAcceptAll = () => {
    updateConsentState({
      analytics: true,
      personalizedAds: true,
    });
  };

  const handleSavePreferences = () => {
    updateConsentState(preferences);
  };

  const handleCustomize = () => {
    setShowCustomize(true);
  };

  // Function for the cross button - same as Accept All
  const handleCloseBannerAcceptAll = () => {
    handleAcceptAll();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-sm w-full max-h-[90vh] overflow-y-auto p-6 relative text-center">
        {/* Close button */}
        <button onClick={handleCloseBannerAcceptAll} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Logo */}
        <div className="flex justify-center mb-2">
          {/* Using a generic path for the logo. Ensure /apple-touch-icon.png is correct or update. */}
          <img src="/apple-touch-icon.png" alt="ChatSafari Logo" className="h-10 w-10" />
        </div>

        {/* Welcome Text */}
        <h3 className="text-lg font-bold text-gray-900 mb-4">Welcome to Chatsafari</h3>

        {/* Simple Consent Message */}
        {!showCustomize && (
          <p className="text-sm text-gray-700 mb-6">
            We use cookies to enhance your browsing experience and analyze our traffic.
            By clicking "Accept All", you consent to our use of cookies.
          </p>
        )}

        {/* Customization Options (shown when Customize is clicked) */}
        {showCustomize && (
          <div className="mt-4 pt-4 border-t border-gray-200 text-left">
            <h4 className="text-md font-semibold text-gray-800 mb-2">Manage Your Options</h4>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={preferences.analytics}
                  onChange={(e) => setPreferences(prev => ({ ...prev, analytics: e.target.checked }))}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                Analytics Cookies
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={preferences.personalizedAds}
                  onChange={(e) => setPreferences(prev => ({ ...prev, personalizedAds: e.target.checked }))}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                Personalized Ads
              </label>
            </div>
             {/* Save preferences button for customization view */}
             <button
               onClick={handleSavePreferences}
               className="mt-4 w-full px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
             >
               Save Preferences
             </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className={`flex justify-center gap-3 ${showCustomize ? 'mt-6' : ''}`}>
          {!showCustomize ? (
             <button
               onClick={handleCustomize}
               className="px-4 py-2 text-indigo-600 border border-indigo-600 rounded-md text-sm font-medium hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
             >
               Customize
             </button>
          ) : null}
          <button
            onClick={handleAcceptAll}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConsentBanner;
