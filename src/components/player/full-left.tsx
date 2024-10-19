'use client';
import { Song } from './types';
import Controls from './controls';
import { useEffect, useState, useCallback } from 'react';
import { debounce } from 'lodash';
import { useQueueStore } from '@/lib/queue';
import { CrossPlatformStorage } from '@/lib/storage/cross-platform-storage';
import { useRouter } from 'next/navigation';
import { subsonicURL } from '@/lib/servers/navidrome';

export default function Left({
  audioRef,
}: {
  audioRef: React.RefObject<HTMLAudioElement>;
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
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    if (songData) {
      setImage();
    }
  }, [songData, credentials]);

  const setImage = async () => {
    const url = await subsonicURL(
      '/rest/getCoverArt',
      `&id=${songData.coverArt}`
    );
    if (url === 'error') {
      router.push('/servers');
    }
    setImageUrl(url.toString());
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
    setCredentials({ username, password, salt });
  }

  const handleMouseMove = useCallback(() => {
    setIsMouseMoving(true);
    debouncedMouseStop();
  }, [debouncedMouseStop]);
  return (
    <div
      className='group z-50 flex h-full w-1/2 flex-col items-center justify-center'
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setIsMouseMoving(false)}
    >
      {songData && imageUrl && songData.title ? (
        <>
          <img
            src={imageUrl}
            alt=''
            className='aspect-square max-h-[58.33%] rounded-2xl border-[1px] border-border'
          />
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
        <div className='aspect-square max-h-[58.33%] bg-gray-800'></div>
      )}
      <div
        className={`'w-full h-0 ${isMouseMoving && 'mt-6'} ' transition-all duration-700`}
      >
        <div
          className={`pulse_3s_ease-out_infinite opacity-0 transition-opacity duration-700 ${isMouseMoving && 'opacity-100'}`}
        >
          <Controls songData={songData} />
        </div>
      </div>
    </div>
  );
}
