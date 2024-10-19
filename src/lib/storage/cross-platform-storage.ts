import { StorageInterface } from './storage-interface';
import { BrowserStorage } from './browser-storage';
import { ElectronStorage } from './electron-storage';

export class CrossPlatformStorage implements StorageInterface {
  private store: StorageInterface;

  constructor() {
    if (typeof window !== 'undefined') {
      this.store = this.isElectron()
        ? new ElectronStorage()
        : new BrowserStorage();
    } else {
      // Server-side fallback
      this.store = {
        getItem: async () => null,
        setItem: async () => {},
        removeItem: async () => {},
        clear: async () => {},
        key: async () => null,
        length: async () => 0,
      };
    }
  }

  private isElectron(): boolean {
    return !!(window as any).process && !!(window as any).process.type;
  }

  async getItem(key: string): Promise<string | null> {
    return this.store.getItem(key);
  }

  async setItem(key: string, value: string): Promise<void> {
    await this.store.setItem(key, value);
  }

  async removeItem(key: string): Promise<void> {
    await this.store.removeItem(key);
  }

  async clear(): Promise<void> {
    await this.store.clear();
  }

  async key(index: number): Promise<string | null> {
    return this.store.key(index);
  }

  async length(): Promise<number> {
    return this.store.length();
  }
}
