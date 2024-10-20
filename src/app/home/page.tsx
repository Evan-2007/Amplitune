'use client';
import { navidromeApi, subsonicURL } from '@/lib/servers/navidrome';
import { useEffect } from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function HomePage() {
  const [baseUrl, setBaseUrl] = useState<string | null>(null);

  useEffect(() => {
    getSubsonicURL();
  }, []);

  const getSubsonicURL = async () => {
    setBaseUrl(await subsonicURL('/rest/getCoverArt', ''));
  };

  return (
    <div className='flex h-full w-full flex-col p-10'>
      <RecentlyPlayed baseImageUrl={baseUrl} />
      <h1 className='text-3xl'>Most Played</h1>
      <h1 className='text-3xl'>Recently added</h1>
      <h1 className='text-3xl'>Artists</h1>
      <h1 className='text-3xl'>Albums</h1>
    </div>
  );
}

interface SongSearch {
  playCount: number;
  playDate?: string;
  rating?: number;
  starredAt?: string | null;
  id: string;
  libraryId?: string;
  name: string;
  embedArtPath?: string;
  artistId?: string;
  artist: string;
  albumArtistId?: string;
  albumArtist?: string;
  allArtistIds?: string;
  maxYear?: number;
  minYear?: number;
  date?: string;
  maxOriginalYear?: number;
  minOriginalYear?: number;
  releases?: number;
  compilation?: boolean;
  songCount?: number;
  duration?: number;
  size?: number;
  genre?: string;
  genres?: any;
  discs?: any;
  orderAlbumName?: string;
  orderAlbumArtistName?: string;
  paths?: string;
  externalInfoUpdatedAt?: any;
  createdAt?: string;
  updatedAt?: string;
  orderTitle?: string;
}

function RecentlyPlayed({ baseImageUrl }: { baseImageUrl: string | null }) {
  const [recentlyPlayed, setRecentlyPlayed] = useState<
    SongSearch[] | undefined
  >(undefined);
  const router = useRouter();

  useEffect(() => {
    getRecentlyPlayed();
  }, []);

  async function getRecentlyPlayed() {
    const response = await navidromeApi(
      '/api/song?_end=15&_order=DESC&_sort=play_date&_start=0'
    );
    if (
      response.error == 'not_authenticated' ||
      response.error == 'no_server'
    ) {
      router.push('/servers');
    }

    if (response.response) {
      setRecentlyPlayed(response.response);
    }
  }
  return (
    <>
      <div className='flex overflow-auto'>
        {recentlyPlayed && baseImageUrl && (
          <DisplaySongs songs={recentlyPlayed} baseImageURL={baseImageUrl} />
        )}
      </div>
    </>
  );
}

function DisplaySongs({
  songs,
  baseImageURL,
}: {
  songs: SongSearch[];
  baseImageURL: string;
}) {
  const [screenCount, setScreenCount] = useState<number>(0);
  const [tab, setTab] = useState({
    start: 0,
    end: screenCount,
  });

  useEffect(() => {
    const updateScreenCount = () => {
      const screenWidth = window.innerWidth;
      const screenCount = Math.floor(screenWidth / 200);
      setScreenCount(screenCount == 0 ? 1 : screenCount);
    };

    window.addEventListener('resize', updateScreenCount);
    updateScreenCount(); // Initial call to set the screen count

    return () => {
      window.removeEventListener('resize', updateScreenCount);
    };
  }, []);

  return (
    <div className=''>
      <h1 className='text-3xl'>Recently Played</h1>
      <TabSwitcher
        next={() => {
          setTab({
            start: tab.start + screenCount,
            end: tab.end + screenCount,
          });
        }}
        previous={() => {
          setTab({
            start: tab.start - screenCount,
            end: tab.end - screenCount,
          });
        }}
        tab={
          tab.start == 0
            ? 'first'
            : tab.end == songs.length
              ? 'last'
              : undefined
        }
      />
      <div className='flex space-x-5'>
        {songs.slice(0, screenCount).map((song: SongSearch) => {
          return (
            <div key={song.id} className='flex flex-col'>
              <Image
                src={`${baseImageURL}&id=${song.id}`}
                width={300}
                height={300}
                alt={song.orderTitle}
              />
              <p>{song.orderTitle}</p>
              <p>{song.artist}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

import { Car, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
function TabSwitcher({
  next,
  previous,
  tab,
}: {
  next: () => void;
  previous: () => void;
  tab: 'last' | 'first' | undefined;
}) {
  return (
    <div className='flex justify-center space-x-4'>
      <Card>
        <ChevronLeftIcon onClick={previous} />
      </Card>
      <Card>
        <ChevronRightIcon onClick={next} />
      </Card>
    </div>
  );
}
