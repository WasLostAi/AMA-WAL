"use server"

import { put, del } from "@vercel/blob"
import { revalidatePath } from "next/cache"
import { openai } from "@ai-sdk/openai"
import { supabaseAdmin } from "@/lib/supabase"
import pdf from "pdf-parse"
import mammoth from "mammoth"
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

// Helper to fetch current metadata
async function fetchCurrentMetadata(): Promise<AllFileMetadata> {
  try {
    const response = await fetch(`https://blob.vercel-storage.com/${METADATA_BLOB_PATH}`, {
      next: { revalidate: 0 }, // Always get the latest
    })

    if (response.ok) {
      return (await response.json()) as AllFileMetadata
    }
  } catch (error) {
    console.warn("No existing file metadata blob found or error fetching it. Starting fresh.", error)
  }
  return { files: [] }
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

// --- New RAG Processing Logic ---

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
  } else if (contentType.includes("application/pdf")) {
    const data = await pdf(fileBuffer)
    return data.text
  } else if (contentType.includes("application/vnd.openxmlformats-officedocument.wordprocessingml.document")) {
    // .docx files
    const result = await mammoth.extractRawText({ arrayBuffer: fileBuffer.buffer })
    return result.value
  } else if (contentType.includes("text/html")) {
    return convert(fileBuffer.toString("utf-8"), {
      wordwrap: 130,
    })
  }
  // Add more parsers for other document types as needed (e.g., .xlsx, .pptx)
  // For images, you'd typically use an OCR service here.
  console.warn(`Unsupported file type for text extraction: ${contentType}`)
  return "" // Return empty string for unsupported types
}

export async function processFileForRAG(filePath: string, tags: string[], contentType: string) {
  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY environment variable is not set.")
    return { message: "Server configuration error: OpenAI API key is missing.", success: false }
  }

  try {
    // 1. Fetch the file content from Vercel Blob
    const blobUrl = `https://blob.vercel-storage.com${filePath}` // Construct full URL
    const response = await fetch(blobUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch file from Blob: ${response.statusText}`)
    }
    const fileBuffer = Buffer.from(await response.arrayBuffer())

    // 2. Extract text based on content type
    const fullText = await extractTextFromFile(fileBuffer, contentType)
    if (!fullText) {
      return { message: `No extractable text found for file type: ${contentType}`, success: false }
    }

    // 3. Chunk the text
    const chunks = chunkText(fullText)

    // 4. Generate embeddings for each chunk and store in Supabase
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

// --- Existing File Upload/Delete Actions (Modified) ---

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
    // Upload the file to Vercel Blob
    const filePath = `uploaded-files/${Date.now()}-${file.name}` // Unique path
    const blob = await put(filePath, file, {
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

    // --- NEW: Trigger RAG processing for the uploaded file ---
    await processFileForRAG(blob.pathname, newFileEntry.tags, newFileEntry.contentType)

    revalidatePath("/admin/content-manager") // Revalidate the page to show new file
    console.log("File uploaded and metadata updated:", blob.url)
    return { message: `File "${file.name}" uploaded successfully!`, success: true }
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
