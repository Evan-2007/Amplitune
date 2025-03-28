import { SourceInterface } from '@/lib/sources/source-interface';
import { song, Lyrics, searchResult } from '@/lib/sources/types';

export class tidal implements SourceInterface {
  async play(): Promise<void> {
    throw new Error('Method not implemented.');
  }
  async pause(): Promise<void> {
    throw new Error('Method not implemented.');
  }
  playSong(): void {
    throw new Error('Method not implemented.');
  }
  getAllPlaylists(): void {
    throw new Error('Method not implemented.');
  }
  getQueue(): void {
    throw new Error('Method not implemented.');
  }
  getLyrics(): Promise<Lyrics> {
    throw new Error('Method not implemented.');
  }
  onTimeUpdate(): void {
    throw new Error('Method not implemented.');
  }
  onPlayPause(): void {
    throw new Error('Method not implemented.');
  }
  async seek(): Promise<void> {
    throw new Error('Method not implemented.');
  }
  setVolume(): void {
    throw new Error('Method not implemented.');
  }
  getSongData(): Promise<song> {
    throw new Error('Method not implemented.');
  }
  async getAlbumData(
    albumId: string,
    source: string
  ): Promise<import('../../types').AlbumData> {
    // Placeholder implementation
    return {
      id: albumId,
      source: source,
      releaseDate: '',
      artWork: {
        url: '',
        width: 0,
        height: 0,
        textColor1: '',
        textColor2: '',
        textColor3: '',
        textColor4: '',
        bgColor: '',
        hasP3: false,
      },
      name: 'Album Name',
      artist: 'Album Artist',
      isSingle: false,
    };
  }

  async search(query: string): Promise<searchResult> {
    throw new Error('Method not implemented.');
  }

  async setRepeat(repeat: boolean): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
