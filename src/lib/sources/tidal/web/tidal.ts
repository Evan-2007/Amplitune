import { SourceInterface } from '@/lib/sources/source-interface';
import { song, Lyrics } from '@/lib/sources/types';


export class tidal implements SourceInterface {

    play(): void {
        throw new Error('Method not implemented.');
    }
    pause(): void {
        throw new Error('Method not implemented.');
    }
    playSong(): void {
        throw new Error('Method not implemented.');
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
    onTimeUpdate(): void {
        throw new Error('Method not implemented.');
    }
    onPlayPause(): void {
        throw new Error('Method not implemented.');
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
    async search(query: string): void {
        throw new Error('Method not implemented.');
    }

    async setRepeat(repeat: boolean): Promise<void> {
        throw new Error('Method not implemented.');
    }

}