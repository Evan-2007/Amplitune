import { getActiveNavidromeAccount } from '@/lib/accounts/store';
import { subsonicBaseUrl } from './navidrome/web/subsonic';

interface navidromeRequest {
  response?: any;
  error: 'not_authenticated' | 'not_found' | 'error' | 'no_server';
}

export const navidromeApi = async (path: string): Promise<navidromeRequest> => {
  const account = getActiveNavidromeAccount();
  if (!account) {
    return { response: null, error: 'no_server' };
  }
  if (!account.token) {
    return { response: null, error: 'not_authenticated' };
  }

  try {
    const response = await fetch(`${account.url}${path}`, {
      headers: {
        'X-Nd-Authorization': `Bearer ${account.token}`,
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
    return { response: null, error: 'error' };
  }
};

export const subsonicURL = async (path: string, params?: string) => {
  try {
    return await subsonicBaseUrl(path, params ?? '');
  } catch {
    return 'error';
  }
};
