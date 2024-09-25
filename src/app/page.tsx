'use client'
import Image from "next/image";
import {ModeToggle} from "@/components/theme-toggle";
import { Header } from "@/components/ui/header";
import {useEffect} from "react";

export default function Home() {

  useEffect(() => {
    console.log(localStorage)
  }, []);
  return (
      <div>
        <Header />
      </div>
  );
}
