"use client"

import { useState, useEffect, useMemo } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { SocialPostScroller } from "@/components/social-post-scroller"
import { useWallet } from "@solana/wallet-adapter-react"
import { useWalletModal } from "@solana/wallet-adapter-react-ui"
import { useRouter } from "next/navigation"

type FeedType = "twitter" | "linkedin"

export function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [currentFeedType, setCurrentFeedType] = useState<FeedType>("twitter")

  const { publicKey, connected, disconnect } = useWallet()
  const { setVisible } = useWalletModal()
  const router = useRouter()

  const authorizedWalletAddress = useMemo(() => process.env.NEXT_PUBLIC_AUTHORIZED_SOLANA_WALLET, [])

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

  // New useEffect to handle post-connection redirection for unauthorized users
  useEffect(() => {
    if (connected) {
      if (!isAuthorized) {
        // If connected but not authorized, redirect to contact form
        router.push("/contact")
        // Optionally, disconnect the wallet after redirecting
        // disconnect(); // Uncomment if you want to auto-disconnect unauthorized wallets
      } else {
        // If connected and authorized, and not already on admin page, navigate to admin
        // This handles cases where they connect the authorized wallet from the home page
        if (window.location.pathname !== "/admin") {
          router.push("/admin")
        }
      }
    }
  }, [connected, isAuthorized, router, disconnect]) // Add disconnect to dependencies if used

  const toggleFeedType = () => {
    setCurrentFeedType((prevType) => (prevType === "twitter" ? "linkedin" : "twitter"))
  }

  const handleConnectClick = () => {
    if (isAuthorized) {
      // If already connected AND authorized, go to editor
      router.push("/admin")
    } else if (connected) {
      // If connected but NOT authorized, disconnect
      disconnect()
    } else {
      // If not connected, open the wallet modal for anyone
      setVisible(true)
    }
  }

  const buttonText = useMemo(() => {
    if (isAuthorized) {
      return "EDITOR"
    } else if (connected) {
      return "DISCONNECT"
    } else {
      return "CONNECT WALLET"
    }
  }, [isAuthorized, connected])

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
          {buttonText}
        </Button>
      </div>
    </header>
  )
}
