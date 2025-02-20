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
import { song } from '@/lib/sources/types';

import { Ellipsis } from 'lucide-react';
import { useQueueStore } from '@/lib/queue';
import { subsonicURL } from '@/lib/sources/navidrome';
import { useEffect, useState } from 'react';

export function SongDropdown({ song }: { song: song }) {
  const queue = useQueueStore((state) => state);
  const addToQueue = useQueueStore((state) => state.addToQueue);
  const playNext = useQueueStore((state) => state.playNext);
  const [songData, setSongData] = useState<song | null>(null);

  useEffect(() => {}, []);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Ellipsis size={20} />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => playNext(song.id)}>
          Play next
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => addToQueue(song.id)}>
          Add to queue
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
