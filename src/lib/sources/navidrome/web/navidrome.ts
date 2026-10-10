import { SourceInterface } from '@/lib/sources/source-interface';
//import {getSongData} from './getSong'
import { subsonicBaseUrl } from './subsonic';
import { AudioPlayer } from './audioPlayer';
import { Lyrics, Playlist, PlaylistSummary, ArtistData } from '../../types';
import { getLyrics } from './getLyrics';
import { Song } from '../../types';
import { SearchResult } from '../../types';

export class WebNavidrome implements SourceInterface {
  private audioPlayer: AudioPlayer;
  private currentTrack: string | null = null;
  private currentTrackId: string | null = null;
  private timeUpdateCallback:
    | ((currentTime: number, duration: number) => void)
    | null = null;
  private playPauseCallback:
    | ((playing: 'playing' | 'paused' | 'ended') => void)
    | null = null;

  constructor() {
    this.audioPlayer = new AudioPlayer();
    this.setUpPlayerEvents();
    this.setupPlayPauseEvents();
  }

  public onTimeUpdate(
    callback: (currentTime: number, duration: number) => void
  ): void {
    this.timeUpdateCallback = callback;
  }

  private setUpPlayerEvents() {
    this.audioPlayer.on(
      'timeupdate',
      (data: { currentTime: number; duration: number }) => {
        if (this.timeUpdateCallback) {
          this.timeUpdateCallback(data.currentTime, data.duration);
        }
      }
    );
  }

  public onPlayPause(
    callback: (playing: 'playing' | 'paused' | 'ended') => void
  ): void {
    this.playPauseCallback = callback;
  }

  private setupPlayPauseEvents() {
    this.audioPlayer.on('play', () => {
      if (this.playPauseCallback) {
        this.playPauseCallback('playing');
      }
    });

    this.audioPlayer.on('pause', () => {
      if (this.playPauseCallback) {
        this.playPauseCallback('paused');
      }
    });
    this.audioPlayer.on('ended', () => {
      if (this.playPauseCallback) {
        this.playPauseCallback('ended');
      }
    });
  }

  async play(): Promise<void> {
    await this.audioPlayer.play();
  }
  async pause(): Promise<void> {
    await this.audioPlayer.pause();
  }
  async playSong(trackId: string): Promise<void> {
    const url = await subsonicBaseUrl('/rest/stream', `&id=${trackId}`);
    await this.audioPlayer.load(url, trackId);
    this.currentTrack = trackId;
    this.currentTrackId = trackId;
    try {
      await this.audioPlayer.play();
    } catch (error) {
      // Autoplay being blocked, or this load being superseded by the next
      // track, is not a playback failure
      const name = (error as DOMException)?.name;
      if (name !== 'NotAllowedError' && name !== 'AbortError') throw error;
    }
  }
  getAllPlaylists(): void {
    throw new Error('Method not implemented.');
  }
  async getLyrics(trackId: string): Promise<Lyrics> {
    if (!this.currentTrackId) {
      return {
        error: 'No track playing',
        source: 'navidrome',
      };
    }
    return await getLyrics(trackId);
  }
  getQueue(): void {
    throw new Error('Method not implemented.');
  }
  async seek(time: number): Promise<void> {
    this.audioPlayer.seek(time);
  }

  setVolume(volume: number): void {
    this.audioPlayer.setVolume(volume);
  }

  private async toSong(song: any): Promise<Song> {
    return {
      id: song.id,
      title: song.title,
      artist: song.artist,
      album: song.album,
      albumId: song.albumId,
      // Subsonic reports seconds
      duration: (song.duration ?? 0) * 1000,
      source: 'navidrome',
      availableSources: ['navidrome'],
      imageUrl: song.coverArt
        ? await subsonicBaseUrl(
            '/rest/getCoverArt',
            `&id=${encodeURIComponent(song.coverArt)}`
          )
        : '',
      releaseDate: song.year ? String(song.year) : '',
    };
  }

  async getSongData(trackId: string): Promise<Song> {
    const url = await subsonicBaseUrl(
      '/rest/getSong',
      `&id=${encodeURIComponent(trackId)}`
    );
    const data = await (await fetch(url)).json();
    const song = data['subsonic-response']?.song;
    if (!song) {
      throw new Error(`Song ${trackId} not found`);
    }
    return this.toSong(song);
  }

  async getAlbumData(
    albumId: string,
    source: string
  ): Promise<import('../../types').AlbumData> {
    return {
      id: albumId,
      source: source,
      releaseDate: '',
      artWork: { url: '' },
      name: 'Album Name',
      artist: 'Album Artist',
      isSingle: false,
    };
  }

  async getArtistById(artistId: string): Promise<ArtistData> {
    throw new Error('Method not implemented.');
  }

  async getPlaylists(): Promise<PlaylistSummary[]> {
    return [];
  }
  async getPlaylistById(playlistId: string): Promise<Playlist> {
    throw new Error('Method not implemented.');
  }

  async setRepeat(repeat: boolean): Promise<void> {
    if (repeat) {
      this.audioPlayer.setLoop(true);
    } else {
      this.audioPlayer.setLoop(false);
    }
  }

  async search(query: string): Promise<SearchResult> {
    const url = await subsonicBaseUrl(
      '/rest/search3',
      `&query=${encodeURIComponent(query)}`
    );

    const response = await fetch(url);

    const data = await response.json();

    // Navidrome omits `song` entirely when nothing matches
    const songs: Song[] = await Promise.all(
      (data['subsonic-response']?.searchResult3?.song ?? []).map((song: any) =>
        this.toSong(song)
      )
    );

    return {
      songs,
      //videos: [],
      albums: [],
      artists: [],
    };
  }
}
