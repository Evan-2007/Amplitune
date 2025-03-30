'use client';
import React, { useState, useEffect } from 'react';
import { CrossPlatformStorage } from '@/lib/storage/cross-platform-storage';
import Link from 'next/link';
import { usePlaylistStore } from '@/lib/playlistStore';
import { SourceManager } from '@/lib/sources/source-manager';
import { ScrollArea } from '@/components/ui/scroll-area';

export function Sidebar() {
  const playlists = usePlaylistStore((state) => state.playlists);
  const refreshPlaylists = usePlaylistStore((state) => state.refreshPlaylists);
  const sourceManager = SourceManager.getInstance();

  const refresh = async () => {
    await refreshPlaylists();
  };

  useEffect(() => {
    refresh();
  }, []);

  return (
    <div className='lex-shrink-0f flex h-full w-64 flex-col justify-between max-md:hidden'>
      <ScrollArea className='flex h-full flex-col'>
        <div className='flex h-2/6 items-center p-2'></div>
        <div className='flex h-4/6 flex-col pb-4'>
          <button
            onClick={refresh}
            className='p-2 text-start text-sm hover:bg-gray-100'
          >
            <p>Refresh</p>
          </button>
          {playlists.map((playlist) => (
            <Link
              key={playlist.id}
              href={`/home/playlist?id=${playlist.id}&source=${playlist.source}`}
            >
              <div className='flex items-center p-2 hover:bg-gray-900'>
                {playlist.imageUrl ? (
                  <img
                    src={playlist.imageUrl}
                    className='h-6 w-6 rounded-full'
                  />
                ) : (
                  <div className='h-6 w-6 rounded-full bg-gray-300' />
                )}
                <span className='ml-2 line-clamp-1 text-nowrap text-sm'>
                  {playlist.name}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
