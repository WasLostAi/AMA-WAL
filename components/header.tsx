"use client"

import { useState, useEffect, useMemo } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { SocialPostScroller } from "@/components/social-post-scroller"
import { useWallet } from "@solana/wallet-adapter-react" // Import useWallet
import { useWalletModal } from "@solana/wallet-adapter-react-ui" // Import useWalletModal
import { useRouter } from "next/navigation" // Import useRouter

type FeedType = "twitter" | "linkedin"

export function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [currentFeedType, setCurrentFeedType] = useState<FeedType>("twitter") // State to manage feed type

  const { publicKey, connected, disconnect } = useWallet()
  const { setVisible } = useWalletModal()
  const router = useRouter()

  // Your specific authorized wallet address
  const authorizedWalletAddress = useMemo(() => process.env.NEXT_PUBLIC_AUTHORIZED_SOLANA_WALLET, [])

  // Check if the connected wallet is YOUR authorized wallet
  const isAuthorized = useMemo(() => {
    return connected && publicKey?.toBase58() === authorizedWalletAddress
  }, [connected, publicKey, authorizedWalletAddress])

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

  const handleConnectClick = () => {
    if (isAuthorized) {
      // If authorized, navigate to the consolidated admin editor
      router.push("/admin") // Changed path here
    } else if (connected) {
      // If connected but not authorized, disconnect
      disconnect()
    } else {
      // If not connected, open the wallet modal
      setVisible(true)
    }
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
        {/* Logo div */}
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

        {/* Social Post Scroller */}
        <SocialPostScroller feedType={currentFeedType} onToggleFeed={toggleFeedType} />

        {/* CONNECT / EDITOR / DISCONNECT button */}
        <Button
          className="jupiter-button-dark h-12 px-6 bg-neumorphic-base hover:bg-neumorphic-base"
          onClick={handleConnectClick}
        >
          {isAuthorized ? "EDITOR" : connected ? "DISCONNECT" : "CONNECT"}
        </Button>
      </div>
    </header>
  )
}
