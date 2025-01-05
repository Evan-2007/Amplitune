import { SourceInterface } from './source-interface';
import { Tidal } from './tidal/tidal';
import { Navidrome } from './navidrome/navidrome';
import { Lyrics, song, sources, artists, albums } from './types';
import { getLRCLIBLyrics } from './lrc-lib/lrc-lib';
import { MusicKit } from './musicKit/musicKit';

// Types and interfaces at the top for better organization
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
    album?: string;  // Made optional since it's used in getLyrics
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
    
    // Event listeners
    private readonly timeUpdateListeners: Set<TimeUpdateListener>;
    private readonly playPauseListeners: Set<PlayPauseListener>;

    private constructor() {
        // Initialize properties
        this.sources = new Map();
        this.activeSource = null;
        this.currentTrack = null;
        this.currentPosition = 0;
        this.trackDuration = 0;
        this.playing = 'paused';
        this.timeUpdateInterval = null;
        this.timeUpdateListeners = new Set();
        this.playPauseListeners = new Set();

        if (typeof window !== 'undefined') {
            this.initializeSources();
        }
    }

    public static getInstance(): SourceManager {
        if (!SourceManager.instance) {
            SourceManager.instance = new SourceManager();
        }
        return SourceManager.instance;
    }

    // Source management
    private initializeSources(): void {

         if (localStorage.getItem('activeServer')) {
            this.sources.set('navidrome', new Navidrome());
        }
        this.checkMusicKit();
    }


    public addSource(source: string): void {
        const savedSources = this.getSavedSources();
        
        if (source === 'tidal') {
            this.sources.set('tidal', new Tidal());
        }

        if (source === 'musicKit') {
            this.sources.set('musicKit', new MusicKit());
        }
    }

    private async checkMusicKit(): Promise<void> { 
        // First check if MusicKit is already available
        if ((window as any).MusicKit) {
            console.log('MusicKit already available');
            this.sources.set('musicKit', new MusicKit());
            return;
        }
    
        // If not, listen for when it becomes available
        window.addEventListener('musickitloaded', async () => {
            console.log('MusicKit loaded');
            this.sources.set('musicKit', new MusicKit());
        });
    
        // Add some debug logging
        console.log('MusicKit check initialized');
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
    public async playSong(trackId: string, sourceId: string): Promise<void> {
        const source = this.sources.get(sourceId);
        if (!source) {
            throw new Error(`Source ${sourceId} not found`);
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
        await source.playSong(trackId);
        this.resetPlaybackState();
    }

    private resetPlaybackState(): void {
        this.currentPosition = 0;
        this.trackDuration = 0;
    }

    public async pause(): Promise<void> {
        const source = this.getActiveSource();
        if (source) {
            await source.pause();
            this.stopTimeUpdates();
        }
    }

    public async play(): Promise<void> {
        const source = this.getActiveSource();
        if (source) {
            await source.play();
        }
    }

    public async seek(position: number): Promise<void> {
        const source = this.getActiveSource();
        if (source) {
            await source.seek(position);
        }
    }

    public async setVolume(volume: number): Promise<void> {
        const source = this.getActiveSource();
        if (source) {
            await source.setVolume(volume);
        }
    }

    // Utility methods
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
        const sourceInstance = this.sources.get(source);
        if (!sourceInstance) {
            return Promise.reject('Source not found');
        }
        return sourceInstance.getSongData(trackId);
    }

    // Lyrics handling
    public async getLyrics(trackId: string): Promise<Lyrics> {
        const source = this.getActiveSource();
        if (!source) {
            return { error: 'No source playing', source: 'source-manager' };
        }

        const lyrics = await source.getLyrics(trackId);
        
        if (this.shouldFetchBackupLyrics(lyrics) && this.currentTrack) {
            const backupLyrics = await getLRCLIBLyrics(
                this.currentTrack.title,
                this.currentTrack.artist,
                this.currentTrack.album
            );
            
            return 'error' in backupLyrics ? lyrics : backupLyrics;
        }

        return lyrics;
    }

    private shouldFetchBackupLyrics(lyrics: Lyrics): boolean {
        return (
            ('error' in lyrics && lyrics.error === 'No lyrics found') ||
            ('synced' in lyrics && lyrics.synced === false)
        );
    }


    public async search(query: string): Promise<({
        song: song & { availableSources: string[] }
        album: albums & { availableSources: string[] }
        artist: artists & { availableSources: string[] }

    })[]> {
        const promises = Array.from(this.sources.entries()).map(async ([sourceId, source]) => {
            console.log(sourceId)
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
            return `${s.title.toLowerCase()}|${s.artist.toLowerCase()}|${s.album.toLowerCase()}|${s.duration}`;
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
            song: mergedSongs,
            album: [],
            artist: []
        };
    }

    // Cleanup
    public destroy(): void {
        this.stopTimeUpdates();
        this.timeUpdateListeners.clear();
        this.playPauseListeners.clear();
    }
}