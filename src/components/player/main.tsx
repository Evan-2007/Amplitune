'use client';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Song } from './types';
import Link from 'next/link';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import {
  ChevronUp,
  Repeat,
  Repeat1,
  Shuffle,
  ListStart,
  Volume,
  Volume1,
  Volume2,
  VolumeX,
} from 'lucide-react';

import { Slider } from '@/components/ui/slider';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { CrossPlatformStorage } from '@/lib/storage/cross-platform-storage';
import FullScreenPlayer from './full-player';
import Controls from './controls';
import { useQueueStore } from '@/lib/queue';
import { usePlayerStore, useUiStore } from '@/lib/state';
import Image from 'next/image';
import { subsonicURL } from '@/lib/servers/navidrome';

const localStorage = new CrossPlatformStorage();

function SearchParamsWrapper({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  return children;
}

export function Player({}: {}) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SearchParamsWrapper>
        <PlayerContent />
      </SearchParamsWrapper>
    </Suspense>
  );
}

export function PlayerContent({}: {}) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  const setCurrentSong = useQueueStore((state) => state.setCurrentSong);
  const addToQueue = useQueueStore((state) => state.addToQueue);
  const queue = useQueueStore((state) => state.queue);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();
  let searchParams = useSearchParams();
  const songData = useQueueStore((state) => state.queue.currentSong?.track);

  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const setFullScreen = useUiStore((state) => state.toggleFullScreenPlayer);

  const setRef = usePlayerStore((state) => state.setRef);

  const audioRef = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    setRef(audioRef);
  }, [audioRef.current]);
  useEffect(() => {
    setIsClient(true);
    const initializePlayer = async () => {
      if (searchParams.get('playing')) {
        const playing = searchParams.get('playing') || '';
        await localStorage.setItem('currentlyPlaying', playing);
        setCurrentlyPlaying(playing);
      } else {
        const storedPlaying = await localStorage.getItem('currentlyPlaying');
        setCurrentlyPlaying(storedPlaying);
      }
    };
    initializePlayer();
  }, [searchParams]);

  useEffect(() => {
    if (isClient && currentlyPlaying) {
      setParams();
      fetchSongData();
    }
  }, [isClient, currentlyPlaying]);

  async function setParams() {
    if (currentlyPlaying !== searchParams.get('playing')) {
      router.push(`/home/?playing=${currentlyPlaying}`);
    }
  }
  const currentSong = useQueueStore((state) => state.queue.currentSong);
  const playNext = useQueueStore((state) => state.playNext);
  async function fetchSongData() {
    try {
      const url = await subsonicURL('/rest/getSong', `&id=${currentlyPlaying}`);
      if (url === 'error') {
        router.push('/servers');
      }
      const fetchSongData = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (fetchSongData.status === 200) {
        const response = await fetchSongData.json();
        if (response['subsonic-response'].status === 'ok') {
          const getImageUrl = await subsonicURL(
            '/rest/getCoverArt',
            `&id=${response['subsonic-response'].song.coverArt}`
          );
          const getAudioUrl = await subsonicURL(
            '/rest/stream',
            `&id=${response['subsonic-response'].song.id}`
          );
          if (getImageUrl === 'error' || getAudioUrl === 'error') {
            router.push('/servers');
          }
          setImageUrl(getImageUrl.toString());
          setAudioUrl(getAudioUrl.toString());
          playNext(response['subsonic-response'].song);
          if (queue.songs.length >= 1) {
            console.log((currentSong?.index ?? 0) + 1);
            setCurrentSong((currentSong?.index ?? 0) + 1);
          } else {
            console.log('set queue to 0');
            setCurrentSong(0);
          }
        }
      }
    } catch (error) {
      console.error(error);
    }
  }

  const songs = useQueueStore((state) => state.queue.songs);
  const repeat = usePlayerStore((state) => state.repeat);

  useEffect(() => {
    console.log(repeat);
  }, [repeat]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.onended = () => {
        console.log('Song ended');
        handleScrobble(true); // Submit scrobble
        if (songs.length > 0) {
          const currentIndex = songs.findIndex(
            (song) => song.id === currentSong?.track?.id
          );
          console.log('Current index:', currentIndex);
          if (currentIndex === -1 || currentIndex === songs.length - 1) {
            console.log(repeat);
            if (repeat == 1) {
              console.log('Moving to first song');
              setCurrentSong(0);
            }
          } else {
            console.log('Moving to next song');
            setCurrentSong(currentIndex + 1);
          }
        } else {
          console.log('No songs in queue');
        }
      };
    }
  }, [audioRef.current, songs, currentSong, setCurrentSong]);

  useEffect(() => {
    if (currentSong && currentSong.track && currentSong.track.id) {
      updateUrls();
      console.log(currentSong);
      setParams();
    } else {
      console.log('Current song or track ID is not available');
    }
  }, [currentSong, apiUrl]);

  async function updateUrls() {
    const getImageUrl = await subsonicURL(
      '/rest/getCoverArt',
      `&id=${currentSong.track.coverArt}`
    );
    const getAudioUrl = await subsonicURL(
      '/rest/stream',
      `&id=${currentSong.track.id}`
    );
    if (getImageUrl === 'error' || getAudioUrl === 'error') {
      router.push('/servers');
    }
    setImageUrl(getImageUrl.toString());
    setAudioUrl(getAudioUrl.toString());
  }

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.load();
      audioRef.current
        .play()
        .catch((error: unknown) =>
          console.error('Error playing audio:', error)
        );
    }
  }, [audioUrl]);

  //listen for play for scrobbling
  useEffect(() => {
    let lastClickTime = 0;
    const handlePlay = () => {
      const now = Date.now();
      if (now - lastClickTime < 300) {
        console.log('Preventing multiple clicks');
        return;
      }
      lastClickTime = now;
      console.log('Playing');
      handleScrobble();
    };

    if (audioRef.current) {
      audioRef.current.addEventListener('play', handlePlay);
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('play', handlePlay);
      }
    };
  }, [audioRef.current]);

  async function handleScrobble(submit = false) {
    if (currentSong && currentSong.track) {
      const url = await subsonicURL(
        '/rest/scrobble',
        `&id=${currentSong.track.id}&submission=${submit}`
      );
      fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } else {
      console.log('Current song or track ID is not available');
    }
  }

  if (songData == null) {
    return (
      <div className='sticky flex h-[100px] w-screen'>
        <div className='flex h-full items-center justify-center'>
          <div className='h-full p-3'>
            <div className='aspect-square h-full rounded-lg bg-background'></div>
          </div>
          <div className=''>
            <p>Not Playing</p>
            <div className='flex flex-row'>
              <p className='pr-1 text-sm text-slate-500'>Not Playing</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='sticky flex h-[100px] w-screen justify-between'>
      <div className='absolute flex h-full items-center justify-center'>
        <div className='group h-full'>
          <div className='absolute z-50 aspect-square h-full rounded-lg p-3'>
            <button
              className='invisible z-50 flex aspect-square h-full items-center justify-center rounded-lg group-hover:visible'
              onClick={() => setFullScreen()}
            >
              <ChevronUp
                className='text-slate-300 opacity-0 transition-all duration-700 group-hover:mb-4 group-hover:opacity-70'
                size={64}
              />
            </button>
          </div>
          <div className='h-full p-3'>
            {imageUrl ? (
              <img
                src={imageUrl}
                alt='Album Cover'
                className='h-full rounded-lg transition-all duration-700 group-hover:blur-xs'
              />
            ) : (
              <div className='aspect-square h-full rounded-lg bg-background transition-all duration-700 group-hover:blur-xs'></div>
            )}
          </div>
        </div>
        <div className=''>
          <Link href={`/home/track/${songData.id}`}>
            <p>{songData.title}</p>{' '}
          </Link>
          <div className='flex flex-row'>
            <Link href={`/home/album/${songData.albumId}`}>
              <p className='pr-1 text-sm text-slate-500 hover:underline'>
                {songData.album}
              </p>
            </Link>
            <p className='pr-1 text-sm text-slate-500'>-</p>
            <Link href={`/home/artist/${songData.artistId}`}>
              <p className='text-sm text-slate-500 hover:underline'>
                {songData.artist}
              </p>
            </Link>
          </div>
          <div className='flex'>
            <HoverCard>
              <HoverCardTrigger>
                <p className='border-1 rounded-md border pl-1 pr-1 text-sm text-slate-300'>
                  {songData.suffix.toUpperCase()}
                </p>
              </HoverCardTrigger>
              <HoverCardContent>
                <p className='text-slate-300'>
                  {songData.suffix.toUpperCase()} ({songData.bitRate} Kbps -{' '}
                  {songData.samplingRate / 1000} Mhz)
                </p>
              </HoverCardContent>
            </HoverCard>
          </div>
        </div>
      </div>
      <div></div>
      <div>
        <Controls songData={songData} />
      </div>
      <div>
        <RightControls audioRef={audioRef} />
      </div>
      <audio ref={audioRef} src={audioUrl ?? undefined} />
    </div>
  );
}

