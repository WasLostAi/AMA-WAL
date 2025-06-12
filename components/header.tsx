"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { SocialPostScroller } from "@/components/social-post-scroller"

type FeedType = "twitter" | "linkedin"

export function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [currentFeedType, setCurrentFeedType] = useState<FeedType>("twitter") // State to manage feed type

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

  const toggleFeedType = () => {
    setCurrentFeedType((prevType) => (prevType === "twitter" ? "linkedin" : "twitter"))
  }

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
        {/* Logo div - removed onClick */}
        <div className="neumorphic-base p-2 inline-flex items-center justify-center h-12">
          <Image
            src="/images/waslost-logo.png"
            alt="WasLost AI Logo"
            width={180}
            height={40}
            priority
            className="h-8 w-auto"
          />
        </div>

        {/* Social Post Scroller - now receives the toggle function */}
        <SocialPostScroller feedType={currentFeedType} onToggleFeed={toggleFeedType} />

        {/* CONNECT button */}
        <Button className="jupiter-button-dark h-12 px-6 bg-neumorphic-base hover:bg-neumorphic-base">CONNECT</Button>
      </div>
    </header>
  )
}
