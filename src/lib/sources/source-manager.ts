import { SourceInterface } from './source-interface';
import { Tidal } from './tidal/tidal';
import { Navidrome } from './navidrome/navidrome';
import { Lyrics, song, sources, artists, albums, searchResult } from './types';
import { getLRCLIBLyrics } from './lrc-lib/lrc-lib';
import { MusicKit } from './musicKit/musicKit';

type PlaybackStatus = 'playing' | 'paused' | 'ended';
type TimeUpdateListener = (position: number, duration: number) => void;
type PlayPauseListener = (playing: PlaybackStatus) => void;

interface CurrentTrack {
  id: string;
  title: string;
  artist: string;
  duration: number;
  source: string;
  position: number;
  album?: string;
}

export class SourceManager {
  private static instance: SourceManager;
  private readonly sources: Map<string, SourceInterface>;
  private activeSource: string | null;
  private currentTrack: CurrentTrack | null;
  
  // Playback state
  private currentPosition: number;
  private trackDuration: number;
  private playing: PlaybackStatus;
  private timeUpdateInterval: NodeJS.Timeout | null;
  private repeatState: boolean;
  
  // Event listeners
  private readonly timeUpdateListeners: Set<TimeUpdateListener>;
  private readonly playPauseListeners: Set<PlayPauseListener>;

  // NEW: Promise that resolves once all sources (including MusicKit) are ready
  private initializationPromise: Promise<void>;

