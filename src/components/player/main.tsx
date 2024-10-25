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
  const setFullScreen = useUiStore((state) => state.toggleFullScreenPlayer);
  const songData = useQueueStore((state) => state.queue.currentSong.track);
  const play = useQueueStore((state) => state.play);
  const searchParams = useSearchParams();
  const setAudioRef = usePlayerStore((state) => state.setRef);
  const audioRef = useRef<HTMLAudioElement>(null);
  const playNext = useQueueStore((state) => state.skip);
  const router = useRouter();

  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);

    //data about the song when song is not loaded from queue state
    const getSongData = async (id: string) => {
      const baseUrl = await subsonicURL('/rest/getSong', '&id=' + id);
      const response = await fetch(baseUrl);
      const data = await response.json();
      console.log(id);
      if (data['subsonic-response'].song) {
        console.log(data['subsonic-response'].song);
        play(data['subsonic-response'].song);
      }
      console.log("song: "+ songData);
    };


    //gets the song data from the search params
    useEffect(() => {
      if (searchParams.get('playing')) {
        getSongData(searchParams.get('playing') as string);
      }
    }, [searchParams]);

    //updates the search params when the song changes
    const updateParams = () => {
      if (songData) {
        const params = new URLSearchParams();
        params.set('playing', songData.id);
        router.replace(`?${params.toString()}`);
      }
    };


    //sets the audioRef in global state
    useEffect(() => {
      setAudioRef(audioRef);
    } , [audioRef.current]);


    //fetches the image url and audio url on song change
    useEffect(() => {
      getImageUrl();
      fetchAudioUrl();
      updateParams();
    }, [songData]);

    //fetches the audio url for the song and plays it
    const fetchAudioUrl = async () => {
      if (songData?.id) {
        const url = await subsonicURL(`/rest/stream`, `&id=${songData.id}`);
        if (audioRef.current) {
          audioRef.current.src = url;
          audioRef.current.play();
        }
      } else {
        setError(new Error('No song data'));
      }
    };

    //generates the image url for the song
    const getImageUrl = async () => {
      if (songData && songData.coverArt) {
        console.log('test1'+ songData.id);
        const url = await subsonicURL('/rest/getCoverArt', `&id=${songData.coverArt}`);
        setImageUrl(url);
      } else {
        setImageUrl(undefined);
      }
    }

    //scrobbles the song
    async function handleScrobble(submit = false) {
      if (songData) {
        const url = await subsonicURL(
          '/rest/scrobble',
          `&id=${songData.id}&submission=${submit}`
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


    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);

    //handle audio events
    useEffect(() => {
      const audio = audioRef.current;
      if (!audio) return;
  
      const handleError = (e: ErrorEvent) => {
        console.error('Audio error:', e);
        setError(new Error('Audio playback error'));
      };
  
      const handleStalled = () => {
        console.warn('Audio stalled');
      };
  
      const handleWaiting = () => {
        setIsLoading(true);
      };
  
      const handlePlaying = () => {
        setIsLoading(false);
        setError(null);
      };

      const handleEnded = () => {
        playNext();
        handleScrobble(true);
      }

      let lastClickTime = 0;
      const handlePlay = () => {
        // prevent spamming play causing lots of scrobbles
        const now = Date.now();
        if (now - lastClickTime < 1000) {
          console.log('Preventing multiple clicks');
          return;
        } else {
          lastClickTime = now;
          handleScrobble();
        }
      };
  
      audio.addEventListener('error', handleError);
      audio.addEventListener('stalled', handleStalled);
      audio.addEventListener('waiting', handleWaiting);
      audio.addEventListener('playing', handlePlaying);
      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('play', handlePlay);
  
      return () => {
        audio.removeEventListener('error', handleError);
        audio.removeEventListener('stalled', handleStalled);
        audio.removeEventListener('waiting', handleWaiting);
        audio.removeEventListener('playing', handlePlaying);
        audio.removeEventListener('ended', handleEnded);
      };
    }, []);

  if (songData == undefined) {
    return (
      <div className='sticky flex h-[75px] w-screen flex-shrink-0 flex-grow-0'>
        <div className='flex h-full items-center justify-center'>
          <div className='h-full p-3'>
            <div className='aspect-square h-full rounded-lg bg-background'></div>
          </div>
          <div className=''>
            <p>{songData}</p>
            <div className='flex flex-row'>
              <p className='pr-1 text-sm text-slate-500'>Not Playing</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='sticky flex h-[75px] w-screen flex-shrink-0 flex-grow-0 justify-between'>
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
      <audio ref={audioRef} />
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
