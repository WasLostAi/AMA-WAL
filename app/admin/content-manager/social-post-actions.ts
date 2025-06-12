"use server"

import { put } from "@vercel/blob"
import { revalidatePath } from "next/cache"

export async function saveSocialPostsMarkdown(prevState: any, formData: FormData) {
  const markdownContent = formData.get("markdownContent") as string

  if (!markdownContent) {
    return { message: "No content provided.", success: false }
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error("BLOB_READ_WRITE_TOKEN environment variable is not set.")
    return { message: "Server configuration error: Blob storage token is missing.", success: false }
  }

  try {
    // Save the markdown content to Vercel Blob
    // We'll use a fixed filename so it always overwrites the latest content
    const blob = await put("social-posts-source.md", markdownContent, {
      access: "public", // Make it publicly accessible for the API route to fetch
      contentType: "text/markdown",
      allowOverwrite: true,
    })

    // Revalidate the API route that fetches this content
    // This ensures the social post scroller gets the new content quickly
    revalidatePath("/api/generate-social-posts")

    console.log("Markdown content saved to Vercel Blob:", blob.url)
    return { message: "Updates committed successfully!", success: true }
  } catch (error) {
    console.error("Error saving markdown to Vercel Blob:", error)
    return {
      message: `Failed to commit updates: ${error instanceof Error ? error.message : String(error)}`,
      success: false,
    }
  }
}
