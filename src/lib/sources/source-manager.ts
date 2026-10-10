import { SourceInterface } from './source-interface';
import { Navidrome } from './navidrome/navidrome';
import {
  Lyrics,
  Song,
  ArtistSummary as Artist,
  AlbumSummary as Album,
  SearchResult,
  AlbumData,
  PlaylistSummary,
  Playlist,
  ArtistData,
} from './types';
import { getLRCLIBLyrics } from './lrc-lib/lrc-lib';
import { MusicKit } from './musicKit/musicKit';
import {
  getActiveNavidromeAccount,
  useAccountsStore,
} from '@/lib/accounts/store';

type PlaybackStatus = 'playing' | 'paused' | 'ended';
type TimeUpdateListener = (position: number, duration: number) => void;
type PlayPauseListener = (playing: PlaybackStatus) => void;
type SourcesChangeListener = (sources: string[]) => void;

interface CurrentTrack {
  id: string;
  title: string;
  artist: string;
  duration: number;
  source: string;
  position: number;
  album?: string;
}

interface Mergeable {
  id: string;
  source: string;
  availableSources: string[];
  sourceIds?: Record<string, string>;
}

const MUSICKIT_TIMEOUT = 10000;

const normalizeKey = (...parts: string[]) =>
  parts
    .map((part) => (part ?? '').toLowerCase().replace(/\s+/g, ' ').trim())
    .join('|');

export class SourceManager {
  private static instance: SourceManager;
  // Sources that are currently usable (configured and enabled)
  private readonly sources: Map<string, SourceInterface>;
  // Every source ever created, so toggling one does not rebuild it
  private readonly instances: Map<string, SourceInterface>;
  public activeSource: string | null;
  private currentTrack: CurrentTrack | null;

  // Playback state
  private currentPosition: number;
  private trackDuration: number;
  private playing: PlaybackStatus;
  private repeatState: boolean;
  // Incremented per playSong call so a slow, superseded call can bail out
  private playRequestId: number;

  // Event listeners
  private readonly timeUpdateListeners: Set<TimeUpdateListener>;
  private readonly playPauseListeners: Set<PlayPauseListener>;
  private readonly sourcesChangeListeners: Set<SourcesChangeListener>;

  // Resolves once all sources (including MusicKit) are ready
  private initializationPromise: Promise<void>;

  private constructor() {
    this.sources = new Map();
    this.instances = new Map();
    this.activeSource = null;
    this.currentTrack = null;
    this.currentPosition = 0;
    this.trackDuration = 0;
    this.playing = 'paused';
    this.playRequestId = 0;
    this.timeUpdateListeners = new Set();
    this.playPauseListeners = new Set();
    this.sourcesChangeListeners = new Set();
    this.repeatState = false;

    if (typeof window !== 'undefined') {
      // Begin async loading of sources (including MusicKit)
      this.initializationPromise = this.initializeSources();
      // Accounts added, removed or toggled later take effect without a reload
      useAccountsStore.subscribe(() => this.refresh());
      window.addEventListener('musickitready', () => this.refresh());
    } else {
      // On server side, just resolve immediately
      this.initializationPromise = Promise.resolve();
    }
  }

  public static getInstance(): SourceManager {
    if (!SourceManager.instance) {
      SourceManager.instance = new SourceManager();
    }
    return SourceManager.instance;
  }

  private async initializeSources(): Promise<void> {
    this.refresh();
    await this.waitForMusicKit();
    this.refresh();
  }

  private waitForMusicKit(): Promise<void> {
    return new Promise<void>((resolve) => {
      if ((window as any).musicKitStatus === 'ready') {
        resolve();
        return;
      }
      const onReady = () => {
        clearTimeout(timeout);
        resolve();
      };
      const timeout = setTimeout(() => {
        console.warn('MusicKit load timed out');
        window.removeEventListener('musickitready', onReady);
        resolve();
      }, MUSICKIT_TIMEOUT);
      window.addEventListener('musickitready', onReady, { once: true });
    });
  }

