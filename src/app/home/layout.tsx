'use client'
import React from 'react'
import {Player} from '@/components/player/main'
import {Header} from '@/components/ui/header'
import { useEffect, useState } from 'react'
import FullScreenPlayer from '@/components/player/full-player'
import {Song} from '@/components/player/types'
import { Sidebar } from '@/components/main/sidebar'
import {usePlayerStore} from "@/lib/state"


export default function HomeLayout({
    children,
  }: {
    children: React.ReactNode
  }) {

    const [audioUrl, setAudioUrl] = useState('')
    const [fullScreen, setFullScreen] = useState(false)
    const [songData, setSongData] = useState<Song | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);

    const audioRef = usePlayerStore((state) => state.ref)

    return(
      <div className='w-screen h-full'>
      <div className='absolute'>
      {fullScreen && <FullScreenPlayer audioRef={audioRef} setFullScreen={setFullScreen} />}
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
        <Player setFullScreen={setFullScreen}/>
      </div>

      </div>
    )
  }