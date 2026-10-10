'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Search as SearchIcon } from 'lucide-react';
import { Input } from '../ui/input';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { debounce } from 'lodash';
import { useQueueStore } from '@/lib/queue';
import { useSourceManager } from '@/lib/hooks';
import { SearchResult } from '@/lib/sources/types';
import { albumHref, artistHref, trackHref } from '@/lib/format';
import { Artwork } from '@/components/media/artwork';
import { SongDropdown } from '@/components/song/dropdown';

export function Header() {
  return (
    <div className='z-10 flex items-center justify-center bg-card p-2 md:justify-between md:p-4'>
      <div className='max-md:hidden'>
        <LeftMenu />
      </div>
      <div>
        <React.Suspense fallback={null}>
          <Search />
        </React.Suspense>
      </div>
      <div className='max-md:hidden'>
        <RightMenu />
      </div>
    </div>
  );
}

function LeftMenu() {
  return (
    <ul className='flex space-x-4'>
      <li>
        <Link className='hover:underline' href='/home'>
          Home
        </Link>
      </li>
    </ul>
  );
}

function RightMenu() {
  return (
    <ul className='flex space-x-4'>
      <li>
        <Link className='hover:underline' href='/accounts'>
          Accounts
        </Link>
      </li>
    </ul>
  );
}

const QUICK_ARTISTS = 2;
const QUICK_SONGS = 4;
const QUICK_ALBUMS = 3;

function Search() {
  const sourceManager = useSourceManager();
  const play = useQueueStore((state) => state.play);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [text, setText] = useState('');
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // Only the answer to the latest keystroke is shown
  const requestRef = useRef(0);

  const runSearch = useMemo(
    () =>
      debounce(async (query: string, request: number) => {
        try {
          const found = await sourceManager.search(query);
          if (request === requestRef.current) setResults(found);
        } catch (error) {
          console.error('Search failed', error);
          if (request === requestRef.current) setResults(null);
        } finally {
          if (request === requestRef.current) setLoading(false);
        }
      }, 250),
    [sourceManager]
  );
  useEffect(() => () => runSearch.cancel(), [runSearch]);

  const onChange = (value: string) => {
    setText(value);
    setOpen(true);
    const request = ++requestRef.current;
    if (!value.trim()) {
      runSearch.cancel();
      setResults(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    runSearch(value.trim(), request);
  };

  // Close when clicking elsewhere, and whenever the page changes
  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);
  useEffect(() => setOpen(false), [pathname, searchParams]);

  const submit = () => {
    const query = text.trim();
    if (!query) return;
    runSearch.cancel();
    setOpen(false);
    inputRef.current?.blur();
    router.push(`/home/search?query=${encodeURIComponent(query)}`);
  };

  const artists = results?.artists.slice(0, QUICK_ARTISTS) ?? [];
  const songs = results?.songs.slice(0, QUICK_SONGS) ?? [];
  const albums = results?.albums.slice(0, QUICK_ALBUMS) ?? [];
  const empty = artists.length + songs.length + albums.length === 0;

  return (
    <div ref={containerRef} className='relative z-20'>
      <div className='relative'>
        <SearchIcon className='pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
        <Input
          ref={inputRef}
          value={text}
          placeholder='Search'
          aria-label='Search'
          className='h-8 w-64 rounded-2xl pl-8'
          onChange={(event) => onChange(event.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') submit();
            if (event.key === 'Escape') setOpen(false);
          }}
        />
      </div>

      {open && text.trim() && (
        <div className='absolute left-1/2 top-full mt-3 max-h-[70vh] w-96 max-w-[92vw] -translate-x-1/2 overflow-y-auto rounded-xl border border-border bg-card/80 p-1 shadow-lg backdrop-blur-md scrollbar-none'>
          {empty ? (
            <p className='px-3 py-6 text-center text-sm text-muted-foreground'>
              {loading ? 'Searching…' : `No results for "${text.trim()}"`}
            </p>
          ) : (
            <>
              {artists.map((artist) => (
                <QuickLink
                  key={`${artist.source}-${artist.id}`}
                  href={artistHref(artist.id, artist.source)}
                  image={artist.imageUrl}
                  kind='artist'
                  title={artist.name}
                  subtitle='Artist'
                />
              ))}
              {songs.map((song) => (
                <div
                  key={`${song.source}-${song.id}`}
                  className='group flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-accent'
                >
                  <button
                    aria-label={`Play ${song.title}`}
                    onClick={() => play(song)}
                    className='relative h-10 w-10 shrink-0'
                  >
                    <Artwork
                      src={song.imageUrl}
                      alt=''
                      kind='track'
                      className='h-10 w-10'
                    />
                    <span className='absolute inset-0 hidden items-center justify-center rounded-md bg-black/50 text-white group-hover:flex'>
                      <Play className='h-4 w-4 fill-current' />
                    </span>
                  </button>
                  <Link href={trackHref(song)} className='min-w-0 flex-1'>
                    <p className='truncate text-sm group-hover:underline'>
                      {song.title}
                    </p>
                    <p className='truncate text-xs text-muted-foreground'>
                      Song · {song.artist}
                    </p>
                  </Link>
                  <SongDropdown song={song} />
                </div>
              ))}
              {albums.map((album) => (
                <QuickLink
                  key={`${album.source}-${album.id}`}
                  href={albumHref(album.id, album.source)}
                  image={album.imageUrl}
                  kind='album'
                  title={album.title}
                  subtitle={`Album · ${album.artist}`}
                />
              ))}
              <button
                onClick={submit}
                className='mt-1 w-full rounded-lg px-2 py-2 text-center text-sm text-muted-foreground hover:bg-accent hover:text-foreground'
              >
                See all results
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function QuickLink({
  href,
  image,
  kind,
  title,
  subtitle,
}: {
  href: string;
  image: string;
  kind: 'artist' | 'album';
  title: string;
  subtitle: string;
}) {
  return (
    <Link
      href={href}
      className='group flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-accent'
    >
      <Artwork src={image} alt='' kind={kind} className='h-10 w-10' />
      <div className='min-w-0 flex-1'>
        <p className='truncate text-sm group-hover:underline'>{title}</p>
        <p className='truncate text-xs text-muted-foreground'>{subtitle}</p>
      </div>
    </Link>
  );
}
