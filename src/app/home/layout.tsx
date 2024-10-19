import React from 'react';
import { Player } from '@/components/player/main';
import { Header } from '@/components/ui/header';

import FullScreenPlayer from '@/components/player/full-player';
import { Sidebar } from '@/components/main/sidebar';

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className='h-full w-screen'>
      <div className='absolute'>{<FullScreenPlayer />}</div>
      <div className='absolute flex h-screen w-full flex-col bg-card'>
        <Header />
        <div className='flex h-full w-full'>
          <Sidebar />
          <div className='h-full w-full pr-4'>
            <div className='h-full w-full rounded-xl border border-border bg-background'>
              {children}
            </div>
          </div>
        </div>
        <Player />
      </div>
    </div>
  );
}
