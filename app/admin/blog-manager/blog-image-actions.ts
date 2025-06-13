"use server"

import { put } from "@vercel/blob"
import { revalidatePath } from "next/cache"

export async function uploadBlogImage(
  prevState: any,
  formData: FormData,
): Promise<{ success: boolean; message: string; imageUrl?: string }> {
  const file = formData.get("file") as File

  if (!file) {
    return { success: false, message: "No image file provided." }
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error("BLOB_READ_WRITE_TOKEN environment variable is not set.")
    return { success: false, message: "Server configuration error: Blob storage token is missing." }
  }

  try {
    // Ensure it's an image
    if (!file.type.startsWith("image/")) {
      return { success: false, message: "Only image files are allowed." }
    }

    // Create a unique path for the image
    const filePath = `blog-images/${Date.now()}-${file.name}`

    // Upload the image to Vercel Blob
    const blob = await put(filePath, file, {
      access: "public",
      contentType: file.type,
      addRandomSuffix: false, // We're adding timestamp for uniqueness
    })

    revalidatePath("/admin/blog-manager") // Revalidate admin page to reflect changes if needed
    console.log("Blog image uploaded to Vercel Blob:", blob.url)

    return { success: true, message: "Image uploaded successfully!", imageUrl: blob.url }
  } catch (error) {
    console.error("Error uploading blog image:", error)
    return {
      success: false,
      message: `Failed to upload image: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}
