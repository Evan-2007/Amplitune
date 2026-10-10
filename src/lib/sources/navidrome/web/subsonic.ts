import { getActiveNavidromeAccount } from '@/lib/accounts/store';
import { NavidromeAccount } from '@/lib/accounts/types';

const AUTH_PARAMS = ['u', 't', 's'];

function authQuery(account: NavidromeAccount): string {
  return `u=${encodeURIComponent(account.username)}&t=${account.hash}&s=${account.salt}&v=1.13.0&c=amplitune&f=json`;
}

export const subsonicBaseUrl = async (
  path: string,
  params: string = ''
): Promise<string> => {
  const account = getActiveNavidromeAccount();
  if (!account) {
    throw new Error('No active server');
  }
  return `${account.url}${path}?${authQuery(account)}${params}`;
};

/**
 * Removes the Subsonic credentials from a URL so it can be persisted or put
 * in a route. Non-Subsonic URLs are returned unchanged.
 */
export function stripSubsonicAuth(url: string): string {
  if (!url || !url.includes('/rest/')) return url;
  try {
    const parsed = new URL(url);
    AUTH_PARAMS.forEach((param) => parsed.searchParams.delete(param));
    return parsed.toString();
  } catch {
    return url;
  }
}

/** Re-adds credentials to a URL that went through `stripSubsonicAuth`. */
export function signSubsonicUrl(url: string): string {
  if (!url || !url.includes('/rest/')) return url;
  const account = getActiveNavidromeAccount();
  if (!account || !url.startsWith(`${account.url}/rest/`)) return url;
  try {
    const parsed = new URL(url);
    if (parsed.searchParams.has('t')) return url;
    parsed.searchParams.set('u', account.username);
    parsed.searchParams.set('t', account.hash);
    parsed.searchParams.set('s', account.salt);
    return parsed.toString();
  } catch {
    return url;
  }
}

export type NavidromeStatus = 'connected' | 'unauthorized' | 'unreachable';

export async function pingNavidrome(
  account: NavidromeAccount
): Promise<NavidromeStatus> {
  try {
    const response = await fetch(
      `${account.url}/rest/ping?${authQuery(account)}`
    );
    const data = await response.json();
    return data['subsonic-response']?.status === 'ok'
      ? 'connected'
      : 'unauthorized';
  } catch {
    return 'unreachable';
  }
}
