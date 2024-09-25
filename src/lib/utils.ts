import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export function isElectron() {
  // Check if the userAgent contains 'Electron'
  if (typeof window !== 'undefined' && typeof window.navigator === 'object') {
    return /electron/i.test(window.navigator.userAgent);
  }

  // Check if the process has electron version
  if (typeof process !== 'undefined' && typeof process.versions === 'object' && typeof process.versions.electron === 'string') {
    return true;
  }

  // Check if the electron module is available
  return typeof window !== 'undefined' && typeof window.process === 'object' && typeof window.process.versions === 'object' && typeof window.process.versions.electron === 'string';
}