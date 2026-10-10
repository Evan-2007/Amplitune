/**
 * Interface for cross-platform window control operations
 */
export interface WindowInterface {
  /**
   * Enter native fullscreen mode
   */
  enterFullscreen(): Promise<void>;

  /**
   * Exit native fullscreen mode
   */
  exitFullscreen(): Promise<void>;

  /**
   * Toggle fullscreen mode
   */
  toggleFullscreen(): Promise<void>;

  /**
   * Check if window is currently in fullscreen mode
   */
  isFullscreen(): Promise<boolean>;

  /**
   * Register a callback for fullscreen state changes
   * @param callback Function to call when fullscreen state changes
   * @returns Cleanup function to remove the listener
   */
  onFullscreenChange(callback: (isFullscreen: boolean) => void): () => void;
}
