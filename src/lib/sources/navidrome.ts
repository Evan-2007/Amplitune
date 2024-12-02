import { useRouter } from 'next/router';
import { CrossPlatformStorage } from '@/lib/storage/cross-platform-storage';

interface navidromeRequest {
  response?: any;
  error: 'not_authenticated' | 'not_found' | 'error' | 'no_server';
}

export const navidromeApi = async (path: string): Promise<navidromeRequest> => {
  const storage = new CrossPlatformStorage();
  const activeServer = await storage.getItem('activeServer');
  if (!activeServer) {
    return { response: null, error: 'no_server' };
  }
  const parsedServer = await JSON.parse(activeServer);
  if (!parsedServer || parsedServer.token === undefined) {
    return { response: null, error: 'not_authenticated' };
  }

  const url = `${parsedServer.url}${path}`;
  try {
    const response = await fetch(url, {
      headers: {
        'X-Nd-Authorization': `Bearer ${parsedServer.token}`,
      },
    });
    if (response.status === 401) {
      return { response: null, error: 'not_authenticated' };
    }
    if (response.status === 404) {
      return { response: null, error: 'not_found' };
    }
    if (response.ok) {
      const data = await response.json();
      return { response: data, error: 'error' };
    }
    return { response: null, error: 'error' };
  } catch (err) {
    return { response: null, error: 'not_authenticated' };
  }
};

interface server {
  url: string;
  username: string;
  password: string;
  id: string;
  salt: string;
  hash: string;
  type: 'navidrome';
}

export const subsonicURL = async (path: string, params?: string) => {
  const storage = new CrossPlatformStorage();
  const activeServer = await storage.getItem('activeServer');
  if (!activeServer) {
    return 'error';
  }
  const parsedServer = await JSON.parse(activeServer);
  console.log(parsedServer);
  const url = `${parsedServer.url}${path}?u=${parsedServer.username}&t=${parsedServer.hash}&s=${parsedServer.salt}&v=1.13.0&c=myapp&f=json${params}`;
  return url;
};
