'use client';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/song-display/header';
import { SourceManager } from '@/lib/sources/source-manager';
import { useEffect, useState } from 'react';
import { Playlist } from '@/lib/sources/types';
import { SongList } from '@/components/song-display/song-list';
import { Separator } from '@/components/ui/separator';

export default function Page() {
  return (
    <div className='flex h-full w-full flex-col items-center'>
      <Suspense fallback={<div>Loading...</div>}>
        <Album />
      </Suspense>
    </div>
  );
}

function Album() {
  const sourceManager = SourceManager.getInstance();

  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const source = searchParams.get('source');

  const [playlistData, setPlaylistData] = useState<Playlist | null>(null);

  useEffect(() => {
    if (id && source) {
      sourceManager.getPlaylistById(id, source).then((data) => {
        setPlaylistData(data);
        console.log('Album data fetched:', data);
      });
    }
  }, [id, source]);

  if (!playlistData) {
    return <div>Loading album data...</div>;
  }

  return (
    <div className='flex h-full w-full flex-col items-center'>
      <Header type='playlist' data={playlistData} />
      <Separator className='my-2 mt-4 w-11/12' />
      {playlistData.tracks && playlistData.tracks.length > 0 && (
        <SongList songs={playlistData.tracks} />
      )}
    </div>
  );
}
