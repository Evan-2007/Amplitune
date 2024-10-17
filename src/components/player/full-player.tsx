'use client'
import {Song} from './types'
import {X} from 'lucide-react'
import { useEffect, useState } from 'react'
import { CrossPlatformStorage } from '@/lib/storage/cross-platform-storage'
import { ScrollArea } from '@/components/ui/scroll-area'
import { extractColors } from 'extract-colors'
import Controls from './controls'
import Background from './background'
import { debounce } from 'lodash'
import { useCallback } from 'react'
import Lyrics from './lyrics'
import Left from './full-left'
import {useQueueStore} from '@/lib/queue'
import {usePlayerStore, useUiStore} from '@/lib/state'


 
import {useRef} from 'react'

export default function FullScreenPlayer(
    {  }: {
    }
) {

    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [credentials, setCredentials] = useState<{ username: string; password: string; salt: string } | null>(null);
    
    const storage = new CrossPlatformStorage();

    const songData = useQueueStore((state) => state.queue.currentSong?.track);

    const audioRef = usePlayerStore((state) => state.ref)

    const fullScreen = useUiStore((state) => state.fullScreenPlayer)
    const setFullScreen = useUiStore((state) => state.toggleFullScreenPlayer)

    const container = useRef<HTMLDivElement>(null)
    function handleClose() {
        container.current?.classList.add('animate-[shrink-height_.3s_ease-out]')
        setTimeout(() => {
            setFullScreen()
        }, 300)
    }

    useEffect (() => {
        if (container.current) {
            container.current.addEventListener
        }
    }, [container])

    interface FinalColor {
        hex: string,
        area: number
    }

    const [colors, setColors] = useState<FinalColor[]>([])


    useEffect(() => {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;

        if (songData && credentials) {
            setImageUrl(`${apiUrl}/rest/getCoverArt?u=${credentials.username}&t=${credentials.password}&s=${credentials.salt}&v=1.13.0&c=myapp&f=json&id=${songData.coverArt}`);
        }

    }, [songData ,credentials]);

    useEffect(() => {
        getCredentials();
    }, []);

    async function getCredentials() {
        const username = await storage.getItem('username');
        const password = await storage.getItem('password');
        const salt = await storage.getItem('salt');
        if (!username || !password || !salt) {
            return null;
        }
        setCredentials({ username, password, salt });
    }


    useEffect(() => {
        getImageColors()
    }, [imageUrl])

    const getImageColors = async () => {
        if (imageUrl) {
            const response = await fetch(imageUrl)
            const blob = await response.blob();
            const image = URL.createObjectURL(blob);
            extractColors(image).then((colors) => {
                const sortedColors = colors.sort((a, b) => b.area - a.area);
                const filteredColors = sortedColors
                    .filter(color => {
                        const rgb = hexToRgb(color.hex);
                        //!(rgb.r > 240 && rgb.g > 240 && rgb.b > 240) &&
                        return  color.area > 0.02;
                    })
                    .sort((a, b) => {
                        const rgbA = hexToRgb(a.hex);
                        const rgbB = hexToRgb(b.hex);
                        const brightnessA = 0.299 * rgbA.r + 0.587 * rgbA.g + 0.114 * rgbA.b;
                        const brightnessB = 0.299 * rgbB.r + 0.587 * rgbB.g + 0.114 * rgbB.b;
                        return brightnessA - brightnessB;
                    });
                console.log(filteredColors);
                setColors(filteredColors);
            });

        }


    }

    function hexToRgb(hex: string) {
        const bigint = parseInt(hex.slice(1), 16);
        const r = (bigint >> 16) & 255;
        const g = (bigint >> 8) & 255;
        const b = bigint & 255;
        return { r, g, b };
    }

    if (!fullScreen) return null

    return (
        <div className=" w-screen z-50 animate-[grow-height_.3s_ease-out] h-screen bottom-0 relative " ref={container} style={
            colors.length > 0 ? {
                background: `${colors[0].hex} linear-gradient(180deg, ${colors[0].hex}, ${colors[0].hex})`,
            } : {background: 'linear-gradient(180deg, #000, #000)'}
        }
        >
            <div className='w-full h-full flex z-50 absolute'>
                <Left audioRef={audioRef} />
                <div className="w-1/2 h-full flex flex-col justify-center items-center">
                {songData && <Lyrics audioRef={audioRef} />}
                </div>
            </div>
            <div className='w-12 h-12 bg-slate-700 absolute top-4 right-4 cursor-pointer z-50 rounded-full flex justify-center items-center border-border border opacity-40 hover:opacity-90 transition-all duration-300' onClick={() => handleClose()}>
                <X className=" color-white" size={24}  />
            </div>
                <div className='absolute'>
                    <Background colors={colors.slice(1).map(color => color.hex)} />
                </div>
        </div>
    )
}

