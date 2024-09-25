import { StorageInterface } from './storage-interface';

export class BrowserStorage implements StorageInterface {
  private storage: Storage;

  constructor() {
    this.storage = window.localStorage;
  }

  async getItem(key: string): Promise<string | null> {
    return this.storage.getItem(key);
  }

  async setItem(key: string, value: string): Promise<void> {
    this.storage.setItem(key, value);
  }

  async removeItem(key: string): Promise<void> {
    this.storage.removeItem(key);
  }

  async clear(): Promise<void> {
    this.storage.clear();
  }

  async key(index: number): Promise<string | null> {
    return this.storage.key(index);
  }

  async length(): Promise<number> {
    return this.storage.length;
  }
}