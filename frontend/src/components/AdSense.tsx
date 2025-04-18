import React, { useEffect } from 'react';

interface AdSenseProps {
  slot: string;
  format?: string;
  style?: React.CSSProperties;
  responsive?: boolean;
}

const AdSense: React.FC<AdSenseProps> = ({ slot, format = 'auto', style, responsive = true }) => {
  useEffect(() => {
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error('AdSense error:', err);
    }
  }, []);

  return (
    <div className="ad-container">
      <ins
        className="adsbygoogle"
        style={style}
        data-ad-client="ca-pub-9696449443766781" // Replace with your AdSense client ID
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive}
      />
    </div>
  );
};

export default AdSense; 
