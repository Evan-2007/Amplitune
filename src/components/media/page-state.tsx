'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { TrackRowSkeleton } from './track-row';

/** Shared padding and width for the browse pages. */
export function PageBody({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    // Extra room at the bottom on phones, where the player floats over the page
    <div
      className={cn('w-full px-4 pb-10 pt-6 max-md:pb-44 md:px-8', className)}
    >
      {children}
    </div>
  );
}

/** Placeholder shown while an album, track or playlist loads. */
export function DetailSkeleton() {
  return (
    <PageBody>
      <div className='flex flex-col items-center gap-6 sm:flex-row sm:items-end'>
        <div className='h-52 w-52 animate-pulse rounded-xl bg-muted' />
        <div className='w-full max-w-sm space-y-3'>
          <div className='h-8 w-3/4 animate-pulse rounded bg-muted' />
          <div className='h-4 w-1/2 animate-pulse rounded bg-muted' />
          <div className='h-9 w-48 animate-pulse rounded-full bg-muted' />
        </div>
      </div>
      <div className='mt-8'>
        <TrackRowSkeleton count={6} />
      </div>
    </PageBody>
  );
}

export function PageError({
  title,
  error,
  onRetry,
}: {
  title: string;
  error?: Error | null;
  onRetry?: () => void;
}) {
  return (
    <PageBody className='flex min-h-[50vh] flex-col items-center justify-center text-center'>
      <h1 className='text-lg font-semibold'>{title}</h1>
      {error?.message && (
        <p className='mt-1 max-w-md text-sm text-muted-foreground'>
          {error.message}
        </p>
      )}
      {onRetry && (
        <Button variant='secondary' className='mt-4' onClick={onRetry}>
          Try again
        </Button>
      )}
    </PageBody>
  );
}

/** Long text clamped to a few lines with a More / Less toggle. */
export function ExpandableText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const long = text.length > 280;
  return (
    <div className={cn('max-w-3xl text-sm text-muted-foreground', className)}>
      <p className={cn('whitespace-pre-line', !open && long && 'line-clamp-3')}>
        {text}
      </p>
      {long && (
        <button
          onClick={() => setOpen(!open)}
          className='mt-1 text-foreground hover:underline'
        >
          {open ? 'Less' : 'More'}
        </button>
      )}
    </div>
  );
}
