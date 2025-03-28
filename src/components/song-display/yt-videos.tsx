import React, { useEffect, useState } from 'react';
import { GetListByKeyword, VideoItem } from '@/lib/youtubeSearch';
import { Separator } from '@/components/ui/separator';

export function Videos({ title, artist }: { title: string; artist: string }) {
  const [videos, setVideos] = useState<VideoItem[]>([]);

  useEffect(() => {
    async function fetchVideos() {
      const results = await GetListByKeyword(`${title} ${artist}`, false, 10);
      console.log(results);
      const filteredVideos = results.items.filter((result: any) => {
        return (
          result.title.toLowerCase().includes(title.toLowerCase()) &&
          result.title.toLowerCase().includes(artist.toLowerCase())
        );
      });
      setVideos(filteredVideos);
      console.log(filteredVideos);
    }
    fetchVideos();
  }, [title]);

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
