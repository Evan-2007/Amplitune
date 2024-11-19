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
    <div className='h-screen w-screen overflow-hidden'>
      <div className='absolute'>
        <FullScreenPlayer />
      </div>

      <div className='flex h-full flex-col bg-card'>
        <Header />
        <Player />

        <div className='flex min-h-0 flex-1'>
          <Sidebar />

          <main className='flex-1 overflow-auto p-4'>
            <div className='h-full rounded-xl border border-border bg-background'>
              {children}
            </div>
          </main>
        </div>

        {/* <Player /> */}
      </div>
    </div>
  );
}
