import { create } from 'zustand';
import { Playlists } from '@/lib/sources/types';
import { SourceManager } from './sources/source-manager';

export interface PlaylistStore {
  playlists: Playlists[];
  setPlaylists: (playlists: Playlists[]) => void;
  refreshPlaylists: () => Promise<void>;
}

const sourceManager = SourceManager.getInstance();

export const usePlaylistStore = create<PlaylistStore>((set) => ({
  playlists: [],
  setPlaylists: (playlists: Playlists[]) => set({ playlists }),
  refreshPlaylists: async () => {
    try {
      const playlists = await sourceManager.getPlaylists();
      set({ playlists });
    } catch (error) {
      console.error(error);
    }
  },
}));
