'use client'
import { useSearchParams } from "next/navigation";
import {useEffect, useState, useRef, Suspense} from "react";
import {useRouter} from "next/navigation";
import {Song} from "./types";
import Link from 'next/link';
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
  } from "@/components/ui/hover-card"
import {ChevronUp, Repeat, Repeat1, Shuffle, ListStart, Volume, Volume1, Volume2, VolumeX} from 'lucide-react'

import { Slider } from "@/components/ui/slider"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
  } from "@/components/ui/tooltip"

  function SearchParamsWrapper({ children }: { children: React.ReactNode }) {
    const searchParams = useSearchParams();
    return children;
  }

export function Player() { 
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <SearchParamsWrapper>
                <PlayerContent />
            </SearchParamsWrapper>
        </Suspense>
    )
}


export function PlayerContent() {
    //for testing
    const apiUrl = process.env.NEXT_PUBLIC_API_URL

    const [isClient, setIsClient] = useState(false)

    const router = useRouter();

    let searchParams = useSearchParams();
    const audioRef = useRef(null);

    useEffect(() => {
        //set currently playing from search params
        if (searchParams.get('playing')) {
            const playing = searchParams.get('playing') || '';
            localStorage.setItem('currentlyPlaying', playing);
        }
    } , [searchParams.get('playing')]);

    useEffect(() => {
        //set search params to currently playing for link sharing
        if (localStorage.getItem('currentlyPlaying') !== searchParams.get('playing') ) {
            router.push(`/home/?playing=${localStorage.getItem('currentlyPlaying')}`);
        }
        fetchSongData();
    }, [isClient && localStorage.getItem('currentlyPlaying')]);

    const [songData, setSongData] = useState<Song | null>(null);

    async function fetchSongData() {
        try {
            const fetchSongData = await fetch(`${apiUrl}/rest/getSong?u=${localStorage.getItem('username')}&t=${localStorage.getItem('password')}&s=${localStorage.getItem('salt')}&v=1.13.0&c=myapp&f=json&id=${localStorage.getItem('currentlyPlaying')}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            if (fetchSongData.status === 200) {
                const response = await fetchSongData.json();
                if (response['subsonic-response'].status === 'ok') {
                    setSongData(response['subsonic-response'].song);
                }
            }
        } catch (error) {
            console.error(error);
        }   
    }
    

    if (songData == null) {
        return (
            <div className="h-[100px] w-screen bg-card border-border border-t sticky flex">
                <div className='flex h-full justify-center items-center'>
                    <div className='h-full p-3'>
                        <div  className='h-full rounded-lg aspect-square bg-background'>
                        </div>
                    </div>
                    <div className=''>
                        <p>Not Playing</p>
                        <div className='flex flex-row '>
                            <p className='pr-1 text-slate-500 text-sm'>Not Playing</p> 
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="h-[100px] w-screen bg-card border-border border-t sticky flex justify-between">
            <div className='flex h-full justify-center items-center absolute'>
                <div className='h-full group'>
                    <div  className='h-full rounded-lg aspect-square absolute p-3 z-50'>
                        <div className='h-full rounded-lg aspect-square invisible group-hover:visible z-50 flex justify-center items-center'>
                            <ChevronUp className=' text-slate-300 opacity-0 group-hover:opacity-70 transition-all duration-700 group-hover:mb-4' size={64}/>
                        </div>
                    </div>
                    <div className='h-full p-3'>
                        <img 
                            src={`${apiUrl}/rest/getCoverArt?u=${localStorage.getItem('username')}&t=${localStorage.getItem('password')}&s=${localStorage.getItem('salt')}&v=1.13.0&c=myapp&f=json&id=${songData.coverArt}`} 
                            alt="Album Cover" className='h-full rounded-lg group-hover:blur-xs transition-all duration-700' 
                        />
                    </div>
                </div>
                <div className=''>
                    <Link href={`/home/track/${songData.id}`} ><p>{songData.title}</p> </Link>
                    <div className='flex flex-row '>
                        <Link href={`/home/album/${songData.albumId}`} ><p className='pr-1 hover:underline text-sm text-slate-500'>{songData.album}</p></Link> 
                        <p className='pr-1 text-slate-500 text-sm'>-</p> 
                        <Link href={`/home/artist/${songData.artistId}`} ><p className='hover:underline text-slate-500 text-sm'>{songData.artist}</p></Link>
                    </div>
                    <div className=' flex '>
                        <HoverCard>
                            <HoverCardTrigger>
                                <p className=' text-slate-300 border border-1 rounded-md pl-1 pr-1 text-sm'>{songData.suffix.toUpperCase()}</p>
                            </HoverCardTrigger>
                            <HoverCardContent>
                                <p className='text-slate-300'>{songData.suffix.toUpperCase()} ({songData.bitRate} Kbps - {songData.samplingRate/1000} Mhz)</p>
                            </HoverCardContent>
                        </HoverCard>
                    </div>
                </div>
            </div>
            <div>
            </div>
            <div>
                <Controls songData={songData} audioRef={audioRef}/>
            </div>
            <div>
                <RightControls audioRef={audioRef} />
            </div>
            <audio ref={audioRef} id="music" preload="all">
                <source src={`${apiUrl}/rest/stream?u=${localStorage.getItem('username')}&t=${localStorage.getItem('password')}&s=${localStorage.getItem('salt')}&v=1.13.0&c=myapp&f=json&id=${localStorage.getItem('currentlyPlaying')}`} />
            </audio>
        </div>
    );
}

const Controls: React.FC<{ songData: Song, audioRef : any }> = ({ songData, audioRef  }) => {

      const formatTime = (time: number): string => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
      };
        const [playing, setPlaying] = useState(false);
        const [repeat, setRepeat] = useState(0);
        const [shuffle, setShuffle] = useState(false);
        const [sliderTimestamp, setSliderTimestamp] = useState('0:00');
        const [timestamp, setTimestamp] = useState('0:00');
        const [sliderValue, setSliderValue] = useState(0);
        const [sliderActive, setSliderActive] = useState(false);
      
        const length = songData.duration;
        const currentTimestamp = parseInt(timestamp.split(':')[0]) * 60 + parseInt(timestamp.split(':')[1]);
        const timeLeft = length - currentTimestamp;
      
        const timeLeftString = `-${formatTime(timeLeft)}`;
        const durationString = formatTime(length - currentTimestamp);
      
        const handleSliderChange = (value: number) => {
          const time = (length * value) / 1000;
          setSliderTimestamp(formatTime(time));
            setSliderValue(value);
        };
      
        const handleSliderCommit = (value: number) => {
          const time = (length * value) / 1000;
          setTimestamp(formatTime(time));
            setSliderActive(false);
            setSliderValue(value);

            if (audioRef.current) {
                audioRef.current.currentTime = time;
            }
        };

        useEffect(() => {
            if (playing && audioRef.current) {
                audioRef.current.play().catch((error: unknown) => console.error('Error playing audio:', error));
              } else if (audioRef.current) {
                audioRef.current.pause();
              }
        }, [playing])
        
        useEffect(() => {
            if (audioRef.current) {
                audioRef.current.loop = repeat === 2;
              }
        }, [repeat])

        useEffect(() => {
            if (audioRef.current) {
                audioRef.current?.addEventListener('timeupdate', () => {
                    const time = audioRef.current?.currentTime;
                    setTimestamp(formatTime(time));
                } , false);
              }
        }, [])

        useEffect (() => {
            if (sliderActive) {
                return;
            }
            setSliderValue((currentTimestamp / length) * 1000);
            setSliderTimestamp(formatTime(currentTimestamp));

        }, [timestamp])



    return (
        <div className='flex flex-col h-full'>
            <div className='h-full'>
                <div className='flex justify-center items-center align-middle h-full space-x-2 mt-2'>
                    {
                        shuffle ? 
                        <button onClick={() => setShuffle(false)}>
                            <Shuffle color='red' strokeWidth={3} absoluteStrokeWidth/>
                        </button> 
                        :
                        <button onClick={() => setShuffle(true)}>
                            <Shuffle  strokeWidth={3} absoluteStrokeWidth/>
                        </button>
                    }
                    <button>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
                            <path d="M9.195 18.44c1.25.714 2.805-.189 2.805-1.629v-2.34l6.945 3.968c1.25.715 2.805-.188 2.805-1.628V8.69c0-1.44-1.555-2.343-2.805-1.628L12 11.029v-2.34c0-1.44-1.555-2.343-2.805-1.628l-7.108 4.061c-1.26.72-1.26 2.536 0 3.256l7.108 4.061Z" />
                        </svg>
                    </button>
                    {
                        playing ? 
                        <button onClick={() => setPlaying(false)}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
                                <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 0 1 .75-.75H9a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H7.5a.75.75 0 0 1-.75-.75V5.25Zm7.5 0A.75.75 0 0 1 15 4.5h1.5a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H15a.75.75 0 0 1-.75-.75V5.25Z" clipRule="evenodd" />
                            </svg>
                        </button> 
                        :
                        <button onClick={() => setPlaying(true)} >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
                                <path fillRule="evenodd" d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd" />
                            </svg>
                        </button>
                    }
                    <button>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
                            <path d="M5.055 7.06C3.805 6.347 2.25 7.25 2.25 8.69v8.122c0 1.44 1.555 2.343 2.805 1.628L12 14.471v2.34c0 1.44 1.555 2.343 2.805 1.628l7.108-4.061c1.26-.72 1.26-2.536 0-3.256l-7.108-4.061C13.555 6.346 12 7.249 12 8.689v2.34L5.055 7.061Z" />
                        </svg>
                    </button>
                    {
                        repeat === 2 ?
                        <button onClick={() => setRepeat(0)}>
                            <Repeat1 color='red' strokeWidth={3} absoluteStrokeWidth/>
                        </button> 
                        : repeat === 1 ?
                        <button onClick={() => setRepeat(2)}>
                            <Repeat strokeWidth={3} absoluteStrokeWidth color='red'/>
                        </button>
                        :
                        <button onClick={() => setRepeat(1)}>
                            <Repeat strokeWidth={3} absoluteStrokeWidth/>
                        </button>
                    }
                </div>
            </div>
            <div className='flex flex-row justify-center items-center mb-4'>
                <p>{timestamp}</p>
                <div>
                <TooltipProvider delayDuration={300}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Slider defaultValue={[0]} max={1000} step={1} className='w-96 mr-2 ml-2' onValueChange = {(e: number[]) => handleSliderChange(e[0])} onValueCommit = {(e: number[]) => handleSliderCommit(e[0])} value={[Math.round(sliderValue)]} onPointerDown={() => setSliderActive(true)} onPointerUp={() => setSliderActive(true)} />
                        </TooltipTrigger>
                        <TooltipContent sideOffset={4}>{sliderTimestamp}</TooltipContent>
                    </Tooltip>
                </TooltipProvider>
                </div>                
                <p>{timeLeftString}</p>
            </div>
        </div>
    )
}

function RightControls({audioRef}: {audioRef: any}) {

    const [open , setOpen] = useState<boolean>(false);
    const [volume , setVolume] = useState<number>(100);

    const onChange = (e: number[]) => {
        const volumeValue = e[0];
        setVolume(volumeValue / 10);
        localStorage.setItem('volume', volumeValue.toString());
        if (audioRef.current) {
            audioRef.current.volume = volumeValue / 1000;
        }
    }

    useEffect (() => {
        if (audioRef.current) {
            audioRef.current.volume = localStorage.getItem('volume') !== null ? parseInt(localStorage.getItem('volume') || '100') / 1000 : 1;
            setVolume(localStorage.getItem('volume') !== null ? parseInt(localStorage.getItem('volume') || '100')/ 10 : 100);
            console.log(localStorage.getItem('volume') !== null ? parseInt(localStorage.getItem('volume') || '100') / 1000 : 1)
        }
    } , [audioRef.current])

    return (
        <div className='flex flex-row justify-center items-center mb-4 h-full absolute z-20 right-4'>
            <Volume1 strokeWidth={3} absoluteStrokeWidth />
            <TooltipProvider delayDuration={300}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Slider defaultValue={[
                            localStorage.getItem('volume') !== null ? parseInt(localStorage.getItem('volume') || '100') : 100
                        ]} max={1000} step={1} className='w-36 mr-2 ml-2' onValueChange = {(e: number[]) => onChange(e)} />
                    </TooltipTrigger>
                    <TooltipContent sideOffset={4}>{Math.round(volume)}%</TooltipContent>
                </Tooltip>
            </TooltipProvider>
            <ListStart strokeWidth={3} absoluteStrokeWidth />
        </div>
    )
}