import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { DEFAULT_SOURCE_PRIORITY, NavidromeAccount, SourceId } from './types';

export interface AccountsStore {
  accounts: NavidromeAccount[];
  /** Only one Navidrome server feeds the `navidrome` source at a time. */
  activeNavidromeId: string | null;
  sourcePriority: SourceId[];
  disabledSources: SourceId[];

  /** Adds the account, or replaces the existing login for the same server/user. */
  saveNavidromeAccount: (
    account: Omit<NavidromeAccount, 'id' | 'provider' | 'label'> & {
      label?: string;
    }
  ) => NavidromeAccount;
  renameAccount: (id: string, label: string) => void;
  removeAccount: (id: string) => void;
  setActiveNavidrome: (id: string) => void;
  setSourcePriority: (priority: SourceId[]) => void;
  setSourceEnabled: (source: SourceId, enabled: boolean) => void;
}

export function normalizeServerUrl(url: string): string {
  return url.trim().replace(/\/+$/, '');
}

function defaultLabel(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

export const useAccountsStore = create<AccountsStore>()(
  persist(
    (set, get) => ({
      accounts: [],
      activeNavidromeId: null,
      sourcePriority: DEFAULT_SOURCE_PRIORITY,
      disabledSources: [],

      saveNavidromeAccount: (input) => {
        const url = normalizeServerUrl(input.url);
        const existing = get().accounts.find(
          (a) => a.url === url && a.username === input.username
        );
        const account: NavidromeAccount = {
          ...input,
          url,
          provider: 'navidrome',
          id: existing?.id ?? crypto.randomUUID(),
          label: input.label || existing?.label || defaultLabel(url),
        };
        set((state) => ({
          accounts: existing
            ? state.accounts.map((a) => (a.id === existing.id ? account : a))
            : [...state.accounts, account],
          activeNavidromeId: account.id,
        }));
        return account;
      },

      renameAccount: (id, label) =>
        set((state) => ({
          accounts: state.accounts.map((a) =>
            a.id === id ? { ...a, label: label.trim() || a.label } : a
          ),
        })),

      removeAccount: (id) =>
        set((state) => {
          const accounts = state.accounts.filter((a) => a.id !== id);
          return {
            accounts,
            // Only move the active server when the active one was removed
            activeNavidromeId:
              state.activeNavidromeId === id
                ? (accounts[0]?.id ?? null)
                : state.activeNavidromeId,
          };
        }),

      setActiveNavidrome: (id) =>
        set((state) =>
          state.accounts.some((a) => a.id === id)
            ? { activeNavidromeId: id }
            : {}
        ),

      setSourcePriority: (sourcePriority) => set({ sourcePriority }),

      setSourceEnabled: (source, enabled) =>
        set((state) => ({
          disabledSources: enabled
            ? state.disabledSources.filter((s) => s !== source)
            : Array.from(new Set([...state.disabledSources, source])),
        })),
    }),
    {
      name: 'accounts',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export function getActiveNavidromeAccount(): NavidromeAccount | null {
  const { accounts, activeNavidromeId } = useAccountsStore.getState();
  return accounts.find((a) => a.id === activeNavidromeId) ?? null;
}

/**
 * One-time import of the old `servers` / `activeServer` keys. Passwords that
 * older builds saved are dropped rather than carried over.
 */
function migrateLegacyServers() {
  const rawServers = localStorage.getItem('servers');
  const rawActive = localStorage.getItem('activeServer');

  if (useAccountsStore.getState().accounts.length === 0 && rawServers) {
    try {
      const servers: any[] = JSON.parse(rawServers) ?? [];
      let active: any = null;
      try {
        active = rawActive ? JSON.parse(rawActive) : null;
      } catch {
        // older builds could store the literal string "undefined" here
      }
      const { saveNavidromeAccount, setActiveNavidrome } =
        useAccountsStore.getState();
      let activeId: string | null = null;
      for (const server of servers) {
        if (!server?.url || !server?.username || !server?.hash) continue;
        const saved = saveNavidromeAccount({
          url: server.url,
          username: server.username,
          salt: server.salt,
          hash: server.hash,
          token: server.token,
        });
        if (
          active &&
          normalizeServerUrl(active.url ?? '') === saved.url &&
          active.username === saved.username
        ) {
          activeId = saved.id;
        }
      }
      const first = useAccountsStore.getState().accounts[0];
      if (activeId ?? first) setActiveNavidrome(activeId ?? first.id);
    } catch (error) {
      console.error('Could not migrate saved servers', error);
      return;
    }
  }

  for (const key of [
    'servers',
    'activeServer',
    'username',
    'password',
    'salt',
  ]) {
    localStorage.removeItem(key);
  }
}

if (typeof window !== 'undefined') {
  migrateLegacyServers();
}
