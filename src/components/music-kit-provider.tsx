'use client';
declare global {
  interface Window {
    MusicKit: any;
    musicKitStatus: string;
  }
}

import { useEffect } from 'react';
import Script from 'next/script';
import { fetch as tauriFetch } from '@tauri-apps/plugin-http';


async function accessToken() {

  const fetch = window.isTauri ? tauriFetch : window.fetch;

  console.info('Fetching access token from webUI');
  const response = await fetch('https://music.apple.com/us/browse', {
    method: 'GET',
    mode: 'no-cors',
  });

  if (response.status !== 200) {
    console.error('Failed to get music.apple.com! Please re-try...');
    throw new Error(JSON.stringify(response));
  }

  const htmlText = await response.text();
  const indexJsMatch = htmlText.match(/(?<=index)(.*?)(?=\.js")/);
  if (!indexJsMatch) {
    throw new Error('Could not find index JS file reference');
  }

  const indexJs = indexJsMatch[1];
  console.log(indexJs);
  const jsResponse = await fetch(
    `https://music.apple.com/assets/index${indexJs}.js`
  );

  if (jsResponse.status !== 200) {
    console.error('Failed to get js library! Please re-try...');
    throw new Error('Failed to get js library');
  }

  const jsText = await jsResponse.text();
  const tokenMatch = jsText.match(/(?=eyJh)(.*?)(?=")/);

  if (!tokenMatch) {
    throw new Error('Could not find access token in JS file');
  }

  const accessToken = tokenMatch[1];
  console.log('Access token:', accessToken);
  return accessToken;
}



export function MusicKitProvider() {

  async function getAccsessToken() {
    try {
      const token = await accessToken();
      localStorage.setItem('music.apple.com:music-token', token);
    } catch (error) {
      console.error('Error fetching access token:', error);
    }
  }

  useEffect(() => {
    getAccsessToken()
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
