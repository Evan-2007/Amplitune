'use client';
import React, { use } from 'react';
import { ModeToggle } from '../theme-toggle';
import { Search as SearchIcon, CirclePlay } from 'lucide-react';
import { Input } from '../ui/input';
import { useEffect, useState, useRef } from 'react';
import { isElectron as checkIsElectron } from '@/lib/utils';
import { CrossPlatformStorage } from '@/lib/storage/cross-platform-storage';
import { Song, searchResult } from '@/components/player/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useQueueStore } from '@/lib/queue';
import { subsonicURL } from '@/lib/sources/navidrome';

import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownSection,
  DropdownItem,
} from '@nextui-org/dropdown';

export function Header() {
  const localStorage = new CrossPlatformStorage();

  const [isElectronApp, setIsElectronApp] = useState(false);

  useEffect(() => {
    setIsElectronApp(checkIsElectron());
  }, []);

  return (
    <div className='z-10 flex items-center justify-between bg-card p-4'>
      <LeftMenu />
      <Search />
      <RightMenu />
    </div>
  );
}

function LeftMenu() {
  return (
    <ul className='flex space-x-4'>
      <li>Home</li>
      <li>Library</li>
      <li>Search</li>
    </ul>
  );
}

function RightMenu() {
  return (
    <ul className='flex space-x-4'>
      <li>Profile</li>
      <li>Settings</li>
    </ul>
  );
}

