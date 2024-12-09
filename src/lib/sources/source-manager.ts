import { SourceInterface } from './source-interface';
import { Tidal } from './tidal/tidal';
import { Navidrome } from './navidrome/navidrome';

interface CurrentTrack {
    id: string;
    title: string;
    artist: string;
    duration: number;
    source: string;
    position: number;
}

type TimeUpdateListener = (position: number, duration: number) => void;
type PlayPauseListener = (playing: 'playing' | 'paused' | 'ended') => void;

export class SourceManager implements SourceInterface {
    private static instance: SourceManager;
    private sources: Map<string, SourceInterface>;
    private activeSource: string | null = null;
    private currentTrack: CurrentTrack | null = null;
    
    private currentPosition: number = 0;
    private trackDuration: number = 0;
    private timeUpdateListeners: Set<TimeUpdateListener> = new Set();
    private timeUpdateInterval: NodeJS.Timeout | null = null;

    private playing: 'playing' | 'paused' | 'ended' = 'paused';
    private playPauseListeners: Set<PlayPauseListener> = new Set();

    private constructor() {
        this.sources = new Map();
        
 //       this.sources.set('tidal', new Tidal());
        this.sources.set('navidrome', new Navidrome());
    }

    public static getInstance(): SourceManager {
        if (!SourceManager.instance) {
            SourceManager.instance = new SourceManager();
        }
        return SourceManager.instance;
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
    public getPlaying(): 'playing' | 'paused' | 'ended' {
        return this.playing;
    }
    public setPlaying(playing: 'playing' | 'paused' | 'ended'): void {
        this.playing = playing;
        this.emitPlayPause();
    }


    // Format time 
    public formatTime(seconds: number): string {
        const totalMilliseconds = Math.round(seconds * 1000);
        const totalSeconds = Math.floor(totalMilliseconds / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const remainingSeconds = totalSeconds % 60;
   //     console.log(seconds)
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }


    // play/pause subscription

    public onPlayPause(callback: PlayPauseListener): () => void {
        this.playPauseListeners.add(callback);
        console.log('Listener added. Total listeners:', this.playPauseListeners.size);
      
        return () => {
          this.playPauseListeners.delete(callback);
          console.log('Listener removed. Total listeners:', this.playPauseListeners.size);
        };
      }  

    private emitPlayPause(): void {
        this.playPauseListeners.forEach(callback => {
            callback(this.playing);
        });
    }

    // Time update subscription
    public onTimeUpdate(callback: TimeUpdateListener): () => void {
        this.timeUpdateListeners.add(callback);
        console.log('Listener added. Total listeners:', this.timeUpdateListeners.size);
      
        return () => {
          this.timeUpdateListeners.delete(callback);
          console.log('Listener removed. Total listeners:', this.timeUpdateListeners.size);
        };
      }


    private emitTimeUpdate(): void {
        this.timeUpdateListeners.forEach(callback => {
            callback(this.currentPosition, this.trackDuration);
        });
    }



    private stopTimeUpdates(): void {
        if (this.timeUpdateInterval) {
            clearInterval(this.timeUpdateInterval);
            this.timeUpdateInterval = null;
        }
    }

    // Playback control 


    public async playSong(trackId: string, sourceId: string,): Promise<void> {
        if (this.activeSource && this.activeSource !== sourceId) {
            const currentSource = this.sources.get(this.activeSource);
            if (currentSource) {
                await currentSource.pause();
            }
        }
    
        const source = this.sources.get(sourceId);
        if (!source) {
            throw new Error(`Source ${sourceId} not found`);
        }
    
        this.activeSource = sourceId;
    

        source.onTimeUpdate((currentTime: number, duration: number) => {
            this.setPosition(currentTime);
            this.setDuration(duration);
        });

        source.onPlayPause((playing: 'playing' | 'paused' | 'ended') => {
            this.setPlaying(playing);
        });
    
        await source.playSong(trackId);
    

        this.currentPosition = 0;
        this.trackDuration = 0;
    }

    public async pause(): Promise<void> {
        if (!this.activeSource) return;
        const source = this.sources.get(this.activeSource);
        if (source){
            await source.pause();
            this.stopTimeUpdates();
        }
    }

    public async play(): Promise<void> {
        if (!this.activeSource) return;
        const source = this.sources.get(this.activeSource);
        if (source){
            await source.play();
        }
    }


    public async seek(position: number): Promise<void> {
        if (!this.activeSource) return;
        const source = this.sources.get(this.activeSource);
        if (source){
            await source.seek(position);
        }
    }

    public async setVolume(volume: number): Promise<void> {
        if (!this.activeSource) return;
        const source = this.sources.get(this.activeSource);
        if (source){
            await source.setVolume(volume);
        }
    }

    // Cleanup method
    public destroy(): void {
        this.stopTimeUpdates();
        this.timeUpdateListeners.clear();
    }

}