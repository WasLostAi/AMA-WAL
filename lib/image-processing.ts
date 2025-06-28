"use client" // This utility will be used in client components

import pica from "pica"

// Initialize pica instance
const picaInstance = pica()

interface ResizeImageOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number // JPEG quality, 0-1, default 0.95
}

/**
 * Resizes an image file using pica.
 * @param file The image file to resize.
 * @param options Resize options including maxWidth, maxHeight, and quality.
 * @returns A Promise that resolves with the resized image as a Blob, or null if an error occurs.
 */
function resizeImage(file: File, options: ResizeImageOptions = {}): Promise<Blob | null> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous" // Important for handling images from different origins

    img.onload = async () => {
      const canvas = document.createElement("canvas")
      let { width, height } = img

      // Calculate new dimensions while maintaining aspect ratio
      if (options.maxWidth && width > options.maxWidth) {
        height *= options.maxWidth / width
        width = options.maxWidth
      }
      if (options.maxHeight && height > options.maxHeight) {
        width *= options.maxHeight / height
        height = options.maxHeight
      }

      canvas.width = width
      canvas.height = height

      try {
        // Perform the resize operation
        const resizedBlob = await picaInstance
          .resize(img, canvas, {
            quality: options.quality || 0.95,
          })
          .toBlob("image/jpeg", options.quality || 0.95) // Output as JPEG by default

        resolve(resizedBlob)
      } catch (error) {
        console.error("Pica resize failed:", error)
        reject(new Error("Failed to resize image."))
      }
    }

    img.onerror = (error) => {
      console.error("Image loading failed:", error)
      reject(new Error("Failed to load image for resizing."))
    }

    // Load the image from the file
    img.src = URL.createObjectURL(file)
  })
}

export { resizeImage }
