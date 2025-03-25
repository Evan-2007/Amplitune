'use client';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Suspense, useEffect, useState } from 'react';
import { Separator } from '@/components/ui/separator';
import { useQueueStore } from '@/lib/queue';
import { SourceManager } from '@/lib/sources/source-manager';
import { song as Song } from '@/lib/sources/types';
import NavidromeIcon from '@/assets/navidrome_dark.svg';
import { GetListByKeyword, VideoItem } from '@/lib/youtubeSearch';

export default function YourComponent() {

  const sourceManager = SourceManager.getInstance();
  const play = useQueueStore((state) => state.play);
  const addToQueue = useQueueStore((state) => state.addToQueue);

  return (
    <div className='flex h-full w-full flex-col items-center'>
      <Suspense fallback={<div>Loading...</div>}>
        <Top />
      </Suspense>
      <Suspense fallback={<div>Loading...</div>}>
        {typeof window !== 'undefined' && window.isTauri && <Videos />}
      </Suspense>
    </div>
  );
}

function Top() {
  const searchParams = useSearchParams();
  const paramsObject = Object.fromEntries(searchParams.entries()) as any;
  const play = useQueueStore((state) => state.play);
  const addToQueue = useQueueStore((state) => state.addToQueue);

  const fromattedParams = {
    ...paramsObject,
    duration: parseInt(paramsObject.duration, 10),
    availableSources: paramsObject.availableSources.split(','),
  } as Song;

  return (
    <div className='flex h-full w-full flex-col items-center pt-16 max-lg:items-center lg:flex-row lg:pl-24'>
      <Image
        src={paramsObject.imageUrl}
        alt='Logo'
        width={300}
        height={300}
        className='rounded-xl'
      />
      <div className='flex h-full flex-col justify-center max-lg:mt-3 lg:ml-10'>
        <div className='flex flex-col items-center justify-center lg:items-start'>
          <h1 className='text-2xl font-bold'>{paramsObject.title}</h1>
          <h2 className='text-xl text-gray-400'>{paramsObject.artist}</h2>
          <h3 className='text-md text-gray-500'>{paramsObject.album}</h3>
          <h3 className='text-md text-gray-500'>
            {Math.floor(paramsObject.duration / 1000 / 60)}:
            {Math.floor(paramsObject.duration / 1000) % 60 < 10
              ? '0' + (Math.floor(paramsObject.duration / 1000) % 60)
              : Math.floor(paramsObject.duration / 1000) % 60}
          </h3>
        </div>
        <div className='mb-2 flex w-full flex-row items-end max-lg:mt-3 max-lg:justify-center lg:mt-10 lg:h-full'>
          <button
            onClick={() => play(fromattedParams)}
            className='flex items-center justify-center rounded-xl bg-red-700 p-2 text-white hover:bg-red-600'
          >
            Play
            <div className='ml-2 h-4 w-4'>
              {paramsObject.source === 'navidrome' && <NavidromeIcon />}
              {paramsObject.source === 'tidal' && <TidalLogo />}
              {paramsObject.source === 'musicKit' && <AMusicLogo />}
            </div>
          </button>
          <button
            className='ml-4 flex items-center justify-center rounded-xl bg-gray-700 p-2 text-white hover:bg-gray-600'
            onClick={() => addToQueue(fromattedParams)}
          >
            Add to Queue
          </button>
        </div>
      </div>
    </div>
  );
}

function Videos() {
  const searchParams = useSearchParams();
  const paramsObject = Object.fromEntries(searchParams.entries()) as any;
  const play = useQueueStore((state) => state.play);
  const addToQueue = useQueueStore((state) => state.addToQueue);

  const fromattedParams = {
    ...paramsObject,
    duration: parseInt(paramsObject.duration, 10),
    availableSources: paramsObject.availableSources.split(','),
  } as Song;
  const [videos, setVideos] = useState<VideoItem[]>([]);

  useEffect(() => {
    async function fetchVideos() {
      const results = await GetListByKeyword(
        `${paramsObject.title} ${paramsObject.artist}`,
        false,
        10
      );
      console.log(results);
      const filteredVideos = results.items.filter((result: any) => {
        return (
          result.title
            .toLowerCase()
            .includes(paramsObject.title.toLowerCase()) &&
          result.title.toLowerCase().includes(paramsObject.artist.toLowerCase())
        );
      });
      setVideos(filteredVideos);
      console.log(filteredVideos);
    }
    fetchVideos();
  }, [paramsObject.title]);

  return (
    <div className='flex w-full flex-col items-center pt-10'>
      <h1 className='text-2xl font-bold'>Videos</h1>
      <Separator className='my-2 w-1/2' />
      <div className='mt-4 flex w-full flex-row flex-wrap items-center justify-center space-x-6'>
        {videos.map((video) => (
          <div key={video.id}>
            <iframe
              src={`https://www.youtube.com/embed/${video.id}`}
              allow='fullscreen;'
            ></iframe>
          </div>
        ))}
      </div>
    </div>
  );
}

function AMusicLogo() {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      aria-label='Apple Music'
      role='img'
      viewBox='0 0 512 512'
    >
      <rect width='100%' height='100%' rx='15%' fill='url(#g)' />
      <linearGradient id='g' x1='.5' y1='.99' x2='.5' y2='.02'>
        <stop offset='0' stop-color='#FA233B' />
        <stop offset='1' stop-color='#FB5C74' />
      </linearGradient>
      <path
        fill='#ffffff'
        d='M199 359V199q0-9 10-11l138-28q11-2 12 10v122q0 15-45 20c-57 9-48 105 30 79 30-11 35-40 35-69V88s0-20-17-15l-170 35s-13 2-13 18v203q0 15-45 20c-57 9-48 105 30 79 30-11 35-40 35-69'
      />
    </svg>
  );
}

function TidalLogo() {
  return (
    <svg
      fill='#ffffff'
      viewBox='0 0 24 24'
      role='img'
      xmlns='http://www.w3.org/2000/svg'
    >
      <title>Tidal icon</title>
      <path d='M12.012 3.992L8.008 7.996 4.004 3.992 0 7.996 4.004 12l4.004-4.004L12.012 12l-4.004 4.004 4.004 4.004 4.004-4.004L12.012 12l4.004-4.004-4.004-4.004zM16.042 7.996l3.979-3.979L24 7.996l-3.979 3.979z' />
    </svg>
  );
}
