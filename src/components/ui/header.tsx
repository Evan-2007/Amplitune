'use client';
import React, { use } from 'react';
import { ModeToggle } from '../theme-toggle';
import { Search as SearchIcon, CirclePlay } from 'lucide-react';
import { Input } from '../ui/input';
import { useEffect, useState, useRef, useMemo } from 'react';
import { isElectron as checkIsElectron } from '@/lib/utils';
import { CrossPlatformStorage } from '@/lib/storage/cross-platform-storage';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useQueueStore } from '@/lib/queue';
import { subsonicURL } from '@/lib/sources/navidrome';
import { useSourceManager } from '@/lib/hooks';
import { debounce } from 'lodash';
import { SearchResult } from '@/lib/sources/types';
import AMIcon from '@/assets/apple-music_dark.svg';
import NavidromeIcon from '@/assets/navidrome_dark.svg';

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
    <div className='z-10 flex items-center md:justify-between bg-card md:p-4 p-2 justify-center'>
      <div className="max-md:hidden">
        <LeftMenu />
      </div>
      <div>
        <Search />
      </div>
      <div className="max-md:hidden">
        <RightMenu />
      </div>
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
      <li>
        <Link className='hover:underline' href='/accounts'>
          Accounts
        </Link>
      </li>
    </ul>
  );
}

function Search() {
  const sourceManager = useSourceManager();
  const queue = useQueueStore((state) => state);

  const [results, setResults] = useState<SearchResult | null>(null);

  const [activeInput, setActiveInput] = useState(false);
  const [search, setSearch] = useState('');

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
    if (activeInput && resultsContainerRef.current) {
      document.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          router.push(`/home/search?query=${inputRef.current?.value}`);
          setActiveInput(false);
        }
      });
    }
  }, [activeInput]);

  const handleUpdate = useMemo(
    () =>
      debounce(async (e: any) => {
        const results = await sourceManager.search(e.target.value);
        setResults(results);
      }, 100),
    []
  );
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
                    {results.artists &&
                      results.artists.length > 0 &&
                      results.artists.map((artist, index) => (
                        <div className='' key={index}>
                          <div className='col-auto grid grid-cols-7 py-2 pl-2'>
                            <button
                              key={index}
                              className='group relative flex w-full items-center pb-2 pt-2 filter-none'
                              onClick={() =>
                                router.push(
                                  `/home/artist?id=${artist.id}&source=${artist.source}`
                                )
                              }
                            >
                              <img
                                className='absolute w-11 rounded-full'
                                src={artist.imageUrl}
                                alt=''
                              />
                            </button>
                            <div className='col-span-5 space-y-1 pr-3'>
                              <Link
                                className='line-clamp-1 text-sm hover:underline'
                                href={`/home/artist?id=${artist.id}&source=${artist.source}`}
                              >
                                {artist.name}
                              </Link>
                              <Link
                                className='line-clamp-1 text-[11px] text-gray-500 hover:underline'
                                href={`/home/artist?id=${artist.id}&source=${artist.source}`}
                              >
                                Artist
                              </Link>
                            </div>
                            <ItemMenu />
                          </div>
                          <div className='line-clamp-1 h-[1px] w-full bg-border px-2'></div>
                        </div>
                      ))}

                    {results.songs &&
                      results.songs.length > 0 &&
                      results.songs.map((song, index) => (
                        <div className='' key={index}>
                          <div className='col-auto grid grid-cols-7 py-2 pl-2'>
                            <button
                              key={index}
                              className='group relative flex w-full items-center filter-none'
                              onClick={() => play(song)}
                            >
                              <img
                                className='absolute w-11 rounded-md'
                                src={song.imageUrl}
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
                                className='line-clamp-1 flex text-sm hover:underline'
                                href={`/home/?playing=${song.id}&play=true`}
                              >
                                {song.title}
                                <div className='ml-2 flex items-center space-x-1'>
                                  {song.availableSources.includes(
                                    'musicKit'
                                  ) && <AMIcon className='h-4 w-4' />}
                                  {song.availableSources.includes(
                                    'navidrome'
                                  ) && <NavidromeIcon className='h-4 w-4' />}
                                </div>
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
                                  key={index}
                                >
                                  Add To Queue
                                </DropdownItem>
                              </DropdownMenu>
                            </Dropdown>
                          </div>
                          <div className='line-clamp-1 h-[1px] w-full bg-border px-2'></div>
                        </div>
                      ))}

                    {results.albums &&
                      results.albums.length > 0 &&
                      results.albums.map((album, index) =>
                        //check count
                        album ? (
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
                                  src={album.imageUrl}
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
                                  {album.title}
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
