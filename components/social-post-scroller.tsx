"use client"

import { TwitterIcon, LinkedInIcon } from "@/components/icons"
import { useEffect, useState } from "react"

type SocialPostType = "twitter" | "linkedin"

interface SocialPost {
  id: number | string
  type: SocialPostType
  headline: string
  content: string
  createdAt?: string
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
        console.log(`Fetching ${feedType} posts...`)

        const response = await fetch(`/api/generate-social-posts?type=${feedType}`)

        if (!response.ok) {
          const contentType = response.headers.get("Content-Type")
          let errorMessage = `Failed to generate ${feedType} posts. Status: ${response.status}`

          if (contentType && contentType.includes("application/json")) {
            try {
              const errorResponse = await response.json()
              errorMessage = errorResponse.error || errorResponse.suggestion || errorMessage
            } catch (jsonParseError) {
              console.error("Failed to parse JSON error response:", jsonParseError)
              const textResponse = await response.text()
              errorMessage = `Server error: ${textResponse.substring(0, 100)}...`
            }
          } else {
            try {
              const textResponse = await response.text()
              errorMessage = `Server returned non-JSON error: ${textResponse.substring(0, 100)}...`
            } catch (textError) {
              errorMessage = `Server error (status ${response.status})`
            }
          }
          throw new Error(errorMessage)
        }

        const data = await response.json()

        if (!Array.isArray(data)) {
          throw new Error("Invalid response format: expected array of posts")
        }

        console.log(`Successfully fetched ${data.length} ${feedType} posts`)
        setPosts(data)
        setCurrentPostIndex(0)
      } catch (err: any) {
        console.error(`Error fetching ${feedType} posts:`, err)
        setError(err.message || "Failed to load posts.")
        setPosts([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchPosts()
  }, [feedType]) // Remove posts.length dependency to avoid infinite loops

  useEffect(() => {
    if (posts.length === 0) return

    const interval = setInterval(() => {
      setCurrentPostIndex((prevIndex) => (prevIndex + 1) % posts.length)
    }, 5000) // Change post every 5 seconds

    return () => clearInterval(interval)
  }, [posts.length]) // Separate effect for the interval

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
        <span className="text-red-500 text-sm">Error: {error}</span>
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
