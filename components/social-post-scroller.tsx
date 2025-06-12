"use client"

import { TwitterIcon, LinkedInIcon } from "@/components/icons"
import { useEffect, useState } from "react"

type SocialPostType = "twitter" | "linkedin"

interface SocialPost {
  id: number | string
  type: SocialPostType
  headline: string
  content: string
  createdAt?: string // Optional, if you want to display it
}

// Placeholder for LinkedIn data (since we're only implementing X API for now)
const linkedinPosts: SocialPost[] = [
  {
    id: 1,
    type: "linkedin",
    headline: "New Article: Agentic Solutions",
    content:
      "Just published a deep dive into Agentic Solutions and their impact on Web3 workflows. Check it out on my LinkedIn profile!",
  },
  {
    id: 2,
    type: "linkedin",
    headline: "Hiring for AI Research",
    content:
      "WasLost.Ai is looking for talented AI researchers to join our team. DM me if you're passionate about AI and Web3!",
  },
  {
    id: 3,
    type: "linkedin",
    headline: "WasLost.Ai Product Launch",
    content: "Excited to announce the upcoming launch of our new AI agent ecosystem. Stay tuned for more updates!",
  },
  {
    id: 4,
    type: "linkedin",
    headline: "Speaking at Web3 Summit",
    content: "Honored to be speaking at the upcoming Web3 Summit on the future of decentralized AI. See you there!",
  },
  {
    id: 5,
    type: "linkedin",
    headline: "Partnership Announcement",
    content:
      "Thrilled to announce a new strategic partnership that will accelerate our AI development. More details soon!",
  },
]

interface SocialPostScrollerProps {
  feedType: SocialPostType
  onToggleFeed: () => void
}

export function SocialPostScroller({ feedType, onToggleFeed }: SocialPostScrollerProps) {
  const [currentPostIndex, setCurrentPostIndex] = useState(0)
  const [posts, setPosts] = useState<SocialPost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPosts = async () => {
      setIsLoading(true)
      setError(null)
      try {
        let data: SocialPost[] = []
        if (feedType === "twitter") {
          const response = await fetch("/api/x-posts") // Call the new X API route
          if (!response.ok) {
            // Parse error details from the backend response
            const errorResponse = await response.json()
            // Use the 'error' or 'suggestion' field from the backend response
            throw new Error(errorResponse.error || errorResponse.suggestion || "Failed to fetch Twitter posts")
          }
          data = await response.json()
        } else if (feedType === "linkedin") {
          // For LinkedIn, we're still using placeholder data for now
          data = linkedinPosts
        }
        setPosts(data)
        setCurrentPostIndex(0) // Reset index when feed type changes
      } catch (err: any) {
        console.error(`Error fetching ${feedType} posts:`, err)
        setError(err.message || "Failed to load posts.")
        setPosts([]) // Clear posts on error
      } finally {
        setIsLoading(false)
      }
    }

    fetchPosts()

    // Set up interval for scrolling
    const interval = setInterval(() => {
      if (posts.length > 0) {
        setCurrentPostIndex((prevIndex) => (prevIndex + 1) % posts.length)
      }
    }, 5000) // Change post every 5 seconds

    return () => clearInterval(interval)
  }, [feedType, posts.length]) // Re-fetch and reset interval when feedType changes or posts length changes

  if (isLoading) {
    return (
      <div className="neumorphic-base p-2 flex items-center gap-3 flex-1 mx-4 h-12 overflow-hidden">
        <span className="text-white">Loading {feedType} posts...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="neumorphic-base p-2 flex items-center gap-3 flex-1 mx-4 h-12 overflow-hidden">
        <span className="text-red-500">Error: {error}</span>
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div className="neumorphic-base p-2 flex items-center gap-3 flex-1 mx-4 h-12 overflow-hidden">
        <span className="text-white">No {feedType} posts available.</span>
      </div>
    )
  }

  const currentPost = posts[currentPostIndex]

  return (
    <div className="neumorphic-base p-2 flex items-center gap-3 flex-1 mx-4 h-12 overflow-hidden">
      {currentPost.type === "twitter" ? (
        <TwitterIcon
          className="h-6 w-6 text-[#afcd4f] flex-shrink-0 cursor-pointer"
          onClick={onToggleFeed}
          aria-label="Toggle to LinkedIn feed"
        />
      ) : (
        <LinkedInIcon
          className="h-6 w-6 text-[#afcd4f] flex-shrink-0 cursor-pointer"
          onClick={onToggleFeed}
          aria-label="Toggle to Twitter feed"
        />
      )}
      <div className="flex-1 overflow-hidden">
        <div className="whitespace-nowrap animate-marquee">
          <span className="text-[#afcd4f] font-bold mr-2">{currentPost.headline}:</span>
          <span className="text-white">{currentPost.content}</span>
        </div>
      </div>
    </div>
  )
}
