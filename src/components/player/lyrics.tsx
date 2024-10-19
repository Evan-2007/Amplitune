import { Song } from './types';
import { useEffect, useState, useRef, useCallback } from 'react';
import { CrossPlatformStorage } from '@/lib/storage/cross-platform-storage';
import { debounce } from 'lodash';
import Queue from '@/assets/queue.svg'
import LyricsSVG from '@/assets/lyrics.svg'
import { MessageSquareQuote } from 'lucide-react';
import {useQueueStore} from '@/lib/queue'
import { ScrollArea } from '../ui/scroll-area';
import { useRouter } from 'next/navigation';
import {formatLyrics} from '@/lib/lyrics'

import {Ellipsis} from 'lucide-react'
import {
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownSection,
    DropdownItem
  } from "@nextui-org/dropdown";
  import {subsonicURL} from '@/lib/servers/navidrome'



export default function Lyrics({ audioRef }: { audioRef: React.RefObject<HTMLAudioElement> }) {
    interface LyricLine {
        start: number,
        value: string
    }

    const currentQueue = useQueueStore((state) => state.queue);

    const localStorage = new CrossPlatformStorage();

    const [tab , setTab] = useState<'lyrics' | 'queue'>('lyrics');

    const [lyrics, setLyrics] = useState<LyricLine[] | null>(null);
    const [currentLine, setCurrentLine] = useState<number>(0);
    const [error, setError] = useState<string | null>(null);
    const [isMouseMoving, setIsMouseMoving] = useState<boolean>(false);

    const router = useRouter();

    const lyricsContainerRef = useRef<HTMLDivElement>(null);

    const songData = useQueueStore(state => state.queue.currentSong?.track)

    useEffect(() => {
        if (audioRef.current) {
            console.log(lyrics)
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
            fetchLyrics();
            //scroll to top of lyrics
            setCurrentLine(0);
    }, [songData]);

    useEffect (() => {
        if (lyricsContainerRef.current) {
            const container = lyricsContainerRef.current;
            const currentLineElement = container.querySelector(`[data-line="${currentLine}"]`);
            if (currentLineElement) {
                currentLineElement.scrollIntoView({
                    block: 'center',
                });
            }
        }
    } , [tab])

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



    async function fetchLyrics() {
        if (!songData) return;
        try {
            const url = await subsonicURL('/rest/getLyricsBySongId.view', `&id=${songData.id}`);
            if (url === 'error') {
                router.push('/servers');
            }
            const response = await fetch(url.toString());
            const data = await response.json();
            if (!data['subsonic-response'].lyricsList.structuredLyrics) {
                fetchLRCLIB();
                return null;
            }
            if (data['subsonic-response'].status !== 'ok') {
                throw new Error(data['subsonic-response'].error.message);
            }
            setLyrics(data['subsonic-response'].lyricsList.structuredLyrics[0].line);
        } catch (error) {
            console.error('An error occurred:', error);
            setError('An error occurred while fetching the lyrics');
        }
    }

    async function fetchLRCLIB() {
        if (!songData) return;
        try {
            await fetch('https://lrclib.net/api/get?artist_name=' + songData.artist + '&track_name=' + songData.title + '&album_name=' + songData.album).then(async (response) => {
                const data = await response.json();
                setLyrics(formatLyrics(data.syncedLyrics));
            });
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


    const currentlyPlaying = useQueueStore(state => state.queue.currentSong)

    if (error) return <p className="text-red-500">{error}</p>;
    if (!lyrics) return <p className="text-gray-500">No Lyrics Found</p>;


    return (
        <div className="w-full h-full overflow-hidden relative flex justify-center items-center">
            <div 
                ref={lyricsContainerRef}
                className="h-full overflow-y-auto py-[50vh] flex flex-col items-center group mr-10 no-scrollbar w-full"
                style={{ scrollBehavior: 'smooth' }}
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setIsMouseMoving(false)}
            >
                {tab === 'lyrics' && lyrics.map((line, index) => (
                    <button key={index} onClick={() => handleLyricClick(index)}>
                        <p
                        data-line={index}
                        className={`
                            text-center transition-all duration-1000 ease-in-out text-6xl text-wrap z-50 font-bold pb-12 px-16 drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)] animate-[fade-in] 
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

                {tab === 'queue' && (
                    <QueueList isMouseMoving={isMouseMoving}/>
                )}


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



function QueueList({ isMouseMoving }: { isMouseMoving: boolean } ) {

    const currentlyPlaying = useQueueStore(state => state.queue.currentSong)
    const queue = useQueueStore(state => state.queue)
    const [baseUrl, setBaseUrl] = useState<string>('')

    const localStorage = new CrossPlatformStorage();
    const setSong = useQueueStore(state => state.setCurrentSong)
    const removeFromQueue = useQueueStore(state => state.removeFromQueue)



    useEffect(() => {
        setBaseImageUrl()
    }, [])

    const setBaseImageUrl = async () => {
        setBaseUrl(await subsonicURL('/rest/getCoverArt', ''))
    }



    return (
        <div className={`w-9/12 h-[75vh] flex flex-col animate-[fade-in]  top-24 absolute backdrop-opacity-0 transition-all duration-700 ${isMouseMoving && 'bg-card/60 backdrop-opacity-100 backdrop-blur-md'} p-10 rounded-2xl`}>
        <div className=' top-24 flex justify-between '>
        <div></div>
            <div>
                <h1>Clear</h1>
            </div>
        </div>
        <div className='mt-8 mb-2 mr-10 text-2xl font-bold'>
            Previous
        </div>
        <div className='space-y-2'>
            {queue.songs.map((song, index) => (
                <>
                    {index < queue.currentSong.index && (
                        <div className='flex justify-between'>
                            <div className='flex space-x-4'>
                                <img src={`${baseUrl}&id=${song.coverArt}`} alt="cover art" className="w-12 h-12 rounded-md" onClick={() => setSong(index)}/>
                                <div>
                                    <h1>{song.title}</h1>
                                    <h1>{song.artist} - {song.album}</h1>
                                </div>
                            </div>
                            <div className='flex justify-center items-center'>
                                <DropdownComponent index={index} song={song}/>
                            </div>
                        </div>
                    )}
                </>
            ))}
        </div>
        <div>
            <h1 className="mr-10 text-2xl font-bold mt-8 mb-2">Playing</h1>
            <div className='flex justify-between'>
                <div className='flex space-x-4'>
                    <img src={`${baseUrl}&id=${currentlyPlaying.track.coverArt}`} alt="cover art" className="w-12 h-12 rounded-md"/>
                    <div>
                        <h1>{currentlyPlaying?.track.title}</h1>
                        <h1>{currentlyPlaying?.track.artist} - {currentlyPlaying?.track.album}</h1>
                    </div>
                </div>
                <div className='flex justify-center items-center'>
                    <DropdownComponent index={queue.currentSong.index} song={currentlyPlaying?.track}/>
                </div>
            </div>
        </div>
        <div className='mt-8 mb-2 mr-10 text-2xl font-bold'>
            Up Next
        </div>
            <div className='space-y-3'>
                {queue.songs.map((song, index) => (
                    <>
                        {index > queue.currentSong.index && (
                            <div className='flex justify-between'>
                                <div className='flex space-x-4'>
                                
                                    <img src={`${baseUrl}&id=${song.coverArt}`} alt="cover art" className="w-12 h-12 rounded-md" onClick={() => setSong(index)}/>
                                    <div>
                                        <h1>{song.title}</h1>
                                        <h1>{song.artist} - {song.album}</h1>
                                    </div>
                                </div>
                                <div className='flex justify-center items-center'>
                                    <DropdownComponent index={index} song={song}/>
                                </div>
                            </div>
                        )}
                    </>
                ))}
            </div>
        </div>
    );
}

function DropdownComponent({index , song}: {index: number, song: Song}) {

    const removeFromQueue = useQueueStore(state => state.removeFromQueue)


    const handleRemove = (index: number) => {
        console.log(index)  
        removeFromQueue(index)
    }

    return (
        <Dropdown
        classNames={{
            content: "bg-background border-border border rounded-xl backdrop-blur-xl",
        }}
        >
            <DropdownTrigger>
                <Ellipsis size={24} />
            </DropdownTrigger>
            <DropdownMenu  className='text-sm'>
                <DropdownItem onClick={() => handleRemove(index)}>Remove from Queue</DropdownItem>
            </DropdownMenu>
        </Dropdown>
    )
}