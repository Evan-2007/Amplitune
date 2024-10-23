'use client';
import React, { useState, useEffect } from 'react';
import { CrossPlatformStorage } from '@/lib/storage/cross-platform-storage';
import Link from 'next/link';

interface Location {
  url: string;
  type: 'navidrome';
  username: string;
}

export function Sidebar() {
  const [location, setLocation] = useState<Location | false>(false);

  return (
    <div className='lex-shrink-0f flex h-full w-64 flex-col justify-between'>
      <div></div>
      <div className='mb-3 flex h-10 w-full rounded-lg bg-red-700'>
        {!location ? (
          <Link
            className='flex w-full items-center justify-center'
            href='/servers'
          >
            {' '}
            Connect to Server{' '}
          </Link>
        ) : (
          <div className='flex h-10 w-full items-center justify-center bg-red-700'>
            {' '}
            {location.username}{' '}
          </div>
        )}
      </div>
    </div>
  );
}
