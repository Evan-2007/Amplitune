import { TidalAuthParams, NavidromeAuthParams } from "./authParams";

export interface SyncedLyrics {
    synced: true;
    lines: {
        value: string;
        start: number; // time in milliseconds
    }[];
    source: string;
    type: 'synced' | 'unsynced' | 'instrumental';
}

export interface ErrorLyrics {
    error: string;
    source: string;
}

interface NormalLyrics {
    synced: false;
    lines: {
        value: string;
    } [];
    source: string;
}

export type Lyrics = SyncedLyrics | ErrorLyrics | NormalLyrics;




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
    songs: song [];
    albums: albums[];
    artists: artists[];
}


export interface sources {
    tidal: {
        status: boolean;
    }
    navidrome: {
        status: boolean;
        hash: string;
        id: string;
        salt: string;
        token: string;
        url: string;
        username: string;
        type: 'navidrome';
    }
}

