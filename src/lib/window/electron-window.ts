import { WindowInterface } from './window-interface';

/**
 * Electron platform implementation using IPC
 */
export class ElectronWindow implements WindowInterface {
  async enterFullscreen(): Promise<void> {
    if (window.electronAPI) {
      window.electronAPI.send('window-fullscreen-enter');
    }
  }

  async exitFullscreen(): Promise<void> {
    if (window.electronAPI) {
      window.electronAPI.send('window-fullscreen-exit');
    }
  }

  async toggleFullscreen(): Promise<void> {
    if (window.electronAPI) {
      window.electronAPI.send('window-fullscreen-toggle');
    }
  }

  async isFullscreen(): Promise<boolean> {
    if (window.electronAPI) {
      return new Promise((resolve) => {
        window.electronAPI!.send('window-fullscreen-query');

        const handler = (_event: unknown, isFullscreen: boolean) => {
          window.electronAPI!.removeListener('window-fullscreen-query-reply', handler);
          resolve(isFullscreen);
        };

        window.electronAPI!.on('window-fullscreen-query-reply', handler);
      });
    }
    return false;
  }

  onFullscreenChange(callback: (isFullscreen: boolean) => void): () => void {
    if (!window.electronAPI) {
      return () => {};
    }

    const handler = (_event: unknown, isFullscreen: boolean) => {
      callback(isFullscreen);
    };

    window.electronAPI.on('window-fullscreen-changed', handler);

    return () => {
      if (window.electronAPI) {
        window.electronAPI.removeListener('window-fullscreen-changed', handler);
      }
    };
  }
}
