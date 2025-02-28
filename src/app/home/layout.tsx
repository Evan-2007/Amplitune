import React from 'react';
import { Player } from '@/components/player/main';
import { Header } from '@/components/ui/header';

import FullScreenPlayer from '@/components/player/full-player';
import { Sidebar } from '@/components/main/sidebar';
import { cn } from '@/lib/utils';
import styles from '@/components/player/ignore-safe-area.module.css';
import {MobileFooter} from '@/components/main/footer';

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={cn('min-h-screen h-full md:w-screen', styles.fillSafeArea)}>
      <div className='absolute'>
        <FullScreenPlayer />
      </div>

      <div className='flex h-full flex-col bg-card'>
        <Header />
        {/* <Player /> */}

        <div className='flex min-h-0 flex-1 h-full'>
          <Sidebar />

          <main className='flex-1 overflow-auto md:px-4 h-full'>
            <div className='h-fit min-h-full border-border bg-background md:rounded-xl md:border'>
              {children}
            </div>
          </main>
        </div>

        <Player />
        <MobileFooter />
      </div>
    </div>
  );
}
