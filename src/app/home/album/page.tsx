'use client';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/song-display/header';
import { SourceManager } from '@/lib/sources/source-manager';
import { useEffect, useState } from 'react';
import { AlbumData } from '@/lib/sources/types';
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

  const [albumData, setAlbumData] = useState<AlbumData | null>(null);

  useEffect(() => {
    if (id && source) {
      sourceManager.getAlbumData(id, source).then((data) => {
        setAlbumData(data);
        console.log('Album data fetched:', data);
      });
    }
  }, [id, source]);

  if (!albumData) {
    return <div>Loading album data...</div>;
  }

  return (
    <div className='flex h-full w-full flex-col items-center'>
      <Header type='album' data={albumData} />
      <Separator className='my-2 mt-4 w-11/12' />
      {albumData.tracks && albumData.tracks.length > 0 && (
        <SongList songs={albumData.tracks} />
      )}
    </div>
  );
}
