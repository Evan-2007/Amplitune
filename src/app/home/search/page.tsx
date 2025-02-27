'use client';
import { SourceManager } from '@/lib/sources/source-manager';
import { useSearchParams } from 'next/navigation';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Suspense } from 'react';

export default function Search() {
  const sourceManager = SourceManager.getInstance();
  const [tab, setTab] = useState('Top Results');

  return (
    <div className='flex h-full w-full flex-col items-center'>
      <div className='flex w-11/12 flex-col items-center'>
        <div className='mb-3 mt-3 flex w-full flex-row items-end space-x-1 overflow-scroll scrollbar-none'>
          <Button
            variant={tab === 'Top Results' ? 'default' : 'secondary'}
            onClick={() => setTab('Top Results')}
          >
            <p>Top Results</p>
          </Button>
          <Button
            variant={tab === 'Tracks' ? 'default' : 'secondary'}
            onClick={() => setTab('Tracks')}
          >
            <p>Tracks</p>
          </Button>
          <Button
            variant={tab === 'Albums' ? 'default' : 'secondary'}
            onClick={() => setTab('Albums')}
          >
            <p>Albums</p>
          </Button>
          <Button
            variant={tab === 'Artists' ? 'default' : 'secondary'}
            onClick={() => setTab('Artists')}
          >
            <p>Artists</p>
          </Button>
          <Button
            variant={tab === 'Playlists' ? 'default' : 'secondary'}
            onClick={() => setTab('Playlists')}
          >
            <p>Playlists</p>
          </Button>
          <Button
            variant={tab === 'Videos' ? 'default' : 'secondary'}
            onClick={() => setTab('Videos')}
          >
            <p>Videos</p>
          </Button>
        </div>
        <Separator />
      </div>
      <div>
        <Suspense fallback={<div>Loading...</div>}>
          <Results tab={tab} />
        </Suspense>
      </div>
    </div>
  );
}

function Results({ tab }: { tab: string }) {
  const searchParams = useSearchParams();
  const search = searchParams.get('query');

  return null;
}
