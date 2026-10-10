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
import { Song } from '@/lib/sources/types';

import { Ellipsis } from 'lucide-react';
import { useQueueStore } from '@/lib/queue';

export function SongDropdown({ song }: { song: Song }) {
  const addToQueue = useQueueStore((state) => state.addToQueue);
  const playNext = useQueueStore((state) => state.playNext);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Ellipsis size={20} />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => playNext(song)}>
          Play next
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => addToQueue(song)}>
          Add to queue
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
