"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { resizeImage } from "@/lib/image-processing" // Import the utility

export function ImageResizerDemo() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [resizedImageUrl, setResizedImageUrl] = useState<string | null>(null)
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith("image/")) {
      setSelectedFile(file)
      setOriginalImageUrl(URL.createObjectURL(file))
      setResizedImageUrl(null) // Clear previous resized image
      setError(null)
    } else {
      setSelectedFile(null)
      setOriginalImageUrl(null)
      setResizedImageUrl(null)
      setError("Please select an image file (PNG, JPEG, GIF).")
    }
  }

  const handleResize = async () => {
    if (!selectedFile) {
      setError("No image selected for resizing.")
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      // Example: Resize to max width 800px, max height 600px, with 80% quality
      const resizedBlob = await resizeImage(selectedFile, { maxWidth: 800, maxHeight: 600, quality: 0.8 })
      if (resizedBlob) {
        setResizedImageUrl(URL.createObjectURL(resizedBlob))
      } else {
        setError("Failed to resize image: Resulting blob was null.")
      }
    } catch (err: any) {
      console.error("Error during image resize:", err)
      setError(`Error resizing image: ${err.message || "Unknown error"}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="jupiter-outer-panel p-6 mt-8">
      <h2 className="text-center text-2xl font-bold text-[#afcd4f] mb-4">Image Resizer (Pica Demo)</h2>
      <p className="text-sm text-muted-foreground mb-4 text-center">
        This demonstrates client-side image resizing using the `pica` library. Select an image, then click "Resize
        Image" to see the result.
      </p>
      <div className="space-y-4">
        <div>
          <Label htmlFor="image-upload" className="block text-sm font-medium text-muted-foreground mb-1">
            Upload Image
          </Label>
          <Input
            id="image-upload"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            ref={fileInputRef}
            className="bg-neumorphic-base shadow-inner-neumorphic text-white"
            disabled={isLoading}
          />
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        {selectedFile && (
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Original Image ({Math.round(selectedFile.size / 1024)} KB)
              </p>
              {originalImageUrl && (
                <img
                  src={originalImageUrl || "/placeholder.svg"}
                  alt="Original"
                  className="max-w-full h-auto max-h-64 object-contain rounded-lg neumorphic-inset mx-auto"
                />
              )}
            </div>
            <div className="flex-1 text-center">
              <p className="text-sm text-muted-foreground mb-2">Resized Image</p>
              {resizedImageUrl ? (
                <img
                  src={resizedImageUrl || "/placeholder.svg"}
                  alt="Resized"
                  className="max-w-full h-auto max-h-64 object-contain rounded-lg neumorphic-inset mx-auto"
                />
              ) : (
                <div className="w-full h-64 flex items-center justify-center text-muted-foreground neumorphic-inset rounded-lg">
                  {isLoading ? "Resizing..." : "No resized image yet"}
                </div>
              )}
            </div>
          </div>
        )}

        <Button
          onClick={handleResize}
          className="jupiter-button-dark w-full h-12 px-6 bg-neumorphic-base hover:bg-neumorphic-base"
          disabled={!selectedFile || isLoading}
        >
          {isLoading ? "Resizing..." : "Resize Image"}
        </Button>
      </div>
    </div>
  )
}
