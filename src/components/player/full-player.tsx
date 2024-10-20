'use client';
import { Song } from './types';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { CrossPlatformStorage } from '@/lib/storage/cross-platform-storage';
import { ScrollArea } from '@/components/ui/scroll-area';
import { extractColors } from 'extract-colors';
import Controls from './controls';
import Background from './background';
import { debounce } from 'lodash';
import { useCallback } from 'react';
import Lyrics from './lyrics';
import Left from './full-left';
import { useQueueStore } from '@/lib/queue';
import { usePlayerStore, useUiStore } from '@/lib/state';
import { subsonicURL } from '@/lib/servers/navidrome';
import { useRouter } from 'next/navigation';

import { useRef } from 'react';

export default function FullScreenPlayer({}: {}) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const storage = new CrossPlatformStorage();

  const songData = useQueueStore((state) => state.queue.currentSong?.track);

  const audioRef = usePlayerStore((state) => state.ref);

  const router = useRouter();

  const fullScreen = useUiStore((state) => state.fullScreenPlayer);
  const setFullScreen = useUiStore((state) => state.toggleFullScreenPlayer);

  const container = useRef<HTMLDivElement>(null);
  function handleClose() {
    container.current?.classList.add('animate-[shrink-height_.3s_ease-out]');
    setTimeout(() => {
      setFullScreen();
    }, 300);
  }

  useEffect(() => {
    if (container.current) {
      container.current.addEventListener;
    }
  }, [container]);

  interface FinalColor {
    hex: string;
    area: number;
  }

  const [colors, setColors] = useState<FinalColor[]>([]);

  useEffect(() => {
    updateImageUrl();
  }, [songData]);

  const updateImageUrl = async () => {
    if (songData) {
      const url = await subsonicURL(
        '/rest/getCoverArt',
        `&id=${songData.coverArt}`
      );
      if (url === 'error') {
        router.push('/servers');
      }
      setImageUrl(url.toString());
    }
  };

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
  }

  useEffect(() => {
    getImageColors();
  }, [imageUrl]);

  const getImageColors = async () => {
    if (imageUrl) {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const image = URL.createObjectURL(blob);
      extractColors(image).then((colors) => {
        const sortedColors = colors.sort((a, b) => b.area - a.area);
        const filteredColors = sortedColors
          .filter((color) => {
            const rgb = hexToRgb(color.hex);
            //!(rgb.r > 240 && rgb.g > 240 && rgb.b > 240) &&
            return color.area > 0.02;
          })
          .sort((a, b) => {
            const rgbA = hexToRgb(a.hex);
            const rgbB = hexToRgb(b.hex);
            const brightnessA =
              0.299 * rgbA.r + 0.587 * rgbA.g + 0.114 * rgbA.b;
            const brightnessB =
              0.299 * rgbB.r + 0.587 * rgbB.g + 0.114 * rgbB.b;
            return brightnessA - brightnessB;
          });
        console.log(filteredColors);
        setColors(filteredColors);
      });
    }
  };

  function hexToRgb(hex: string) {
    const bigint = parseInt(hex.slice(1), 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return { r, g, b };
  }

  if (!fullScreen) return null;

  return (
    <div
      className='relative bottom-0 z-50 h-screen w-screen animate-[grow-height_.3s_ease-out]'
      ref={container}
      style={
        colors.length > 0
          ? {
              background: `${colors[0].hex} linear-gradient(180deg, ${colors[0].hex}, ${colors[0].hex})`,
            }
          : { background: 'linear-gradient(180deg, #000, #000)' }
      }
    >
      <div className='absolute z-50 flex h-full w-full'>
        <Left audioRef={audioRef} />
        <div className='flex h-full w-1/2 flex-col items-center justify-center'>
          {songData && <Lyrics audioRef={audioRef} />}
        </div>
      </div>
      <div
        className='absolute right-4 top-4 z-50 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border border-border bg-slate-700 opacity-40 transition-all duration-300 hover:opacity-90'
        onClick={() => handleClose()}
      >
        <X className='color-white' size={24} />
      </div>
      <div className='absolute'>
        <Background colors={colors.slice(1).map((color) => color.hex)} />
      </div>
    </div>
  );
}
