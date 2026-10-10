'use client';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect, Suspense } from 'react';
import { Play } from 'lucide-react';
import { useSourceSearch } from '@/lib/hooks';
import { useQueueStore } from '@/lib/queue';
import { SearchResult } from '@/lib/sources/types';
import { albumHref, artistHref, trackHref } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Artwork } from '@/components/media/artwork';
import { SourceBadges } from '@/components/media/source-badges';
import {
  TrackRow,
  TrackRowSkeleton,
  TrackSubtitle,
} from '@/components/media/track-row';
import {
  AlbumCard,
  ArtistCard,
  MediaGrid,
  MediaGridSkeleton,
  Section,
  SectionAction,
} from '@/components/media/media-card';
import { PageBody, PageError } from '@/components/media/page-state';

type Tab = 'all' | 'tracks' | 'albums' | 'artists';

export default function Search() {
  return (
    <Suspense fallback={null}>
      <Results />
    </Suspense>
  );
}

function Results() {
  const query = useSearchParams().get('query');
  const { results, loading, error } = useSourceSearch(query);
  const [tab, setTab] = useState<Tab>('all');

  useEffect(() => setTab('all'), [query]);

  if (!query) {
    return (
      <PageError title='Search for songs, albums, and artists using the box above' />
    );
  }

  const counts = {
    tracks: results?.songs.length ?? 0,
    albums: results?.albums.length ?? 0,
    artists: results?.artists.length ?? 0,
  };
  const total = counts.tracks + counts.albums + counts.artists;
  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'all', label: 'All' },
    { id: 'tracks', label: 'Tracks', count: counts.tracks },
    { id: 'albums', label: 'Albums', count: counts.albums },
    { id: 'artists', label: 'Artists', count: counts.artists },
  ];

  return (
    <PageBody>
      <p className='text-sm text-muted-foreground'>Results for</p>
      <h1 className='truncate text-2xl font-bold'>{query}</h1>

      <div className='mt-3 flex gap-2 overflow-x-auto scrollbar-none'>
        {tabs
          .filter((item) => item.id === 'all' || item.count)
          .map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={cn(
                'whitespace-nowrap rounded-full border px-3 py-1 text-sm',
                tab === item.id
                  ? 'border-transparent bg-primary text-primary-foreground'
                  : 'border-border text-muted-foreground hover:text-foreground'
              )}
            >
              {item.label}
              {item.count ? (
                <span className='ml-1.5 opacity-70'>{item.count}</span>
              ) : null}
            </button>
          ))}
      </div>

      {loading || (!results && !error) ? (
        <div className='mt-8 space-y-8'>
          <TrackRowSkeleton count={4} />
          <MediaGridSkeleton />
        </div>
      ) : error ? (
        <PageError title='Search failed' error={error} />
      ) : !results || total === 0 ? (
        <PageError title={`No results for "${query}"`} />
      ) : (
        <ResultSections results={results} tab={tab} setTab={setTab} />
      )}
    </PageBody>
  );
}

function ResultSections({
  results,
  tab,
  setTab,
}: {
  results: SearchResult;
  tab: Tab;
  setTab: (tab: Tab) => void;
}) {
  const play = useQueueStore((state) => state.play);
  const all = tab === 'all';
  const { songs, albums, artists } = results;

  const trackList = (limit?: number) => (
    <div className='-mx-2 flex flex-col'>
      {songs.slice(0, limit).map((song) => (
        <TrackRow
          key={`${song.source}-${song.id}`}
          song={song}
          subtitle={<TrackSubtitle song={song} />}
          showSources
          onPlay={() => play(song)}
        />
      ))}
    </div>
  );
  const showAll = (target: Tab, count: number, limit: number) =>
    all && count > limit ? (
      <SectionAction onClick={() => setTab(target)}>Show all</SectionAction>
    ) : undefined;

  return (
    <>
      {all && songs.length > 0 && (
        <div className='mt-6 grid gap-x-8 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]'>
          <Section title='Top result' className='mt-0'>
            <TopResult results={results} />
          </Section>
          <Section
            title='Tracks'
            className='mt-0 max-lg:mt-8'
            action={showAll('tracks', songs.length, 4)}
          >
            {trackList(4)}
          </Section>
        </div>
      )}
      {tab === 'tracks' && <div className='mt-6'>{trackList()}</div>}
      {(all || tab === 'albums') && albums.length > 0 && (
        <Section
          title='Albums'
          className={tab === 'albums' ? 'mt-6' : undefined}
          action={showAll('albums', albums.length, 6)}
        >
          <MediaGrid>
            {albums.slice(0, all ? 6 : undefined).map((album) => (
              <AlbumCard key={`${album.source}-${album.id}`} album={album} />
            ))}
          </MediaGrid>
        </Section>
      )}
      {(all || tab === 'artists') && artists.length > 0 && (
        <Section
          title='Artists'
          className={tab === 'artists' ? 'mt-6' : undefined}
          action={showAll('artists', artists.length, 6)}
        >
          <MediaGrid>
            {artists.slice(0, all ? 6 : undefined).map((artist) => (
              <ArtistCard
                key={`${artist.source}-${artist.id}`}
                artist={artist}
              />
            ))}
          </MediaGrid>
        </Section>
      )}
    </>
  );
}

/**
 * The first artist when its name matches what was typed, otherwise the first
 * song: sources already return each list best match first.
 */
function TopResult({ results }: { results: SearchResult }) {
  const query = (useSearchParams().get('query') ?? '').trim().toLowerCase();
  const play = useQueueStore((state) => state.play);
  const artist = results.artists.find(
    (candidate) => candidate.name.toLowerCase() === query
  );
  const album = results.albums.find(
    (candidate) => candidate.title.toLowerCase() === query
  );
  const song = results.songs[0];

  const card = artist
    ? {
        href: artistHref(artist.id, artist.source),
        image: artist.imageUrl,
        kind: 'artist' as const,
        title: artist.name,
        subtitle: 'Artist',
        sources: artist.availableSources,
      }
    : album
      ? {
          href: albumHref(album.id, album.source),
          image: album.imageUrl,
          kind: 'album' as const,
          title: album.title,
          subtitle: `Album · ${album.artist}`,
          sources: album.availableSources,
        }
      : {
          href: trackHref(song),
          image: song.imageUrl,
          kind: 'track' as const,
          title: song.title,
          subtitle: `Song · ${song.artist}`,
          sources: song.availableSources,
        };

  return (
    <div className='relative rounded-xl bg-accent/50 p-4 hover:bg-accent'>
      <Link href={card.href} className='block outline-none'>
        <Artwork
          src={card.image}
          alt=''
          kind={card.kind}
          className='h-24 w-24'
        />
        <p className='mt-3 line-clamp-2 text-xl font-bold'>{card.title}</p>
        <p className='truncate text-sm text-muted-foreground'>
          {card.subtitle}
        </p>
        <SourceBadges sources={card.sources} className='mt-3' />
      </Link>
      {card.kind === 'track' && (
        <button
          aria-label={`Play ${card.title}`}
          onClick={() => play(song)}
          className='absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground hover:scale-105'
        >
          <Play className='h-4 w-4 fill-current' />
        </button>
      )}
    </div>
  );
}
