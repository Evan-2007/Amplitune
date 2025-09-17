'use client';
import { Card, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import * as tidal from '@tidal-music/auth';
import { listen } from '@tauri-apps/api/event';
import { useEffect, useState } from 'react';
import { Webview } from '@tauri-apps/api/webview';

interface TidalResponse {
  event: string;
  id: string;
  payload: {
    code: string;
  };
}

export default function Accounts() {
  const [error, setError] = useState<string | null>(null);
  const [authenticated, setAuthenticated] = useState<string[]>([]);

  const clientId = 'MFzBCbOcFf8ObmHD';

  async function finalizeLogin(code: string) {
    try {
      await tidal.finalizeLogin(`?code=${code}`);
      console.log('Logged in');
    } catch (error) {
      setError('Failed to authenticate with Tidal');
    }
  }

  useEffect(() => {
  // Check if returning from Apple Music auth
  if (sessionStorage.getItem('musickit_auth_pending') === 'true') {
    sessionStorage.removeItem('musickit_auth_pending');
    
    // Wait for MusicKit to be ready
    const checkAuth = setInterval(() => {
      if (
        typeof window !== 'undefined' &&
        (window as any).musicKitStatus === 'ready'
      ) {
        const musicKitInstance = (window as any).MusicKit.getInstance();
        
        if (musicKitInstance.isAuthorized && musicKitInstance.musicUserToken) {
          setAuthenticated((prev) => [...prev, 'apple-music']);
          clearInterval(checkAuth);
        }
      }
    }, 500);
    
    // Stop checking after 10 seconds
    setTimeout(() => clearInterval(checkAuth), 10000);
  }
}, []);


  useEffect(() => {


    const checkAuth = async () => {
      setTimeout(() => {}, 1000);
      if (
        typeof window !== 'undefined' &&
        (window as any).musicKitStatus === 'ready'
      ) {
        const musicKitInstance = (window as any).MusicKit.getInstance();
        const isAuthorized = musicKitInstance.isAuthorized;
        console.log('isAuthorized', isAuthorized);
        if (isAuthorized) {
          setAuthenticated((prev) => [...prev, 'apple-music']);
        } else {
          setAuthenticated((prev) =>
            prev.filter((item) => item !== 'apple-music')
          );
        }
      }
    };

    checkAuth();

    function handleStatusChange() {
      checkAuth();
    }

    window.addEventListener('musickitloaded', handleStatusChange);

    return () => {
      window.removeEventListener('musickitloaded', handleStatusChange);
    };
  }, []);

  const handleTidalAuth = async () => {
    await tidal.init({
      clientId,
      credentialsStorageKey: 'tidal-credentials',
    });
    const getUrl = await tidal.initializeLogin({
      redirectUri: 'amplitune://oauth2/callback/tidal',
    });
    console.log(getUrl);
    const tidalWindow = window.open(getUrl, '_blank');

    tidal.credentialsProvider;

    listen('tidal-auth-response', (event: any) => {
      console.log(event);
      if (tidalWindow) {
        tidalWindow.close();
      }
      if (event.payload.code) {
        console.log('code', event.payload.code);
        finalizeLogin(event.payload.code);
      } else {
        setError('Failed to authenticate with Tidal');
      }
    });
  };

  function isIOS() {
    return (
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    );
  }

async function handleMusicKitAuth() {
  if (authenticated.includes('apple-music')) {
    if (
      typeof window !== 'undefined' &&
      (window as any).musicKitStatus === 'ready'
    ) {
      const musicKitInstance = (window as any).MusicKit.getInstance();
      musicKitInstance.unauthorize();
      setAuthenticated((prev) =>
        prev.filter((item) => item !== 'apple-music')
      );
    }
    return;
  }
  
  if (
    typeof window !== 'undefined' &&
    (window as any).musicKitStatus === 'ready'
  ) {
    const musicKitInstance = (window as any).MusicKit.getInstance();
    
    try {
      //throw new Error('Simulated failure');
      const userToken = await musicKitInstance.authorize();
      
      
      if (musicKitInstance.musicUserToken) {
        setAuthenticated((prev) => [...prev, 'apple-music']);
        return;
      }
    
      throw new Error('No token received');
      
    } catch (error) {
      console.error('Standard auth failed:', error);
      
      // Fallback for iOS - construct the URL manually
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      
      if (isMobile) {
        constructManualAuthURL(musicKitInstance);
      } else {
        setError('Authentication failed. Please try again.');
      }
    }
  }
}

function constructManualAuthURL(musicKitInstance: any) {
  try {
    const developerToken = musicKitInstance.developerToken;
    
    if (!developerToken) {
      throw new Error('No developer token available');
    }
    

    const authObject = {
      thirdPartyName: window.location.host, 
      thirdPartyToken: developerToken
    };
    
    const authParam = btoa(JSON.stringify(authObject));
    
    const referrer = window.location.href;
    
    const params = new URLSearchParams({
      a: authParam,
      referrer: referrer,
      app: 'music',
      p: 'subscribe'
    });
    
    const authUrl = `https://authorize.music.apple.com/woa?${params.toString()}`;
    
    console.log('Redirecting to:', authUrl);
  
    sessionStorage.setItem('musickit_auth_pending', 'true');
    
    window.location.href = authUrl;
    
  } catch (error) {
    console.error('Failed to construct auth URL:', error);
    setError('Unable to authenticate on this device.');
  }
}

  return (
    <div className='flex h-full w-full items-center justify-center'>
      <Card className=''>
        <div className='flex w-full justify-center pt-6 text-xl'>
          Link Account
        </div>
        {error && (
          <div className='text-md flex w-full justify-center pt-1 text-center text-red-500'>
            {error}
          </div>
        )}
        <div className='flex flex-col justify-between space-y-4 p-12'>
          <Button asChild className='bg-blue-700 px-12 hover:bg-blue-600'>
            <Link href='/servers'>Navidrome</Link>
          </Button>
          <Button className='border-[1px] border-border bg-black text-white hover:bg-zinc-950'>
            <div
              className='flex flex-row items-center justify-center'
              onClick={() => handleTidalAuth()}
            >
              Tidal{' '}
              <div className='ml-2 h-5 w-5'>
                <TidalLogo />
              </div>{' '}
            </div>
          </Button>
          <Button onClick={() => handleMusicKitAuth()} className='bg-red-700'>
            <div className='flex'>
              {' '}
              <AMusicLogo /> {authenticated.includes('apple-music') ? 'Log out' : "Apple Music"}{' '}
            </div>
          </Button>
          <Link href={'/home'}>
            <Button className='bg-muted px-12 hover:bg-gray-400'>Back</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}

function AMusicLogo() {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      aria-label='Apple Music'
      role='img'
      viewBox='0 0 512 512'
    >
      <rect width='100%' height='100%' rx='15%' fill='url(#g)' />
      <linearGradient id='g' x1='.5' y1='.99' x2='.5' y2='.02'>
        <stop offset='0' stop-color='#FA233B' />
        <stop offset='1' stop-color='#FB5C74' />
      </linearGradient>
      <path
        fill='#ffffff'
        d='M199 359V199q0-9 10-11l138-28q11-2 12 10v122q0 15-45 20c-57 9-48 105 30 79 30-11 35-40 35-69V88s0-20-17-15l-170 35s-13 2-13 18v203q0 15-45 20c-57 9-48 105 30 79 30-11 35-40 35-69'
      />
    </svg>
  );
}

function TidalLogo() {
  return (
    <svg
      fill='#ffffff'
      viewBox='0 0 24 24'
      role='img'
      xmlns='http://www.w3.org/2000/svg'
    >
      <title>Tidal icon</title>
      <path d='M12.012 3.992L8.008 7.996 4.004 3.992 0 7.996 4.004 12l4.004-4.004L12.012 12l-4.004 4.004 4.004 4.004 4.004-4.004L12.012 12l4.004-4.004-4.004-4.004zM16.042 7.996l3.979-3.979L24 7.996l-3.979 3.979z' />
    </svg>
  );
}
