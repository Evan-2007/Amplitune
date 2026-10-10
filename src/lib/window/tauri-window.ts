import { getCurrentWindow } from '@tauri-apps/api/window';
import { WindowInterface } from './window-interface';

/**
 * Tauri platform implementation using @tauri-apps/api/window
 */
export class TauriWindow implements WindowInterface {
  async enterFullscreen(): Promise<void> {
    try {
      const window = getCurrentWindow();
      await window.setFullscreen(true);
    } catch (error) {
      console.error('Failed to enter fullscreen:', error);
    }
  }

  async exitFullscreen(): Promise<void> {
    try {
      const window = getCurrentWindow();
      await window.setFullscreen(false);
    } catch (error) {
      console.error('Failed to exit fullscreen:', error);
    }
  }

  async toggleFullscreen(): Promise<void> {
    const isCurrentlyFullscreen = await this.isFullscreen();
    const window = getCurrentWindow();
    await window.setFullscreen(!isCurrentlyFullscreen);
  }

  async isFullscreen(): Promise<boolean> {
    try {
      const window = getCurrentWindow();
      return await window.isFullscreen();
    } catch (error) {
      console.error('Failed to check fullscreen status:', error);
      return false;
    }
  }

  onFullscreenChange(callback: (isFullscreen: boolean) => void): () => void {
    // Tauri doesn't have a built-in fullscreen change event, so we use polling
    let lastState = false;
    let intervalId: NodeJS.Timeout | null = null;

    const checkFullscreen = async () => {
      const currentState = await this.isFullscreen();
      if (currentState !== lastState) {
        lastState = currentState;
        callback(currentState);
      }
    };

    // Initial check
    checkFullscreen();

    // Poll every 500ms
    intervalId = setInterval(checkFullscreen, 500);

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }
}
