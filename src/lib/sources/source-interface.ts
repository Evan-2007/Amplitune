import { Lyrics, song, searchResult } from './types';


export interface SourceInterface {
    play(): void;
    pause(): void;
    playSong(trackId: string, sourceId?: string,): void;
    getAllPlaylists(): void;
    getQueue(): void;
    getLyrics(trackId: string): Promise<Lyrics>;
    onTimeUpdate(callback: (currentTime: number, duration: number) => void): void;
    onPlayPause(callback: (playing: 'playing' | 'paused' | 'ended') => void): void;
    seek(time: number): Promise<void>;
    setVolume(volume: number): void;
    getSongData(trackId: string): Promise<song>;
    search(query: string): Promise<searchResult>;
    setRepeat(repeat: boolean): Promise<void>;
}