import { WindowInterface } from './window-interface';
import { WebWindow } from './web-window';
import { ElectronWindow } from './electron-window';
import { TauriWindow } from './tauri-window';

/**
 * Detect the current platform
 */
function detectPlatform(): 'tauri' | 'electron' | 'web' {
  // Check for Tauri
  // Tauri v2 only sets `__TAURI__` with `withGlobalTauri`; `isTauri` is always set
  if (typeof window !== 'undefined' && (window as any).isTauri) {
    return 'tauri';
  }

  // Check for Electron
  if (
    typeof window !== 'undefined' &&
    (window.electronAPI ||
      (window.process && (window.process as any).versions?.electron))
  ) {
    return 'electron';
  }

  // Default to web
  return 'web';
}

/**
 * Cross-platform window controller that routes to the appropriate implementation
 */
export class CrossPlatformWindow implements WindowInterface {
  private implementation: WindowInterface;

  constructor() {
    const platform = detectPlatform();

    switch (platform) {
      case 'tauri':
        this.implementation = new TauriWindow();
        break;
      case 'electron':
        this.implementation = new ElectronWindow();
        break;
      case 'web':
      default:
        this.implementation = new WebWindow();
        break;
    }
  }

  async enterFullscreen(): Promise<void> {
    return this.implementation.enterFullscreen();
  }

  async exitFullscreen(): Promise<void> {
    return this.implementation.exitFullscreen();
  }

  async toggleFullscreen(): Promise<void> {
    return this.implementation.toggleFullscreen();
  }

  async isFullscreen(): Promise<boolean> {
    return this.implementation.isFullscreen();
  }

  onFullscreenChange(callback: (isFullscreen: boolean) => void): () => void {
    return this.implementation.onFullscreenChange(callback);
  }
}
