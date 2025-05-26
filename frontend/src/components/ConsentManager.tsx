import React, { useEffect } from 'react';

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

const ConsentManager: React.FC = () => {
  useEffect(() => {
    // Initialize Google's consent management
    if (window.gtag) {
      // Set default consent to 'denied' for analytics and ad storage
      // but allow functionality_storage for basic site operation
      window.gtag('consent', 'default', {
        'analytics_storage': 'denied',
        'ad_storage': 'denied',
        'functionality_storage': 'granted', // Allow basic functionality
        'personalization_storage': 'denied',
        'security_storage': 'granted'
      });

      // Initialize Google Analytics with consent mode
      window.gtag('config', 'G-FV52YJDMHF', {
        'consent_mode_enabled': true,
        'cookie_flags': 'SameSite=None;Secure'
      });
    }

    // Initialize AdSense with consent mode
    if (window.adsbygoogle) {
      window.adsbygoogle.push({
        'consent_mode_enabled': true
      });
    }
  }, []);

  // Return null as we're not rendering any UI
  return null;
};

export default ConsentManager;
