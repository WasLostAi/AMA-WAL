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
  const [errorDetails, setErrorDetails] = useState<string | null>(null) // New state for error details
  const [errorSuggestion, setErrorSuggestion] = useState<string | null>(null) // New state for error suggestion

  useEffect(() => {
    const fetchPosts = async () => {
      setIsLoading(true)
      setError(null)
      setErrorDetails(null) // Clear previous error details
      setErrorSuggestion(null) // Clear previous error suggestion
      try {
        const response = await fetch(`/api/generate-social-posts?type=${feedType}`)

        if (!response.ok) {
          const contentType = response.headers.get("content-type")
          if (contentType && contentType.includes("application/json")) {
            const errorResponse = await response.json()
            setError(errorResponse.error || `Failed to generate ${feedType} posts.`)
            setErrorDetails(errorResponse.details || null) // Set details from server
            setErrorSuggestion(errorResponse.suggestion || null) // Set suggestion from server
            throw new Error(errorResponse.error || errorResponse.suggestion || `Failed to generate ${feedType} posts.`)
          } else {
            const errorText = await response.text()
            console.error("Non-JSON error response from API:", errorText)
            setError(`Server returned an unexpected error (Status: ${response.status}).`)
            setErrorDetails("The server did not return a valid JSON error response.")
            setErrorSuggestion("Please check Vercel logs for more details on the server-side error.")
            throw new Error(`Server returned an unexpected error (Status: ${response.status}).`)
          }
        }

        const data = await response.json()
        setPosts(data)
        setCurrentPostIndex(0) // Reset index when feed type changes
      } catch (err: any) {
        console.error(`Error fetching ${feedType} posts:`, err)
        // If error was already set by the JSON parsing block, don't overwrite it
        if (!error) {
          setError(err.message || "Failed to load posts.")
        }
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
  }, [feedType, posts.length, error]) // Re-fetch and reset interval when feedType changes or posts length changes

  if (isLoading) {
    return (
      <div className="neumorphic-base p-2 flex items-center gap-3 flex-1 mx-4 h-12 overflow-hidden">
        <span className="text-white">Loading {feedType} posts...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="neumorphic-base p-2 flex flex-col justify-center flex-1 mx-4 h-auto min-h-[48px] overflow-hidden text-red-500">
        <span className="font-bold">Error: {error}</span>
        {errorDetails && <span className="text-sm mt-1">{errorDetails}</span>}
        {errorSuggestion && <span className="text-sm mt-1">{errorSuggestion}</span>}
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
