export type SourceId = 'navidrome' | 'musicKit' | 'tidal';

export const DEFAULT_SOURCE_PRIORITY: SourceId[] = [
  'navidrome',
  'tidal',
  'musicKit',
];

/**
 * A Navidrome server login. The password is never stored; `salt`/`hash` are
 * the Subsonic token pair and `token` is the Navidrome native-API JWT.
 */
export interface NavidromeAccount {
  id: string;
  provider: 'navidrome';
  label: string;
  url: string;
  username: string;
  salt: string;
  hash: string;
  token: string;
}

export type Account = NavidromeAccount;
