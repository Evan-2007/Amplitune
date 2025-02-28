'use client'
import { Library, House, Search} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export function MobileFooter() {
    const pathname = usePathname()
    console.log(pathname)
    return (
        <div className ="md:hidden h-14 w-full bg-background border-t border-border flex items-center justify-between px-4">
            <div className={`flex flex-col items-center w-[25%] transition-colors duration-100 ${pathname === '/home' ? 'text-red-500' : ''}`}>
                <Link href="/home" className="flex flex-col items-center">
                    <House size={26} strokeWidth={2.5}/>
                    <p className="text-xs">Home</p>
                </Link>
            </div>
            <div className={`flex flex-col items-center w-[50%] transition-colors duration-100 ${pathname === '/home/search' ? 'text-red-500' : ''}`}>
                <Link href="/home/search" className="flex flex-col items-center">
                    <Search size={26} strokeWidth={2.5} />
                    <p className="text-xs">Search</p>
                </Link>
            </div>
            <div className={`flex flex-col items-center w-[25%] transition-colors duration-500 ${pathname === '/home/library' ? 'text-red-500' : ''}`}>
                <Link href="/home/library" className="flex flex-col items-center">
                    <Library size={26}  strokeWidth={2.5}/>
                    <p className="text-xs">Library</p>
                </Link>
            </div>
        </div>
    )
}