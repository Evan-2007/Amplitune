'use client'
import {Song} from './types'
import {X} from 'lucide-react'
import { useEffect, useState } from 'react'
import { CrossPlatformStorage } from '@/lib/storage/cross-platform-storage'
import { ScrollArea } from '@/components/ui/scroll-area'
import { extractColors } from 'extract-colors'
import Controls from './controls'
import Background from './background'
 
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
                    <div className='w-full h-48 bg-black mt-24 hidden group-hover:visible'>

                    </div>
                </div>
                <div className="w-1/2 h-full flex flex-col justify-center items-center">
                {songData && <Lyrics songData={songData} audioRef={audioRef} />}
                </div>
            </div>
            <div className='w-12 h-12 bg-slate-700 absolute top-4 right-4 cursor-pointer z-50 rounded-full flex justify-center items-center border-border border opacity-40 hover:opacity-90 transition-all duration-500'>
                <X className=" color-white" size={24} onClick={() => handleClose()} />
            </div>
                <div className='absolute'>
                    <Background colors={colors.slice(1).map(color => color.hex)} />
                </div>
        </div>
    )
}

function Lyrics({ songData, audioRef }: { songData: Song, audioRef: React.RefObject<HTMLAudioElement> }) {
    interface LyricLine {
        start: number,
        value: string
    }

    const localStorage = new CrossPlatformStorage();

    const [lyrics, setLyrics] = useState<LyricLine[] | null>(null);
    const [currentLine, setCurrentLine] = useState<number>(0);
    const [error, setError] = useState<string | null>(null);
    const [credentials, setCredentials] = useState<{username: string | null, password: string | null, salt: string | null}>({username: null, password: null, salt: null});

    const lyricsContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        getCredentials();
    }, []);

    useEffect(() => {
        if (audioRef.current) {
            const handleTimeUpdate = () => {
                const currentTime = audioRef.current?.currentTime;
                if (currentTime && lyrics) {
                    const milliseconds = currentTime * 1000;
                    const currentLineIndex = lyrics.findIndex((line) => line.start > milliseconds);
                    setCurrentLine(currentLineIndex - 1);
                }
            };

            audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
            return () => {
                audioRef.current?.removeEventListener('timeupdate', handleTimeUpdate);
            };
        }
    }, [audioRef, lyrics]);

    useEffect(() => {
        if (credentials.username && credentials.password && credentials.salt) {
            fetchLyrics();
        }
    }, [songData, credentials]);

    useEffect(() => {
        if (lyricsContainerRef.current && !lyricsContainerRef.current?.matches(':hover')) {
            const container = lyricsContainerRef.current;
            const currentLineElement = container.querySelector(`[data-line="${currentLine}"]`);
            if (currentLineElement) {
                currentLineElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                });
            }
        }
    }, [currentLine]);

    async function getCredentials() {
        const username = await localStorage.getItem('username');
        const password = await localStorage.getItem('password');
        const salt = await localStorage.getItem('salt');
        setCredentials({username, password, salt});
    }

    async function fetchLyrics() {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/rest/getLyricsBySongId.view?u=${credentials.username}&t=${credentials.password}&s=${credentials.salt}&v=1.13.0&c=myapp&f=json&id=${songData.id}`);
            const data = await response.json();
            if (data['subsonic-response'].status !== 'ok') {
                throw new Error(data['subsonic-response'].error.message);
            }
            setLyrics(data['subsonic-response'].lyricsList.structuredLyrics[0].line);
        } catch (error) {
            console.error('An error occurred:', error);
            setError('An error occurred while fetching the lyrics');
        }
    }

    function handleLyricClick(index: number) {
        if (audioRef.current && lyricsContainerRef) {
            const line = lyrics?.[index];
            if (line ) {
                const seconds = line.start / 1000;
                audioRef.current.currentTime = seconds;
                setCurrentLine(index);
                audioRef.current.play();
            }
        }
    }

    if (error) return <p className="text-red-500">{error}</p>;
    if (!lyrics) return <p className="text-gray-500">No Lyrics Found</p>;

    //4vw

    return (
        <div className="w-full h-full overflow-hidden relative flex justify-center items-center">
            <div 
                ref={lyricsContainerRef}
                className=" h-full overflow-y-auto py-[50vh] flex flex-col items-center group mr-10 no-scrollbar"
                style={{ scrollBehavior: 'smooth' }}
            >
                {lyrics.map((line, index) => (
                    <button onClick={() => handleLyricClick(index)}>
                        <p
                        key={index}
                        data-line={index}
                        className={`
                            text-center transition-all duration-1000 ease-in-out text-6xl text-wrap z-[100] font-bold pb-12 px-16 drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)] 
                            ${index === currentLine ? 'text-white scale-110  pb-10 drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]' : index > currentLine ? 'text-gray-400 scale-[80%] blur-[7px] group-hover:blur-0' : 'text-gray-400 opacity-0 blur-[5px] group-hover:blur-0  group-hover:scale-[80%] group-hover:opacity-100'}
                        `}
                        >
                            {line.value}
                        </p>

                        {line.value === '' && index === currentLine && <>
                            <div className="flex gap-2 mb-10">
                                <div className="w-10 aspect-square rounded-full animate-[pulse_3s_ease-out_infinite] bg-white pt-4 pb-4 scale-75"></div>
                                <div className="w-10 aspect-square rounded-full animate-[pulse_3s_ease-out_infinite] bg-white pt-4 pb-4 scale-75 delay-200"></div>
                                <div className="w-10 aspect-square rounded-full animate-[pulse_3s_ease-out_infinite] bg-white pt-4 pb-4 scale-75 delay-500"></div>
                            </div>
                        </>}
                    </button>
                ))}
            </div>
        </div>
    );
}

