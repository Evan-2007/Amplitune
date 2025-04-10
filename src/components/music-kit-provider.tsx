'use client';
declare global {
  interface Window {
    MusicKit: any;
    musicKitStatus: string;
  }
}

import { useEffect } from 'react';
import Script from 'next/script';

export function MusicKitProvider() {
  useEffect(() => {
    // Set up the event listener immediately
    document.addEventListener('musickitloaded', async () => {
      try {
        const response = await fetch(
          'https://qgejhylfftwlxrlqsnak.supabase.co/functions/v1/musicKitJWT'
        );
        const { token } = await response.json();

        await window.MusicKit.configure({
          developerToken: token,
          app: {
            name: 'Amplitune',
            build: '1.0.0',
          },
        });

        window.dispatchEvent(new Event('musickitready'));
        window.musicKitStatus = 'ready';
      } catch (error) {
        console.error('Error configuring MusicKit:', error);
      }
    });
  }, []);

  return (
    <Script
      src='https://js-cdn.music.apple.com/musickit/v3/musickit.js'
      strategy='afterInteractive'
    />
  );
}
