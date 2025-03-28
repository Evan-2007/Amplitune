import { SourceInterface } from '@/lib/sources/source-interface';
import {
  song,
  Lyrics,
  searchResult as SearchResult,
  albums as Album,
  AlbumData,
} from '@/lib/sources/types';
import { jwtDecode } from 'jwt-decode';

export class musicKit implements SourceInterface {
  private musicKitInstance: any = null;
  private initializationPromise: Promise<void> | null = null;
  private timeUpdateCallback:
    | ((currentTime: number, duration: number) => void)
    | null = null;
  private playPauseCallback:
    | ((playing: 'playing' | 'paused' | 'ended') => void)
    | null = null;

  private privilagedDeveloperToken: null | string = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializationPromise = this.initialize();
    }

    this.setUpPlayerEvents();
    this.setupPlayPauseEvents();
  }

  private async initialize(): Promise<void> {
    await this.checkMusicKit();
  }

  private async checkMusicKit(): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeoutDuration = 10000;
      const retryInterval = 100;
      const startTime = Date.now();

      const checkStatus = () => {
        if (
          typeof window !== 'undefined' &&
          (window as any).musicKitStatus === 'ready'
        ) {
          this.musicKitInstance = (window as any).MusicKit.getInstance();
          console.log('MusicKit configured');
          resolve();
        } else if (Date.now() - startTime >= timeoutDuration) {
          console.error('MusicKit not configured');
          reject(new Error('MusicKit not configured within timeout'));
        } else {
          setTimeout(checkStatus, retryInterval);
        }
      };

      checkStatus();
    });
  }

  async play(): Promise<void> {
    await this.initializationPromise;

    await this.musicKitInstance.play();
  }
  async pause(): Promise<void> {
    await this.initializationPromise;
    console.log('Pausing song using web');
    if (!this.musicKitInstance) {
      console.error('MusicKit not initialized');
      return;
    }

    this.musicKitInstance.pause();
  }
  async playSong(trackId: string): Promise<void> {
    await this.initializationPromise;
    console.log('Playing song using web', trackId);
    if (!this.musicKitInstance) {
      console.error('MusicKit not initialized');
      return;
    }

    await this.musicKitInstance.setQueue({
      song: trackId,
    });

    // await this.musicKitInstance.play();
  }
  getAllPlaylists(): void {
    throw new Error('Method not implemented.');
  }
  getQueue(): void {
    throw new Error('Method not implemented.');
  }
  getLyrics(): Promise<Lyrics> {
    return {
      //@ts-ignore
      error: 'No lyrics found',
      source: 'musicKit',
    };
  }

  public onTimeUpdate(
    callback: (currentTime: number, duration: number) => void
  ): void {
    this.timeUpdateCallback = callback;
  }

  private async setUpPlayerEvents() {
    await this.initializationPromise;
    this.musicKitInstance.addEventListener(
      'playbackTimeDidChange',
      (data: {
        currentPlaybackDuration: number;
        currentPlaybackTime: number;
        curentPlaybackTimeRemaining: number;
      }) => {
        if (this.timeUpdateCallback) {
          this.timeUpdateCallback(
            data.currentPlaybackTime,
            data.currentPlaybackDuration
          );
        }
      }
    );
  }

  public onPlayPause(
    callback: (playing: 'playing' | 'paused' | 'ended') => void
  ): void {
    this.playPauseCallback = callback;
  }

  private async setupPlayPauseEvents() {
    await this.initializationPromise;
    this.musicKitInstance.addEventListener(
      'playbackStateDidChange',
      (data: { state: number }) => {
        console.log('Play state change', data);
        if (this.playPauseCallback) {
          if (data.state === 2) {
            this.playPauseCallback('playing');
          } else if (data.state === 3) {
            this.playPauseCallback('paused');
          } else if (data.state === 10) {
            this.playPauseCallback('ended');
          } else {
            //console.log('No callback set');
          }
        }
      }
    );
  }
  async seek(position: number): Promise<void> {
    await this.initializationPromise;
    if (!this.musicKitInstance) {
      console.error('MusicKit not initialized');
      return;
    }

    this.musicKitInstance.seekToTime(position);
  }

  async setRepeat(repeat: boolean): Promise<void> {
    await this.initializationPromise;
    if (!this.musicKitInstance) {
      console.error('MusicKit not initialized');
      return;
    }

    this.musicKitInstance.repeatMode = repeat ? 1 : 0;
  }
  async setVolume(volume: number): Promise<void> {
    await this.initializationPromise;
    if (!this.musicKitInstance) {
      console.error('MusicKit not initialized');
      return;
    }

    this.musicKitInstance.volume = volume;
  }
  getSongData(): Promise<song> {
    throw new Error('Method not implemented.');
  }

  async getAlbumData(albumId: string, source: string): Promise<AlbumData> {
    await this.initializationPromise;

    const result = await this.musicKitInstance.api.music(
      `/v1/catalog/{{storefrontId}}/albums/${albumId}`
    );
    if (!result || !result.data) {
      console.error('Failed to fetch album data');
      return {
        id: albumId,
        source: source,
        releaseDate: '',
        artWork: {
          url: '',
          width: 0,
          height: 0,
          textColor1: '',
          textColor2: '',
          textColor3: '',
          textColor4: '',
          bgColor: '',
          hasP3: false,
        },
        name: 'Album Name',
        artist: 'Album Artist',
        isSingle: false,
      };
    }
    const albumData = await result.data.data[0];
    console.log('Album data fetched from MusicKit:', albumData);

    let formatedTracks: song[] = [];

    if (albumData.relationships && albumData.relationships.tracks) {
      formatedTracks = albumData.relationships.tracks.data.map(
        (track: any) => ({
          id: track.id,
          title: track.attributes.name,
          artist: track.attributes.artistName,
          album: track.attributes.albumName || albumData.attributes.name,
          duration: track.attributes.durationInMillis || 0,
          //       quality: track.attributes.audioTraits[0],
          source: 'musicKit',
          availableSources: ['musicKit'],
          imageUrl: (albumData.attributes.artwork.url ?? '').replace(
            '{w}x{h}',
            '900x900'
          ),
          releaseDate: albumData.attributes.releaseDate ?? '',
        })
      );
    }

    return {
      id: albumData.id,
      source: 'musicKit',
      releaseDate: albumData.attributes.releaseDate || '',
      artWork: {
        type: 'apple',
        url:
          albumData.attributes.artwork.url.replace('{w}x{h}', '900x900') || '',
        width: albumData.attributes.artwork.width || 0,
        height: albumData.attributes.artwork.height || 0,
        textColor1: albumData.attributes.artwork.textColor1 || '',
        textColor2: albumData.attributes.artwork.textColor2 || '',
        textColor3: albumData.attributes.artwork.textColor3 || '',
        textColor4: albumData.attributes.artwork.textColor4 || '',
        bgColor: albumData.attributes.artwork.bgColor || '',
        hasP3: albumData.attributes.artwork.hasP3 || false,
      },
      name: albumData.attributes.name || 'Album Name',
      artist: albumData.attributes.artistName || 'Album Artist',
      isSingle: albumData.attributes.isSingle || false,
      editorialNotes: albumData.attributes.editorialNotes,
      attributes: [],
      gnres: albumData.attributes.genreNames || [],
      tracks: formatedTracks,
    };
  }

  async search(query: string): Promise<SearchResult> {
    await this.initializationPromise;
    if (!this.musicKitInstance) {
      console.error('MusicKit not initialized');
      return {
        songs: [],
        albums: [],
        artists: [],
      };
    }
    const params = {
      term: query,
      limit: 25,
      types: ['songs', 'albums', 'artists'],
    };
    const result = await this.musicKitInstance.api.music(
      '/v1/catalog/{{storefrontId}}/search',
      params
    );

    const queryParameters = { l: 'en-us' };
    const me = await this.musicKitInstance.api.music(
      '/v1/me/recent/played',
      queryParameters
    );

    console.log(me);

    const response = await result;

    let songs = [];

    if (result.data.meta.results.order.includes('songs')) {
      songs = result.data.results.songs.data.map((song: any) => ({
        id: song.id,
        title: song.attributes.name,
        artist: song.attributes.artistName,
        album: song.attributes.albumName,
        duration: song.attributes.durationInMillis,
        quality: 'lossless',
        source: 'musicKit',
        availableSources: ['musicKit'],
        imageUrl: song.attributes.artwork.url.replace('{w}x{h}', '900x900'),
        releaseDate: song.attributes.releaseDate,
      }));
    }

    let albums = [];

    if (result.data.meta.results.order.includes('albums')) {
      albums = result.data.results.albums.data.map((album: any) => ({
        id: album.id,
        title: album.attributes.name,
        artist: album.attributes.artistName,
        imageUrl: album.attributes.artwork.url.replace('{w}x{h}', '900x900'),
        source: 'musicKit',
        availableSources: ['musikKit'],
        releaseDate: album.attributes.releaseDate,
        totalTracks: album.attributes.trackCount,
      }));
    }

    let artists = [];

    if (result.data.meta.results.order.includes('artists')) {
      artists = result.data.results.artists.data.map((artist: any) => ({
        id: artist.id,
        name: artist.attributes.name,
        imageUrl: artist.attributes.artwork.url.replace('{w}x{h}', '900x900'),
        source: 'musicKit',
        availableSources: ['musikKit'],
      }));
    }

    console.log(songs);

    const videos = await this.musicKitInstance.api.music(
      '/v1/catalog/{{storefrontId}}/search',
      params
    );

    const filteredAlbums = albums.filter(
      (album: Album) => album.totalTracks > 1
    );
    return {
      songs,
      //videos: [],
      albums: filteredAlbums,
      artists,
    };
  }
}
