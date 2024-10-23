'use client';
import Image from 'next/image';
import { ModeToggle } from '@/components/theme-toggle';
import { Header } from '@/components/ui/header';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useState } from 'react';
import { CrossPlatformStorage } from '@/lib/storage/cross-platform-storage';
import { isElectron } from '@/lib/utils';
import { SongDropdown } from '@/components/song/dropdown';

const localStorage = new CrossPlatformStorage();

export default function Home() {
  const handleAcceleration = () => {
    if (isElectron()) {
      window.electronAPI.send('hardwareAcceleration', true);
    }
  };

  useEffect(() => {
    console.log(localStorage);
  }, []);
  return (
    <div>
      <Header />
      <Button asChild>
        <Link href='/login'>Login</Link>
      </Button>
      <Button asChild>
        <Link href='/home'>Home</Link>
      </Button>
      <Button onClick={handleAcceleration}>Toggle Acceleration</Button>
      <ModeToggle />
    </div>
  );
}
