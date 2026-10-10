'use client';
import { useEffect, useState } from 'react';
import { Disc3, Music, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const ICONS = { album: Disc3, track: Music, artist: User };

/**
 * Cover art that falls back to a placeholder when there is no URL or the
 * image fails to load. Size it through `className`.
 */
export function Artwork({
  src,
  alt,
  kind = 'album',
  className,
}: {
  src?: string;
  alt: string;
  kind?: keyof typeof ICONS;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);

  const shape = kind === 'artist' ? 'rounded-full' : 'rounded-md';
  if (!src || failed) {
    const Icon = ICONS[kind];
    return (
      <div
        role='img'
        aria-label={alt}
        className={cn(
          'flex aspect-square shrink-0 items-center justify-center bg-muted text-muted-foreground',
          shape,
          className
        )}
      >
        <Icon className='h-1/3 w-1/3' strokeWidth={1.5} />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      loading='lazy'
      draggable={false}
      onError={() => setFailed(true)}
      className={cn('aspect-square shrink-0 object-cover', shape, className)}
    />
  );
}
