import React from 'react'
import {Player} from '@/components/player/main'

export default function HomeLayout({
    children,
  }: {
    children: React.ReactNode
  }) {
    return(
      <div className='w-full h-screen flex flex-col'>
        <header className='h-10 w-screen absolute z-50'></header>
        {children}
        <Player />
      </div>
    )
  }