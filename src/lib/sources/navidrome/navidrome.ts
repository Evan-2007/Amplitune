'use client'
import { SourceInterface } from '../source-interface';
import { platform } from '@tauri-apps/plugin-os';
import { WebNavidrome } from './web/navidrome';


type PlatformType = "windows" | "linux" | "macos" | "android" | "ios" | "web" | string;

const isTauri = () => {
    return 'window' in globalThis && 'window.__TAURI__' in window;
}


export class Navidrome implements SourceInterface {
    private platform: SourceInterface;

    
    constructor() {
        const currentPlatform = isTauri() ? platform() : "web";
        this.platform = this.getPlatformImplementation(currentPlatform);
    }

    private getPlatformImplementation(platform: PlatformType): SourceInterface {
        const implementations: Record<string, new () => SourceInterface> = {
            android: WebNavidrome,
            ios: WebNavidrome,
            linux: WebNavidrome,
            macos: WebNavidrome,
            web: WebNavidrome
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

    playSong(trackId: string): void {
        this.platform.playSong(trackId);
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
    onTimeUpdate(callback: (currentTime: number, duration: number) => void): void {
        this.platform.onTimeUpdate(callback);
    }
    seek(time: number): void {
        this.platform.seek(time);
        console.log(time)
    }

    onPlayPause(callback: (playing: 'playing' | 'paused' | 'ended') => void): void {
        this.platform.onPlayPause(callback);
    }
}