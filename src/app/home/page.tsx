'use client';
import { navidromeApi, subsonicURL } from '@/lib/sources/navidrome';
import { useEffect } from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { SongDropdown } from '@/components/song/dropdown';

export default function HomePage() {
  const [baseUrl, setBaseUrl] = useState<string | null>(null);

  return (
    <ScrollArea className='flex h-full w-full flex-col overflow-auto p-10'>
      <MostPlayed baseImageUrl={baseUrl} />
      <RecentlyPlayed baseImageUrl={baseUrl} />
      <h1 className='text-3xl'>Recently added</h1>
      <h1 className='text-3xl'>Artists</h1>
      <h1 className='text-3xl'>Albums</h1>
    </ScrollArea>
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
  title?: string;
}

function RecentlyPlayed({ baseImageUrl }: { baseImageUrl: string | null }) {
  const [recentlyPlayed, setRecentlyPlayed] = useState<
    SongSearch[] | undefined
  >(undefined);
  const router = useRouter();

  useEffect(() => {
    getRecentlyPlayed();
  }, []);

  async function getRecentlyPlayed() {}
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

function MostPlayed({ baseImageUrl }: { baseImageUrl: string | null }) {
  const [mostPlayed, setMostPlayed] = useState<SongSearch[] | undefined>(
    undefined
  );
  const router = useRouter();

  useEffect(() => {
    getMostPlayed();
  }, []);

  async function getMostPlayed() {}
  return (
    <>
      <p className='text-3xl'>Most Played</p>
      <ScrollArea>
        <div className='grid w-full grid-flow-col grid-rows-3 overflow-auto'>
          {mostPlayed &&
            baseImageUrl &&
            mostPlayed.map((song: SongSearch, index) => {
              return (
                <SongDisply
                  song={song}
                  baseImageUrl={baseImageUrl}
                  key={index}
                />
              );
            })}
        </div>
        <ScrollBar orientation='horizontal' />
      </ScrollArea>
    </>
  );
}

import { CirclePlay } from 'lucide-react';
import { useQueueStore } from '@/lib/queue';
function SongDisply({
  song,
  baseImageUrl,
}: {
  song: SongSearch;
  baseImageUrl: string;
}) {
  const setPlayingSong = useQueueStore((state) => state.play);
  return (
    <div
      key={song.id}
      className='group mr-4 mt-2 line-clamp-1 flex w-[300px] flex-row items-center space-x-3 text-ellipsis rounded-md border-b border-border p-2 hover:bg-gray-700/60'
    >
      <div className='flex h-[48px] w-[48px] flex-shrink-0'>
        <Image
          src={`${baseImageUrl}&id=${song.id}`}
          width={48}
          height={48}
          alt={song.orderTitle || song.name}
          className='rounded-md'
        />
        <div
          className='invisible absolute z-50 flex h-[48px] w-[48px] items-center justify-center rounded-md bg-card/20 opacity-0 backdrop-blur-[2px] transition-all duration-200 ease-in group-hover:visible group-hover:opacity-100'
          onClick={() => setPlayingSong(song.id)}
        >
          <CirclePlay className='m-auto h-8 w-8 text-white' strokeWidth={0.8} />
        </div>
      </div>
      <div className='flex flex-col'>
        <div className='flex flex-col'>
          <p className='line-clamp-1'>
            {song.title ?? song.orderTitle ?? song.name}
          </p>
          <p className='line-clamp-1'>{song.artist}</p>
        </div>
      </div>
      {/* <SongDropdown song={song} /> */}
    </div>
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
                alt={song.orderTitle || song.name}
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
import { set } from 'lodash';
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
