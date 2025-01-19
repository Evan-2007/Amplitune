'use client'
import { useEffect } from 'react';
import Script from 'next/script';

export function MusicKitProvider() {


  const handleLoad = async () => {
    window.dispatchEvent(new Event('musickitconfigured'));
    try {
      const response = await fetch('https://qgejhylfftwlxrlqsnak.supabase.co/functions/v1/musicKitJWT');
      const { token } = await response.json();
      
      // Configure MusicKit directly instead of getting instance first
      await window.MusicKit.configure({
        developerToken: token,
        app: {
          name: 'Amplitune',
          build: '1.0.0',
        },
      });

      // Now we can get the instance after configuration
      const musicKitInstance = window.MusicKit.getInstance();

      
      // You can do additional setup with the instance here if needed
      
    } catch (error) {
      console.error('Error configuring MusicKit:', error);
    }
  };

  return (
    <Script 
      src="https://js-cdn.music.apple.com/musickit/v3/musickit.js"
      onLoad={handleLoad}
      strategy="afterInteractive"
    />
  );
}

declare global {
  interface Window {
    MusicKit: any;
  }
}