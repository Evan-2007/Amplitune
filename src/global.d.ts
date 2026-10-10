/**
 * Global type declarations for Amplitune
 */

interface ElectronAPI {
  on: (channel: string, callback: (event: unknown, ...args: any[]) => void) => void;
  send: (channel: string, args?: any) => void;
  removeListener: (channel: string, callback: (event: unknown, ...args: any[]) => void) => void;
}

interface Window {
  electronAPI?: ElectronAPI;
  __TAURI__?: any;
  process?: {
    versions?: {
      electron?: string;
    };
  };
}
