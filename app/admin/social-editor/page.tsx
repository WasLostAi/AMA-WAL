"use client"

import { useState, useEffect, useMemo } from "react"
import { useActionState } from "react"
import { saveSocialPostsMarkdown } from "./actions"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { initialProjectUpdatesMarkdown } from "@/lib/current-projects"
import { useWallet } from "@solana/wallet-adapter-react" // Import useWallet
import { useRouter } from "next/navigation" // Import useRouter

export default function SocialEditorPage() {
  const [content, setContent] = useState(initialProjectUpdatesMarkdown)
  const [state, formAction, isPending] = useActionState(saveSocialPostsMarkdown, { message: "", success: false })

  const { publicKey, connected } = useWallet()
  const router = useRouter()

  // Your specific authorized wallet address
  const authorizedWalletAddress = useMemo(() => process.env.NEXT_PUBLIC_AUTHORIZED_SOLANA_WALLET, [])

  // Check if the connected wallet is YOUR authorized wallet
  const isAuthorized = useMemo(() => {
    return connected && publicKey?.toBase58() === authorizedWalletAddress
  }, [connected, publicKey, authorizedWalletAddress])

  useEffect(() => {
    if (!connected || !isAuthorized) {
      // If not connected or not the authorized wallet, redirect to home
      router.push("/")
    }
  }, [connected, isAuthorized, router])

  useEffect(() => {
    if (state.message) {
      alert(state.message)
    }
  }, [state])

  // Only render the editor if authorized
  if (!connected || !isAuthorized) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4">
        <p className="text-red-500 text-lg">Unauthorized access. Redirecting...</p>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <Card className="w-full max-w-3xl jupiter-outer-panel p-6">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold text-[#afcd4f]">Social Post Editor</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4 text-center">
            Paste your Markdown-formatted project updates here. This content will be used by AI to generate your social
            media posts.
          </p>
          <form action={formAction} className="space-y-4">
            <Textarea
              name="markdownContent"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste your Markdown content here..."
              className="min-h-[400px] bg-neumorphic-base shadow-inner-neumorphic text-white p-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#afcd4f]"
            />
            <Button
              type="submit"
              className="jupiter-button-dark w-full h-12 px-6 bg-neumorphic-base hover:bg-neumorphic-base"
              disabled={isPending}
            >
              {isPending ? "Committing..." : "COMMIT UPDATES"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
