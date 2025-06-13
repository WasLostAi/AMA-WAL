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
        // Fetch from the single AI-powered route
        const response = await fetch(`/api/generate-social-posts?type=${feedType}`)
        if (!response.ok) {
          // Check content type before attempting to parse as JSON
          const contentType = response.headers.get("Content-Type")
          let errorMessage = `Failed to generate ${feedType} posts. Status: ${response.status}`

          if (contentType && contentType.includes("application/json")) {
            try {
              const errorResponse = await response.json()
              errorMessage = errorResponse.error || errorResponse.suggestion || errorMessage
            } catch (jsonParseError) {
              console.error("Failed to parse JSON error response:", jsonParseError)
              errorMessage = `Server returned non-JSON error: ${await response.text()}`
            }
          } else {
            errorMessage = `Server returned non-JSON error: ${await response.text()}`
          }
          throw new Error(errorMessage)
        }
        const data = await response.json()
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