  private createSource(sourceId: string): SourceInterface {
    const source = sourceId === 'navidrome' ? new Navidrome() : new MusicKit();
    // Registered once; events from a source that is no longer active (for
    // example the pause we trigger when switching away) are ignored.
    source.onTimeUpdate((currentTime: number, duration: number) => {
      if (this.activeSource !== sourceId) return;
      this.currentPosition = currentTime;
      this.trackDuration = duration;
      this.emitTimeUpdate();
    });
    source.onPlayPause((playing: PlaybackStatus) => {
      if (this.activeSource !== sourceId) return;
      this.setPlaying(playing);
    });
    return source;
  }

  /** Re-evaluates which sources are configured and enabled. */
  public refresh(): void {
    if (typeof window === 'undefined') return;
    const { disabledSources } = useAccountsStore.getState();
    const wanted: string[] = [];
    if (getActiveNavidromeAccount() && !disabledSources.includes('navidrome')) {
      wanted.push('navidrome');
    }
    if (
      (window as any).musicKitStatus === 'ready' &&
      !disabledSources.includes('musicKit')
    ) {
      wanted.push('musicKit');
    }

    let changed = false;
    for (const [sourceId, source] of Array.from(this.sources)) {
      if (wanted.includes(sourceId)) continue;
      if (this.activeSource === sourceId) {
        this.activeSource = null;
        Promise.resolve(source.pause()).catch(() => {});
        this.setPlaying('paused');
      }
      this.sources.delete(sourceId);
      changed = true;
    }
    for (const sourceId of wanted) {
      if (this.sources.has(sourceId)) continue;
      if (!this.instances.has(sourceId)) {
        this.instances.set(sourceId, this.createSource(sourceId));
      }
      this.sources.set(sourceId, this.instances.get(sourceId)!);
      changed = true;
    }

    if (changed) {
      const registered = this.getRegisteredSources();
      this.sourcesChangeListeners.forEach((callback) => callback(registered));
    }
  }

  public getRegisteredSources(): string[] {
    return Array.from(this.sources.keys());
  }

  public onSourcesChange(callback: SourcesChangeListener): () => void {
    this.sourcesChangeListeners.add(callback);
    return () => this.sourcesChangeListeners.delete(callback);
  }

  /** The registered sources among `candidates`, highest priority first. */
  private getSourceOrder(candidates: string[]): string[] {
    const priority: string[] = useAccountsStore.getState().sourcePriority;
    return [
      ...priority.filter((source) => candidates.includes(source)),
      ...candidates.filter((source) => !priority.includes(source)),
    ].filter((source) => this.sources.has(source));
  }

  // Time tracking
  public setPosition(position: number): void {
    this.currentPosition = position;
    this.emitTimeUpdate();
  }

  public setDuration(duration: number): void {
    this.trackDuration = duration;
    this.emitTimeUpdate();
  }

  public getPosition(): number {
    return this.currentPosition;
  }

  public getDuration(): number {
    return this.trackDuration;
  }

  public getPlaying(): PlaybackStatus {
    return this.playing;
  }

  public setPlaying(playing: PlaybackStatus): void {
    this.playing = playing;
    this.emitPlayPause();
  }

  // Event handling
  public onPlayPause(callback: PlayPauseListener): () => void {
    this.playPauseListeners.add(callback);
    return () => this.playPauseListeners.delete(callback);
  }

  private emitPlayPause(): void {
    this.playPauseListeners.forEach((callback) => callback(this.playing));
  }

  public onTimeUpdate(callback: TimeUpdateListener): () => void {
    this.timeUpdateListeners.add(callback);
    return () => this.timeUpdateListeners.delete(callback);
  }

  private emitTimeUpdate(): void {
    this.timeUpdateListeners.forEach((callback) =>
      callback(this.currentPosition, this.trackDuration)
    );
  }

