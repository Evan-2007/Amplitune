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
import {useRouter } from 'next/navigation';

const localStorage = new CrossPlatformStorage();

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    console.log(localStorage);
    if (window.isTauri) {
      router.push('/home');
    }
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
      <Button disabled>Toggle Acceleration</Button>
      <ModeToggle />
    </div>
  );
}
