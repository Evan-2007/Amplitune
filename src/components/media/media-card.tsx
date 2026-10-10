'use client';
import Link from 'next/link';
import { AlbumSummary, ArtistSummary } from '@/lib/sources/types';
import { albumHref, artistHref, formatYear, joinMeta } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Artwork } from './artwork';

export function AlbumCard({
  album,
  showArtist = true,
  subtitle,
}: {
  album: AlbumSummary;
  showArtist?: boolean;
  /** Replaces the default artist / year line */
  subtitle?: string;
}) {
  const year = formatYear(album.releaseDate);
  // The artist is its own link, so the card cannot be one big link
  return (
    <div className='group min-w-0 rounded-lg p-2 focus-within:bg-accent hover:bg-accent'>
      <Link
        href={albumHref(album.id, album.source)}
        className='peer block outline-none'
      >
        <Artwork src={album.imageUrl} alt='' className='w-full' />
        <p className='mt-2 truncate text-sm hover:underline'>{album.title}</p>
      </Link>
      <p className='truncate text-xs text-muted-foreground'>
        {subtitle ??
          (showArtist && album.artist ? (
            <>
              {album.artistId ? (
                <Link
                  href={artistHref(album.artistId, album.source)}
                  className='hover:underline'
                >
                  {album.artist}
                </Link>
              ) : (
                album.artist
              )}
              {year && ` · ${year}`}
            </>
          ) : (
            joinMeta(year, album.isSingle && 'Single')
          ))}
      </p>
    </div>
  );
}

export function ArtistCard({ artist }: { artist: ArtistSummary }) {
  return (
    <Link
      href={artistHref(artist.id, artist.source)}
      className='group block min-w-0 rounded-lg p-2 text-center outline-none hover:bg-accent focus-visible:bg-accent'
    >
      <Artwork src={artist.imageUrl} alt='' kind='artist' className='w-full' />
      <p className='mt-2 truncate text-sm group-hover:underline'>
        {artist.name}
      </p>
      <p className='text-xs text-muted-foreground'>Artist</p>
    </Link>
  );
}

/** Responsive grid for album and artist cards. */
export function MediaGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        '-mx-2 grid grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6',
        className
      )}
    >
      {children}
    </div>
  );
}

export function MediaGridSkeleton({ count = 5 }: { count?: number }) {
  return (
    <MediaGrid>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className='p-2'>
          <div className='aspect-square w-full animate-pulse rounded-md bg-muted' />
          <div className='mt-2 h-3 w-3/4 animate-pulse rounded bg-muted' />
        </div>
      ))}
    </MediaGrid>
  );
}

/** A titled block of page content with an optional action on the right. */
export function Section({
  title,
  action,
  children,
  className,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('mt-8', className)}>
      <div className='mb-2 flex items-baseline justify-between gap-4'>
        <h2 className='text-lg font-semibold'>{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function SectionAction({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className='shrink-0 text-sm text-muted-foreground hover:text-foreground hover:underline'
    >
      {children}
    </button>
  );
}