  private constructor() {
    this.sources = new Map();
    this.activeSource = null;
    this.currentTrack = null;
    this.currentPosition = 0;
    this.trackDuration = 0;
    this.playing = 'paused';
    this.timeUpdateInterval = null;
    this.timeUpdateListeners = new Set();
    this.playPauseListeners = new Set();
    this.repeatState = false;

    if (typeof window !== 'undefined') {
      // Begin async loading of sources (including MusicKit)
      this.initializationPromise = this.initializeSources();
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
    if (localStorage.getItem('activeServer')) {
      this.sources.set('navidrome', new Navidrome());
    }
    await this.checkMusicKit(); // Make sure MusicKit is loaded
  }

  public addSource(source: string): void {
    if (source === 'tidal') {
      this.sources.set('tidal', new Tidal());
    }
    if (source === 'musicKit') {
      this.sources.set('musicKit', new MusicKit());
    }
  }

  private checkMusicKit(): Promise<void> {
    return new Promise<void>((resolve) => {
  
        const timeoutDuration = 10000; // 10 seconds
        const timeout = setTimeout(() => {
          console.warn('MusicKit load timed out');
          resolve(); // Or reject() depending on your requirements
        }, timeoutDuration);
  
        window.addEventListener('musickitconfigured', () => {
          clearTimeout(timeout);
          console.log('MusicKit loaded');
          this.sources.set('musicKit', new MusicKit());
          resolve();
        });
      
      console.log('MusicKit check initialized');
    });
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
    this.playPauseListeners.forEach(callback => callback(this.playing));
  }

  public onTimeUpdate(callback: TimeUpdateListener): () => void {
    this.timeUpdateListeners.add(callback);
    return () => this.timeUpdateListeners.delete(callback);
  }

  private emitTimeUpdate(): void {
    this.timeUpdateListeners.forEach(callback => 
      callback(this.currentPosition, this.trackDuration)
    );
  }

  private stopTimeUpdates(): void {
    if (this.timeUpdateInterval) {
      clearInterval(this.timeUpdateInterval);
      this.timeUpdateInterval = null;
    }
  }

  // Playback control
  public async playSong(track: song): Promise<void> {
    // WAIT HERE for all async init to complete:
    await this.initializationPromise;
    console.log(track.availableSources);
    const sourcePriority = localStorage.getItem('sourcePriority') || '["navidrome", "tidal", "musicKit"]';
    
    const parsedSourcePriority: string[] = JSON.parse(sourcePriority);

    console.log('sourcePriority', sourcePriority);
    
    // Find the first available source
    const sourceId = parsedSourcePriority.find(source => track.availableSources.includes(source));
    console.log('sourceId', sourceId, track.title);
    if (!sourceId) {
      console.error(`No available source found. Sources: ${Array.from(this.sources.keys()).join(', ')}`);
      return
    }



    const source = this.sources.get(sourceId);
    if (!source) {
      console.error(`Source ${sourceId} not found`);
      return
    }

    // Handle source switching
    if (this.activeSource && this.activeSource !== sourceId) {
      const currentSource = this.sources.get(this.activeSource);
      if (currentSource) {
        await currentSource.pause();
      }
    }

    this.activeSource = sourceId;
    
    // Set up event handlers
    source.onTimeUpdate((currentTime: number, duration: number) => {
      this.setPosition(currentTime);
      this.setDuration(duration);
    });

    source.onPlayPause((playing: PlaybackStatus) => {
      this.setPlaying(playing);
    });

    // Play the song
    await source.playSong(track.id);
    this.currentTrack = {
      id: track.id,
      title: track.title,
      artist: track.artist,
      duration: track.duration,
      source: sourceId,
      position: 0,
      album: track.album
    };
    await source.setRepeat(this.repeatState);
    this.resetPlaybackState();
  }

  private resetPlaybackState(): void {
    this.currentPosition = 0;
    this.trackDuration = 0;
  }

  public async pause(): Promise<void> {
    // Optionally await initialization if needed:
    await this.initializationPromise;

    const source = this.getActiveSource();
    if (source) {
      await source.pause();
      this.stopTimeUpdates();
    }
  }

  public async play(): Promise<void> {
    // Optionally await initialization if needed:
    await this.initializationPromise;

    const source = this.getActiveSource();
    if (source) {
      await source.play();
    }
  }

  public async seek(position: number): Promise<void> {
    // Optionally await initialization if needed:
    await this.initializationPromise;

    const source = this.getActiveSource();
    if (source) {
      await source.seek(position);
    }
  }

  public async setRepeat(repeat: boolean): Promise<void> {
    // Optionally await initialization if needed:
    await this.initializationPromise;
    this.repeatState = repeat;
    const source = this.getActiveSource();
    if (source) {
      await source.setRepeat(repeat);

    }
  }

  public async setVolume(volume: number): Promise<void> {
    // Optionally await initialization if needed:
    await this.initializationPromise;

    const source = this.getActiveSource();
    if (source) {
      await source.setVolume(volume);
    }
  }

  private getActiveSource(): SourceInterface | null {
    return this.activeSource ? this.sources.get(this.activeSource) || null : null;
  }

  public formatTime(seconds: number): string {
    const totalMilliseconds = Math.round(seconds * 1000);
    const totalSeconds = Math.floor(totalMilliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  public async getSongData(trackId: string, source: string): Promise<song> {
    await this.initializationPromise; // Just to be safe, if needed

    const sourceInstance = this.sources.get(source);
    if (!sourceInstance) {
      return Promise.reject('Source not found');
    }
    return sourceInstance.getSongData(trackId);
  }

  // Lyrics handling
  public async getLyrics(trackId: string): Promise<Lyrics> {
    await this.initializationPromise;

    const source = this.getActiveSource();
    if (!source) {
      return { error: 'No source playing', source: 'source-manager' };
    }

    const lyrics = await source.getLyrics(trackId);
    console.log('shouldFetchBackupLyrics', this.shouldFetchBackupLyrics(lyrics), this.currentTrack);
    if (this.shouldFetchBackupLyrics(lyrics) && this.currentTrack) {
      const backupLyrics = await getLRCLIBLyrics(
        this.currentTrack.title,
        this.currentTrack.artist,
        this.currentTrack.album || ''
      );
      console.log('backupLyrics', backupLyrics);
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

  public async search(query: string): Promise<searchResult> {
    await this.initializationPromise;
  
    const promises = Array.from(this.sources.entries()).map(async ([sourceId, source]) => {
      try {
        const results = await source.search(query);
        return results.songs.map(song => ({
          ...song,
          source: sourceId,
          availableSources: [sourceId]
        }));
      } catch (error) {
        console.error(`Search failed for source ${sourceId}:`, error);
        return [];
      }
    });
  
    const results = await Promise.all(promises);
    const allSongs = results.flat();
  
    const dedupedSongs = (s: song) => {
      return `${s.title?.toLowerCase() ?? ''}|${s.artist?.toLowerCase() ?? ''}`;
    };
  
    interface ExtendedSong extends song {
      _firstAppearanceIndex: number;
      availableSources: string[];
    }
  
    const songMap = new Map<string, ExtendedSong>();
    let overallIndex = 0;
  
    for (const s of allSongs) {
      const key = dedupedSongs(s);
      if (songMap.has(key)) {
        const existing = songMap.get(key)!;
        existing.availableSources = Array.from(new Set([...existing.availableSources, s.source]));
      } else {
        songMap.set(key, {
          ...s,
          availableSources: [s.source],
          _firstAppearanceIndex: overallIndex
        });
      }
      overallIndex++;
    }
  
    let mergedSongs = Array.from(songMap.values());
    mergedSongs.sort((a, b) => a._firstAppearanceIndex - b._firstAppearanceIndex);
    mergedSongs.forEach(s => {
      delete (s as Partial<ExtendedSong>)._firstAppearanceIndex;
    });
  
    return {
      songs: mergedSongs,
      albums: [],
      artists: []
    };
  }
  

  // Cleanup
  public destroy(): void {
    this.stopTimeUpdates();
    this.timeUpdateListeners.clear();
    this.playPauseListeners.clear();
  }
}
