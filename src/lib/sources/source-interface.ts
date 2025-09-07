import {
  Lyrics,
  song,
  searchResult,
  AlbumData,
  Playlists,
  Playlist,
} from './types';
import { ArtistResponse } from '@/types/artistResponse';

export interface SourceInterface {
  play(): Promise<void>;
  pause(): Promise<void>;
  playSong(trackId: string, sourceId?: string): void;
  getAllPlaylists(): void;
  getQueue(): void;
  getLyrics(trackId: string): Promise<Lyrics>;
  onTimeUpdate(callback: (currentTime: number, duration: number) => void): void;
  onPlayPause(
    callback: (playing: 'playing' | 'paused' | 'ended') => void
  ): void;
  seek(time: number): Promise<void>;
  setVolume(volume: number): void;
  getSongData(trackId: string): Promise<song>;
  search(query: string): Promise<searchResult>;
  setRepeat(repeat: boolean): Promise<void>;
  getAlbumData(albumId: string, source: string): Promise<AlbumData>;
  getPlaylists(): Promise<Playlists[]>;
  getPlaylistById(playlistId: string): Promise<Playlist>;
  getArtistById(artistId: string): Promise<ArtistResponse>;
}
