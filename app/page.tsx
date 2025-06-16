"use client"

import { useEffect, useState, useCallback } from "react" // Import useCallback
import { Header } from "@/components/header"
import { ChatInterface } from "@/components/chat-interface"
import { FeatureSection } from "@/components/feature-section"
import { Footer } from "@/components/footer"
import { getAgentProfileData } from "./admin/agent-manager/agent-actions" // Import agent actions
import { TwitterFeed } from "@/components/twitter-feed"

export default function HomePage() {
  const [loaded, setLoaded] = useState(false)
  const [initialGreeting, setInitialGreeting] = useState(
    "Hello, I'm Michael Robinson's AI representative. I'm here to provide insights into his professional background and the innovative work at WasLost.Ai. How can I assist you?",
  )
  const [aiAvatarSrc, setAiAvatarSrc] = useState<string | undefined>(undefined)

  // Fetch agent profile data for initial greeting and avatar
  const fetchAgentProfile = useCallback(async () => {
    const { data } = await getAgentProfileData()
    if (data) {
      setInitialGreeting(data.chatbotInstructions?.initialGreeting || initialGreeting)
      setAiAvatarSrc(data.personal?.avatarUrl || undefined)
    }
  }, [initialGreeting]) // Depend on initialGreeting to avoid stale closure if it's a default

  useEffect(() => {
    setLoaded(true)
    fetchAgentProfile() // Fetch profile on mount
  }, [fetchAgentProfile])

  return (
    <main className="flex min-h-screen flex-col">
      <Header />
      <div className="flex-1 container max-w-4xl mx-auto px-4">
        <div className="pt-40 pb-20">
          <div className={`transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}>
            <ChatInterface initialGreeting={initialGreeting} aiAvatarSrc={aiAvatarSrc} />
          </div>
          <div className="mt-6 mb-10">
            <hr className="border-border opacity-30" />
          </div>
          <div
            className={`transition-all duration-700 delay-500 ${loaded ? "opacity-100 transform-none" : "opacity-0 translate-y-10"}`}
          >
            <FeatureSection />
          </div>
          <div
            className={`transition-all duration-700 delay-700 ${loaded ? "opacity-100 transform-none" : "opacity-0 translate-y-10"}`}
          >
            <TwitterFeed />
          </div>
        </div>
      </div>
      <div className="mt-auto">
        <Footer />
      </div>
    </main>
  )
}
