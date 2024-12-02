export interface SourceInterface {
    play(): void;
    pause(): void;
    playSong(trackId: string): void;
    getAllPlaylists(): void;
    getQueue(): void;
    getLyrics(): void;
    onTimeUpdate(callback: (currentTime: number, duration: number) => void): void;
    onPlayPause(callback: (playing: 'playing' | 'paused' | 'ended') => void): void;
    seek(time: number): void;
}