"use server"

import { put, del } from "@vercel/blob"
import { revalidatePath } from "next/cache"
import { openai } from "@ai-sdk/openai"
import { supabaseAdmin } from "@/lib/supabase"
import { convert } from "html-to-text"

interface FileMetadata {
  fileName: string
  filePath: string
  tags: string[]
  contentType: string
  uploadedAt: string
}

interface AllFileMetadata {
  files: FileMetadata[]
}

const METADATA_BLOB_PATH = "file-metadata.json"

// Helper to fetch current metadata with caching
async function fetchCurrentMetadata(): Promise<AllFileMetadata> {
  try {
    const response = await fetch(`https://blob.vercel-storage.com/${METADATA_BLOB_PATH}`, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    })

    if (response.ok) {
      const text = await response.text() // Read as text first
      if (text) {
        return JSON.parse(text) as AllFileMetadata
      } else {
        // If response is OK but body is empty, treat as no files
        console.warn("File metadata blob exists but is empty. Initializing with no files.")
        return { files: [] }
      }
    } else if (response.status === 404) {
      // Explicitly handle 404 for clarity
      console.warn("File metadata blob not found. Initializing with no files.")
      return { files: [] }
    } else {
      // For other non-OK responses, throw an error to be caught by the caller
      throw new Error(`Failed to fetch metadata: ${response.status} ${response.statusText}`)
    }
  } catch (error) {
    console.error("Error fetching file metadata from Blob:", error)
    // If any other error occurs during fetch or parsing, return empty
    return { files: [] }
  }
}

// Helper to update metadata blob
async function updateMetadataBlob(metadata: AllFileMetadata) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN environment variable is not set.")
  }
  await put(METADATA_BLOB_PATH, JSON.stringify(metadata, null, 2), {
    access: "public",
    contentType: "application/json",
    allowOverwrite: true,
  })
}

// Simple text chunking function
function chunkText(text: string, chunkSize = 1000, overlap = 200): string[] {
  const chunks: string[] = []
  let i = 0
  while (i < text.length) {
    let end = Math.min(i + chunkSize, text.length)
    // Try to end at a natural break (e.g., end of a sentence or paragraph)
    let chunk = text.substring(i, end)
    const lastPeriod = chunk.lastIndexOf(".")
    const lastNewline = chunk.lastIndexOf("\n")

    if (end < text.length && (lastPeriod !== -1 || lastNewline !== -1)) {
      const splitPoint = Math.max(lastPeriod, lastNewline)
      if (splitPoint > chunk.length * 0.7) {
        // Only split if it's not too early in the chunk
        chunk = chunk.substring(0, splitPoint + 1)
        end = i + chunk.length
      }
    }

    chunks.push(chunk.trim())
    i = end - overlap
    if (i < 0) i = 0 // Prevent negative index
  }
  return chunks.filter((chunk) => chunk.length > 0)
}

async function extractTextFromFile(fileBuffer: Buffer, contentType: string): Promise<string> {
  if (contentType.includes("text/plain") || contentType.includes("text/markdown")) {
    return fileBuffer.toString("utf-8")
  } else if (contentType.includes("text/html")) {
    return convert(fileBuffer.toString("utf-8"), {
      wordwrap: 130,
    })
  }
  // For PDFs, DOCX, images, or other unsupported types, return empty string
  console.warn(`Unsupported file type for text extraction for AI memory: ${contentType}`)
  return ""
}

export async function processFileForRAG(filePath: string, tags: string[], contentType: string, fileBuffer: Buffer) {
  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY environment variable is not set.")
    return { message: "Server configuration error: OpenAI API key is missing.", success: false }
  }

  // Defensive check for openai.embeddings
  if (!openai.embeddings || typeof openai.embeddings.create !== "function") {
    console.error("AI SDK OpenAI embeddings client is not properly initialized or available.")
    console.error("DEBUG: openai object:", openai) // Log the openai object for debugging
    return {
      success: false,
      message: "AI embeddings service is unavailable. Please check server logs and environment configuration.",
    }
  }

  try {
    // 1. Extract text based on content type
    const fullText = await extractTextFromFile(fileBuffer, contentType)

    if (!fullText) {
      // If no text could be extracted (e.g., it's an image), skip RAG processing
      console.log(`Skipping RAG processing for ${filePath}: No extractable text found for file type: ${contentType}`)
      return {
        message: `File uploaded, but RAG processing skipped for file type: ${contentType}. Supported types: .txt, .md, .html.`,
        success: true, // Still consider the upload successful for the file itself
      }
    }

    // 2. Chunk the text
    const chunks = chunkText(fullText)

    // 3. Generate embeddings for each chunk and store in Supabase
    const documentsToInsert = []
    for (const chunk of chunks) {
      const { embedding } = await openai.embeddings.create({
        model: "text-embedding-3-small", // Or "text-embedding-3-large" for higher quality
        input: chunk,
      })

      documentsToInsert.push({
        file_path: filePath,
        file_name: filePath.split("/").pop(), // Extract file name from path
        tags: tags,
        content: chunk,
        embedding: embedding,
      })
    }

    if (documentsToInsert.length > 0) {
      const { error } = await supabaseAdmin.from("documents").insert(documentsToInsert)

      if (error) {
        console.error("Error inserting documents into Supabase:", error)
        throw new Error(`Failed to store document chunks in database: ${error.message}`)
      }
      console.log(`Successfully processed and stored ${documentsToInsert.length} chunks for ${filePath}`)
    } else {
      console.log(`No chunks generated for ${filePath}`)
    }

    return { message: `File processed for RAG: ${filePath}`, success: true }
  } catch (error) {
    console.error("Error processing file for RAG:", error)
    return {
      message: `Failed to process file for AI memory: ${error instanceof Error ? error.message : String(error)}`,
      success: false,
    }
  }
}

