import { SourceInterface } from '@/lib/sources/source-interface';
import { song, Lyrics, searchResult } from '@/lib/sources/types';



export class musicKit implements SourceInterface {
    private musicKitInstance: any = null;
    private initializationPromise: Promise<void> | null = null;
    private timeUpdateCallback: ((currentTime: number, duration: number) => void) | null = null;
    private playPauseCallback: ((playing: 'playing' | 'paused' | 'ended') => void) | null = null;

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

        return new Promise((resolve) => {
            if (typeof window !== 'undefined' && (window as any).musicKitStatus === 'ready') {
                this.musicKitInstance = (window as any).MusicKit.getInstance();
                console.log('MusicKit already configured');
                resolve();
                return;
            }

            window.addEventListener('musickitready', () => {
                this.musicKitInstance = (window as any).MusicKit.getInstance();
                console.log('MusicKit configured');
                resolve();
            });
        });
    }
    

    async play(): Promise<void> {
        await this.initializationPromise;

        await this.musicKitInstance.play();
    }
    async pause(): promises<void> {
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
            song: trackId
        });

        await this.musicKitInstance.play();
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
            source: 'musicKit'
        }
    }

    public onTimeUpdate(callback: (currentTime: number, duration: number) => void): void {
        this.timeUpdateCallback = callback;
    }

    private async setUpPlayerEvents() {
        await this.initializationPromise;
        this.musicKitInstance.addEventListener('playbackTimeDidChange', (data: {currentPlaybackDuration: number, currentPlaybackTime: number, curentPlaybackTimeRemaining: number}) => {
            if (this.timeUpdateCallback) {
                this.timeUpdateCallback(data.currentPlaybackTime, data.currentPlaybackDuration);
            }
        });
    }

    public onPlayPause(callback: (playing: 'playing' | 'paused' | 'ended') => void): void {
        this.playPauseCallback = callback;
    }

    private async setupPlayPauseEvents() {
        await this.initializationPromise;
        this.musicKitInstance.addEventListener('playbackStateDidChange', (data: {state: number}) => {
            console.log('Play state change', data);
            if (this.playPauseCallback) {
                if (data.state === 2) {
                    this.playPauseCallback('playing');
                } else if (data.state === 3) {
                    this.playPauseCallback('paused');
                } else if (data.state === -1) {
                    this.playPauseCallback('ended');
                } else {
                console.log('No callback set');
            }
        }
        });
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
    setVolume(): void {
        throw new Error('Method not implemented.');
    }
    getSongData(): Promise<song> {
        throw new Error('Method not implemented.');
    }
    async search(query: string): Promise<searchResult> {
        await this.initializationPromise;
        if (!this.musicKitInstance) {
            console.error('MusicKit not initialized');
            return {
                songs: [],
                albums: [],
                artists: []
            };
        }
        const params = { term: query, limit: 10, types: ["songs"] };
        const result = await this.musicKitInstance.api.music('/v1/catalog/{{storefrontId}}/search', params);
        
        const queryParameters = { l: 'en-us' };
        const me = await this.musicKitInstance.api.music('/v1/me/recent/played', queryParameters);

        console.log(me);

        const response = await result
        
        const songs = result.data.results.songs.data.map((song: any) => ({
            id: song.id,
            title: song.attributes.name,
            artist: song.attributes.artistName,
            album: song.attributes.albumName,
            duration: song.attributes.durationInMillis,
            quality: "N/A",
            source: "musicKit",
            availableSources: ["musikKit"],
            imageUrl: song.attributes.artwork.url.replace('{w}x{h}', '900x900'),
            releaseDate: song.attributes.releaseDate
        }));

        console.log(songs);

        const videos = await this.musicKitInstance.api.music('/v1/catalog/{{storefrontId}}/search', params);

        
    
        return {
            songs,
            //videos: [],
            albums: [],
            artists: []
        };
    }
}