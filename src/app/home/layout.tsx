import React from 'react'
import {Player} from '@/components/player/main'

export default function HomeLayout({
    children,
  }: {
    children: React.ReactNode
  }) {
    return(
      <div className='w-full h-screen flex flex-col bg-card'>
        <header className='h-10 w-screen absolute z-50'></header>
        <div className='w-full h-full pr-4 pl-4 pt-4 '>
        <div className='w-full h-full border-border border rounded-xl bg-background '>
          {children}
        </div>
        </div>
        <Player />
      </div>
    )
  }