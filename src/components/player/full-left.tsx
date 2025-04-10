'use client';
import { Song } from './types';
import Controls from './controls';
import { useEffect, useState, useCallback } from 'react';
import { debounce } from 'lodash';
import { useQueueStore } from '@/lib/queue';
import { CrossPlatformStorage } from '@/lib/storage/cross-platform-storage';
import { useRouter } from 'next/navigation';
import { subsonicURL } from '@/lib/sources/navidrome';

export default function Left({
  isMobile,
  tab,
}: {
  isMobile: boolean;
  tab: number;
}) {
  const [isMouseMoving, setIsMouseMoving] = useState<boolean>(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<{
    username: string;
    password: string;
    salt: string;
  } | null>(null);

  const songData = useQueueStore((state) => state.queue.currentSong?.track);

  const storage = new CrossPlatformStorage();

  const router = useRouter();

  const debouncedMouseStop = useCallback(
    debounce(() => {
      setIsMouseMoving(false);
    }, 2000),
    []
  );

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

  const handleMouseMove = useCallback(() => {
    setIsMouseMoving(true);
    debouncedMouseStop();
  }, [debouncedMouseStop]);
  return (
    <div
      className={`${tab === 0 || !isMobile ? 'group z-50 flex h-full w-full flex-col justify-center md:mt-0 md:w-1/2 md:items-center' : 'hidden'} animate-[fade-in] transition-all duration-1000 ease-in-out`}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setIsMouseMoving(false)}
    >
      {songData && songData.title ? (
        <>
          <div className='aspect-square rounded-2xl max-md:w-full md:h-[58.33%]'>
            <ImageSlider enabled={tab === 0 ? true : false} />
          </div>
          <div className='flex w-full flex-col overflow-hidden text-nowrap px-12 text-center'>
            <h1 className='mt-4 text-2xl font-bold text-white'>
              {songData.title}
            </h1>
            <h2 className='text-lg text-gray-300'>
              {songData.album} - {songData.artist}
            </h2>
          </div>
        </>
      ) : (
        <div className='aspect-square max-h-[58.33%] w-full bg-gray-800'></div>
      )}
      <div
        className={`'w-full ${isMouseMoving && 'md:mt-6'} ' transition-all duration-700`}
      >
        <div
          className={`pulse_3s_ease-out_infinite mr-6 mt-[3vh] transition-opacity duration-700 md:mt-0 md:opacity-0 ${isMouseMoving && 'md:opacity-100'}`}
        >
          {(tab === 0 || !isMobile) && <Controls songData={songData} />}
        </div>
      </div>
    </div>
  );
}

import { useRef, useLayoutEffect } from 'react';

function ImageSlider({ enabled = true }: { enabled: boolean }) {
  const queue = useQueueStore((state) => state.queue.songs);
  const currentSong = useQueueStore((state) => state.queue.currentSong);
  const setCurrentSong = useQueueStore((state) => state.setCurrentSong);

  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement | null>(null);
  const [currentIndex, setCurrentIndex] = useState(currentSong.index);
  const [images, setImages] = useState<{ url: string; id: string }[]>([]);
  const [startX, setStartX] = useState(0);
  const [translateX, setTranslateX] = useState(0);
  const [shouldAnimate, setShouldAnimate] = useState(true);

  const previousIndexRef = useRef(currentIndex);

  const GAP_SIZE = 32; // 2rem/32px gap

  useEffect(() => {
    const fetchImages = async () => {
      const imagePromises = queue.map(async (song) => {
        console.log(song);
        return {
          url: song.imageUrl,
          id: song.id,
        };
      });
      const images = await Promise.all(imagePromises);
      setImages(images);
    };

    fetchImages();
  }, [queue]);

  useEffect(() => {
    const previousIndex = previousIndexRef.current;
    const difference = Math.abs(currentSong.index - previousIndex);

    if (difference > 1) {
      setShouldAnimate(false);
    } else {
      setShouldAnimate(true);
    }

    setCurrentIndex(currentSong.index);

    // Reset shouldAnimate to prevent slider from not animating
    setTimeout(() => {
      setShouldAnimate(true);
    }, 100);

    previousIndexRef.current = currentSong.index;
  }, [currentSong.index]);

  const handleDragStart = (
    e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>
  ) => {
    if (e.type === 'touchstart' && 'touches' in e) {
      const pageX = e.touches[0].pageX;
      setStartX(pageX);
    } else if (e.type === 'mousedown' && 'pageX' in e) {
      const pageX = e.pageX;
      setStartX(pageX);
    }
    setIsDragging(true);
    setShouldAnimate(false);
  };

  const handleDragMove = (
    e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>
  ) => {
    if (!isDragging) return;

    const pageX =
      e.type === 'touchmove' && 'touches' in e
        ? e.touches[0].pageX
        : 'pageX' in e
          ? e.pageX
          : 0;
    const deltaX = pageX - startX;
    setTranslateX(deltaX);
  };

  const handleDragEnd = () => {
    if (!isDragging || !sliderRef.current) return;

    const slideWidth = sliderRef.current.clientWidth;
    // min distance to swipe
    const threshold = slideWidth / 4;

    if (translateX > threshold && currentIndex > 0) {
      // Swipe right
      setCurrentSong(currentIndex - 1);
    } else if (translateX < -threshold && currentIndex < images.length - 1) {
      // Swipe left
      setCurrentSong(currentIndex + 1);
    }

    setIsDragging(false);
    setTranslateX(0);
    setShouldAnimate(true);
  };

  if (images.length < 1) return null;

  return (
    <div className='mx-auto h-full w-full select-none'>
      <div className='relative h-full w-full overflow-hidden'>
        <div
          ref={sliderRef}
          className='relative h-full w-full cursor-grab select-none active:cursor-grabbing'
          onMouseDown={enabled ? handleDragStart : undefined}
          onMouseMove={enabled ? handleDragMove : undefined}
          onMouseUp={enabled ? handleDragEnd : undefined}
          onMouseLeave={enabled ? handleDragEnd : undefined}
          onTouchStart={enabled ? handleDragStart : undefined}
          onTouchMove={enabled ? handleDragMove : undefined}
          onTouchEnd={enabled ? handleDragEnd : undefined}
        >
          <div
            className={`flex h-full select-none space-x-[32px] ${
              shouldAnimate ? 'transition-transform duration-300 ease-out' : ''
            }`}
            style={{
              transform: `translateX(calc(-${currentIndex * 100}% + ${translateX}px - ${GAP_SIZE * currentIndex}px))`,
              userSelect: 'none',
            }}
          >
            {images.map((song, index) => (
              <div
                key={index}
                className='flex h-full w-full flex-shrink-0 select-none items-center justify-center'
                style={{ flex: '0 0 100%' }}
              >
                <img
                  src={song.url}
                  alt={`Slide ${index + 1}`}
                  className={`aspect-square rounded-2xl border-[1px] border-border max-md:w-5/6 md:h-full`}
                  draggable='false'
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
