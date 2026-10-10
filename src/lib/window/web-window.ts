import { WindowInterface } from './window-interface';

/**
 * Web platform implementation using the Fullscreen API
 */
export class WebWindow implements WindowInterface {
  async enterFullscreen(): Promise<void> {
    try {
      await document.documentElement.requestFullscreen();
    } catch (error) {
      console.error('Failed to enter fullscreen:', error);
    }
  }

  async exitFullscreen(): Promise<void> {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error('Failed to exit fullscreen:', error);
    }
  }

  async toggleFullscreen(): Promise<void> {
    const isCurrentlyFullscreen = await this.isFullscreen();
    if (isCurrentlyFullscreen) {
      await this.exitFullscreen();
    } else {
      await this.enterFullscreen();
    }
  }

  async isFullscreen(): Promise<boolean> {
    return !!document.fullscreenElement;
  }

  onFullscreenChange(callback: (isFullscreen: boolean) => void): () => void {
    const handler = () => {
      callback(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handler);

    return () => {
      document.removeEventListener('fullscreenchange', handler);
    };
  }
}
