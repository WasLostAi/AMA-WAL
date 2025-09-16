"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, Download, RotateCw, Crop, Palette } from "lucide-react"

interface ImageResizerProps {
  onImageProcessed?: (imageUrl: string) => void
  className?: string
}

export function ImageResizerDemo({ onImageProcessed, className = "" }: ImageResizerProps) {
  const [originalImage, setOriginalImage] = useState<string | null>(null)
  const [processedImage, setProcessedImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  const [quality, setQuality] = useState(0.9)
  const [format, setFormat] = useState("jpeg")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file")
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      setOriginalImage(result)
      setProcessedImage(null)
    }
    reader.readAsDataURL(file)
  }, [])

  const processImage = useCallback(async () => {
    if (!originalImage || !canvasRef.current) return

    setIsProcessing(true)

    try {
      const img = new Image()
      img.crossOrigin = "anonymous"

      img.onload = () => {
        const canvas = canvasRef.current!
        const ctx = canvas.getContext("2d")!

        // Set canvas dimensions
        canvas.width = dimensions.width
        canvas.height = dimensions.height

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        // Draw image with new dimensions
        ctx.drawImage(img, 0, 0, dimensions.width, dimensions.height)

        // Convert to desired format
        const mimeType = format === "png" ? "image/png" : "image/jpeg"
        const processedDataUrl = canvas.toDataURL(mimeType, quality)

        setProcessedImage(processedDataUrl)
        onImageProcessed?.(processedDataUrl)
        setIsProcessing(false)
      }

      img.onerror = () => {
        console.error("Failed to load image")
        setIsProcessing(false)
      }

      img.src = originalImage
    } catch (error) {
      console.error("Error processing image:", error)
      setIsProcessing(false)
    }
  }, [originalImage, dimensions, quality, format, onImageProcessed])

  const downloadImage = useCallback(() => {
    if (!processedImage) return

    const link = document.createElement("a")
    link.download = `resized-image.${format}`
    link.href = processedImage
    link.click()
  }, [processedImage, format])

  const resetImage = useCallback(() => {
    setOriginalImage(null)
    setProcessedImage(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }, [])

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Image Resizer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File Upload */}
        <div className="space-y-2">
          <Label htmlFor="image-upload">Upload Image</Label>
          <div className="flex gap-2">
            <Input
              id="image-upload"
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              ref={fileInputRef}
              className="flex-1"
            />
            <Button onClick={() => fileInputRef.current?.click()} variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Browse
            </Button>
          </div>
        </div>

        {/* Settings */}
        {originalImage && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="width">Width (px)</Label>
              <Input
                id="width"
                type="number"
                value={dimensions.width}
                onChange={(e) => setDimensions((prev) => ({ ...prev, width: Number.parseInt(e.target.value) || 0 }))}
                min="1"
                max="4000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="height">Height (px)</Label>
              <Input
                id="height"
                type="number"
                value={dimensions.height}
                onChange={(e) => setDimensions((prev) => ({ ...prev, height: Number.parseInt(e.target.value) || 0 }))}
                min="1"
                max="4000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quality">Quality</Label>
              <Input
                id="quality"
                type="range"
                min="0.1"
                max="1"
                step="0.1"
                value={quality}
                onChange={(e) => setQuality(Number.parseFloat(e.target.value))}
              />
              <div className="text-sm text-muted-foreground">{Math.round(quality * 100)}%</div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="format">Format</Label>
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="jpeg">JPEG</SelectItem>
                  <SelectItem value="png">PNG</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {originalImage && (
          <div className="flex gap-2 flex-wrap">
            <Button onClick={processImage} disabled={isProcessing}>
              <Crop className="h-4 w-4 mr-2" />
              {isProcessing ? "Processing..." : "Resize Image"}
            </Button>
            {processedImage && (
              <Button onClick={downloadImage} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            )}
            <Button onClick={resetImage} variant="outline">
              <RotateCw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
        )}

        {/* Image Preview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {originalImage && (
            <div className="space-y-2">
              <Label>Original Image</Label>
              <div className="border rounded-lg overflow-hidden">
                <img
                  src={originalImage || "/placeholder.svg"}
                  alt="Original"
                  className="w-full h-auto max-h-64 object-contain"
                />
              </div>
            </div>
          )}
          {processedImage && (
            <div className="space-y-2">
              <Label>Resized Image</Label>
              <div className="border rounded-lg overflow-hidden">
                <img
                  src={processedImage || "/placeholder.svg"}
                  alt="Processed"
                  className="w-full h-auto max-h-64 object-contain"
                />
              </div>
            </div>
          )}
        </div>

        {/* Hidden Canvas */}
        <canvas ref={canvasRef} className="hidden" />
      </CardContent>
    </Card>
  )
}

export const ImageResizer = ImageResizerDemo
