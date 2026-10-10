'use client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Song } from '@/lib/sources/types';
import { useRouter } from 'next/navigation';
import { Ellipsis } from 'lucide-react';
import { useQueueStore } from '@/lib/queue';
import { albumHref, artistHref, trackHref } from '@/lib/format';

export function SongDropdown({ song }: { song: Song }) {
  const addToQueue = useQueueStore((state) => state.addToQueue);
  const playNext = useQueueStore((state) => state.playNext);
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label={`More options for ${song.title}`}
          className='rounded-md p-1 text-muted-foreground outline-none hover:text-foreground focus-visible:text-foreground'
        >
          <Ellipsis size={18} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        <DropdownMenuItem onClick={() => playNext(song)}>
          Play next
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => addToQueue(song)}>
          Add to queue
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push(trackHref(song))}>
          Go to song
        </DropdownMenuItem>
        {song.albumId && (
          <DropdownMenuItem
            onClick={() => router.push(albumHref(song.albumId!, song.source))}
          >
            Go to album
          </DropdownMenuItem>
        )}
        {song.artistId && (
          <DropdownMenuItem
            onClick={() => router.push(artistHref(song.artistId!, song.source))}
          >
            Go to artist
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
