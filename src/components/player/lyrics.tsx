import { Song } from './types';
import {song } from '@/lib/sources/types';
import { useEffect, useState, useRef, useCallback } from 'react';
import { CrossPlatformStorage } from '@/lib/storage/cross-platform-storage';
import { debounce } from 'lodash';
import Queue from '@/assets/queue.svg';
import LyricsSVG from '@/assets/lyrics.svg';
import { MessageSquareQuote } from 'lucide-react';
import { useQueueStore } from '@/lib/queue';
import { ScrollArea } from '../ui/scroll-area';
import { useRouter } from 'next/navigation';
import { CirclePlay } from 'lucide-react';
import { Ellipsis } from 'lucide-react';
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownSection,
  DropdownItem,
} from '@nextui-org/dropdown';
import { subsonicURL } from '@/lib/sources/navidrome';
import {SourceManager} from '@/lib/sources/source-manager'
import {ErrorLyrics} from '@/lib/sources/types'

export default function Lyrics({
  tab,
  setTab,
  isMobile,
}: {
  tab: number;
  setTab: React.Dispatch<React.SetStateAction<number>>;
  setMobile: boolean;
}) {
  interface LyricLine {
    start?: number;
    value: string;
  }

  const currentQueue = useQueueStore((state) => state.queue);
  const sourceManager = SourceManager.getInstance();

  const localStorage = new CrossPlatformStorage();

  const [lyrics, setLyrics] = useState<LyricLine[] | null>(null);
  const [currentLine, setCurrentLine] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [isMouseMoving, setIsMouseMoving] = useState<boolean>(false);
  const [synced, setSynced] = useState<boolean>(false);

  const router = useRouter();

  const lyricsContainerRef = useRef<HTMLDivElement>(null);

  const songData = useQueueStore((state) => state.queue.currentSong?.track);

  useEffect(() => {
      console.log(lyrics);
      const handleTimeUpdate = () => {
        const currentTime = sourceManager.getPosition();
        if (currentTime && lyrics) {
          const milliseconds = currentTime * 1000;
          const currentLineIndex = lyrics.findIndex(
            //@ts-ignore
            (line) => line.start > milliseconds
          );
          setCurrentLine(currentLineIndex - 1);
        }
      };

      const removeEventListner = sourceManager.onTimeUpdate(handleTimeUpdate);
      return () => {
        removeEventListner();
      };
  }, [lyrics]);

  useEffect(() => {
    fetchLyrics();
    //scroll to top of lyrics
    setCurrentLine(0);
  }, [songData]);

  
  useEffect(() => {
    if (lyricsContainerRef.current && synced) {
      const container = lyricsContainerRef.current;
      const currentLineElement = container.querySelector(
        `[data-line="${currentLine}"]`
      );
      if (currentLineElement && isMobile) {
        const elementRect = currentLineElement.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const targetOffset = window.innerHeight * 0.2; // 20vh

        container.scrollTop =
          container.scrollTop +
          (elementRect.top - containerRect.top) -
          targetOffset;
      } else if (currentLineElement) {
        currentLineElement.scrollIntoView({
          block: 'center',
        });
      }
    }
  }, [tab, isMobile]);

  useEffect(() => {
    if (lyricsContainerRef.current && !isMouseMoving) {
      const container = lyricsContainerRef.current;
      const currentLineElement = container.querySelector(
        `[data-line="${currentLine}"]`
      );
      if (currentLineElement && isMobile) {
        const elementRect = currentLineElement.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const targetOffset = window.innerHeight * 0.23; // 20vh

        container.scrollTo({
          top:
            container.scrollTop +
            (elementRect.top - containerRect.top) -
            targetOffset,
          behavior: 'smooth',
        });
      } else if (currentLineElement) {
        currentLineElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    }
  }, [currentLine, isMouseMoving, isMobile]);

  const debouncedMouseStop = useCallback(
    debounce(() => {
      setIsMouseMoving(false);
    }, 2000),
    []
  );

  const debounceTouchStop = useCallback(
    debounce(() => {
      setIsMouseMoving(false);
    }, 5000),
    []
  );

  const handleMouseMove = useCallback(() => {
    setIsMouseMoving(true);
    isMobile ? debouncedMouseStop() : debounceTouchStop();
  }, [debouncedMouseStop]);

  async function fetchLyrics() {



    const lyrics = await sourceManager.getLyrics(currentQueue.currentSong.track.id);
    if ((lyrics as ErrorLyrics).error) {
      console.error('An error occurred:', (lyrics as ErrorLyrics).error);
      setLyrics(null);
      setError('An error occurred while fetching the lyrics');
    } else {
      console.log(lyrics);
      if ('lines' in lyrics && 'synced' in lyrics) {
        setLyrics(lyrics.lines);
        setSynced(lyrics.synced);
      } else {
        setError('An error occurred while fetching the lyrics');
      }
    }
  }

 
  function handleLyricClick(index: number) {
    if ( lyricsContainerRef) {
      const line = lyrics?.[index];
      if (line) {
        if (!synced || !line.start) {
          return;
        }
        const seconds = line.start / 1000;
        sourceManager.seek(seconds);
        setCurrentLine(index);
        sourceManager.play();
        setIsMouseMoving(false);
      }
    }
  }

  const currentlyPlaying = useQueueStore((state) => state.queue.currentSong);

  return (
    <div className='relative flex h-full w-full justify-center overflow-hidden overflow-x-clip overscroll-none md:items-center'>
      <div
        ref={lyricsContainerRef}
        className={`${synced ? 'py-[20vh] md:py-[50vh]' : 'py-[10vh]'} no-scrollbar group flex h-full w-full flex-col items-center overflow-y-auto overflow-x-hidden overscroll-none md:mr-10`}
        style={{ scrollBehavior: 'smooth' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setIsMouseMoving(false)}
        onTouchStart={handleMouseMove}
        onTouchMove={handleMouseMove}
        onTouchEnd={handleMouseMove}
      >
        {tab === 1 &&
          lyrics &&
          synced &&
          lyrics.map((line, index) => (
            <button key={index} onClick={() => handleLyricClick(index)}>
              <p
                data-line={index}
                className={`z-40 animate-[fade-in] text-wrap px-10 pb-6 text-center text-3xl font-bold drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)] transition-all duration-1000 ease-in-out md:px-16 md:pb-12 md:text-6xl ${index === currentLine ? 'scale-110 pb-10 text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]' : index > currentLine && !isMouseMoving ? 'scale-[80%] text-gray-400 blur-[7px]' : index > currentLine && isMouseMoving ? 'scale-[80%] text-gray-400 blur-0' : isMouseMoving ? 'group-hover:scale-[80%] group-hover:opacity-100' : 'text-gray-400 opacity-0 blur-[7px] transition-all duration-1000'} `}
              >
                {line.value}
              </p>

              {line.value === '' && index === currentLine && (
                <div className='mb-10 flex gap-2'>
                  <div className='aspect-square w-10 scale-75 animate-[pulse_3s_ease-out_infinite] rounded-full bg-white pb-4 pt-4'></div>
                  <div className='aspect-square w-10 scale-75 animate-[pulse_3s_ease-out_infinite] rounded-full bg-white pb-4 pt-4 delay-200'></div>
                  <div className='aspect-square w-10 scale-75 animate-[pulse_3s_ease-out_infinite] rounded-full bg-white pb-4 pt-4 delay-500'></div>
                </div>
              )}
            </button>
          ))}

        <div className='mb-[30vh] flex h-full w-full flex-col items-center justify-start'>
          {tab === 1 &&
            lyrics &&
            !synced &&
            lyrics.map((line, index) => (
              <div key={index}>
                <p className='mt-6 text-center text-4xl font-bold text-gray-400 drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]'>
                  {line.value}
                </p>
              </div>
            ))}
        </div>

        {tab === 1 && !lyrics && (
          <p className='mt-6 text-center text-4xl font-bold text-gray-400 drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]'>
            No lyrics found
          </p>
        )}

        {tab === 2 && <QueueList isMouseMoving={isMouseMoving} />}

        <div
          className={`absolute bottom-24 flex w-full items-center justify-center transition-all duration-1000 ease-in-out ${isMouseMoving ? 'opacity-100' : 'opacity-100'} max-md:hidden`}
        >
          <div
            className={`h-11 w-64 rounded-md transition-all duration-1000 ease-in-out ${isMouseMoving ? 'bg-gray-900/70 backdrop-blur-[5px]' : 'bg-gray-900/0'}`}
          >
            <div
              className={`${isMouseMoving ? 'opacity-100' : 'opacity-0'} absolute flex h-full w-full items-center align-middle transition-all duration-1000 ease-in-out`}
            >
              <div className='absolute z-50 h-full w-full p-1'>
                <div
                  className={`absolute left-0 z-50 h-9 w-32 transform rounded-md bg-gray-600 px-1 transition-all duration-500 ease-in-out ${tab === 1 ? 'ml-1 translate-x-0' : 'ml-[-4px] translate-x-full'} `}
                ></div>
              </div>
              <div
                className='z-[60] flex h-full w-3/6 items-center justify-center'
                onClick={() => setTab(1)}
              >
                <MessageSquareQuote
                  size={32}
                  className='z-50 pl-1'
                  onClick={() => setTab(1)}
                />
              </div>
              <div
                className='z-[60] flex h-full w-3/6 items-center justify-center'
                onClick={() => setTab(2)}
              >
                <Queue className='z-50 h-8 w-10 fill-white pr-1' />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function QueueList({ isMouseMoving }: { isMouseMoving: boolean }) {
  const currentlyPlaying = useQueueStore((state) => state.queue.currentSong);
  const queue = useQueueStore((state) => state.queue);
  const [baseUrl, setBaseUrl] = useState<string | undefined>(undefined);

  const scrollRef = useRef<HTMLDivElement>(null);
  const currentSongElement = useRef<HTMLDivElement>(null);

  const localStorage = new CrossPlatformStorage();
  const setSong = useQueueStore((state) => state.setCurrentSong);
  const removeFromQueue = useQueueStore((state) => state.removeFromQueue);
  const clearQueue = useQueueStore((state) => state.clearQueue);

  useEffect(() => {
    setBaseImageUrl();
  }, []);

  const setBaseImageUrl = async () => {
    setBaseUrl(await subsonicURL('/rest/getCoverArt', ''));
  };

  useEffect(() => {
    if (scrollRef.current && !isMouseMoving) {
      currentSongElement.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [isMouseMoving]);

  return (
    <div
      className={`no-scrollbar absolute top-24 flex h-[75vh] w-9/12 animate-[fade-in] flex-col overflow-auto backdrop-opacity-0 transition-all duration-700 max-md:bg-card/30 ${isMouseMoving && 'bg-card/60 backdrop-blur-md backdrop-opacity-100'} overscroll-none rounded-2xl p-10`}
    >
      <div className='top-24 flex justify-between'>
        <div></div>
        <div>
          <button onClick={() => clearQueue([])}>
            <h1>Clear</h1>
          </button>
        </div>
      </div>
      <div className='mb-2 mr-10 mt-8 text-2xl font-bold'>Previous</div>
      <div className='space-y-2'>
        {baseUrl !== undefined &&
          queue.songs.map((song, index) => (
            <>
              {index < queue.currentSong.index && (
                <div className='flex justify-between'>
                  <div className='group/image flex space-x-4'>
                    <div className='' onClick={() => setSong(index)}>
                      <img
                        src={song.imageUrl}
                        alt='cover art'
                        className='absolute h-12 w-12 rounded-md'
                      />
                      <div className='invisible z-50 flex h-12 w-12 cursor-pointer items-center justify-center rounded-md bg-card/20 opacity-0 backdrop-blur-[2px] transition-all duration-300 ease-in group-hover/image:visible group-hover/image:opacity-100'>
                        <CirclePlay
                          className='m-auto h-8 w-8 text-white'
                          strokeWidth={0.8}
                        />
                      </div>
                    </div>
                    <div>
                      <h1>{song.title}</h1>
                      <h1>
                        {song.artist} - {song.album}
                      </h1>
                    </div>
                  </div>
                  <div className='flex items-center justify-center'>
                    <DropdownComponent index={index} song={song} />
                  </div>
                </div>
              )}
            </>
          ))}
      </div>
      <div>
        <h1
          className='mb-2 mr-10 mt-8 text-2xl font-bold'
          ref={currentSongElement}
        >
          Playing
        </h1>
        <div className='flex justify-between'>
          <div className='flex space-x-4'>
            <img
              src={currentlyPlaying.track.imageUrl}
              alt='cover art'
              className='h-12 w-12 rounded-md'
            />
            <div>
              <h1>{currentlyPlaying?.track.title}</h1>
              <h1>
                {currentlyPlaying?.track.artist} -{' '}
                {currentlyPlaying?.track.album}
              </h1>
            </div>
          </div>
          <div className='flex items-center justify-center'>
            <DropdownComponent
              index={queue.currentSong.index}
              song={currentlyPlaying?.track}
            />
          </div>
        </div>
      </div>
      <div className='mb-2 mr-10 mt-8 text-2xl font-bold'>Up Next</div>
      <div className='space-y-3'>
        {queue.songs.map((song, index) => (
          <>
            {index > queue.currentSong.index && (
              <div className='flex justify-between'>
                <div className='group/image flex space-x-4'>
                  <div className='' onClick={() => setSong(index)}>
                    <img
                      src={currentlyPlaying.track.imageUrl}
                      alt='cover art'
                      className='absolute h-12 w-12 rounded-md'
                    />
                    <div className='invisible z-50 flex h-12 w-12 cursor-pointer items-center justify-center rounded-md bg-card/20 opacity-0 backdrop-blur-[2px] transition-all duration-300 ease-in group-hover/image:visible group-hover/image:opacity-100'>
                      <CirclePlay
                        className='m-auto h-8 w-8 text-white'
                        strokeWidth={0.8}
                      />
                    </div>
                  </div>
                  <div>
                    <h1>{song.title}</h1>
                    <h1>
                      {song.artist} - {song.album}
                    </h1>
                  </div>
                </div>
                <div className='flex items-center justify-center'>
                  <DropdownComponent index={index} song={song} />
                </div>
              </div>
            )}
          </>
        ))}
      </div>
    </div>
  );
}

function DropdownComponent({ index, song }: { index: number; song: song }) {
  const removeFromQueue = useQueueStore((state) => state.removeFromQueue);

  const handleRemove = (index: number) => {
    console.log(index);
    removeFromQueue(index);
  };

  return (
    <Dropdown
      classNames={{
        content:
          'bg-background border-border border rounded-xl backdrop-blur-xl',
      }}
    >
      <DropdownTrigger>
        <Ellipsis size={24} />
      </DropdownTrigger>
      <DropdownMenu className='text-sm'>
        <DropdownItem onClick={() => handleRemove(index)}>
          Remove from Queue
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
}