  // Playback control
  public async playSong(track: Song): Promise<void> {
    const requestId = ++this.playRequestId;
    // WAIT HERE for all async init to complete:
    await this.initializationPromise;
    if (requestId !== this.playRequestId) return;
    // The queue starts out with an empty placeholder track
    if (!track || !track.id) return;

    const available = track.availableSources?.length
      ? track.availableSources
      : [track.source];
    // Ids are per-source, so only sources we know this track's id for qualify
    const candidates = this.getSourceOrder(available)
      .map((sourceId) => ({
        sourceId,
        trackId:
          track.sourceIds?.[sourceId] ??
          (track.source === sourceId ? track.id : undefined),
      }))
      .filter(
        (candidate): candidate is { sourceId: string; trackId: string } =>
          !!candidate.trackId
      );

    if (candidates.length === 0) {
      console.error(
        `No available source for "${track.title}" (wants ${available.join(', ')}; connected: ${this.getRegisteredSources().join(', ') || 'none'})`
      );
      return;
    }

    // Try each source in priority order until one starts the track
    for (const { sourceId, trackId } of candidates) {
      const source = this.sources.get(sourceId);
      if (!source) continue;

      const previous =
        this.activeSource && this.activeSource !== sourceId
          ? this.sources.get(this.activeSource)
          : undefined;
      this.activeSource = sourceId;
      if (previous) {
        await Promise.resolve(previous.pause()).catch(() => {});
      }

      this.currentTrack = {
        id: trackId,
        title: track.title,
        artist: track.artist,
        duration: track.duration,
        source: sourceId,
        position: 0,
        album: track.album,
      };
      this.currentPosition = 0;
      this.trackDuration = 0;
      this.emitTimeUpdate();

      try {
        await source.playSong(trackId);
        if (requestId !== this.playRequestId) return;
        await source.setRepeat(this.repeatState);
        return;
      } catch (error) {
        if (requestId !== this.playRequestId) return;
        console.error(`Playback failed on ${sourceId}`, error);
      }
    }
  }

  public async pause(): Promise<void> {
    await this.initializationPromise;

    const source = this.getActiveSource();
    if (source) {
      await source.pause();
    }
  }

  public async play(): Promise<void> {
    await this.initializationPromise;

    const source = this.getActiveSource();
    if (source) {
      await source.play();
    }
  }

  public async seek(position: number): Promise<void> {
    await this.initializationPromise;

    const source = this.getActiveSource();
    if (source) {
      await source.seek(position);
    }
  }

  public async setRepeat(repeat: boolean): Promise<void> {
    await this.initializationPromise;
    this.repeatState = repeat;
    const source = this.getActiveSource();
    if (source) {
      await source.setRepeat(repeat);
    }
  }

  public async setVolume(volume: number): Promise<void> {
    await this.initializationPromise;

    const source = this.getActiveSource();
    if (source) {
      await source.setVolume(volume);
    }
  }

  private getActiveSource(): SourceInterface | null {
    return this.activeSource
      ? this.sources.get(this.activeSource) || null
      : null;
  }

