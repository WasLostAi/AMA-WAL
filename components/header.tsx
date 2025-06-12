"use client"

import { useState, useEffect } from "react"
import Image from "next/image"

export function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setLoaded(true)

    const handleScroll = () => {
      const isScrolled = window.scrollY > 10
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled)
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [scrolled])

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-black/80 backdrop-blur-md" : "bg-transparent"
      }`}
      style={{ backgroundColor: scrolled ? "rgba(12, 12, 12, 0.8)" : "transparent" }}
    >
      <div
        className={`container max-w-4xl mx-auto px-4 py-4 flex justify-between items-center transition-all duration-500 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="flex items-center gap-2">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Logo1-cKn3oZ6iAmIHfsUTkOF0Y7SFbLokfW.png"
            alt="WasLost Ai Logo"
            width={180}
            height={40}
            className="h-8 w-auto"
          />
        </div>
        {/* Removed CONNECT button */}
      </div>
    </header>
  )
}
