'use client'
import React, {useState, useEffect} from 'react'
import { CrossPlatformStorage } from '@/lib/storage/cross-platform-storage'
import Link from 'next/link'

interface Location {
    url: string;
    type: 'navidrome'
    username: string;
}

export function Sidebar(){

    const [location, setLocation] = useState<Location | false>(false)

    

    return (
        <div className="h-full w-1/6 flex justify-between flex-col ">
            <div></div>
            <div className='w-full bg-red-700 rounded-lg h-10 mb-3 flex '>
                {!location ? <Link className='w-full flex justify-center items-center' href='/servers'> Connect to Server </Link> : <div className='w-full h-10 bg-red-700 flex justify-center items-center'> {location.username} </div>}
            </div>
        </div>
    )
}