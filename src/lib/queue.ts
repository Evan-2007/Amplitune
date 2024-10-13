import { create } from 'zustand'


export interface queueStore {
    queue: queue
    setQueue: (queue: queue) => void
    addToQueue: (track: song) => void
    currentSong?: {track: song, index: number}
    removeFromQueue: (index: number) => void
    clearQueue: () => void
    playNext: (track: song) => void
    setCurrentSong: (index: number) => void
}


interface queue {
    repeat: boolean
    shuffle: boolean
    currentSong?: song
    songs: song[]
}

interface song {
    id: string;
    parent: string;
    isDir: boolean;
    title: string;
    album: string;
    artist: string;
    track: number;
    year: number;
    coverArt: string;
    size: number;
    contentType: string;
    suffix: string;
    duration: number;
    bitRate: number;
    path: string;
    playCount: number;
    discNumber: number;
    created: string;
    albumId: string;
    artistId: string;
    type: string;
    isVideo: boolean;
    played: boolean;
    bpm: number;
    comment: string;
    sortName: string;
    mediaType: string;
    musicBrainzId: string;
    genres: string[];
    replayGain: {
        trackPeak: number;
        trackGain: number;
    }
    channelCount: number;
    samplingRate: number;
}


export const useQueueStore = create<queueStore>((set) => ({
    queue: {
        repeat: false,
        shuffle: false,
        songs: [],
        currentSong: undefined
    },
    setQueue: (queue: queue) => set((state) => ({ 
        queue: {
            ...state.queue,
            ...queue,
        }
     })),
    addToQueue: (track) => set((state) => ({
        queue: {
            ...state.queue,
            songs: [...state.queue.songs, track]
        }
    })),
    removeFromQueue: (index) => set((state) => ({
        queue: {
            ...state.queue,
            songs: state.queue.songs.filter((_, i) => i !== index)
        }
    })),
    clearQueue: () => set((state) => ({
        queue: {
            ...state.queue,
            songs: []
        }
    })),
    playNext: (track) => set((state) => ({
        queue: {
            ...state.queue,
            songs: [track, ...state.queue.songs]
        }
    })),


    setCurrentSong: (index) => set((state) => ({
        currentSong: {
            track: state.queue.songs[index],
            index: index
        }
    }))




}))