
import React from 'react'
import {Player} from '@/components/player/main'
import {Header} from '@/components/ui/header'

import FullScreenPlayer from '@/components/player/full-player'
import { Sidebar } from '@/components/main/sidebar'



export default function HomeLayout({
    children,
  }: {
    children: React.ReactNode
  }) {





    return(
      <div className='w-screen h-full'>
      <div className='absolute'>
      {<FullScreenPlayer/>}
      </div>
      <div className='w-full h-screen flex flex-col bg-card absolute'>
        <Header />
        <div className='w-full h-full flex'>
          <Sidebar />
          <div className='w-full h-full pr-4 '>
            <div className='w-full h-full border-border border rounded-xl bg-background '>
              {children}
            </div>
          </div>
        </div>
        <Player/>
      </div>

      </div>
    )
  }