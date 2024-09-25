'use client'
import Image from "next/image";
import {ModeToggle} from "@/components/theme-toggle";
import { Header } from "@/components/ui/header";
import {useEffect} from "react";
import {Button} from "@/components/ui/button";
import Link from "next/link";
import {useState} from "react";
import {CrossPlatformStorage} from "@/lib/storage/cross-platform-storage";

const localStorage = new CrossPlatformStorage();


export default function Home() {





  useEffect(() => {
    console.log(localStorage)
  }, []);
  return (
      <div>
        <Header />
        <Button asChild>
          <Link href="/login">
            Login
          </Link>
        </Button>
        <Button asChild>
          <Link href="/home?playing=31eecdb5ec50449b05683bff93a3f0b5">
            Register
          </Link>
          </Button>
      </div>
  );
}