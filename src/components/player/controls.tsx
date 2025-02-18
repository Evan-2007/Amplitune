import React, { useState, useEffect, useCallback } from 'react';
import { Shuffle, Repeat, Repeat1 } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { SourceManager } from '@/lib/sources/source-manager';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { song } from '@/lib/sources/types';
import { cn } from '@/lib/utils';
import { useQueueStore } from '@/lib/queue';
import { usePlayerStore } from '@/lib/state';

interface ControlsProps {
  songData: song;
  className?: string;
}

const Controls: React.FC<ControlsProps> = ({ className }) => {
  const playing = usePlayerStore((state) => state.playing);
  const setPlaying = usePlayerStore((state) => state.setPlaying);

  const [shuffle, setShuffle] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [sliderValue, setSliderValue] = useState<number>(0);
  const [sliderActive, setSliderActive] = useState<boolean>(false);
  const [length, setLength] = useState<number>(0);

  const sourceManager = SourceManager.getInstance();
  const skip = useQueueStore((state) => state.skip);
  const previous = useQueueStore((state) => state.playPrevious);
  const songData = useQueueStore((state) => state.currentSong?.track);
  const repeat = useQueueStore((state) => state.queue.repeat);
  const setRepeat = useQueueStore((state) => state.setRepeat);


  const timeLeft = length - currentTime;
  const timeLeftString = `-${sourceManager.formatTime(timeLeft)}`;
  const sliderTimestamp = sourceManager.formatTime((length * sliderValue) / 1000);

  


  useEffect(() => {
    const cleanup = sourceManager.onTimeUpdate((position, duration) => {
//      console.log(position, duration);
      setCurrentTime(position);
      setLength(duration);
      
      if (!sliderActive) {
        setSliderValue((position / duration) * 1000);
      }
    });

    return cleanup;
  }, []);

  // Subscribe to play/pause updates 
  useEffect(() => {
    const cleanup = sourceManager.onPlayPause((playing) => {
      console.log(playing);
      setPlaying(playing);
    });

    return cleanup;
  }, []);

  const handleRepeat = async() => {
    if (repeat === 0) {
      setRepeat(1);
      sourceManager.setRepeat(false);
    } else if (repeat === 1) {
      setRepeat(2);
      //toggle repeat in sourceManager
      sourceManager.setRepeat(true);
    } else {
      setRepeat(0);
      sourceManager.setRepeat(false);
    }
      
  }

  // Handle play/pause
  const handlePlayPause = async () => {
    console.log(playing)
    if (playing === 'playing') {
      await sourceManager.pause();
      setPlaying('paused');
    } else {
      await sourceManager.play();
      setPlaying('playing');
    }
  };

  useEffect(() => {
    if (playing === 'ended') {
      skip();
    }
  } , [playing]);

  // Handle seek
  const handleSliderCommit = async (value: number) => {
    const time = (length * value) / 1000;
    setSliderActive(false);
    setSliderValue(value);
    await sourceManager.seek(time);
  };

  // Handle previous
  const handlePrevious = async () => {
    if (currentTime > 5) {
      await sourceManager.seek(0);
    } else {
      previous();
    }
  };

  const toggleShuffle = () => setShuffle(!shuffle);

  return (
    <div className={cn('flex h-full flex-shrink-0 flex-col', className)}>
      <div className='mt-2 flex h-full items-center justify-center space-x-2'>
        <div className='w-9'></div>
        <button onClick={toggleShuffle}>
          <Shuffle
            color={shuffle ? 'red' : 'currentColor'}
            strokeWidth={shuffle ? 3 : 2.5}
            size={20}
          />
        </button>
        <button onClick={handlePrevious}>
          <ControlButton icon='previous' />
        </button>
        <button onClick={handlePlayPause}>
          {playing == 'playing' ? <PauseIcon /> : <PlayIcon />}
        </button>
        <button onClick={() => skip()}>
          <ControlButton icon='next' />
        </button>
        <button onClick={() => handleRepeat()}>
          {repeat === 2 ? (
            <Repeat1 color='red' strokeWidth={2.5} size={24} />
          ) : repeat === 1 ? (
            <Repeat strokeWidth={2.5} color='red' size={24} />
          ) : (
            <Repeat strokeWidth={2.5} size={24} />
          )}
        </button>
        <div className='w-4'></div>
      </div>
      <div className='mb-4 flex flex-row items-center justify-center'>
        <div className='w-9 text-left'>
          <p>{sourceManager.formatTime(currentTime)}</p>
        </div>
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Slider
                max={1000}
                step={1}
                className='mx-2 w-[60vw] md:w-96'
                value={[Math.round(sliderValue)]}
                onValueChange={(e: number[]) => setSliderValue(e[0])}
                onValueCommit={(e: number[]) => handleSliderCommit(e[0])}
                onPointerDown={() => setSliderActive(true)}
                onPointerUp={() => setSliderActive(false)}
              />
            </TooltipTrigger>
            <TooltipContent sideOffset={4}>{sliderTimestamp}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <div className='w-4 text-nowrap text-left'>
          <p>{timeLeftString == '-NaN:NaN' ? 'Loading' : timeLeftString}</p>
        </div>
      </div>
    </div>
  );
};

interface ControlButtonProps {
  icon: 'previous' | 'next';
  onClick?: () => void;
}

const ControlButton: React.FC<ControlButtonProps> = ({ icon }) => (
  <svg
    xmlns='http://www.w3.org/2000/svg'
    viewBox='0 0 24 24'
    fill='currentColor'
    className='size-[30px]'
  >
    <path
      d={
        icon === 'next'
          ? 'M5.055 7.06C3.805 6.347 2.25 7.25 2.25 8.69v8.122c0 1.44 1.555 2.343 2.805 1.628L12 14.471v2.34c0 1.44 1.555 2.343 2.805 1.628l7.108-4.061c1.26-.72 1.26-2.536 0-3.256l-7.108-4.061C13.555 6.346 12 7.249 12 8.689v2.34L5.055 7.061Z'
          : 'M9.195 18.44c1.25.714 2.805-.189 2.805-1.629v-2.34l6.945 3.968c1.25.715 2.805-.188 2.805-1.628V8.69c0-1.44-1.555-2.343-2.805-1.628L12 11.029v-2.34c0-1.44-1.555-2.343-2.805-1.628l-7.108 4.061c-1.26.72-1.26 2.536 0 3.256l7.108 4.061Z'
      }
    />
  </svg>
);

const PlayIcon: React.FC = () => (
  <svg
    xmlns='http://www.w3.org/2000/svg'
    viewBox='0 0 24 24'
    fill='currentColor'
    className='size-[30px]'
  >
    <path
      fillRule='evenodd'
      d='M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z'
      clipRule='evenodd'
    />
  </svg>
);

const PauseIcon: React.FC = () => (
  <svg
    xmlns='http://www.w3.org/2000/svg'
    viewBox='0 0 24 24'
    fill='currentColor'
    className='size-[30px]'
  >
    <path
      fillRule='evenodd'
      d='M6.75 5.25a.75.75 0 0 1 .75-.75H9a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H7.5a.75.75 0 0 1-.75-.75V5.25Zm7.5 0A.75.75 0 0 1 15 4.5h1.5a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H15a.75.75 0 0 1-.75-.75V5.25Z'
      clipRule='evenodd'
    />
  </svg>
);

export default Controls;