function RightControls({ audioRef }: { audioRef: any }) {
  const [open, setOpen] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(100);

  const onChange = (e: number[]) => {
    const volumeValue = e[0];
    setVolume(volumeValue / 10);
    localStorage.setItem('volume', volumeValue.toString());
    if (audioRef.current) {
      audioRef.current.volume = volumeValue / 1000;
    }
  };

  useEffect(() => {
    updateVolume();
  }, [audioRef.current]);

  async function updateVolume() {
    if (audioRef.current) {
      audioRef.current.volume =
        (await localStorage.getItem('volume')) !== null
          ? parseInt((await localStorage.getItem('volume')) || '100') / 1000
          : 1;
      setVolume(
        (await localStorage.getItem('volume')) !== null
          ? parseInt((await localStorage.getItem('volume')) || '100') / 10
          : 100
      );
      console.log(
        (await localStorage.getItem('volume')) !== null
          ? parseInt((await localStorage.getItem('volume')) || '100') / 1000
          : 1
      );
    }
  }

  return (
    <div className='absolute right-4 z-20 mb-4 flex h-full flex-row items-center justify-center'>
      <Volume1 strokeWidth={3} absoluteStrokeWidth />
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Slider
              defaultValue={[]}
              max={1000}
              step={1}
              className='ml-2 mr-2 w-36'
              onValueChange={(e: number[]) => onChange(e)}
              value={[volume * 10]}
            />
          </TooltipTrigger>
          <TooltipContent sideOffset={4}>{Math.round(volume)}%</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <ListStart strokeWidth={3} absoluteStrokeWidth />
    </div>
  );
}
