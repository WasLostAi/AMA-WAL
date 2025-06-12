"use server"

import { put, del } from "@vercel/blob"
import { revalidatePath } from "next/cache"

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
    // Upload the file
    const filePath = `uploaded-files/${Date.now()}-${file.name}` // Unique path
    const blob = await put(filePath, file, {
      access: "public",
      contentType: file.type,
      addRandomSuffix: false, // We're adding timestamp for uniqueness
    })

    // Update metadata
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

    // Update metadata
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
