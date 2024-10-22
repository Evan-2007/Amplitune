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
    <div className="h-screen w-screen overflow-hidden">
      <div className="absolute inset-0 z-50">
        <FullScreenPlayer />
      </div>
      
      <div className="flex h-full flex-col bg-card">
        <Header  />
        
        <div className="flex flex-1 min-h-0"> 
          <Sidebar /> 
          
          <main className="flex-1 p-4 overflow-auto">
            <div className="h-full rounded-xl border border-border bg-background">
              {children}
            </div>
          </main>
        </div>
        
        <Player />
      </div>
    </div>
  );
}