export async function uploadFileWithTag(prevState: any, formData: FormData) {
  const file = formData.get("file") as File
  const tagsString = formData.get("tags") as string

  if (!file) {
    return { message: "No file provided.", success: false }
  }
  if (!tagsString) {
    return { message: "Tags are required.", success: false }
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error("BLOB_READ_WRITE_TOKEN environment variable is not set.")
    return { message: "Server configuration error: Blob storage token is missing.", success: false }
  }

  try {
    // Convert File to Buffer for processing
    const fileBuffer = Buffer.from(await file.arrayBuffer()) // Corrected typo here

    // Upload the file to Vercel Blob
    const filePath = `uploaded-files/${Date.now()}-${file.name}` // Unique path
    const blob = await put(filePath, fileBuffer, {
      // Use fileBuffer here
      access: "public",
      contentType: file.type,
      addRandomSuffix: false, // We're adding timestamp for uniqueness
    })

    // Update metadata JSON blob
    const currentMetadata = await fetchCurrentMetadata()
    const newFileEntry: FileMetadata = {
      fileName: file.name,
      filePath: blob.pathname, // Use pathname for consistent internal reference
      tags: tagsString
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      contentType: file.type,
      uploadedAt: new Date().toISOString(),
    }
    currentMetadata.files.push(newFileEntry)
    await updateMetadataBlob(currentMetadata)

    // Trigger RAG processing for the uploaded file
    // Capture the result to provide specific feedback
    const ragProcessResult = await processFileForRAG(
      blob.pathname,
      newFileEntry.tags,
      newFileEntry.contentType,
      fileBuffer,
    )

    revalidatePath("/admin/content-manager") // Revalidate the page to show new file
    console.log("File uploaded and metadata updated:", blob.url)

    // Combine messages for comprehensive feedback
    if (ragProcessResult.success) {
      return { message: `File "${file.name}" uploaded. ${ragProcessResult.message}`, success: true }
    } else {
      return {
        message: `File "${file.name}" uploaded, but RAG processing failed: ${ragProcessResult.message}`,
        success: false,
      }
    }
  } catch (error) {
    console.error("Error uploading file to Vercel Blob:", error)
    return {
      message: `Failed to upload file: ${error instanceof Error ? error.message : String(error)}`,
      success: false,
    }
  }
}

export async function getFileMetadata(): Promise<AllFileMetadata> {
  return fetchCurrentMetadata()
}

export async function deleteFile(filePath: string) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error("BLOB_READ_WRITE_TOKEN environment variable is not set.")
    return { message: "Server configuration error: Blob storage token is missing.", success: false }
  }

  try {
    // Delete the file from Blob storage
    await del(filePath)

    // Delete associated chunks from Supabase
    const { error: dbError } = await supabaseAdmin.from("documents").delete().eq("file_path", filePath)
    if (dbError) {
      console.error("Error deleting document chunks from Supabase:", dbError)
      // Don't throw, just log, as Blob deletion is more critical
    } else {
      console.log(`Deleted document chunks for ${filePath} from Supabase.`)
    }

    // Update metadata JSON blob
    const currentMetadata = await fetchCurrentMetadata()
    currentMetadata.files = currentMetadata.files.filter((file) => file.filePath !== filePath)
    await updateMetadataBlob(currentMetadata)

    revalidatePath("/admin/content-manager") // Revalidate the page to reflect deletion
    console.log(`File "${filePath}" deleted successfully.`)
    return { message: `File deleted successfully!`, success: true }
  } catch (error) {
    console.error(`Error deleting file ${filePath} from Vercel Blob:`, error)
    return {
      message: `Failed to delete file: ${error instanceof Error ? error.message : String(error)}`,
      success: false,
    }
  }
}
