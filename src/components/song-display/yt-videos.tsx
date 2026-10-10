import React, { useEffect, useState } from 'react';
import { Play } from 'lucide-react';
import { GetListByKeyword, VideoItem } from '@/lib/youtubeSearch';
import { Section } from '@/components/media/media-card';

/** YouTube videos matching a track. Only works in the desktop app. */
export function Videos({ title, artist }: { title: string; artist: string }) {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  // The player is only loaded for a video once it is clicked
  const [playing, setPlaying] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setVideos([]);
    setPlaying(null);
    GetListByKeyword(`${title} ${artist}`, false, 10)
      .then((results) => {
        if (cancelled) return;
        setVideos(
          (results?.items ?? []).filter(
            (video: VideoItem) =>
              video.type === 'video' &&
              video.title?.toLowerCase().includes(title.toLowerCase())
          )
        );
      })
      .catch((error) => console.error('Video search failed', error));
    return () => {
      cancelled = true;
    };
  }, [title, artist]);

  if (videos.length === 0) return null;

  return (
    <Section title='Videos'>
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3'>
        {videos.slice(0, 6).map((video) => (
          <div key={video.id} className='min-w-0'>
            <div className='relative aspect-video overflow-hidden rounded-md bg-muted'>
              {playing === video.id ? (
                <iframe
                  src={`https://www.youtube.com/embed/${video.id}?autoplay=1`}
                  title={video.title}
                  allow='autoplay; fullscreen'
                  className='h-full w-full'
                />
              ) : (
                <button
                  onClick={() => setPlaying(video.id)}
                  aria-label={`Play ${video.title}`}
                  className='group h-full w-full'
                >
                  <img
                    src={video.thumbnail?.[video.thumbnail.length - 1]?.url}
                    alt=''
                    loading='lazy'
                    className='h-full w-full object-cover'
                  />
                  <span className='absolute inset-0 flex items-center justify-center bg-black/30 text-white group-hover:bg-black/50'>
                    <Play className='h-8 w-8 fill-current' />
                  </span>
                </button>
              )}
            </div>
            <p className='mt-2 truncate text-sm'>{video.title}</p>
            {video.channelTitle && (
              <p className='truncate text-xs text-muted-foreground'>
                {video.channelTitle}
              </p>
            )}
          </div>
        ))}
      </div>
    </Section>
  );
}
