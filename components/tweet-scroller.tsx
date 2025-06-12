"use client"

import { TwitterIcon } from "@/components/icons"
import { useEffect, useState } from "react"

// Placeholder for tweet data
const tweets = [
  {
    id: 1,
    headline: "Latest AI breakthroughs!",
    content: "Excited about the new advancements in generative AI models. The possibilities are endless!",
  },
  {
    id: 2,
    headline: "Web3 and Decentralization",
    content: "Exploring new tokenized workflows on Solana. Building the future of decentralized applications.",
  },
  {
    id: 3,
    headline: "Trading Automation Insights",
    content: "Developing new AI-driven trading strategies. Automation is key to efficiency in financial markets.",
  },
  {
    id: 4,
    headline: "WasLost.Ai Vision",
    content: "Our mission is to empower through agentic solutions. Making AI accessible and impactful for everyone.",
  },
  {
    id: 5,
    headline: "Community Building",
    content: "Engaging with our community on Discord and X. Your feedback drives our innovation!",
  },
]

export function TweetScroller() {
  const [currentTweetIndex, setCurrentTweetIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTweetIndex((prevIndex) => (prevIndex + 1) % tweets.length)
    }, 5000) // Change tweet every 5 seconds

    return () => clearInterval(interval)
  }, [])

  const currentTweet = tweets[currentTweetIndex]

  return (
    <div className="neumorphic-base p-2 flex items-center gap-3 flex-1 mx-4 h-12 overflow-hidden">
      <TwitterIcon className="h-6 w-6 text-[#afcd4f] flex-shrink-0" />
      <div className="flex-1 overflow-hidden">
        <div className="whitespace-nowrap animate-marquee">
          <span className="text-[#afcd4f] font-bold mr-2">{currentTweet.headline}:</span>
          <span className="text-white">{currentTweet.content}</span>
        </div>
      </div>
    </div>
  )
}
