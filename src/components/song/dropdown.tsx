'use client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Song } from '@/components/player/types';

import { Ellipsis } from 'lucide-react';
import { useQueueStore } from '@/lib/queue';
import { subsonicURL } from '@/lib/sources/navidrome';
import { useEffect, useState } from 'react';

export function SongDropdown({ song }: { song: Song | string }) {
  const queue = useQueueStore((state) => state);
  const addToQueue = useQueueStore((state) => state.addToQueue);
  const playNext = useQueueStore((state) => state.playNext);
  const [songData, setSongData] = useState<Song | null>(null);

  useEffect(() => {}, []);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Ellipsis size={20} />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem
          onClick={() => playNext(typeof song == 'string' ? song : song.id)}
        >
          Play next
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => addToQueue(typeof song == 'string' ? song : song.id)}
        >
          Add to queue
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
