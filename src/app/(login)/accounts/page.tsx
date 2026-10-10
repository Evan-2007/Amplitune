'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import * as tidal from '@tidal-music/auth';
import { listen } from '@tauri-apps/api/event';
import { Check, ChevronDown, ChevronUp, Pencil, Plus, X } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useAccountsStore } from '@/lib/accounts/store';
import { NavidromeAccount, SourceId } from '@/lib/accounts/types';
import {
  NavidromeStatus,
  pingNavidrome,
} from '@/lib/sources/navidrome/web/subsonic';
import AMIcon from '@/assets/apple-music_dark.svg';
import NavidromeIcon from '@/assets/navidrome_dark.svg';

const TIDAL_CLIENT_ID = 'MFzBCbOcFf8ObmHD';
const MEDIA_USER_TOKEN_KEY = 'music.q222xnn59b.media-user-token';

const SOURCE_NAMES: Record<SourceId, string> = {
  navidrome: 'Navidrome',
  musicKit: 'Apple Music',
  tidal: 'Tidal',
};

export default function Accounts() {
  // The account store is read from localStorage, which the prerendered HTML
  // knows nothing about, so the lists only render once mounted.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className='flex h-screen w-full justify-center overflow-y-auto p-6'>
      <div className='flex w-full max-w-xl flex-col space-y-6'>
        <div className='flex items-center justify-between'>
          <h1 className='text-2xl font-semibold'>Accounts</h1>
          <Button asChild variant='ghost'>
            <Link href='/home'>Done</Link>
          </Button>
        </div>
        {mounted && (
          <>
            <NavidromeSection />
            <AppleMusicSection />
            <TidalSection />
            <PrioritySection />
          </>
        )}
      </div>
    </div>
  );
}

function StatusDot({ tone, label }: { tone: Tone; label: string }) {
  return (
    <span className='flex items-center space-x-2 text-sm text-muted-foreground'>
      <span
        className={cn('h-2 w-2 rounded-full', {
          'bg-green-500': tone === 'good',
          'bg-red-500': tone === 'bad',
          'bg-yellow-500': tone === 'warn',
          'bg-muted-foreground/50': tone === 'idle',
        })}
      />
      <span>{label}</span>
    </span>
  );
}

type Tone = 'good' | 'bad' | 'warn' | 'idle';

const NAVIDROME_STATUS: Record<NavidromeStatus, { tone: Tone; label: string }> =
  {
    connected: { tone: 'good', label: 'Connected' },
    unauthorized: { tone: 'bad', label: 'Sign in again' },
    unreachable: { tone: 'warn', label: 'Unreachable' },
  };

