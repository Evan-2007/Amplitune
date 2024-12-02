import { SourceInterface } from '@/lib/sources/source-interface';

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
    getLyrics(): void {
        throw new Error('Method not implemented.');
    }
    getQueue(): void {
        throw new Error('Method not implemented.');
    }
}