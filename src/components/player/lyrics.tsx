import { Song } from './types';
import { useEffect, useState, useRef, useCallback } from 'react';
import { CrossPlatformStorage } from '@/lib/storage/cross-platform-storage';
import { debounce } from 'lodash';
import Queue from '@/assets/queue.svg'
import LyricsSVG from '@/assets/lyrics.svg'
import { MessageSquareQuote } from 'lucide-react';



export default function Lyrics({ songData, audioRef }: { songData: Song, audioRef: React.RefObject<HTMLAudioElement> }) {
    interface LyricLine {
        start: number,
        value: string
    }

    const localStorage = new CrossPlatformStorage();

    const [tab , setTab] = useState<'lyrics' | 'queue'>('lyrics');

    const [lyrics, setLyrics] = useState<LyricLine[] | null>(null);
    const [currentLine, setCurrentLine] = useState<number>(0);
    const [error, setError] = useState<string | null>(null);
    const [credentials, setCredentials] = useState<{username: string | null, password: string | null, salt: string | null}>({username: null, password: null, salt: null});
    const [isMouseMoving, setIsMouseMoving] = useState<boolean>(false);


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
        if (lyricsContainerRef.current && !isMouseMoving) {
            const container = lyricsContainerRef.current;
            const currentLineElement = container.querySelector(`[data-line="${currentLine}"]`);
            if (currentLineElement) {
                currentLineElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                });
            }
        }
    }, [currentLine, isMouseMoving]);

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

    return (
        <div className="w-full h-full overflow-hidden relative flex justify-center items-center">
            <div 
                ref={lyricsContainerRef}
                className="h-full overflow-y-auto py-[50vh] flex flex-col items-center group mr-10 no-scrollbar"
                style={{ scrollBehavior: 'smooth' }}
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setIsMouseMoving(false)}
            >
                {lyrics.map((line, index) => (
                    <button key={index} onClick={() => handleLyricClick(index)}>
                        <p
                        data-line={index}
                        className={`
                            text-center transition-all duration-1000 ease-in-out text-6xl text-wrap z-50 font-bold pb-12 px-16 drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)] 
                            ${index === currentLine ? 'text-white scale-110  pb-10 drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]' : index > currentLine && !isMouseMoving ? 'text-gray-400 scale-[80%] blur-[7px]': index > currentLine && isMouseMoving ? "text-gray-400 scale-[80%] blur-0" : isMouseMoving ? 'group-hover:scale-[80%] group-hover:opacity-100' : 'text-gray-400 opacity-0 blur-[7px] transition-all duration-1000' }
                        `}
                        >
                            {line.value}
                        </p>

                        {line.value === '' && index === currentLine && (
                            <div className="flex gap-2 mb-10">
                                <div className="w-10 aspect-square rounded-full animate-[pulse_3s_ease-out_infinite] bg-white pt-4 pb-4 scale-75"></div>
                                <div className="w-10 aspect-square rounded-full animate-[pulse_3s_ease-out_infinite] bg-white pt-4 pb-4 scale-75 delay-200"></div>
                                <div className="w-10 aspect-square rounded-full animate-[pulse_3s_ease-out_infinite] bg-white pt-4 pb-4 scale-75 delay-500"></div>
                            </div>
                        )}
                    </button>
                ))}


                    <div className={`bottom-24 w-full flex absolute justify-center items-center transition-all duration-1000 ease-in-out ${isMouseMoving ? 'opacity-100 ' : 'opacity-100'}`}>
                        <div className={` w-64 h-11 rounded-md transition-all duration-1000 ease-in-out ${isMouseMoving ? 'bg-gray-900/70  backdrop-blur-[5px]' : 'bg-gray-900/0'}`}>

                            <div className={`${isMouseMoving ? 'opacity-100' : 'opacity-0'} absolute transition-all duration-1000 ease-in-out items-center flex align-middle w-full h-full`}>
                                <div className="p-1 h-full z-50 w-full absolute">
                                    <div 
                                        className={`
                                            z-50 w-32 bg-gray-600 h-9 px-1 rounded-md 
                                            transition-all duration-500 ease-in-out
                                            absolute left-0 transform
                                            ${tab === 'lyrics' ? 'translate-x-0 ml-1' : 'translate-x-full ml-[-4px]'}
                                        `}
                                    >
                                        </div>
                                    </div>
                                <div className='w-3/6 z-[60] h-full flex justify-center items-center' onClick={() => setTab('lyrics')}>
                                    <MessageSquareQuote size={32} className='z-50 pl-1' onClick={() => setTab('lyrics')}/>
                                </div>
                                <div className='w-3/6 z-[60] h-full flex justify-center items-center' onClick={() => setTab('queue')}>
                                    <Queue className=' h-8 w-10 fill-white z-50 pr-1' />
                                </div>
                            </div>

                            </div>
                        </div>

            </div>
        </div>
    );
}
