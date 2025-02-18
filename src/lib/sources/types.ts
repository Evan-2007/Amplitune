import { TidalAuthParams, NavidromeAuthParams } from './authParams';

export interface NormalLyrics {
  synced: boolean;
  lines: {
    value: string;
    start?: number; // time in milliseconds
  }[];
  source: string;
  type?: 'synced' | 'unsynced' | 'instrumental';
  error?: string;
}

export interface ErrorLyrics {
  error: string;
  source: string;
}

export type Lyrics = ErrorLyrics | NormalLyrics;

export interface song {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  quality: string;
  source: string;
  availableSources: string[];
  imageUrl: string;
  releaseDate: string;
}

export interface albums {
  id: string;
  title: string;
  artist: string;
  imageUrl: string;
  releaseDate: string;
  source: string;
}

export interface artists {
  id: string;
  name: string;
  imageUrl: string;
  source: string;
}

export interface searchResult {
  songs: song[];
  albums: albums[];
  artists: artists[];
}

export interface sources {
  tidal: {
    status: boolean;
  };
  navidrome: {
    status: boolean;
    hash: string;
    id: string;
    salt: string;
    token: string;
    url: string;
    username: string;
    type: 'navidrome';
  };
}