function Search() {
  const queue = useQueueStore((state) => state);

  const [results, setResults] = useState<searchResult | null>(null);

  const [credentials, setCredentials] = useState<{
    username: string | null;
    password: string | null;
    salt: string | null;
  }>({ username: null, password: null, salt: null });
  const [activeInput, setActiveInput] = useState(false);
  const [search, setSearch] = useState('');
  const [baseImageURL, setBaseImageURL] = useState('');

  const play = useQueueStore((state) => state.play);

  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const resultsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleFocus = () => {
      if (document.activeElement === inputRef.current) {
        setActiveInput(true);
      }
    };

    const handleBlur = () => {
      if (
        document.activeElement !== inputRef.current &&
        resultsContainerRef.current &&
        resultsContainerRef.current.querySelector(':hover') === null
      ) {
        resultsContainerRef.current?.classList.remove('animate-[fadeIn_.001s]');
        resultsContainerRef.current?.classList.add('animate-[fadeOut_.001s]');
        console.log(resultsContainerRef.current.querySelector(':hover'));
        setTimeout(() => {
          setActiveInput(false); //false
        }, 100);
      }
    };

    document.addEventListener('click', handleBlur, true);
    document.addEventListener('focus', handleFocus, true);
    document.addEventListener('blur', handleBlur, true);

    return () => {
      document.removeEventListener('click', handleBlur, true);
      document.removeEventListener('focus', handleFocus, true);
      document.removeEventListener('blur', handleBlur, true);
    };
  }, []);

  useEffect(() => {
    getBaseUrl();
  }, []);

  async function getBaseUrl() {
    const url = await subsonicURL('/rest/getCoverArt');
    if (url === 'error') {
      router.push('/servers');
    }
    setBaseImageURL(url.toString());
  }

  useEffect(() => {
    console.log('rtesults: ' + results);
  }, [results]);

  const handleUpdate = async (e: any) => {
    try {
      setSearch(e.target.value);
      const url = await subsonicURL(
        '/rest/search3.view',
        `&query=${e.target.value}`
      );
      if (url === 'error') {
        router.push('/servers');
      }
      const result = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const response = await result.json();
      if (response['subsonic-response'].status !== 'ok') {
        console.error(
          'An error occurred:',
          response['subsonic-response'].error.message
        );
        throw new Error(response['subsonic-response'].error.status);
      }

      if (
        response['subsonic-response'].searchResult3.song.length == 0 &&
        response['subsonic-response'].searchResult3.artist.length == 0 &&
        response['subsonic-response'].searchResult3.album.length == 0
      ) {
        setResults(null);
      } else {
        setResults(response['subsonic-response'].searchResult3);
      }
      console.log(response);
    } catch (error) {
      console.error('An error occurred:', error);
      setResults(null);
    }
  };

  useEffect(() => {
    console.log(results);
  }, [results]);

  return (
    <div className='z-10 flex items-center space-x-2 overflow-visible'>
      <div className='flex flex-col items-center justify-center'>
        <Input
          placeholder='Search'
          className='h-8 w-64 rounded-2xl'
          onChange={(e) => handleUpdate(e)}
          ref={inputRef}
        />

        {activeInput && (
          <>
            <div
              className={`absolute top-10 z-20 mt-5 h-96 w-96 animate-[fadeIn_.001s] overflow-visible rounded-xl border border-border bg-card/60 backdrop-blur-md duration-1000 ease-in-out`}
              ref={resultsContainerRef}
            >
              <ScrollArea className='relative h-full w-full overflow-visible'>
                {results !== null ? (
                  <div className='flex h-full flex-col rounded-xl'>
                    {results.artist &&
                      results.artist.length > 0 &&
                      results.artist.map((artist, index) => (
                        <div className='' key={index}>
                          <div className='col-auto grid grid-cols-7 py-2 pl-2'>
                            <button
                              key={index}
                              className='group relative flex w-full items-center pb-2 pt-2 filter-none'
                              onClick={() =>
                                router.push(`/home/artists/${artist.id}`)
                              }
                            >
                              <img
                                className='absolute w-11 rounded-full'
                                src={`${baseImageURL}&id=${artist.coverArt}`}
                                alt=''
                              />
                            </button>
                            <div className='col-span-5 space-y-1 pr-3'>
                              <Link
                                className='line-clamp-1 text-sm hover:underline'
                                href={`/home/artists/${artist.id}`}
                              >
                                {artist.name}
                              </Link>
                              <Link
                                className='line-clamp-1 text-[11px] text-gray-500 hover:underline'
                                href={`/home/artists/${artist.id}`}
                              >
                                Artist
                              </Link>
                            </div>
                            <ItemMenu />
                          </div>
                          <div className='line-clamp-1 h-[1px] w-full bg-border px-2'></div>
                        </div>
                      ))}

                    {results.song &&
                      results.song.length > 0 &&
                      results.song.map((song, index) => (
                        <div className='' key={index}>
                          <div className='col-auto grid grid-cols-7 py-2 pl-2'>
                            <button
                              key={index}
                              className='group relative flex w-full items-center filter-none'
                              onClick={() => play(song)}
                            >
                              <img
                                className='absolute w-11 rounded-md'
                                src={`${baseImageURL}&id=${song.coverArt}`}
                                alt=''
                              />
                              <div className='invisible absolute z-50 flex h-11 w-11 items-center justify-center rounded-md bg-card/20 opacity-0 backdrop-blur-[2px] transition-all duration-300 ease-in group-hover:visible group-hover:opacity-100'>
                                <CirclePlay
                                  className='m-auto h-8 w-8 text-white'
                                  strokeWidth={0.8}
                                />
                              </div>
                            </button>
                            <div className='col-span-5 space-y-1 pr-3'>
                              <Link
                                className='line-clamp-1 text-sm hover:underline'
                                href={`/home/?playing=${song.id}&play=true`}
                              >
                                {song.title}
                              </Link>
                              <Link
                                className='line-clamp-1 text-[11px] text-gray-500 hover:underline'
                                href={`/home/?playing=${song.id}&play=true`}
                              >
                                {song.artist} - Song
                              </Link>
                            </div>
                            <Dropdown
                              classNames={{
                                content:
                                  'bg-background border-border border rounded-xl backdrop-blur-xl',
                              }}
                            >
                              <DropdownTrigger>
                                <Ellipsis size={24} />
                              </DropdownTrigger>
                              <DropdownMenu className='text-sm'>
                                <DropdownItem
                                  onClick={() => queue.addToQueue(song)}
                                >
                                  Add To Queue
                                </DropdownItem>
                              </DropdownMenu>
                            </Dropdown>
                          </div>
                          <div className='line-clamp-1 h-[1px] w-full bg-border px-2'></div>
                        </div>
                      ))}

                    {results.album &&
                      results.album.length > 0 &&
                      results.album.map((album, index) =>
                        album.songCount > 1 ? (
                          <div className='overflow-visible' key={index}>
                            <div className='col-auto grid grid-cols-7 overflow-visible py-2 pl-2'>
                              <button
                                key={index}
                                className='group relative flex w-full items-center filter-none'
                                onClick={() =>
                                  router.push(
                                    `/home/?playing=${album.id}&play=true`
                                  )
                                }
                              >
                                <img
                                  className='absolute w-11 rounded-md'
                                  src={`${baseImageURL}&id=${album.coverArt}`}
                                  alt=''
                                />
                                <div className='invisible absolute z-50 flex h-11 w-11 items-center justify-center rounded-md bg-card/20 opacity-0 backdrop-blur-[2px] transition-all duration-300 ease-in group-hover:visible group-hover:opacity-100'>
                                  <CirclePlay
                                    className='m-auto h-8 w-8 text-white'
                                    strokeWidth={0.8}
                                  />
                                </div>
                              </button>
                              <div className='col-span-5 space-y-1 pr-3'>
                                <Link
                                  className='line-clamp-1 text-sm hover:underline'
                                  href={`/home/?playing=${album.id}&play=true`}
                                >
                                  {album.name}
                                </Link>
                                <Link
                                  className='line-clamp-1 text-[11px] text-gray-500 hover:underline'
                                  href={`/home/?playing=${album.id}&play=true`}
                                >
                                  {album.artist} - Album
                                </Link>
                              </div>
                              <ItemMenu>
                                <Item>Add To Queue</Item>
                              </ItemMenu>
                            </div>
                            <div className='line-clamp-1 h-[1px] w-full bg-border px-2'></div>
                          </div>
                        ) : null
                      )}
                  </div>
                ) : (
                  <div className='flex w-full items-center justify-center'>
                    <p>No results found</p>
                  </div>
                )}
              </ScrollArea>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

import { Ellipsis } from 'lucide-react';

import { Button } from '@/components/ui/button';

function ItemMenu({ children }: { children?: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  return (
    <div className='z-10 flex w-24 items-center space-x-2 overflow-visible pr-4'>
      <Ellipsis size={24} onClick={toggleMenu} />
      {isOpen && (
        <div ref={menuRef} className='absolute z-50 overflow-visible pl-8'>
          {children}
          TEstawfafgsdgasg
        </div>
      )}
    </div>
  );
}

function Item({ children }: { children?: React.ReactNode }) {
  return (
    <div className='absolute z-10 flex w-24 items-center space-x-2 overflow-visible pr-4'>
      {children}
    </div>
  );
}

function WindowControls() {
  return (
    <div className='absolute right-0 top-0 flex space-x-2'>
      <div id='min-button'>
        <img
          src='icons/min-w-10.png 1x, icons/min-w-12.png 1.25x, icons/min-w-15.png 1.5x, icons/min-w-15.png 1.75x, icons/min-w-20.png 2x, icons/min-w-20.png 2.25x, icons/min-w-24.png 2.5x, icons/min-w-30.png 3x, icons/min-w-30.png 3.5x'
          draggable='false'
          alt='minimize Window'
        />
      </div>

      <div id='max-button'>
        <img
          src='icons/max-w-10.png 1x, icons/max-w-12.png 1.25x, icons/max-w-15.png 1.5x, icons/max-w-15.png 1.75x, icons/max-w-20.png 2x, icons/max-w-20.png 2.25x, icons/max-w-24.png 2.5x, icons/max-w-30.png 3x, icons/max-w-30.png 3.5x'
          draggable='false'
          alt='maximize Window'
        />
      </div>

      <div id='restore-button'>
        <img
          src='icons/restore-w-10.png 1x, icons/restore-w-12.png 1.25x, icons/restore-w-15.png 1.5x, icons/restore-w-15.png 1.75x, icons/restore-w-20.png 2x, icons/restore-w-20.png 2.25x, icons/restore-w-24.png 2.5x, icons/restore-w-30.png 3x, icons/restore-w-30.png 3.5x'
          draggable='false'
          alt='restore window size'
        />
      </div>

      <div id='close-button'>
        <img
          src='icons/close-w-10.png 1x, icons/close-w-12.png 1.25x, icons/close-w-15.png 1.5x, icons/close-w-15.png 1.75x, icons/close-w-20.png 2x, icons/close-w-20.png 2.25x, icons/close-w-24.png 2.5x, icons/close-w-30.png 3x, icons/close-w-30.png 3.5x'
          draggable='false'
          alt='close window'
        />
      </div>
    </div>
  );
}
