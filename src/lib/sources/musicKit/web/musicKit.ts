import { SourceInterface } from '@/lib/sources/source-interface';
import {
  Song,
  Lyrics,
  SearchResult,
  AlbumSummary,
  AlbumData,
  Playlist,
  PlaylistSummary,
  ArtistData,
  ArtistSummary,
} from '@/lib/sources/types';
import { jwtDecode } from 'jwt-decode';
import { last } from 'lodash';
import { fetch as tauriFetch } from '@tauri-apps/plugin-http';
import { ArtistResponse } from '@/types/artistResponse';

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

    this.setUpPlayerEvents().catch((error) => console.error(error));
    this.setupPlayPauseEvents().catch((error) => console.error(error));
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
  async getLyrics(): Promise<Lyrics> {
    return {
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
  async getSongData(trackId: string): Promise<Song> {
    await this.initializationPromise;
    const result = await this.musicKitInstance.api.music(
      `/v1/catalog/{{storefrontId}}/songs/${trackId}`,
      { include: 'albums,artists' }
    );
    const song = result?.data?.data?.[0];
    if (!song) {
      throw new Error(`Song ${trackId} not found`);
    }
    return this.toSong(song);
  }

  private artworkUrl(item: any, size = 900): string {
    return (
      item?.attributes?.artwork?.url
        ?.replace('{w}', String(size))
        .replace('{h}', String(size))
        .replace('{c}', 'cc')
        .replace('{f}', 'webp') ?? ''
    );
  }

  private toSong(song: any, album?: any): Song {
    const attrs = song.attributes ?? {};
    return {
      id: song.id,
      title: attrs.name ?? '',
      artist: attrs.artistName ?? '',
      album: attrs.albumName ?? album?.attributes?.name ?? '',
      albumId: song.relationships?.albums?.data?.[0]?.id ?? album?.id,
      artistId: song.relationships?.artists?.data?.[0]?.id,
      trackNumber: attrs.trackNumber,
      explicit: attrs.contentRating === 'explicit',
      duration: attrs.durationInMillis ?? 0,
      source: 'musicKit',
      availableSources: ['musicKit'],
      imageUrl: this.artworkUrl(song) || this.artworkUrl(album),
      releaseDate: String(
        attrs.releaseDate ?? album?.attributes?.releaseDate ?? ''
      ),
    };
  }

  private toAlbumSummary(album: any): AlbumSummary {
    const attrs = album.attributes ?? {};
    return {
      id: album.id,
      title: attrs.name ?? '',
      artist: attrs.artistName ?? '',
      artistId: album.relationships?.artists?.data?.[0]?.id,
      imageUrl: this.artworkUrl(album, 500),
      releaseDate: String(attrs.releaseDate ?? ''),
      source: 'musicKit',
      availableSources: ['musicKit'],
      totalTracks: attrs.trackCount ?? 0,
      isSingle: attrs.isSingle ?? false,
    };
  }

  async getAlbumData(albumId: string, source: string): Promise<AlbumData> {
    await this.initializationPromise;

    const result = await this.musicKitInstance.api.music(
      `/v1/catalog/{{storefrontId}}/albums/${albumId}`,
      { include: 'artists,tracks' }
    );
    if (!result || !result.data) {
      throw new Error('Failed to fetch album data');
    }
    const albumData = result.data.data?.[0];
    if (!albumData) {
      throw new Error(`Album ${albumId} not found`);
    }

    // Music videos can sit in an album's track list; they are not playable here
    const formatedTracks: Song[] = (albumData.relationships?.tracks?.data ?? [])
      .filter((track: any) => track.type !== 'music-videos')
      .map((track: any) => ({
        ...this.toSong(track, albumData),
        albumId: albumData.id,
        // Tracks never carry their own artwork, so use the album's
        imageUrl: this.artworkUrl(albumData),
      }));
    const artwork = albumData.attributes.artwork ?? {};

    return {
      id: albumData.id,
      source: 'musicKit',
      releaseDate: albumData.attributes.releaseDate || '',
      artWork: {
        type: 'apple',
        url: this.artworkUrl(albumData),
        width: artwork.width || 0,
        height: artwork.height || 0,
        textColor1: artwork.textColor1 || '',
        textColor2: artwork.textColor2 || '',
        textColor3: artwork.textColor3 || '',
        textColor4: artwork.textColor4 || '',
        bgColor: artwork.bgColor || '',
        hasP3: artwork.hasP3 || false,
      },
      name: albumData.attributes.name || '',
      artist: albumData.attributes.artistName || '',
      artistId: albumData.relationships?.artists?.data?.[0]?.id,
      contentRating: albumData.attributes.contentRating,
      isSingle: albumData.attributes.isSingle || false,
      editorialNotes: albumData.attributes.editorialNotes,
      genres: albumData.attributes.genreNames || [],
      tracks: formatedTracks,
    };
  }

  async getPlaylists(): Promise<PlaylistSummary[]> {
    await this.initializationPromise;
    if (!this.musicKitInstance) {
      console.error('MusicKit not initialized');
      return Promise.reject('MusicKit not initialized');
    }
    // The library needs a signed-in user; asking without one is a 401
    if (!this.musicKitInstance.isAuthorized) {
      return [];
    }
    const result = await this.musicKitInstance.api.music(
      '/v1/me/library/playlists'
    );
    if (!result || !result.data) {
      return Promise.reject('Failed to fetch playlists');
    }
    console.log(result.data);
    const playlists = result.data.data.map((playlist: any) => ({
      id: playlist.id,
      name: playlist.attributes.name,
      imageUrl: playlist.attributes.artwork
        ? playlist.attributes.artwork.url.replace('{w}x{h}', '900x900')
        : undefined,
      source: 'musicKit',
      lastModified: playlist.attributes.lastModifiedDate,
      canEdit: playlist.attributes.canEdit,
      isPublic: playlist.attributes.isPublic,
      isLibrary: playlist.attributes.playParams.isLibrary,
      dateAdded: playlist.attributes.dateAdded,
      type: playlist.type,
    }));
    return playlists;
  }

  async getPlaylistById(playlistId: string): Promise<Playlist> {
    await this.initializationPromise;
    if (!this.musicKitInstance) {
      console.error('MusicKit not initialized');
      return Promise.reject('MusicKit not initialized');
    }
    const params = {
      include: 'tracks',
    };
    const result = await this.musicKitInstance.api.music(
      `/v1/me/library/playlists/${playlistId}`,
      params
    );
    if (!result || !result.data) {
      return Promise.reject('Failed to fetch playlist');
    }

    const playlist = result.data.data[0];
    const tracks = playlist.relationships.tracks.data.map((track: any) => ({
      id: track.id,
      title: track.attributes.name,
      artist: track.attributes.artistName,
      album: track.attributes.albumName,
      duration: track.attributes.durationInMillis,
      quality: 'lossless',
      source: 'musicKit',
      availableSources: ['musicKit'],
      imageUrl: this.artworkUrl(track),
      releaseDate: track.attributes.releaseDate ?? '',
    }));

    return {
      id: playlist.id,
      name: playlist.attributes.name,
      // Playlists without custom art have no artwork at all
      imageUrl: this.artworkUrl(playlist) || undefined,
      source: 'musicKit',
      lastModified: playlist.attributes.lastModifiedDate,
      canEdit: playlist.attributes.canEdit,
      isPublic: playlist.attributes.isPublic,
      type: playlist.type,
      isLibrary: playlist.attributes.playParams.isLibrary,
      dateAdded: playlist.attributes.dateAdded,
      tracks: playlist.relationships.tracks ? tracks : undefined,
    };
  }

  async getArtistById(artistId: string): Promise<ArtistData> {
    await this.initializationPromise;
    if (!this.musicKitInstance) {
      console.error('MusicKit not initialized');
      return Promise.reject('MusicKit not initialized');
    }

    if (!window.isTauri) {
      // Standard Apple Music API (appleMusic1)
      const artist = await this.musicKitInstance.api.music(
        `/v1/catalog/{{storefrontId}}/artists/${artistId}`,
        {
          include: 'albums',
          views: 'top-songs,full-albums,singles,latest-release',
        }
      );
      const data = artist?.data?.data?.[0];
      if (!data) {
        throw new Error(`Artist ${artistId} not found`);
      }
      return this.normalizeAppleMusic1(data);
    } else {
      // Extended Apple Music API via Tauri (appleMusic2)
      const MediaUserToken = localStorage.getItem(
        'music.q222xnn59b.media-user-token'
      );
      const token = localStorage.getItem('music.apple.com:music-token');
      if (!token) {
        throw new Error('No developer token found');
      }
      const url = `https://amp-api.music.apple.com/v1/catalog/us/artists/${artistId}?art%5Burl%5D=c%2Cf&extend=artistBio%2CbornOrFormed%2CeditorialArtwork%2CeditorialVideo%2CextendedAssetUrls%2Chero%2CisGroup%2Corigin%2CplainEditorialNotes%2CseoDescription%2CseoTitle&extend%5Bplaylists%5D=trackCount&format%5Bresources%5D=map&include=record-labels%2Cartists%2Cpersons%2Cbands&include%5Bmusic-videos%5D=artists&include%5Bsongs%5D=artists%2Calbums&l=en-US&limit%5Bartists%3Atop-songs%5D=20&meta%5Balbums%3Atracks%5D=popularity&omit%5Bresource%5D=autos&platform=web&views=appears-on-albums%2Ccompilation-albums%2Cfeatured-albums%2Cfeatured-on-albums%2Cfeatured-release%2Cfull-albums%2Clatest-release%2Clive-albums%2Cmore-to-hear%2Cmore-to-see%2Cmusic-videos%2Cplaylists%2Cradio-shows%2Csimilar-artists%2Csingles%2Ctop-songs`;
      const response = await tauriFetch(url, {
        method: 'GET',
        mode: 'no-cors',
        headers: {
          Authorization: `Bearer ${token}`,
          Origin: 'https://music.apple.com',
          'Media-User-Token': MediaUserToken || '',
        },
      });

      if (!response.ok) {
        throw new Error(`Apple Music returned ${response.status}`);
      }
      const apiData: ArtistResponse = {
        data: await response.json(),
        type: 'appleMusic2',
      };
      if (!apiData.data?.resources?.artists?.[artistId]) {
        throw new Error(`Artist ${artistId} not found`);
      }
      return this.normalizeAppleMusic2(apiData.data, artistId);
    }
  }

  private newest(albums: AlbumSummary[]): AlbumSummary | undefined {
    return [...albums].sort((a, b) =>
      b.releaseDate.localeCompare(a.releaseDate)
    )[0];
  }

  /**
   * Builds the albums and singles lists, newest first. `unsorted` are releases
   * Apple did not classify, which are split on its own single flag.
   */
  private splitReleases(
    fullAlbums: any[],
    singles: any[],
    unsorted: any[]
  ): { albums: AlbumSummary[]; singles: AlbumSummary[] } {
    const known = new Set([...fullAlbums, ...singles].map((album) => album.id));
    const rest = unsorted.filter((album) => !known.has(album.id));
    const byDate = (a: AlbumSummary, b: AlbumSummary) =>
      b.releaseDate.localeCompare(a.releaseDate);
    const toList = (items: any[], isSingle: boolean) =>
      items.map((album) => ({ ...this.toAlbumSummary(album), isSingle }));
    return {
      albums: [
        ...toList(fullAlbums, false),
        ...toList(
          rest.filter((album) => !album.attributes?.isSingle),
          false
        ),
      ].sort(byDate),
      singles: [
        ...toList(singles, true),
        ...toList(
          rest.filter((album) => album.attributes?.isSingle),
          true
        ),
      ].sort(byDate),
    };
  }

  private normalizeAppleMusic1(data: any): ArtistData {
    const attrs = data.attributes;
    const artworkUrl = attrs?.artwork?.url
      ?.replace('{w}', '500')
      .replace('{h}', '500')
      .replace('{c}', 'cc')
      .replace('{f}', 'webp') || '';

    const view = (name: string): any[] => data.views?.[name]?.data ?? [];
    const releases = this.splitReleases(
      view('full-albums'),
      view('singles'),
      data.relationships?.albums?.data ?? []
    );
    const latest = view('latest-release')[0];
    const songs: Song[] = view('top-songs').map((song: any) => ({
      ...this.toSong(song),
      artistId: data.id,
    }));

    return {
      id: data.id,
      source: 'musicKit',
      name: attrs?.name || '',
      imageUrl: artworkUrl,
      genres: attrs?.genreNames,
      ...releases,
      latestRelease: latest
        ? this.toAlbumSummary(latest)
        : this.newest([...releases.albums, ...releases.singles]),
      songs,
      artwork: attrs?.artwork
        ? {
            type: 'apple' as const,
            url: artworkUrl,
            width: attrs.artwork.width || 0,
            height: attrs.artwork.height || 0,
            textColor1: attrs.artwork.textColor1 || '',
            textColor2: attrs.artwork.textColor2 || '',
            textColor3: attrs.artwork.textColor3 || '',
            textColor4: attrs.artwork.textColor4 || '',
            bgColor: attrs.artwork.bgColor || '',
            hasP3: attrs.artwork.hasP3 || false,
          }
        : undefined,
    };
  }

  private normalizeAppleMusic2(data: any, artistId: string): ArtistData {
    const artist = data?.resources?.artists?.[artistId];
    const attrs = artist?.attributes;
    const artworkUrl = attrs?.artwork?.url
      ?.replace('{w}', '500')
      .replace('{h}', '500')
      .replace('{c}', 'cc')
      .replace('{f}', 'webp') || '';

    // This response is a map of resources; each view only lists ids into it
    const albumsObj = data?.resources?.albums || {};
    const songsObj = data?.resources?.songs || {};
    const view = (name: string, resources: Record<string, any>): any[] =>
      (artist?.views?.[name]?.data ?? [])
        .map((ref: any) => resources[ref.id])
        .filter(Boolean);

    const fullAlbums = view('full-albums', albumsObj);
    const singles = view('singles', albumsObj);
    const releases = this.splitReleases(
      fullAlbums,
      singles,
      // Without views, every album in the response is all there is to go on
      fullAlbums.length || singles.length ? [] : Object.values(albumsObj)
    );
    const latest = view('latest-release', albumsObj)[0];
    const topSongs = view('top-songs', songsObj);
    const songs: Song[] = (
      topSongs.length ? topSongs : Object.values(songsObj)
    ).map((song: any) => ({ ...this.toSong(song), artistId }));

    const editorialVideo = attrs?.editorialVideo;
    // Bios arrive as HTML
    const bio = String(attrs?.artistBio ?? '')
      .replace(/<[^>]*>/g, '')
      .trim();

    return {
      id: artistId,
      source: 'musicKit',
      name: attrs?.name || '',
      imageUrl: artworkUrl,
      bio: bio || undefined,
      genres: attrs?.genreNames,
      ...releases,
      latestRelease: latest
        ? this.toAlbumSummary(latest)
        : this.newest([...releases.albums, ...releases.singles]),
      songs,
      artwork: attrs?.artwork
        ? {
            type: 'apple' as const,
            url: artworkUrl,
            width: attrs.artwork.width || 0,
            height: attrs.artwork.height || 0,
            textColor1: attrs.artwork.textColor1 || '',
            textColor2: attrs.artwork.textColor2 || '',
            textColor3: attrs.artwork.textColor3 || '',
            textColor4: attrs.artwork.textColor4 || '',
            bgColor: attrs.artwork.bgColor || '',
            hasP3: attrs.artwork.hasP3 || false,
          }
        : undefined,
      editorialVideo: editorialVideo
        ? {
            fullscreen:
              editorialVideo.motionArtistFullscreen16x9?.video ?? undefined,
            square: editorialVideo.motionArtistSquare1x1?.video ?? undefined,
            wide: editorialVideo.motionArtistWide16x9?.video ?? undefined,
          }
        : undefined,
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
      // Results only carry names; these add the ids the links need
      'include[songs]': 'albums,artists',
      'include[albums]': 'artists',
    };
    const result = await this.musicKitInstance.api.music(
      '/v1/catalog/{{storefrontId}}/search',
      params
    );

    // A type with no matches is left out of the response entirely
    const found = result?.data?.results ?? {};
    const songs: Song[] = (found.songs?.data ?? []).map((song: any) =>
      this.toSong(song)
    );
    const albums: AlbumSummary[] = (found.albums?.data ?? []).map(
      (album: any) => this.toAlbumSummary(album)
    );
    const artists: ArtistSummary[] = (found.artists?.data ?? []).map(
      (artist: any) => ({
        id: artist.id,
        name: artist.attributes?.name ?? '',
        imageUrl: this.artworkUrl(artist, 500),
        source: 'musicKit',
        availableSources: ['musicKit'],
      })
    );

    return {
      songs,
      // Singles show up as one-track albums and only repeat the song results
      albums: albums.filter((album) => album.totalTracks > 1),
      artists,
    };
  }
}
