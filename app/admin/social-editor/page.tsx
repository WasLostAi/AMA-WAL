"use client"

import { useState, useEffect } from "react"
import { useActionState } from "react"
import { saveSocialPostsMarkdown } from "./actions"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea" // Assuming you have a Textarea component or will create one
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card" // Assuming shadcn Card components
import { initialProjectUpdatesMarkdown } from "@/lib/current-projects" // Import initial content

export default function SocialEditorPage() {
  const [content, setContent] = useState(initialProjectUpdatesMarkdown)
  const [state, formAction, isPending] = useActionState(saveSocialPostsMarkdown, { message: "", success: false })

  useEffect(() => {
    if (state.message) {
      // You might want a more sophisticated toast/notification system here
      alert(state.message)
    }
  }, [state])

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
