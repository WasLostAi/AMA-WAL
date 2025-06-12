"use server"

import { put, get } from "@vercel/blob"

// Define a consistent path/filename for your blob
const BLOB_PATH = "waslostai-current-projects.md"

export async function saveCurrentProjects(content: string) {
  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      throw new Error("BLOB_READ_WRITE_TOKEN environment variable is not set.")
    }

    const blob = await put(BLOB_PATH, content, {
      access: "public", // Make it public so the API route can read it
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })

    console.log("Content saved to Vercel Blob:", blob.url)
    return { success: true, url: blob.url }
  } catch (error: any) {
    console.error("Error saving content to Vercel Blob:", error)
    return { success: false, error: error.message || "Failed to save content to Blob." }
  }
}

export async function getBlobContent(): Promise<string | null> {
  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.warn("BLOB_READ_WRITE_TOKEN environment variable is not set. Cannot read from Blob.")
      return null
    }

    const blob = await get(BLOB_PATH, {
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })

    if (blob) {
      const content = await blob.text()
      return content
    }
    return null
  } catch (error: any) {
    // If the blob doesn't exist yet, get() will throw a 404.
    // We can treat this as "no content yet" rather than a hard error.
    if (error.message && error.message.includes("BlobNotFound")) {
      console.log(`Blob '${BLOB_PATH}' not found. Returning initial content.`)
      return null // Indicate no content found in blob
    }
    console.error("Error reading content from Vercel Blob:", error)
    throw new Error(error.message || "Failed to read content from Blob.")
  }
}
