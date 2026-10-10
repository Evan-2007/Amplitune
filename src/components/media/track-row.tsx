'use client';
import Link from 'next/link';
import { Play, Volume2 } from 'lucide-react';
import { Song } from '@/lib/sources/types';
import { useQueueStore } from '@/lib/queue';
import { cn } from '@/lib/utils';
import {
  albumHref,
  artistHref,
  formatDuration,
  trackHref,
} from '@/lib/format';
import { Artwork } from './artwork';
import { SourceBadges } from './source-badges';
import { SongDropdown } from '@/components/song/dropdown';

/** Whether two entries are the same track, possibly from different sources. */
function isSameTrack(a: Song | undefined, b: Song): boolean {
  if (!a?.id) return false;
  const idsOf = (song: Song) => ({
    [song.source]: song.id,
    ...(song.sourceIds ?? {}),
  });
  const aIds = idsOf(a);
  return Object.entries(idsOf(b)).some(([source, id]) => aIds[source] === id);
}

export function TrackRow({
  song,
  number,
  showArtwork = true,
  subtitle,
  showSources = false,
  onPlay,
}: {
  song: Song;
  /** Position shown in front of the row (an album's track number) */
  number?: number;
  showArtwork?: boolean;
  /** Second line; leave out for none */
  subtitle?: React.ReactNode;
  showSources?: boolean;
  onPlay: () => void;
}) {
  const isCurrent = useQueueStore((state) =>
    isSameTrack(state.queue.currentSong?.track, song)
  );

  return (
    <div
      role='button'
      tabIndex={0}
      onClick={onPlay}
      onKeyDown={(event) => {
        if (event.key === 'Enter' && event.target === event.currentTarget) {
          onPlay();
        }
      }}
      className={cn(
        'group flex w-full cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 text-left outline-none hover:bg-accent focus-visible:bg-accent',
        isCurrent && 'bg-accent/60'
      )}
    >
      {number !== undefined && (
        <div className='flex w-6 shrink-0 justify-end text-sm tabular-nums text-muted-foreground'>
          {isCurrent ? (
            <Volume2 className='h-4 w-4 text-foreground group-hover:hidden' />
          ) : (
            <span className='group-hover:hidden'>{number}</span>
          )}
          <Play className='hidden h-4 w-4 fill-current text-foreground group-hover:block' />
        </div>
      )}
      {showArtwork && (
        <div className='relative h-10 w-10 shrink-0'>
          <Artwork
            src={song.imageUrl}
            alt=''
            kind='track'
            className='h-10 w-10'
          />
          {number === undefined && (
            <div
              className={cn(
                'absolute inset-0 items-center justify-center rounded-md bg-black/50 text-white',
                isCurrent ? 'flex' : 'hidden group-hover:flex'
              )}
            >
              {isCurrent ? (
                <Volume2 className='h-4 w-4 group-hover:hidden' />
              ) : null}
              <Play
                className={cn(
                  'h-4 w-4 fill-current',
                  isCurrent && 'hidden group-hover:block'
                )}
              />
            </div>
          )}
        </div>
      )}
      <div className='min-w-0 flex-1'>
        <div className='flex items-center gap-1.5'>
          <Link
            href={trackHref(song)}
            onClick={(event) => event.stopPropagation()}
            className={cn(
              'truncate text-sm hover:underline',
              isCurrent && 'font-semibold'
            )}
          >
            {song.title}
          </Link>
          {song.explicit && (
            <span
              title='Explicit'
              className='shrink-0 rounded-sm border border-border px-1 text-[10px] leading-4 text-muted-foreground'
            >
              E
            </span>
          )}
        </div>
        {subtitle && (
          <div className='truncate text-xs text-muted-foreground'>
            {subtitle}
          </div>
        )}
      </div>
      {showSources && (
        <SourceBadges
          sources={song.availableSources}
          className='max-sm:hidden'
        />
      )}
      <span className='w-10 shrink-0 text-right text-xs tabular-nums text-muted-foreground'>
        {formatDuration(song.duration)}
      </span>
      <div
        className='flex shrink-0 items-center'
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
      >
        <SongDropdown song={song} />
      </div>
    </div>
  );
}

/** "Artist · Album", each linked when the source gave us its id. */
export function TrackSubtitle({
  song,
  showArtist = true,
  showAlbum = true,
}: {
  song: Song;
  showArtist?: boolean;
  showAlbum?: boolean;
}) {
  const album =
    showAlbum && song.album ? (
      song.albumId ? (
        <Link
          href={albumHref(song.albumId, song.source)}
          onClick={(event) => event.stopPropagation()}
          className='hover:underline'
        >
          {song.album}
        </Link>
      ) : (
        song.album
      )
    ) : null;
  const artist =
    showArtist && song.artist ? (
      song.artistId ? (
        <Link
          href={artistHref(song.artistId, song.source)}
          onClick={(event) => event.stopPropagation()}
          className='hover:underline'
        >
          {song.artist}
        </Link>
      ) : (
        song.artist
      )
    ) : null;
  return (
    <>
      {artist}
      {artist && album && ' · '}
      {album}
    </>
  );
}

export function TrackRowSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className='flex flex-col'>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className='flex items-center gap-3 px-2 py-1.5'>
          <div className='h-10 w-10 animate-pulse rounded-md bg-muted' />
          <div className='flex-1 space-y-2'>
            <div className='h-3 w-2/5 animate-pulse rounded bg-muted' />
            <div className='h-2.5 w-1/4 animate-pulse rounded bg-muted' />
          </div>
        </div>
      ))}
    </div>
  );
}
