"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/header"
import { ChatInterface } from "@/components/chat-interface"
import { FeatureSection } from "@/components/feature-section"
import { Footer } from "@/components/footer"

export default function HomePage() {
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setLoaded(true)
  }, [])

  return (
    <main className="flex min-h-screen flex-col">
      <Header />
      <div className="flex-1 container max-w-4xl mx-auto px-4">
        <div className="pt-40 pb-20">
          <div className={`transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}>
            <ChatInterface />
          </div>
          {/* Removed AMA Now Live! heading */}
          <div className="mt-6 mb-10">
            <hr className="border-border opacity-30" />
          </div>
          <div
            className={`transition-all duration-700 delay-500 ${loaded ? "opacity-100 transform-none" : "opacity-0 translate-y-10"}`}
          >
            <FeatureSection />
          </div>
        </div>
      </div>
      <div className="mt-auto">
        <Footer />
      </div>
    </main>
  )
}
