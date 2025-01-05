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

            if ((window as any).MusicKit) {
                setTimeout(() => {
                    this.musicKitInstance = (window as any).MusicKit.getInstance();
                    console.log('MusicKit already configured');
                    resolve();
                    return;
                } , 500);
            }


            window.addEventListener('musickitconfigured', () => {
                this.musicKitInstance = (window as any).MusicKit.getInstance();
                console.log('MusicKit configured');
                resolve();
            });
        });
    }
    

    play(): void {
        throw new Error('Method not implemented.');
    }
    pause(): void {
        if (!this.musicKitInstance) {
            console.error('MusicKit not initialized');
            return;
        }

        this.musicKitInstance.pause();
    }
    async playSong(trackId: string): void {
        console.log('Playing song', trackId);
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
        throw new Error('Method not implemented.');
    }

    public onTimeUpdate(callback: (currentTime: number, duration: number) => void): void {
        this.timeUpdateCallback = callback;
    }

    private setUpPlayerEvents() {
        this.timeUpdateCallback = (9, 10)
    }

    public onPlayPause(callback: (playing: 'playing' | 'paused' | 'ended') => void): void {
        this.playPauseCallback = callback;
    }

    private setupPlayPauseEvents() {
        this.playPauseCallback = ('playing')
    }
    seek(): void {
        throw new Error('Method not implemented.');
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
        console.log(result);

        const response = await result
        
        const songs = result.data.results.songs.data.map((song) => ({
            id: song.id,
            title: song.attributes.name,
            artist: song.attributes.artistName,
            album: song.attributes.albumName,
            duration: song.attributes.durationInMillis,
            quality: "N/A",
            source: "musicKit",
            availableSources: ["musikKit"],
            imageUrl: song.attributes.artwork.url.replace('{w}x{h}', '300x300'),
            releaseDate: song.attributes.releaseDate
        }));

        console.log(songs);
    
        return {
            songs,
            albums: [],
            artists: []
        };
    }
}