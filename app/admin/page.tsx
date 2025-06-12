"use client"

import { useState, useEffect, useCallback } from "react"
import { useWallet } from "@solana/wallet-adapter-react"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea" // Assuming you have a Textarea component or use a standard one
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card" // Assuming shadcn Card components
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

const AUTHORIZED_WALLET_ADDRESS = "AuwUfiwsXA6VibDjR579HWLhDUUoa5s6T7i7KPyLUa9F"
const MESSAGE_TO_SIGN = "Authenticate to access WasLost.Ai Admin Panel"

export default function AdminPage() {
  const { publicKey, signMessage, connected } = useWallet()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authMessage, setAuthMessage] = useState("")
  const [markdownContent, setMarkdownContent] = useState("")
  const [commitStatus, setCommitStatus] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const authenticate = useCallback(async () => {
    if (!publicKey || !signMessage) {
      setAuthMessage("Please connect your wallet first.")
      return
    }

    setIsLoading(true)
    setAuthMessage("Authenticating...")

    try {
      const message = new TextEncoder().encode(MESSAGE_TO_SIGN)
      const signature = await signMessage(message)

      const response = await fetch("/api/auth/solana", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          publicKey: publicKey.toBase58(),
          signature: { data: Array.from(signature) }, // Convert Uint8Array to array for JSON
          message: MESSAGE_TO_SIGN,
        }),
      })

      const data = await response.json()
      if (data.success) {
        setIsAuthenticated(true)
        setAuthMessage("Authentication successful! Welcome, Admin.")
        // Fetch current content from Blob after successful auth
        fetchCurrentContent()
      } else {
        setIsAuthenticated(false)
        setAuthMessage(`Authentication failed: ${data.message}`)
      }
    } catch (error: any) {
      console.error("Authentication error:", error)
      setAuthMessage(`Authentication failed: ${error.message || "An unexpected error occurred."}`)
    } finally {
      setIsLoading(false)
    }
  }, [publicKey, signMessage])

  const fetchCurrentContent = useCallback(async () => {
    try {
      // Fetch the raw markdown directly from Blob for the editor
      // Note: NEXT_PUBLIC_VERCEL_BLOB_STORE_ID must be set in Vercel env vars
      const blobUrl = `https://${process.env.NEXT_PUBLIC_VERCEL_BLOB_STORE_ID}.blob.vercel-storage.com/current-projects.md`
      const rawBlobResponse = await fetch(blobUrl)
      if (rawBlobResponse.ok) {
        setMarkdownContent(await rawBlobResponse.text())
      } else {
        // If file doesn't exist or fetch fails, start with a default placeholder
        setMarkdownContent(
          "## My Latest Projects & Updates\n\n- Currently working on a new AI agent for Web3 analytics.\n- Just launched a new feature for automated trading strategies.\n- Exploring decentralized identity solutions on Solana.\n\nFeel free to update this with your latest news!",
        )
      }
    } catch (error) {
      console.error("Error fetching current content:", error)
      setMarkdownContent("Error loading existing content. Please try again or start fresh.")
    }
  }, [])

  const handleCommit = useCallback(async () => {
    if (!isAuthenticated) {
      setCommitStatus("Not authenticated. Please connect and authenticate your wallet.")
      return
    }
    if (!publicKey || !signMessage) {
      setCommitStatus("Wallet not connected.")
      return
    }

    setIsLoading(true)
    setCommitStatus("Committing content...")

    try {
      const message = new TextEncoder().encode(MESSAGE_TO_SIGN)
      const signature = await signMessage(message)

      const response = await fetch("/api/update-current-projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: markdownContent,
          publicKey: publicKey.toBase58(),
          signature: { data: Array.from(signature) },
          message: MESSAGE_TO_SIGN,
        }),
      })

      const data = await response.json()
      if (data.success) {
        setCommitStatus("Content committed successfully!")
      } else {
        setCommitStatus(`Commit failed: ${data.message}`)
      }
    } catch (error: any) {
      console.error("Commit error:", error)
      setCommitStatus(`Commit failed: ${error.message || "An unexpected error occurred."}`)
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated, markdownContent, publicKey, signMessage])

  useEffect(() => {
    if (connected && publicKey && !isAuthenticated) {
      // Automatically try to authenticate if wallet is connected but not authenticated
      authenticate()
    }
  }, [connected, publicKey, isAuthenticated, authenticate])

  return (
    <main className="flex min-h-screen flex-col">
      <Header />
      <div className="flex-1 container max-w-4xl mx-auto px-4 py-12">
        <Card className="neumorphic-base p-6">
          <CardHeader>
            <CardTitle className="text-center text-3xl font-bold text-[#afcd4f]">Admin Panel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center gap-4">
              <WalletMultiButton />
              {connected && publicKey && (
                <p className="text-sm text-muted-foreground">
                  Connected: {publicKey.toBase58().substring(0, 6)}...{publicKey.toBase58().slice(-6)}
                </p>
              )}
              {!isAuthenticated && connected && publicKey && (
                <Button onClick={authenticate} disabled={isLoading} className="jupiter-button-dark">
                  {isLoading ? "Authenticating..." : "Authenticate Wallet"}
                </Button>
              )}
              {authMessage && (
                <p className={`text-sm ${isAuthenticated ? "text-[#afcd4f]" : "text-red-500"}`}>{authMessage}</p>
              )}
            </div>

            {isAuthenticated ? (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-white">Edit Current Project Snippets (Markdown)</h3>
                <Textarea
                  value={markdownContent}
                  onChange={(e) => setMarkdownContent(e.target.value)}
                  placeholder="Paste your Markdown formatted project snippets here..."
                  className="w-full h-64 neumorphic-inset p-4 text-white bg-neumorphic-base focus:outline-none focus:ring-2 focus:ring-[#afcd4f]"
                />
                <Button onClick={handleCommit} disabled={isLoading} className="jupiter-button-dark w-full">
                  {isLoading ? "Committing..." : "Commit Updates"}
                </Button>
                {commitStatus && <p className="text-sm text-center text-muted-foreground">{commitStatus}</p>}
              </div>
            ) : (
              <div className="text-center text-red-500">
                <p>Access Denied. Please connect and authenticate with the authorized Solana wallet.</p>
                <p>Authorized Wallet: {AUTHORIZED_WALLET_ADDRESS}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <Footer />
    </main>
  )
}
