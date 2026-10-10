'use client';
import { useState } from 'react';
import { Play, Shuffle } from 'lucide-react';
import { Song } from '@/lib/sources/types';
import { useQueueStore } from '@/lib/queue';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

function shuffled(songs: Song[]): Song[] {
  const result = [...songs];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Play and Shuffle for a list of tracks. When something is already queued the
 * listener is asked whether to clear the queue or keep it.
 */
export function PlayActions({
  songs,
  children,
}: {
  songs: Song[];
  /** Extra controls shown after the two buttons */
  children?: React.ReactNode;
}) {
  const playAlbum = useQueueStore((state) => state.playAlbum);
  const queueLength = useQueueStore((state) => state.queue.songs.length);
  // The track list waiting on the dialog's answer
  const [pending, setPending] = useState<Song[] | null>(null);

  const start = (list: Song[]) => {
    if (list.length === 0) return;
    if (queueLength > 0) {
      setPending(list);
    } else {
      playAlbum(list, 'clear');
    }
  };

  const answer = (action: 'clear' | 'preserve') => {
    if (pending) playAlbum(pending, action);
    setPending(null);
  };

  return (
    <div className='flex flex-wrap items-center gap-2'>
      <Button
        className='rounded-full px-5'
        disabled={songs.length === 0}
        onClick={() => start(songs)}
      >
        <Play className='mr-2 h-4 w-4 fill-current' />
        Play
      </Button>
      <Button
        variant='secondary'
        className='rounded-full px-4'
        disabled={songs.length === 0}
        onClick={() => start(shuffled(songs))}
      >
        <Shuffle className='mr-2 h-4 w-4' />
        Shuffle
      </Button>
      {children}

      <Dialog
        open={pending !== null}
        onOpenChange={(open) => !open && setPending(null)}
      >
        <DialogContent className='max-w-sm'>
          <DialogHeader>
            <DialogTitle>Clear the queue?</DialogTitle>
            <DialogDescription>
              Your queue has songs in it. Clear it, or keep them and play this
              next.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className='gap-2 sm:gap-0'>
            <Button variant='secondary' onClick={() => answer('preserve')}>
              Keep queue
            </Button>
            <Button variant='destructive' onClick={() => answer('clear')}>
              Clear queue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
