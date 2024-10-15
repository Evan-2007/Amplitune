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
import {CrossPlatformStorage} from "@/lib/storage/cross-platform-storage";
import FullScreenPlayer from "./full-player";
import Controls from "./controls";
import {useQueueStore} from "@/lib/queue";
import {usePlayerStore} from "@/lib/state";
import Image from 'next/image';


const localStorage = new CrossPlatformStorage();

function SearchParamsWrapper({ children }: { children: React.ReactNode }) {
    const searchParams = useSearchParams();
    return children;
}

export function Player({
    setFullScreen,
}: {
    setAudioUrl: (url: string) => void,
    audioUrl: string,
    setFullScreen: (state: boolean) => void,
    setSongData: (song: Song) => void,
    imageUrl: string | null,
    setImageUrl: (url: string) => void
}) { 
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <SearchParamsWrapper>
                <PlayerContent setFullScreen={setFullScreen} />
            </SearchParamsWrapper>
        </Suspense>
    )
}

export function PlayerContent({
    setFullScreen,
}: {
    setFullScreen: (state: boolean) => void,
}) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL

    const setCurrentSong = useQueueStore((state) => state.setCurrentSong);
    const addToQueue = useQueueStore((state) => state.addToQueue);
    const queue = useQueueStore((state) => state.queue);
    const [isClient, setIsClient] = useState(false)
    const router = useRouter();
    let searchParams = useSearchParams();
    const songData = useQueueStore((state) => state.queue.currentSong?.track);

    const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
    const [credentials, setCredentials] = useState<{username: string | null, password: string | null, salt: string | null}>({username: null, password: null, salt: null});
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);


    useEffect (() => {
        getCredentials();
    } , [])

    async function getCredentials() {
        const username = await localStorage.getItem('username');
        const password = await localStorage.getItem('password');
        const salt = await localStorage.getItem('salt');
        setCredentials({username, password, salt});
    }

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
        }
    }, [isClient, currentlyPlaying]);

    async function setParams() {
        if (currentlyPlaying !== searchParams.get('playing')) {
            router.push(`/home/?playing=${currentlyPlaying}`);
        }
        fetchSongData();
    }
    const currentSong = useQueueStore(state => state.queue.currentSong)
    async function fetchSongData() {
        try {            
            const fetchSongData = await fetch(`${apiUrl}/rest/getSong?u=${credentials.username}&t=${credentials.password}&s=${credentials.salt}&v=1.13.0&c=myapp&f=json&id=${currentlyPlaying}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            if (fetchSongData.status === 200) {
                const response = await fetchSongData.json();
                if (response['subsonic-response'].status === 'ok') {
                    setImageUrl(`${apiUrl}/rest/getCoverArt?u=${credentials.username}&t=${credentials.password}&s=${credentials.salt}&v=1.13.0&c=myapp&f=json&id=${response['subsonic-response'].song.coverArt}`);
                    setAudioUrl(`${apiUrl}/rest/stream?u=${credentials.username}&t=${credentials.password}&s=${credentials.salt}&v=1.13.0&c=myapp&f=json&id=${currentlyPlaying}`);
                    addToQueue(response['subsonic-response'].song);
                    if (queue.songs.length === 1) {
                        console.log((currentSong?.index ?? 0) + 1)
                        setCurrentSong((currentSong?.index ?? 0) + 1);
                    } else {
                        console.log('set queue to 0')
                        setCurrentSong(0);
                    }
                }
            }
            
        } catch (error) {
            console.error(error);
        }   
    }



    const songs = useQueueStore((state) => state.queue.songs);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.onended = () => {
                console.log('Song ended');
                if (songs.length > 0) {
                    const currentIndex = songs.findIndex(song => song.id === currentSong?.track?.id);
                    console.log('Current index:', currentIndex);
                    if (currentIndex === -1 || currentIndex === songs.length - 1) {
                        console.log('Moving to first song');
                        setCurrentSong(0);
                    } else {
                        console.log('Moving to next song');
                        setCurrentSong(currentIndex + 1);
                    }
                } else {
                    console.log('No songs in queue');
                }
            }
        }
    }, [audioRef.current, songs, currentSong, setCurrentSong]);

    useEffect(() => {
        if (currentSong && currentSong.track && currentSong.track.id) {
          setAudioUrl(`${apiUrl}/rest/stream?u=${credentials.username}&t=${credentials.password}&s=${credentials.salt}&v=1.13.0&c=myapp&f=json&id=${currentSong.track.id}`);
          setImageUrl(`${apiUrl}/rest/getCoverArt?u=${credentials.username}&t=${credentials.password}&s=${credentials.salt}&v=1.13.0&c=myapp&f=json&id=${currentSong.track.coverArt}`);
          console.log(currentSong);
        } else {
          console.log('Current song or track ID is not available');
        }
      }, [currentSong, credentials, apiUrl]);


    useEffect(() => {
        if (audioRef.current) {
          audioRef.current.load();
          audioRef.current.play().catch((error: unknown) => console.error('Error playing audio:', error));
        }
      }, [audioUrl]);

    

    if (songData == null || credentials.username == null || credentials.password == null || credentials.salt == null) {
        return (
            <div className="h-[100px] w-screen  sticky flex">
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
        <div className="h-[100px] w-screen  sticky flex justify-between">
            <div className='flex h-full justify-center items-center absolute'>
                <div className='h-full group'>
                    <div  className='h-full rounded-lg aspect-square absolute p-3 z-50'>
                        <button className='h-full rounded-lg aspect-square invisible group-hover:visible z-50 flex justify-center items-center' onClick={() => setFullScreen(true)}>
                            <ChevronUp className=' text-slate-300 opacity-0 group-hover:opacity-70 transition-all duration-700 group-hover:mb-4' size={64}/>
                        </button>
                    </div>
                    <div className='h-full p-3'>
                        {
                            imageUrl ? 
                            <img 
                            src={imageUrl} 
                            alt="Album Cover" className='h-full rounded-lg group-hover:blur-xs transition-all duration-700'                             />
                            :
                            <div  className='h-full rounded-lg aspect-square bg-background group-hover:blur-xs transition-all duration-700'></div>
                        }
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
            <audio ref={audioRef} src={audioUrl ?? undefined} />
        </div>
    );
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
        updateVolume();
    } , [audioRef.current])

    async function updateVolume() {
        if (audioRef.current) {
            audioRef.current.volume = await localStorage.getItem('volume') !== null ? parseInt(await localStorage.getItem('volume') || '100') / 1000 : 1;
            setVolume(await localStorage.getItem('volume') !== null ? parseInt(await localStorage.getItem('volume') || '100')/ 10 : 100);
            console.log(await localStorage.getItem('volume') !== null ? parseInt(await localStorage.getItem('volume') || '100') / 1000 : 1)
        }
    }

    return (
        <div className='flex flex-row justify-center items-center mb-4 h-full absolute z-20 right-4'>
            <Volume1 strokeWidth={3} absoluteStrokeWidth />
            <TooltipProvider delayDuration={300}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Slider defaultValue={[
                        ]} max={1000} step={1} className='w-36 mr-2 ml-2' onValueChange = {(e: number[]) => onChange(e)} value={[volume * 10]} />
                    </TooltipTrigger>
                    <TooltipContent sideOffset={4}>{Math.round(volume)}%</TooltipContent>
                </Tooltip>
            </TooltipProvider>
            <ListStart strokeWidth={3} absoluteStrokeWidth />
        </div>
    )
}