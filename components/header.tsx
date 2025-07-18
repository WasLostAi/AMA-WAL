"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Link className="mr-6 flex items-center space-x-2" href="/">
            <span className="hidden font-bold sm:inline-block font-syne text-[#afcd4f]">WasLost.tech</span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link className="transition-colors hover:text-foreground/80 text-foreground/60" href="/projects">
              Projects
            </Link>
            <Link className="transition-colors hover:text-foreground/80 text-foreground/60" href="/blog">
              Blog
            </Link>
            <Link className="transition-colors hover:text-foreground/80 text-foreground/60" href="/contact">
              Contact
            </Link>
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            <Button
              variant="outline"
              className="inline-flex items-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 relative w-full justify-start text-sm text-muted-foreground sm:pr-12 md:w-40 lg:w-64"
            >
              <span className="hidden lg:inline-flex">Search...</span>
              <span className="inline-flex lg:hidden">Search...</span>
            </Button>
          </div>
          <nav className="flex items-center space-x-2">
            <WalletMultiButton />
            <ModeToggle />
          </nav>
        </div>
      </div>
    </header>
  )
}
