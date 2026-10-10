import { SourceInterface } from '@/lib/sources/source-interface';
//import {getSongData} from './getSong'
import { subsonicBaseUrl } from './subsonic';
import { AudioPlayer } from './audioPlayer';
import {
  Lyrics,
  Playlist,
  PlaylistSummary,
  ArtistData,
  ArtistSummary,
  AlbumData,
  AlbumSummary,
  Song,
  SearchResult,
} from '../../types';
import { getLyrics } from './getLyrics';

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
      artistId: song.artistId,
      trackNumber: song.track,
      explicit: song.explicitStatus === 'explicit',
      // Subsonic reports seconds
      duration: (song.duration ?? 0) * 1000,
      source: 'navidrome',
      availableSources: ['navidrome'],
      imageUrl: await this.coverUrl(song.coverArt),
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

  /** Calls a Subsonic endpoint and returns the unwrapped response body. */
  private async request(path: string, params: string = ''): Promise<any> {
    const url = await subsonicBaseUrl(path, params);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Navidrome returned ${response.status}`);
    }
    const body = (await response.json())['subsonic-response'];
    if (!body || body.status === 'failed') {
      throw new Error(body?.error?.message ?? 'Navidrome request failed');
    }
    return body;
  }

  private async coverUrl(coverArt?: string): Promise<string> {
    return coverArt
      ? subsonicBaseUrl(
          '/rest/getCoverArt',
          `&id=${encodeURIComponent(coverArt)}`
        )
      : '';
  }

  private async toAlbumSummary(album: any): Promise<AlbumSummary> {
    return {
      id: album.id,
      title: album.name ?? album.title ?? '',
      artist: album.artist ?? '',
      artistId: album.artistId,
      imageUrl: await this.coverUrl(album.coverArt),
      releaseDate: album.year ? String(album.year) : '',
      source: 'navidrome',
      availableSources: ['navidrome'],
      totalTracks: album.songCount ?? 0,
    };
  }

  async getAlbumData(albumId: string): Promise<AlbumData> {
    const { album } = await this.request(
      '/rest/getAlbum',
      `&id=${encodeURIComponent(albumId)}`
    );
    if (!album) {
      throw new Error(`Album ${albumId} not found`);
    }
    const tracks = await Promise.all(
      (album.song ?? []).map((song: any) => this.toSong(song))
    );
    const genres: string[] = album.genres?.length
      ? album.genres.map((genre: any) => genre.name)
      : album.genre
        ? [album.genre]
        : [];
    return {
      id: album.id,
      source: 'navidrome',
      name: album.name ?? '',
      artist: album.artist ?? '',
      artistId: album.artistId,
      releaseDate: album.year ? String(album.year) : '',
      artWork: { url: await this.coverUrl(album.coverArt) },
      genres,
      isSingle: tracks.length === 1,
      tracks,
    };
  }

  async getArtistById(artistId: string): Promise<ArtistData> {
    const id = encodeURIComponent(artistId);
    const { artist } = await this.request('/rest/getArtist', `&id=${id}`);
    if (!artist) {
      throw new Error(`Artist ${artistId} not found`);
    }

    // Both are optional extras (they depend on the server's Last.fm setup),
    // so a failure here must not take the page down
    const [info, top] = await Promise.all([
      this.request('/rest/getArtistInfo2', `&id=${id}`).catch(() => null),
      this.request(
        '/rest/getTopSongs',
        `&artist=${encodeURIComponent(artist.name)}&count=20`
      ).catch(() => null),
    ]);

    const releases: AlbumSummary[] = (
      await Promise.all(
        (artist.album ?? []).map((album: any) => this.toAlbumSummary(album))
      )
    ).sort((a, b) => b.releaseDate.localeCompare(a.releaseDate));
    const songs = await Promise.all(
      (top?.topSongs?.song ?? []).map((song: any) => this.toSong(song))
    );
    // Navidrome's biography ends with an HTML "Read more" link
    const bio = (info?.artistInfo2?.biography ?? '')
      .replace(/<a\b[^>]*>.*?<\/a>/gi, '')
      .replace(/<[^>]*>/g, '')
      .trim();

    return {
      id: artist.id,
      source: 'navidrome',
      name: artist.name ?? '',
      imageUrl:
        info?.artistInfo2?.largeImageUrl ||
        artist.artistImageUrl ||
        (await this.coverUrl(artist.coverArt)),
      bio: bio || undefined,
      albums: releases.filter((album) => album.totalTracks > 1),
      singles: releases.filter((album) => album.totalTracks <= 1),
      latestRelease: releases[0],
      songs,
    };
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

    // Navidrome omits a list entirely when nothing matches
    const found = data['subsonic-response']?.searchResult3 ?? {};
    const [songs, albums, artists] = await Promise.all([
      Promise.all((found.song ?? []).map((song: any) => this.toSong(song))),
      Promise.all(
        (found.album ?? []).map((album: any) => this.toAlbumSummary(album))
      ),
      Promise.all(
        (found.artist ?? []).map(
          async (artist: any): Promise<ArtistSummary> => ({
            id: artist.id,
            name: artist.name ?? '',
            imageUrl:
              artist.artistImageUrl || (await this.coverUrl(artist.coverArt)),
            source: 'navidrome',
            availableSources: ['navidrome'],
          })
        )
      ),
    ]);

    return { songs, albums, artists };
  }
}
