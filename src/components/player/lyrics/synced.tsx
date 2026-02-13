// SyncedLyrics.tsx
import React, { useEffect, useState } from 'react';
import {
  useLyrics,
  useSourceTimeUpdate,
  useSourceControls,
  useCurrentSong,
} from '@/lib/hooks';
import { NormalLyrics } from '@/lib/sources/types';
import { useSpringLyricScroll } from '@/lib/hooks/useSpringLyricsScroll';

type LyricLine = NormalLyrics['lines'][number];

interface LyricsDisplayProps {
  isMobile: boolean;
  containerRef: React.RefObject<HTMLDivElement>;
  isMouseMoving: boolean;
}

export function SyncedLyrics({
  isMobile,
  containerRef,
  isMouseMoving,
}: LyricsDisplayProps) {
  const { songData, currentSong } = useCurrentSong();
  const { position } = useSourceTimeUpdate();
  const { seek, play } = useSourceControls();

  const { lyrics, synced, error } = useLyrics(currentSong?.track?.id);

  const [currentLine, setCurrentLine] = useState<number>(0);

  const { scrollToLine, setLineRef, reset, pause, resume } = useSpringLyricScroll(
    containerRef,
    lyrics?.length || 0,
    {
      anchorPosition: isMobile ? 0.2 : 0.5,
    }
  );

  // Pause spring scroll when user is interacting, resume when they stop
  useEffect(() => {
    if (isMouseMoving) {
      pause();
    } else {
      resume();
    }
  }, [isMouseMoving, pause, resume]);

  // Update current lyric line based on song position
  useEffect(() => {
    if (position && lyrics) {
      const milliseconds = position * 1000;
      const currentLineIndex = lyrics.findIndex(
        (line: LyricLine) => (line.start ?? 0) > milliseconds
      );
      setCurrentLine(currentLineIndex - 1);
    }
  }, [position, lyrics]);

  // Reset on song change
  useEffect(() => {
    setCurrentLine(0);
    reset();
  }, [songData, reset]);

  // Spring scroll when current line changes (only when user isn't scrolling)
  useEffect(() => {
    if (!isMouseMoving && synced) {
      scrollToLine(currentLine);
    }
  }, [currentLine, isMouseMoving, synced, scrollToLine]);

  function handleLyricClick(index: number) {
    const line = lyrics?.[index];
    if (line) {
      if (!synced || !line.start) return;
      const seconds = line.start / 1000;
      seek(seconds);
      setCurrentLine(index);
      play();
    }
  }

  return (
    <>
      {error && (
        <p className='mt-6 text-center text-4xl font-bold text-gray-400 drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]'>
          {error}
        </p>
      )}
      {lyrics ? (
        synced ? (
          lyrics.map((line: LyricLine, index: number) => (
            <button
              key={index}
              onClick={() => handleLyricClick(index)}
              ref={setLineRef(index)}
              style={{ willChange: 'transform' }}
            >
              <p
                data-line={index}
                className={`z-40 animate-[fade-in] text-wrap px-10 pb-6 text-center text-3xl font-bold drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)] transition-all duration-1000 ease-in-out md:px-16 md:pb-12 md:text-6xl ${
                  index === currentLine
                    ? 'scale-110 pb-10 text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]'
                    : index > currentLine && !isMouseMoving
                      ? 'scale-[80%] text-gray-400 blur-[7px]'
                      : index > currentLine && isMouseMoving
                        ? 'scale-[80%] text-gray-400 blur-0'
                        : isMouseMoving
                          ? 'group-hover:scale-[80%] group-hover:opacity-100'
                          : 'text-gray-400 opacity-0 blur-[7px] transition-all duration-1000'
                }`}
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
          ))
        ) : (
          <div className='mb-[30vh] flex h-full w-full flex-col items-center justify-start'>
            {lyrics.map((line: LyricLine, index: number) => (
              <div key={index}>
                <p className='mt-6 text-center text-4xl font-bold text-gray-400 drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]'>
                  {line.value}
                </p>
              </div>
            ))}
          </div>
        )
      ) : (
        <p className='mt-6 text-center text-4xl font-bold text-gray-400 drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]'>
          No lyrics found
        </p>
      )}
    </>
  );
}