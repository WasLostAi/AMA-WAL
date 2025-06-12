"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { saveCurrentProjects } from "@/app/actions" // Server Action for saving
import { initialCurrentProjectsMarkdown } from "@/lib/current-projects" // Initial content
import { getBlobContent } from "@/lib/blob-actions" // Action to read from blob

export default function EditorPage() {
  const [editorContent, setEditorContent] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  useEffect(() => {
    const loadContent = async () => {
      setIsLoading(true)
      setMessage(null)
      try {
        const content = await getBlobContent()
        if (content) {
          setEditorContent(content)
        } else {
          setEditorContent(initialCurrentProjectsMarkdown) // Use initial fallback if blob is empty
        }
      } catch (error) {
        console.error("Failed to load content from blob:", error)
        setMessage({ type: "error", text: "Failed to load previous content. Using default." })
        setEditorContent(initialCurrentProjectsMarkdown) // Fallback to initial if loading fails
      } finally {
        setIsLoading(false)
      }
    }
    loadContent()
  }, [])

  const handleSubmit = async () => {
    setIsLoading(true)
    setMessage(null)
    try {
      const result = await saveCurrentProjects(editorContent)
      if (result.success) {
        setMessage({ type: "success", text: "Content saved successfully!" })
      } else {
        setMessage({ type: "error", text: result.error || "Failed to save content." })
      }
    } catch (error) {
      console.error("Error saving content:", error)
      setMessage({ type: "error", text: "An unexpected error occurred while saving." })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col">
      <Header />
      <div className="flex-1 container max-w-4xl mx-auto px-4 py-20">
        <div className="jupiter-outer-panel p-6 mb-8">
          <h1 className="text-3xl font-bold text-center mb-6 text-[#afcd4f]">Edit Social Post Source</h1>
          <p className="text-center text-muted-foreground mb-8">
            Paste your Markdown formatted project updates here. This content will be used by the AI to generate your
            social media posts.
          </p>
          <div className="jupiter-panel p-4 flex flex-col gap-4">
            <Textarea
              value={editorContent}
              onChange={(e) => setEditorContent(e.target.value)}
              placeholder="Paste your Markdown content here..."
              rows={20}
              className="font-mono text-sm"
              disabled={isLoading}
            />
            <Button
              onClick={handleSubmit}
              className="jupiter-button-dark h-12 px-6 bg-neumorphic-base hover:bg-neumorphic-base"
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : "Commit Changes"}
            </Button>
            {message && (
              <div
                className={`mt-4 p-3 rounded-md text-center ${
                  message.type === "success" ? "bg-green-900/30 text-green-400" : "bg-red-900/30 text-red-400"
                }`}
              >
                {message.text}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
