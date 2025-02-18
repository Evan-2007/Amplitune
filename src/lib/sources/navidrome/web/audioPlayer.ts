'use client';

export class AudioPlayer {
  private audio: HTMLAudioElement | null = null;
  private currentTrackId: string | null = null;
  private eventListeners: Map<string, Set<Function>>;
  private initialized: boolean = false;

  constructor() {
    this.eventListeners = new Map();
  }

  private initialize() {
    if (this.initialized) return;

    if (typeof window !== 'undefined') {
      this.audio = new Audio();
      this.setupAudioEvents();
      this.initialized = true;
    }
  }

  private setupAudioEvents() {
    if (!this.audio) return;

    const events = [
      'play',
      'pause',
      'ended',
      'timeupdate',
      'error',
      'waiting',
      'playing',
    ];

    events.forEach((event) => {
      this.audio!.addEventListener(event, () => {
        this.emit(event, {
          currentTime: this.audio?.currentTime,
          duration: this.audio?.duration,
        });
      });
    });

    this.audio.addEventListener('error', () => {
      const error = this.audio?.error;
      this.emit('error', {
        code: error?.code,
        message: error?.message,
      });
    });

    this.audio.addEventListener('waiting', () => {
      this.emit('waiting', { trackId: this.currentTrackId });
    });

    this.audio.addEventListener('playing', () => {
      this.emit('playing', { trackId: this.currentTrackId });
    });
  }

  public async load(url: string, trackId: string): Promise<void> {
    this.initialize();
    if (!this.audio) return;

    try {
      this.audio.pause();
      this.audio.currentTime = 0;

      this.audio.src = url;
      this.currentTrackId = trackId;

      await this.audio.load();
      this.emit('loaded', { trackId });
    } catch (error) {
      this.emit('error', { error, trackId });
    }
  }

  public play(): Promise<void> {
    this.initialize();
    return this.audio?.play() || Promise.resolve();
  }

  public setLoop(loop: boolean): void {
    this.initialize();
    if (this.audio) {
      if (loop) {
        this.audio.loop = true;
      } else {
        this.audio.loop = false;
      }
    }
  }

  public pause(): void {
    this.initialize();
    this.audio?.pause();
  }

  public seek(time: number): void {
    this.initialize();
    if (this.audio && time >= 0 && time <= (this.audio.duration || 0)) {
      this.audio.currentTime = time;
    }
  }

  public setVolume(volume: number): void {
    this.initialize();
    if (this.audio) {
      this.audio.volume = Math.max(0, Math.min(1, volume));
    }
  }

  public getCurrentTime(): number {
    return this.audio?.currentTime || 0;
  }

  public getDuration(): number {
    return this.audio?.duration || 0;
  }

  public isPlaying(): boolean {
    return this.audio ? !this.audio.paused : false;
  }

  public on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)?.add(callback);
  }

  public off(event: string, callback: Function): void {
    this.eventListeners.get(event)?.delete(callback);
  }

  private emit(event: string, data: any): void {
    this.eventListeners.get(event)?.forEach((callback) => callback(data));
  }

  public destroy(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio.src = '';
      this.initialized = false;
      this.audio = null;
    }
    this.eventListeners.clear();
  }
}
