import { create } from 'zustand';
import React from 'react';

export interface uiStore {
  sideMenuOpen: boolean;
  setSideMenuOpen: (open: boolean) => void;
  toggleSideMenu: () => void;
  toggleFullScreenPlayer: () => void;

  sideBarOpen: boolean;
  setSideBarOpen: (open: boolean) => void;
  toggleSideBar: () => void;
  sideBarType: 'queue' | 'lyrics';
  fullScreenPlayer: boolean;

  isNativeFullscreen: boolean;
  setIsNativeFullscreen: (isFullscreen: boolean) => void;
}

export const useUiStore = create<uiStore>((set) => ({
  sideMenuOpen: false,
  fullScreenPlayer: false,
  setSideMenuOpen: (open) => set({ sideMenuOpen: open }),
  toggleSideMenu: () => set((state) => ({ sideMenuOpen: !state.sideMenuOpen })),

  sideBarOpen: false,
  setSideBarOpen: (open) => set({ sideBarOpen: open }),
  toggleSideBar: () => set((state) => ({ sideBarOpen: !state.sideBarOpen })),
  toggleFullScreenPlayer: () =>
    set((state) => ({ fullScreenPlayer: !state.fullScreenPlayer })),
  sideBarType: 'queue',

  isNativeFullscreen: false,
  setIsNativeFullscreen: (isFullscreen) => set({ isNativeFullscreen: isFullscreen }),
}));

export interface playerStore {
  playing: boolean;
  setPlaying: (playing: boolean) => void;
  togglePlaying: () => void;

  repeat: number;
  toggleRepeat: () => void;

  volume: number;
  setVolume: (volume: number) => void;

  ref: React.RefObject<HTMLAudioElement>;
  setRef: (ref: React.RefObject<HTMLAudioElement>) => void;
}

export const usePlayerStore = create<playerStore>((set) => ({
  playing: false,
  setPlaying: (playing) => set({ playing }),
  togglePlaying: () => set((state) => ({ playing: !state.playing })),
  repeat: 0,

  volume: 0.5,
  setVolume: (volume) => set({ volume }),

  ref: { current: null },
  setRef: (ref) => set((playerStore) => ({ ...playerStore, ref })),

  toggleRepeat: () =>
    set((state) => {
      if (state.repeat === 2) {
        return {
          ...state,
          repeat: 0,
        };
      } else {
        return {
          ...state,
          repeat: state.repeat + 1,
        };
      }
    }),
}));
