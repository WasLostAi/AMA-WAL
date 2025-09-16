"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, Download, RotateCw, Crop } from "lucide-react"

interface ImageResizerProps {
  onImageProcessed?: (imageUrl: string) => void
  maxWidth?: number
  maxHeight?: number
  quality?: number
}

const ImageResizer = ({ onImageProcessed, maxWidth = 1200, maxHeight = 800, quality = 0.8 }: ImageResizerProps) => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>("")
  const [processedUrl, setProcessedUrl] = useState<string>("")
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [newDimensions, setNewDimensions] = useState({ width: 0, height: 0 })
  const [isProcessing, setIsProcessing] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith("image/")) {
      setSelectedImage(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)

      // Get image dimensions
      const img = new Image()
      img.onload = () => {
        setDimensions({ width: img.width, height: img.height })
        setNewDimensions({ width: img.width, height: img.height })
      }
      img.src = url
    }
  }, [])

  const resizeImage = useCallback(async () => {
    if (!selectedImage || !canvasRef.current) return

    setIsProcessing(true)

    try {
      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      const img = new Image()
      img.crossOrigin = "anonymous"

      img.onload = () => {
        // Calculate new dimensions maintaining aspect ratio
        let { width, height } = newDimensions

        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }

        if (height > maxHeight) {
          width = (width * maxHeight) / height
          height = maxHeight
        }

        canvas.width = width
        canvas.height = height

        // Draw and resize image
        ctx.drawImage(img, 0, 0, width, height)

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob)
              setProcessedUrl(url)
              onImageProcessed?.(url)
            }
            setIsProcessing(false)
          },
          "image/jpeg",
          quality,
        )
      }

      img.src = previewUrl
    } catch (error) {
      console.error("Error resizing image:", error)
      setIsProcessing(false)
    }
  }, [selectedImage, newDimensions, maxWidth, maxHeight, quality, previewUrl, onImageProcessed])

  const downloadImage = useCallback(() => {
    if (!processedUrl) return

    const link = document.createElement("a")
    link.href = processedUrl
    link.download = `resized-${selectedImage?.name || "image.jpg"}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [processedUrl, selectedImage])

  const resetImage = useCallback(() => {
    setSelectedImage(null)
    setPreviewUrl("")
    setProcessedUrl("")
    setDimensions({ width: 0, height: 0 })
    setNewDimensions({ width: 0, height: 0 })
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }, [])

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crop className="h-5 w-5" />
          Image Resizer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File Upload */}
        <div className="space-y-2">
          <Label htmlFor="image-upload">Select Image</Label>
          <div className="flex gap-2">
            <Input
              id="image-upload"
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="flex-1"
            />
            <Button onClick={() => fileInputRef.current?.click()} variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Browse
            </Button>
          </div>
        </div>

        {/* Image Preview */}
        {previewUrl && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Original Image</Label>
                <div className="border rounded-lg p-2 bg-muted/50">
                  <img
                    src={previewUrl || "/placeholder.svg"}
                    alt="Original"
                    className="w-full h-auto max-h-48 object-contain rounded"
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    {dimensions.width} × {dimensions.height}
                  </p>
                </div>
              </div>

              {processedUrl && (
                <div>
                  <Label>Resized Image</Label>
                  <div className="border rounded-lg p-2 bg-muted/50">
                    <img
                      src={processedUrl || "/placeholder.svg"}
                      alt="Resized"
                      className="w-full h-auto max-h-48 object-contain rounded"
                    />
                    <p className="text-sm text-muted-foreground mt-2">Optimized for web</p>
                  </div>
                </div>
              )}
            </div>

            {/* Dimension Controls */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="width">Width (px)</Label>
                <Input
                  id="width"
                  type="number"
                  value={newDimensions.width}
                  onChange={(e) =>
                    setNewDimensions((prev) => ({
                      ...prev,
                      width: Number.parseInt(e.target.value) || 0,
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="height">Height (px)</Label>
                <Input
                  id="height"
                  type="number"
                  value={newDimensions.height}
                  onChange={(e) =>
                    setNewDimensions((prev) => ({
                      ...prev,
                      height: Number.parseInt(e.target.value) || 0,
                    }))
                  }
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 flex-wrap">
              <Button onClick={resizeImage} disabled={isProcessing} className="flex-1">
                <RotateCw className={`h-4 w-4 mr-2 ${isProcessing ? "animate-spin" : ""}`} />
                {isProcessing ? "Processing..." : "Resize Image"}
              </Button>

              {processedUrl && (
                <Button onClick={downloadImage} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              )}

              <Button onClick={resetImage} variant="outline">
                Reset
              </Button>
            </div>
          </div>
        )}

        {/* Hidden Canvas */}
        <canvas ref={canvasRef} className="hidden" />
      </CardContent>
    </Card>
  )
}

export default ImageResizer
