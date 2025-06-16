"use client"

import type React from "react"

import { useState, useActionState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { fetchTweets } from "@/app/twitter/actions" // Import the server action
import { TwitterIcon } from "@/components/icons" // Assuming you have a TwitterIcon

interface Tweet {
  id: string
  text: string
  author_id?: string
  created_at?: string
}

export function TwitterFeed() {
  const [query, setQuery] = useState("")
  const [state, formAction, isPending] = useActionState(fetchTweets, {
    success: false,
    message: "",
    tweets: [],
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim() || isPending) return

    const formData = new FormData()
    formData.append("query", query)
    formAction(formData) // Call the server action
  }

  return (
    <Card className="w-full max-w-3xl mx-auto jupiter-outer-panel p-6 mt-8">
      <CardHeader>
        <CardTitle className="text-center text-2xl font-bold text-[#afcd4f]">
          <TwitterIcon className="inline-block h-6 w-6 mr-2 text-[#afcd4f]" />
          TwitterAPI.io Feed
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4 text-center">
          Enter a query to fetch tweets using the hypothetical twitterapi.io integration.
        </p>
        <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
          <Input
            type="text"
            placeholder="Search tweets (e.g., #AI OR #Web3)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-neumorphic-base shadow-inner-neumorphic text-white"
            disabled={isPending}
          />
          <Button
            type="submit"
            className="jupiter-button-dark h-12 px-6 bg-neumorphic-base hover:bg-neumorphic-base"
            disabled={isPending || !query.trim()}
          >
            {isPending ? "Fetching..." : "Fetch Tweets"}
          </Button>
        </form>

        {state.message && (
          <p className={`text-sm text-center mb-4 ${state.success ? "text-green-500" : "text-red-500"}`}>
            {state.message}
          </p>
        )}

        {state.success && state.tweets && state.tweets.length > 0 ? (
          <div className="space-y-4 max-h-96 overflow-y-auto p-2">
            {state.tweets.map((tweet) => (
              <div key={tweet.id} className="neumorphic-inset p-3 rounded-lg">
                <p className="text-sm text-white">{tweet.text}</p>
                {tweet.author_id && <p className="text-xs text-muted-foreground mt-1">Author ID: {tweet.author_id}</p>}
                {tweet.created_at && (
                  <p className="text-xs text-muted-foreground">Posted: {new Date(tweet.created_at).toLocaleString()}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          !isPending &&
          !state.message && <p className="text-center text-muted-foreground">No tweets to display. Try a search!</p>
        )}
      </CardContent>
    </Card>
  )
}
