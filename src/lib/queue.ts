import { create } from 'zustand';
import { subsonicURL } from '@/lib/sources/navidrome';
import { persist, createJSONStorage } from 'zustand/middleware';
import { song } from '@/lib/sources/types';

export interface queueStore {
  queue: queue;
  addToQueue: (track: song | string) => void;
  currentSong?: { track: song; index: number };
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  playNext: (track: song | string) => void;
  setCurrentSong: (index: number) => void;
  setRepeat: (repeat: number) => void;
  playPrevious: () => void;
  skip: () => void;
  shuffle: () => void;
  setQueue: (songs: song[], shuffle: boolean, clearQueue: boolean) => void;
  play: (song: song | string) => void;
  setPlaying: (playing: "playing" | "paused" | "ended") => void;
}

interface queue {
  repeat: number;
  shuffle: boolean;
  playing: "playing" | "paused" | "ended";
  currentSong: { track: song; index: number };
  songs: song[];
  shuffledSongs: song[];
}


export const useQueueStore = create<queueStore>()(
  persist(
    (set, get) => ({
      queue: {
        repeat: 0,
        shuffle: false,
        playing: 'paused',
        songs: [],
        shuffledSongs: [],
        currentSong: {
          //set to -1 to avoid adding first song at index of 1
          index: -1,
          track: {
            id: '',
            title: '',
            artist: '',
            album: '',
            duration: 0,
            quality: '',
            source: '',
            availableSources: [],
            imageUrl: '',
            releaseDate: '',
          },
        },
      },

      play: async (track) => {
        if (typeof track === 'string') {
          await getSongData(track).then((song) => {
            if (song) {
              set((state) => ({
                queue: {
                  ...state.queue,
                  currentSong: {
                    track: song,
                    index: state.queue.currentSong.index + 1,
                  },
                  songs: [
                    ...state.queue.songs.slice(
                      0,
                      state.queue.currentSong.index + 1
                    ),
                    song,
                    ...state.queue.songs.slice(
                      state.queue.currentSong.index + 1
                    ),
                  ],
                },
              }));
            }
          });
        } else {
          set((state) => ({
            queue: {
              ...state.queue,
              currentSong: {
                track,
                index: state.queue.currentSong.index + 1,
              },
              songs: [
                ...state.queue.songs.slice(
                  0,
                  state.queue.currentSong.index + 1
                ),
                track,
                ...state.queue.songs.slice(state.queue.currentSong.index + 1),
              ],
            },
          }));
        }
      },

      addToQueue: async (track) => {
        if (typeof track === 'string') {
          await getSongData(track).then((song) => {
            if (song) {
              set((state) => ({
                queue: {
                  ...state.queue,
                  songs: [...state.queue.songs, song],
                },
              }));
            }
          });
        } else {
          set((state) => ({
            queue: {
              ...state.queue,
              songs: [...state.queue.songs, track],
            },
          }));
        }
      },

      removeFromQueue: (index) =>
        set((state: queueStore) => {
          const newSongs = state.queue.songs.filter((_, i) => i !== index);
          const isCurrentSong = state.queue.currentSong.index === index;
          return {
            queue: {
              ...state.queue,
              songs: newSongs,
              currentSong: isCurrentSong
                ? {
                    track: newSongs[index] || state.queue.songs[index + 1],
                    index: index,
                  }
                : state.queue.currentSong,
            },
          };
        }),

      clearQueue: () =>
        set((state) => ({
          queue: {
            ...state.queue,
            songs: [],
          },
        })),

      playNext: async (track) => {
        if (typeof track === 'string') {
          await getSongData(track).then((song) => {
            if (song) {
              set((state) => ({
                queue: {
                  ...state.queue,
                  songs: [
                    ...state.queue.songs.slice(
                      0,
                      state.queue.currentSong.index + 1
                    ),
                    song,
                    ...state.queue.songs.slice(
                      state.queue.currentSong.index + 1
                    ),
                  ],
                },
              }));
            }
          });
        } else {
          set((state) => ({
            queue: {
              ...state.queue,
              songs: [
                ...state.queue.songs.slice(
                  0,
                  state.queue.currentSong.index + 1
                ),
                track,
                ...state.queue.songs.slice(state.queue.currentSong.index + 1),
              ],
            },
          }));
        }
      },

      setCurrentSong: (index) =>
        set((state) => ({
          queue: {
            ...state.queue,
            currentSong: {
              track: state.queue.songs[index],
              index,
            },
          },
        })),

      setRepeat: (repeat) =>
        set((state) => ({
          queue: {
            ...state.queue,
            repeat: repeat,
          },
        })),

      playPrevious: () =>
        set((state) => {
          console.log('playPrevious');
          if (state.queue.currentSong) {
            const currentIndex = state.queue.currentSong.index;
            if (currentIndex > 0) {
              return {
                queue: {
                  ...state.queue,
                  currentSong: {
                    track: state.queue.songs[currentIndex - 1],
                    index: currentIndex - 1,
                  },
                },
              };
            } else if (state.queue.currentSong.index === 0) {
              return {
                queue: {
                  ...state.queue,
                  currentSong: {
                    track: state.queue.songs[state.queue.songs.length - 1],
                    index: state.queue.songs.length - 1,
                  },
                },
              };
            }
          }
          return {};
        }),

      skip: () =>
        set((state) => {
          console.log('skip');
          console.log(state.currentSong);
          if (state.queue.currentSong) {
            const currentIndex = state.queue.currentSong.index;
            if (currentIndex < state.queue.songs.length - 1) {
              return {
                queue: {
                  ...state.queue,
                  currentSong: {
                    track: state.queue.songs[currentIndex + 1],
                    index: currentIndex + 1,
                  },
                },
              };
            } else if (
              state.queue.currentSong.index ===
              state.queue.songs.length - 1
            ) {
              return {
                queue: {
                  ...state.queue,
                  currentSong: {
                    track: state.queue.songs[0],
                    index: 0,
                  },
                },
              };
            }
          }
          return {};
        }),

        setPlaying: (playing) =>
        set((state) => ({
          queue: {
            ...state.queue,
            playing: playing,
          },
        })),

      shuffle: () =>
        set((state) => {
          console.log('shuffle');
          if (state.queue.shuffle) {
            return {
              queue: {
                ...state.queue,
                shuffledSongs: state.queue.songs.sort(
                  () => Math.random() - 0.5
                ),
              },
            };
          }
          return {};
        }),

      setQueue: (songs, shuffle, clearQueue) =>
        set((state) => {
          console.log('setQueue');
          return {
            queue: {
              ...state.queue,
              currentSong: clearQueue
                ? {
                    track: songs[0],
                    index: 0,
                  }
                : state.queue.currentSong,
              songs: clearQueue ? songs : [...state.queue.songs, ...songs],
              shuffledSongs: shuffle
                ? songs.sort(() => Math.random() - 0.5)
                : [],
            },
          };
        }),
    }),
    {
      name: 'queue-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

const getSongData = async (id: string): Promise<song | undefined> => {
  const baseUrl = await subsonicURL('/rest/getSong', '&id=' + id);
  try {
    const res = await fetch(baseUrl);
    const data = await res.json();
    if (data['subsonic-response'].song) {
      return data['subsonic-response'].song;
    }
  } catch (err) {
    console.log(err);
  }
  return undefined;
};
