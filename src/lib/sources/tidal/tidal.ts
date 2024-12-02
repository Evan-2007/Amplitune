'use client'
import { SourceInterface } from '../source-interface';
import { platform } from '@tauri-apps/plugin-os';
import { tidal as IosTidal } from './ios/tidal';
import { tidal as AndroidTidal } from './android/tidal';
import { tidal as WebTidal } from './web/tidal';


type PlatformType = "windows" | "linux" | "macos" | "android" | "ios" | "web" | string;

const isTauri = () => {
    return 'window' in globalThis && 'window.__TAURI__' in window;
}


export class Tidal implements SourceInterface {
    private platform: SourceInterface;

    constructor() {
        const currentPlatform = isTauri() ? platform() : "web";
        this.platform = this.getPlatformImplementation(currentPlatform);
    }

    private getPlatformImplementation(platform: PlatformType): SourceInterface {
        const implementations: Record<string, new () => SourceInterface> = {
            android: AndroidTidal,
            ios: IosTidal,
            web: WebTidal
        };

        const Implementation = implementations[platform];
        if (!Implementation) {
            throw new Error(`Platform ${platform} not supported`);
        }

        return new Implementation();
    }

    play(): void {
        this.platform.play();
    }

    pause(): void {
        this.platform.pause();
    }

    playSong(songId: string): void {
        this.platform.playSong(songId);
    }

    getAllPlaylists(): void {
        this.platform.getAllPlaylists();
    }

    getQueue(): void {
        this.platform.getQueue();
    }
    getLyrics(): void {
        this.platform.getLyrics();
    }
}