  public formatTime(seconds: number): string {
    const totalMilliseconds = Math.round(seconds * 1000);
    const totalSeconds = Math.floor(totalMilliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  public async getSongData(trackId: string, source: string): Promise<Song> {
    await this.initializationPromise;

    const sourceInstance = this.sources.get(source);
    if (!sourceInstance) {
      return Promise.reject('Source not found');
    }
    return sourceInstance.getSongData(trackId);
  }

  // Get album data
  public async getAlbumData(
    albumId: string,
    source: string
  ): Promise<AlbumData> {
    await this.initializationPromise;

    const sourceInstance = this.sources.get(source);
    if (!sourceInstance) {
      return Promise.reject('Source not found');
    }
    return sourceInstance.getAlbumData(albumId, source);
  }

  public async getPlaylists(): Promise<PlaylistSummary[]> {
    await this.initializationPromise;
    let playlists: PlaylistSummary[] = [];
    for (const [sourceId, source] of this.sources) {
      try {
        const sourcePlaylists = await source.getPlaylists();
        playlists = playlists.concat(
          sourcePlaylists.map((p) => ({ ...p, source: sourceId }))
        );
      } catch (error) {
        console.error(`Failed to get playlists for source ${sourceId}`, error);
      }
    }
    if (playlists.length === 0) {
      console.error('No playlists found');
      return Promise.reject('No playlists found');
    }
    return playlists;
  }

  public async getPlaylistById(
    playlistId: string,
    source: string
  ): Promise<Playlist> {
    await this.initializationPromise;

    const sourceInstance = this.sources.get(source);
    if (!sourceInstance) {
      return Promise.reject('Source not found');
    }
    return sourceInstance.getPlaylistById(playlistId);
  }

  // Lyrics handling
  public async getLyrics(trackId: string): Promise<Lyrics> {
    await this.initializationPromise;

    const source = this.getActiveSource();
    if (!source) {
      return { error: 'No source playing', source: 'source-manager' };
    }

    // The active source may know this track under a different id
    const lyrics = await source.getLyrics(this.currentTrack?.id ?? trackId);
    if (this.shouldFetchBackupLyrics(lyrics) && this.currentTrack) {
      const backupLyrics = await getLRCLIBLyrics(
        this.currentTrack.title,
        this.currentTrack.artist,
        this.currentTrack.album || ''
      );
      if (!backupLyrics) {
        return lyrics;
      } else {
        return backupLyrics;
      }
    }

    return lyrics;
  }

  private shouldFetchBackupLyrics(lyrics: Lyrics): boolean {
    return (
      ('error' in lyrics && lyrics.error === 'No lyrics found') ||
      ('synced' in lyrics && lyrics.synced === false)
    );
  }

  public async search(query: string): Promise<SearchResult> {
    await this.initializationPromise;

    // Highest priority first, so a merged result shows the metadata of the
    // source it will actually play from
    const order = this.getSourceOrder(this.getRegisteredSources());
    const sourceResults = await Promise.all(
      order.map(async (sourceId) => {
        try {
          const results = await this.sources.get(sourceId)!.search(query);
          const tag = <T extends Mergeable>(items: T[]): T[] =>
            (items ?? []).map((item) => ({ ...item, source: sourceId }));
          return {
            songs: tag(results.songs),
            albums: tag(results.albums),
            artists: tag(results.artists),
          };
        } catch (error) {
          console.error(`Search failed for source ${sourceId}:`, error);
          return { songs: [], albums: [], artists: [] };
        }
      })
    );

    return {
      songs: this.mergeAcrossSources(
        sourceResults.flatMap((result) => result.songs),
        (song: Song) => normalizeKey(song.title, song.artist)
      ),
      albums: this.mergeAcrossSources(
        sourceResults.flatMap((result) => result.albums),
        (album: Album) => normalizeKey(album.title, album.artist)
      ),
      artists: this.mergeAcrossSources(
        sourceResults.flatMap((result) => result.artists),
        (artist: Artist) => normalizeKey(artist.name)
      ),
    };
  }

  /**
   * Collapses the same item found in several sources into one entry, keeping
   * the first one's metadata and recording its id in every source.
   */
  private mergeAcrossSources<T extends Mergeable>(
    items: T[],
    getKey: (item: T) => string
  ): T[] {
    const merged = new Map<string, T>();
    for (const item of items) {
      const key = getKey(item);
      const existing = merged.get(key);
      if (!existing) {
        merged.set(key, {
          ...item,
          availableSources: [item.source],
          sourceIds: { [item.source]: item.id },
        });
      } else if (!existing.availableSources.includes(item.source)) {
        existing.availableSources.push(item.source);
        existing.sourceIds![item.source] = item.id;
      }
    }
    return Array.from(merged.values());
  }

  /**
   * Retrieves artist information by their unique ID from a specified source.
   *
   * @param artistId - The unique identifier of the artist to retrieve.
   * @param source - The name of the source from which to fetch the artist data.
   * @returns A promise that resolves to an {@link ArtistData} containing the artist's information.
   * @throws Will reject the promise if the specified source is not found.
   */
  public async getArtistById(
    artistId: string,
    source: string
  ): Promise<ArtistData> {
    await this.initializationPromise;
    const sourceInstance = this.sources.get(source);
    if (!sourceInstance) {
      return Promise.reject('Source not found');
    }
    return sourceInstance.getArtistById(artistId);
  }

  // Cleanup
  public destroy(): void {
    this.timeUpdateListeners.clear();
    this.playPauseListeners.clear();
    this.sourcesChangeListeners.clear();
  }
}
