'use client'
import React from 'react'
import { ModeToggle } from '../theme-toggle'
import { Search as SearchIcon} from 'lucide-react'
import {Input } from '../ui/input'
import { useEffect, useState, useRef } from 'react'
import { isElectron as checkIsElectron } from '@/lib/utils'
import { CrossPlatformStorage} from '@/lib/storage/cross-platform-storage'
import {Song} from '@/components/player/types'
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useRouter } from 'next/navigation'

export function Header() {

    const localStorage = new CrossPlatformStorage();

    const [isElectronApp, setIsElectronApp] = useState(false)

    
    useEffect(() => {
        setIsElectronApp(checkIsElectron())
    }, [])

    return (
        <div className="flex items-center justify-between p-4 bg-card z-10">
            <LeftMenu />
            <Search />
            <RightMenu />

            {isElectronApp && <WindowControls /> }
        </div>
    )
}

function LeftMenu() {
    return (
        <ul className="flex space-x-4">
            <li>Home</li>
            <li>Library</li>
            <li>Search</li>
        </ul>
    )
}

function RightMenu() {
    return (
        <ul className="flex space-x-4">
            <li>Profile</li>
            <li>Settings</li>
        </ul>
    )
}


function Search() {

    const [results , setResults] = useState<Song[]>([])


    const [credentials, setCredentials] = useState<{username: string | null, password: string | null, salt: string | null}>({username: null, password: null, salt: null});
    const [activeInput, setActiveInput] = useState(true);
    const [search, setSearch] = useState('');

    const inputRef = useRef(null);
    const router = useRouter();

    useEffect(() => {
      const handleFocus = () => {
        if (document.activeElement === inputRef.current) {
            setActiveInput(true);
        }
      };
  
      const handleBlur = () => {
        setActiveInput(true);
      };
  
      document.addEventListener('focus', handleFocus, true);
      document.addEventListener('blur', handleBlur, true);
  
      return () => {
        document.removeEventListener('focus', handleFocus, true);
        document.removeEventListener('blur', handleBlur, true);
      };
    }, []);

    useEffect (() => {
        getCredentials();
    } , [])

    async function getCredentials() {
        const username = await localStorage.getItem('username');
        const password = await localStorage.getItem('password');
        const salt = await localStorage.getItem('salt');
        setCredentials({username, password, salt});
    }


    useEffect(() => {
        console.log('rtesults: ' + results)
    }, [results])



    const handleUpdate = async(e: any) => {
        try {
            setSearch(e.target.value);
            const result = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/rest/search3.view?u=${credentials.username}&t=${credentials.password}&s=${credentials.salt}&f=json&v=1.13.0&c=myapp&query=${e.target.value}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            const response = await result.json();
            if (response['subsonic-response'].status !== 'ok') {
                console.error('An error occurred:', response['subsonic-response'].error.message);
                throw new Error(response['subsonic-response'].error.status);
            }
            setResults(response['subsonic-response'].searchResult3.song || []);
            console.log(response) 
        } catch (error) {
            console.error('An error occurred:', error);
        }
    }

    return (
        <div className="flex items-center space-x-2 z-10">

            <div className='flex flex-col justify-center items-center'>
  
                    <Input placeholder="Search"  className='w-64 h-8 rounded-2xl' onChange={(e) => handleUpdate(e)} ref={inputRef}/>

                {
                    activeInput && search != "" && (
                        <div className='bg-card h-96 w-96 border-border border rounded-xl mt-4 absolute top-10'>
                            <ScrollArea className='h-full w-full relative'>
                                {results.length > 0 ? (
                                    <ul className='w-full h-full flex flex-col space-y-2'>
                                        {results.map((song, index) => (
                                            <button key={index} className='filter-none flex w-full' onClick={() => router.push(`/home/?playing=${song.id}&play=true`)}>
                                                <img className='w-10 rounded-md' src={`${process.env.NEXT_PUBLIC_API_URL}/rest/getCoverArt?u=${credentials.username}&t=${credentials.password}&s=${credentials.salt}&v=1.13.0&c=myapp&f=json&id=${song.coverArt}`} alt="" />
                                                <li className='text-nowrap'>{song.title}</li>
                                                <div className='w-full my-2 bg-border h-[1px]'></div>
                                            </button>
                                        ))}
                                    </ul>
                                ) : (
                                <p>No results found</p>
                                )}
                            </ScrollArea>
                        </div>
                    )
                }
            </div>

        </div>
    )
}


function WindowControls() {
    return (
        <div className="flex space-x-2 absolute right-0 top-0">
            <div id="min-button">
                <img  src="icons/min-w-10.png 1x, icons/min-w-12.png 1.25x, icons/min-w-15.png 1.5x, icons/min-w-15.png 1.75x, icons/min-w-20.png 2x, icons/min-w-20.png 2.25x, icons/min-w-24.png 2.5x, icons/min-w-30.png 3x, icons/min-w-30.png 3.5x" draggable="false" />
            </div>

            <div  id="max-button">
                <img  src="icons/max-w-10.png 1x, icons/max-w-12.png 1.25x, icons/max-w-15.png 1.5x, icons/max-w-15.png 1.75x, icons/max-w-20.png 2x, icons/max-w-20.png 2.25x, icons/max-w-24.png 2.5x, icons/max-w-30.png 3x, icons/max-w-30.png 3.5x" draggable="false" />
            </div>

            <div  id="restore-button">
                <img  src="icons/restore-w-10.png 1x, icons/restore-w-12.png 1.25x, icons/restore-w-15.png 1.5x, icons/restore-w-15.png 1.75x, icons/restore-w-20.png 2x, icons/restore-w-20.png 2.25x, icons/restore-w-24.png 2.5x, icons/restore-w-30.png 3x, icons/restore-w-30.png 3.5x" draggable="false" />
            </div>

            <div  id="close-button">
                <img  src="icons/close-w-10.png 1x, icons/close-w-12.png 1.25x, icons/close-w-15.png 1.5x, icons/close-w-15.png 1.75x, icons/close-w-20.png 2x, icons/close-w-20.png 2.25x, icons/close-w-24.png 2.5x, icons/close-w-30.png 3x, icons/close-w-30.png 3.5x" draggable="false" />
            </div>
        </div>
    )
}