function NavidromeSection() {
  const accounts = useAccountsStore((state) => state.accounts);
  const activeId = useAccountsStore((state) => state.activeNavidromeId);
  const [statuses, setStatuses] = useState<Record<string, NavidromeStatus>>({});

  useEffect(() => {
    let cancelled = false;
    accounts.forEach(async (account) => {
      const status = await pingNavidrome(account);
      if (!cancelled) {
        setStatuses((prev) => ({ ...prev, [account.id]: status }));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [accounts]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center space-x-2 text-lg'>
          <NavidromeIcon className='h-5 w-5' />
          <span>Navidrome</span>
        </CardTitle>
        <CardDescription>
          Your own servers. One server is used at a time.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-3'>
        {accounts.length === 0 && (
          <p className='text-sm text-muted-foreground'>No servers added yet.</p>
        )}
        {accounts.map((account) => (
          <NavidromeRow
            key={account.id}
            account={account}
            active={account.id === activeId}
            status={statuses[account.id]}
          />
        ))}
        <Button asChild variant='outline' className='w-full'>
          <Link href='/login'>
            <Plus className='mr-2 h-4 w-4' /> Add server
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function NavidromeRow({
  account,
  active,
  status,
}: {
  account: NavidromeAccount;
  active: boolean;
  status?: NavidromeStatus;
}) {
  const setActive = useAccountsStore((state) => state.setActiveNavidrome);
  const removeAccount = useAccountsStore((state) => state.removeAccount);
  const renameAccount = useAccountsStore((state) => state.renameAccount);
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(account.label);
  const [confirmingRemove, setConfirmingRemove] = useState(false);

  const saveLabel = () => {
    renameAccount(account.id, label);
    setEditing(false);
  };

  return (
    <div
      className={cn(
        'flex flex-col space-y-3 rounded-md border border-border p-3',
        active && 'border-primary'
      )}
    >
      <div className='flex items-start justify-between space-x-3'>
        <div className='min-w-0 flex-1'>
          {editing ? (
            <form
              className='flex items-center space-x-2'
              onSubmit={(e) => {
                e.preventDefault();
                saveLabel();
              }}
            >
              <Input
                autoFocus
                className='h-8'
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
              <Button type='submit' size='icon' variant='ghost'>
                <Check className='h-4 w-4' />
              </Button>
            </form>
          ) : (
            <div className='flex items-center space-x-2'>
              <p className='truncate font-medium'>{account.label}</p>
              <button
                aria-label='Rename'
                className='text-muted-foreground hover:text-foreground'
                onClick={() => {
                  setLabel(account.label);
                  setEditing(true);
                }}
              >
                <Pencil className='h-3.5 w-3.5' />
              </button>
            </div>
          )}
          <p className='truncate text-sm text-muted-foreground'>
            {account.username} · {account.url}
          </p>
        </div>
        {status ? (
          <StatusDot {...NAVIDROME_STATUS[status]} />
        ) : (
          <StatusDot tone='idle' label='Checking' />
        )}
      </div>
      <div className='flex items-center justify-between'>
        {active ? (
          <span className='text-sm font-medium text-primary'>In use</span>
        ) : (
          <Button
            size='sm'
            variant='secondary'
            onClick={() => setActive(account.id)}
          >
            Use this server
          </Button>
        )}
        <div className='flex items-center space-x-2'>
          {status === 'unauthorized' && (
            <Button asChild size='sm' variant='outline'>
              <Link href='/login'>Sign in again</Link>
            </Button>
          )}
          {confirmingRemove ? (
            <>
              <Button
                size='sm'
                variant='destructive'
                onClick={() => removeAccount(account.id)}
              >
                Remove
              </Button>
              <Button
                size='sm'
                variant='ghost'
                onClick={() => setConfirmingRemove(false)}
              >
                Cancel
              </Button>
            </>
          ) : (
            <Button
              size='sm'
              variant='ghost'
              onClick={() => setConfirmingRemove(true)}
            >
              Remove
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

type AppleStatus = 'loading' | 'signedOut' | 'signedIn';

function AppleMusicSection() {
  const [status, setStatus] = useState<AppleStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const [showManual, setShowManual] = useState(false);
  const [manualToken, setManualToken] = useState('');
  const [manualSaved, setManualSaved] = useState(false);

  const getInstance = () =>
    typeof window !== 'undefined' && window.musicKitStatus === 'ready'
      ? window.MusicKit.getInstance()
      : null;

  const checkAuth = useCallback(() => {
    const instance = getInstance();
    if (!instance) return;
    setStatus(instance.isAuthorized ? 'signedIn' : 'signedOut');
  }, []);

  useEffect(() => {
    sessionStorage.removeItem('musickit_auth_pending');
    let instance: any = null;

    const attach = () => {
      instance = getInstance();
      if (!instance) return;
      checkAuth();
      instance.addEventListener('authorizationStatusDidChange', checkAuth);
    };

    attach();
    window.addEventListener('musickitready', attach);
    return () => {
      window.removeEventListener('musickitready', attach);
      instance?.removeEventListener('authorizationStatusDidChange', checkAuth);
    };
  }, [checkAuth]);

  async function signIn() {
    const instance = getInstance();
    if (!instance) return;
    setError(null);
    try {
      await instance.authorize();
      if (!instance.musicUserToken) throw new Error('No token received');
      checkAuth();
    } catch (authError) {
      console.error('Standard auth failed:', authError);
      // The popup flow does not work everywhere (notably iOS webviews), so
      // fall back to sending the whole window through Apple's sign-in page
      redirectToAppleAuth(instance);
    }
  }

  function redirectToAppleAuth(instance: any) {
    const developerToken = instance.developerToken;
    if (!developerToken) {
      setError('Unable to sign in to Apple Music on this device.');
      return;
    }
    const params = new URLSearchParams({
      a: btoa(
        JSON.stringify({
          thirdPartyName: window.location.host,
          thirdPartyToken: developerToken,
        })
      ),
      referrer: window.location.href,
      app: 'music',
      p: 'subscribe',
    });
    sessionStorage.setItem('musickit_auth_pending', 'true');
    window.location.href = `https://authorize.music.apple.com/woa?${params.toString()}`;
  }

  async function signOut() {
    const instance = getInstance();
    if (!instance) return;
    await instance.unauthorize();
    checkAuth();
  }

  function saveManualToken(event: React.FormEvent) {
    event.preventDefault();
    const token = manualToken.trim();
    if (!token) return;
    document.cookie = `${MEDIA_USER_TOKEN_KEY}=${encodeURIComponent(token)}; path=/; SameSite=Lax`;
    localStorage.setItem(MEDIA_USER_TOKEN_KEY, token);
    setManualToken('');
    setManualSaved(true);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center justify-between text-lg'>
          <span className='flex items-center space-x-2'>
            <AMIcon className='h-5 w-5' />
            <span>Apple Music</span>
          </span>
          <StatusDot
            tone={
              status === 'signedIn'
                ? 'good'
                : status === 'loading'
                  ? 'idle'
                  : 'warn'
            }
            label={
              status === 'signedIn'
                ? 'Signed in'
                : status === 'loading'
                  ? 'Loading'
                  : 'Not signed in'
            }
          />
        </CardTitle>
        <CardDescription>
          Search works without signing in. Playback and your library need an
          Apple Music subscription.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-3'>
        {error && <p className='text-sm text-red-500'>{error}</p>}
        {status === 'signedIn' ? (
          <Button variant='outline' className='w-full' onClick={signOut}>
            Sign out
          </Button>
        ) : (
          <Button
            className='w-full'
            disabled={status === 'loading'}
            onClick={signIn}
          >
            Sign in with Apple Music
          </Button>
        )}
        <button
          className='text-sm text-muted-foreground hover:underline'
          onClick={() => setShowManual((open) => !open)}
        >
          Enter a media-user-token manually
        </button>
        {showManual && (
          <form className='flex space-x-2' onSubmit={saveManualToken}>
            <Input
              placeholder='media-user-token'
              value={manualToken}
              onChange={(e) => setManualToken(e.target.value)}
            />
            <Button type='submit' variant='secondary'>
              Save
            </Button>
          </form>
        )}
        {manualSaved && (
          <p className='text-sm text-muted-foreground'>
            Token saved. Reload the app for it to take effect.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function TidalSection() {
  const [error, setError] = useState<string | null>(null);

  const handleTidalAuth = async () => {
    setError(null);
    try {
      await tidal.init({
        clientId: TIDAL_CLIENT_ID,
        credentialsStorageKey: 'tidal-credentials',
      });
      const loginUrl = await tidal.initializeLogin({
        redirectUri: 'amplitune://oauth2/callback/tidal',
      });
      const tidalWindow = window.open(loginUrl, '_blank');

      const unlisten = await listen('tidal-auth-response', async (event: any) => {
        unlisten();
        tidalWindow?.close();
        if (!event.payload.code) {
          setError('Failed to authenticate with Tidal');
          return;
        }
        try {
          await tidal.finalizeLogin(`?code=${event.payload.code}`);
        } catch {
          setError('Failed to authenticate with Tidal');
        }
      });
    } catch (authError) {
      console.error('Tidal auth failed:', authError);
      setError('Failed to authenticate with Tidal');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center space-x-2 text-lg'>
          <span className='h-5 w-5'>
            <TidalLogo />
          </span>
          <span>Tidal</span>
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-3'>
        {error && <p className='text-sm text-red-500'>{error}</p>}
        <Button variant='outline' className='w-full' onClick={handleTidalAuth}>
          Sign in with Tidal
        </Button>
      </CardContent>
    </Card>
  );
}

function PrioritySection() {
  const priority = useAccountsStore((state) => state.sourcePriority);
  const disabled = useAccountsStore((state) => state.disabledSources);
  const setPriority = useAccountsStore((state) => state.setSourcePriority);
  const setEnabled = useAccountsStore((state) => state.setSourceEnabled);

  const move = (index: number, offset: number) => {
    const next = [...priority];
    const target = index + offset;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setPriority(next);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-lg'>Playback priority</CardTitle>
        <CardDescription>
          When a song is available from more than one source, it plays from the
          highest one in this list.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-2'>
        {priority.map((source, index) => {
          const enabled = !disabled.includes(source);
          return (
            <div
              key={source}
              className='flex items-center justify-between rounded-md border border-border p-2 pl-3'
            >
              <span className={cn(!enabled && 'text-muted-foreground')}>
                {index + 1}. {SOURCE_NAMES[source]}
              </span>
              <div className='flex items-center space-x-1'>
                {source !== 'tidal' && (
                  <Button
                    size='sm'
                    variant='ghost'
                    onClick={() => setEnabled(source, !enabled)}
                  >
                    {enabled ? (
                      <>
                        <Check className='mr-1 h-4 w-4' /> Enabled
                      </>
                    ) : (
                      <>
                        <X className='mr-1 h-4 w-4' /> Disabled
                      </>
                    )}
                  </Button>
                )}
                <Button
                  aria-label='Move up'
                  size='icon'
                  variant='ghost'
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                >
                  <ChevronUp className='h-4 w-4' />
                </Button>
                <Button
                  aria-label='Move down'
                  size='icon'
                  variant='ghost'
                  disabled={index === priority.length - 1}
                  onClick={() => move(index, 1)}
                >
                  <ChevronDown className='h-4 w-4' />
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function TidalLogo() {
  return (
    <svg
      fill='currentColor'
      viewBox='0 0 24 24'
      role='img'
      xmlns='http://www.w3.org/2000/svg'
    >
      <title>Tidal icon</title>
      <path d='M12.012 3.992L8.008 7.996 4.004 3.992 0 7.996 4.004 12l4.004-4.004L12.012 12l-4.004 4.004 4.004 4.004 4.004-4.004L12.012 12l4.004-4.004-4.004-4.004zM16.042 7.996l3.979-3.979L24 7.996l-3.979 3.979z' />
    </svg>
  );
}
