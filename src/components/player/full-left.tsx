'use client'
import {Song} from './types'
import Controls from './controls'
import { useEffect, useState, useCallback } from 'react'
import { debounce } from 'lodash'

export default function Left({ songData, audioRef, imageUrl }: { songData: Song, audioRef: React.RefObject<HTMLAudioElement>, imageUrl: string }) {

    const [isMouseMoving, setIsMouseMoving] = useState<boolean>(false);

    const debouncedMouseStop = useCallback(
        debounce(() => {
            setIsMouseMoving(false);
        }, 2000),
        []
    );

    const handleMouseMove = useCallback(() => {
        setIsMouseMoving(true);
        debouncedMouseStop();
    }, [debouncedMouseStop]);
    return (
        <div 
        className="w-1/2 h-full flex justify-center items-center flex-col group z-50"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setIsMouseMoving(false)}
        >
            {imageUrl ? <img src={imageUrl} alt="" className='max-h-[58.33%] aspect-square rounded-2xl border-border border-[1px]'/> : <div className='max-h-[58.33%] aspect-square bg-gray-800'></div>}
            <div className={`'w-full h-0  ${isMouseMoving && 'mt-6'}  transition-all duration-700 '`}>
                <div className={`transition-opacity duration-700 pulse_3s_ease-out_infinite opacity-0 ${isMouseMoving && 'opacity-100'}`}>
                    <Controls songData={songData} audioRef={audioRef} />
                </div>
            </div>
        </div>
    )
}