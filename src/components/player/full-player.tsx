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

 
import {useRef} from 'react'

export default function FullScreenPlayer(
    {songData, imageUrl, audioRef, setFullScreen }: {
        songData: Song | null,
        imageUrl: string | null,
        audioRef: React.RefObject<HTMLAudioElement>,
        setFullScreen: (state: boolean) => void
    }
) {

    const container = useRef<HTMLDivElement>(null)
    function handleClose() {
        container.current?.classList.add('animate-[shrink-height_.3s_ease-out]')
        setTimeout(() => {
            setFullScreen(false)
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

    return (
        <div className=" w-screen z-50 animate-[grow-height_.3s_ease-out] h-screen bottom-0 relative " ref={container} style={
            colors.length > 0 ? {
                background: `${colors[0].hex} linear-gradient(180deg, ${colors[0].hex}, ${colors[0].hex})`,
            } : {background: 'linear-gradient(180deg, #000, #000)'}
        }
        >
            <div className='w-full h-full flex z-50 absolute'>
                <div className="w-1/2 h-full flex justify-center items-center flex-col group z-50">
                    {imageUrl ? <img src={imageUrl} alt="" className='max-h-[58.33%] aspect-square rounded-2xl border-border border-[1px]'/> : <div className='max-h-[58.33%] aspect-square bg-gray-800'></div>}
                    <div className='w-full h-0   group-hover:mt-6  transition-all duration-700 '>
                        <div className='group-hover:opacity-100 opacity-0 transition-opacity duration-700 '>
                            <Controls songData={songData as Song} audioRef={audioRef} />
                        </div>
                    </div>
                </div>
                <div className="w-1/2 h-full flex flex-col justify-center items-center">
                {songData && <Lyrics songData={songData} audioRef={audioRef} />}
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

