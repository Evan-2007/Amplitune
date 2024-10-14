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
    setRepeat: (repeat: boolean) => void
    playPrevious: () => void
    skip: () => void
}


interface queue {
    repeat: boolean
    shuffle: boolean
    currentSong?: {track: song, index: number}
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
        currentSong: {
            index: 0,
            track: {
                id: '',
                parent: '',
                isDir: false,
                title: '',
                album: '',
                artist: '',
                track: 0,
                year: 0,
                coverArt: '',
                size: 0,
                contentType: '',
                suffix: '',
                duration: 0,
                bitRate: 0,
                path: '',
                playCount: 0,
                discNumber: 0,
                created: '',
                albumId: '',
                artistId: '',
                type: '',
                isVideo: false,
                played: false,
                bpm: 0,
                comment: '',
                sortName: '',
                mediaType: '',
                musicBrainzId: '',
                genres: [],
                replayGain: {
                    trackPeak: 0,
                    trackGain: 0
                },
                channelCount: 0,
                samplingRate: 0
            }
        }
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
        queue: {
            ...state.queue,
            currentSong: {
                track: state.queue.songs[index],
                index
            }
        }
    })),


    setRepeat: (repeat) => set((state) => ({
        queue: {
            ...state.queue,
            repeat
        }
    })),

    playPrevious: () => set((state) => {
        console.log('playPrevious')
        if (state.queue.currentSong) {
          const currentIndex = state.queue.currentSong.index
          if (currentIndex > 0) {
            return {
              queue: {
                ...state.queue,
                currentSong: {
                  track: state.queue.songs[currentIndex - 1],
                  index: currentIndex - 1
                }
              }
            }
          }
        }
        return {}
      }),
    
      skip: () => set((state) => {
        console.log('skip')
        console.log(state.currentSong)
        if (state.queue.currentSong) {
          const currentIndex = state.queue.currentSong.index
          if (currentIndex < state.queue.songs.length - 1) {
            return {
              queue: {
                ...state.queue,
                currentSong: {
                  track: state.queue.songs[currentIndex + 1],
                  index: currentIndex + 1
                }
              }
            }
          }
        }
        return {}
      })
    }))