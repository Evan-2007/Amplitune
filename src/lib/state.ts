import { create } from 'zustand'
import React from 'react'


export interface uiStore {
    sideMenuOpen: boolean
    setSideMenuOpen: (open: boolean) => void
    toggleSideMenu: () => void

    sideBarOpen: boolean
    setSideBarOpen: (open: boolean) => void
    toggleSideBar: () => void
    sideBarType: 'queue' | 'lyrics'
}

export const useUiStore = create<uiStore>((set) => ({
    sideMenuOpen: false,
    setSideMenuOpen: (open) => set({ sideMenuOpen: open }),
    toggleSideMenu: () => set((state) => ({ sideMenuOpen: !state.sideMenuOpen })),

    sideBarOpen: false,
    setSideBarOpen: (open) => set({ sideBarOpen: open }),
    toggleSideBar: () => set((state) => ({ sideBarOpen: !state.sideBarOpen })),
    sideBarType: 'queue'
}))


export interface playerStore {
    playing: boolean
    setPlaying: (playing: boolean) => void
    togglePlaying: () => void

    volume: number
    setVolume: (volume: number) => void


    ref: React.RefObject<HTMLAudioElement>
    setRef: (ref: React.RefObject<HTMLAudioElement>) => void
}

export const usePlayerStore = create<playerStore>((set) => ({
    playing: false,
    setPlaying: (playing) => set({ playing }),
    togglePlaying: () => set((state) => ({ playing: !state.playing })),

    volume: 0.5,
    setVolume: (volume) => set({ volume }),

    ref: { current: null },
    setRef: (ref) => set({ ref })

}))