import { StorageInterface } from './storage-interface';

export class ElectronStorage implements StorageInterface {
  private ipcRenderer: any;

  constructor() {
    // Safely require electron in Electron environment
    if (this.isElectron()) {
      this.ipcRenderer = window.require('electron').ipcRenderer;
    }
  }

  private isElectron(): boolean {
    return !!(window && window.process && window.process.versions && window.process.versions.electron);
  }

  async getItem(key: string): Promise<string | null> {
    return this.ipcRenderer.invoke('electron-store-get', key);
  }

  async setItem(key: string, value: string): Promise<void> {
    await this.ipcRenderer.invoke('electron-store-set', { key, value });
  }

  async removeItem(key: string): Promise<void> {
    await this.ipcRenderer.invoke('electron-store-delete', key);
  }

  async clear(): Promise<void> {
    await this.ipcRenderer.invoke('electron-store-clear');
  }

  async key(index: number): Promise<string | null> {
    return this.ipcRenderer.invoke('electron-store-key', index);
  }

  async length(): Promise<number> {
    return this.ipcRenderer.invoke('electron-store-length');
  }
}