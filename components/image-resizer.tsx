"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CropIcon, RotateCwIcon, ZoomInIcon, ZoomOutIcon } from "lucide-react"

interface ImageResizerProps {
  src: string | null
  onSave: (blob: Blob, fileName: string) => void
  onClose: () => void
  aspectRatio?: number // e.g., 16 / 9, 1 / 1, 4 / 3
  minWidth?: number
  minHeight?: number
  maxWidth?: number
  maxHeight?: number
  fileName?: string
}

export function ImageResizer({
  src,
  onSave,
  onClose,
  aspectRatio,
  minWidth = 100,
  minHeight = 100,
  maxWidth = 1920,
  maxHeight = 1080,
  fileName = "resized_image.png",
}: ImageResizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null)
  const [outputWidth, setOutputWidth] = useState(maxWidth)
  const [outputHeight, setOutputHeight] = useState(maxHeight)

  const loadImage = useCallback(() => {
    if (!src) return

    const img = new window.Image()
    img.src = src
    img.crossOrigin = "anonymous" // Important for CORS issues when drawing to canvas
    img.onload = () => {
      setOriginalImage(img)
      setImageLoaded(true)
      // Reset state for new image
      setZoom(1)
      setRotation(0)
      setPosition({ x: 0, y: 0 })
      // Set initial output dimensions based on image aspect ratio or default
      const imgAspectRatio = img.width / img.height
      if (aspectRatio) {
        if (imgAspectRatio > aspectRatio) {
          setOutputHeight(Math.min(maxHeight, img.height))
          setOutputWidth(Math.round(outputHeight * aspectRatio))
        } else {
          setOutputWidth(Math.min(maxWidth, img.width))
          setOutputHeight(Math.round(outputWidth / aspectRatio))
        }
      } else {
        setOutputWidth(Math.min(maxWidth, img.width))
        setOutputHeight(Math.min(maxHeight, img.height))
      }
    }
    img.onerror = (err) => {
      console.error("Failed to load image:", err)
      setImageLoaded(false)
      alert("Failed to load image. Please check the URL or file.")
    }
  }, [src, aspectRatio, maxWidth, maxHeight, outputHeight, outputWidth])

  useEffect(() => {
    loadImage()
  }, [src, loadImage])

  useEffect(() => {
    if (!imageLoaded || !originalImage || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const drawImage = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.save()

      // Translate to center of canvas for rotation and zoom
      ctx.translate(canvas.width / 2, canvas.height / 2)
      ctx.rotate((rotation * Math.PI) / 180)
      ctx.scale(zoom, zoom)

      // Draw image, adjusting for position and center translation
      ctx.drawImage(
        originalImage,
        -originalImage.width / 2 + position.x,
        -originalImage.height / 2 + position.y,
        originalImage.width,
        originalImage.height,
      )
      ctx.restore()
    }

    drawImage()
  }, [imageLoaded, originalImage, zoom, rotation, position, outputWidth, outputHeight])

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!imageLoaded) return
    setIsDragging(true)
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.1, 5))
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.1, 0.1))
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360)

  const handleSave = () => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const tempCanvas = document.createElement("canvas")
    const tempCtx = tempCanvas.getContext("2d")
    if (!tempCtx) return

    tempCanvas.width = outputWidth
    tempCanvas.height = outputHeight

    // Calculate the visible area of the original image on the main canvas
    const scaleX = canvas.width / (originalImage?.width || 1)
    const scaleY = canvas.height / (originalImage?.height || 1)
    const effectiveScale = Math.min(scaleX, scaleY) * zoom

    const rotatedWidth = (rotation % 180 === 90 ? originalImage?.height : originalImage?.width) || 0
    const rotatedHeight = (rotation % 180 === 90 ? originalImage?.width : originalImage?.height) || 0

    const sourceX = (originalImage?.width || 0) / 2 - (canvas.width / 2 - position.x) / zoom
    const sourceY = (originalImage?.height || 0) / 2 - (canvas.height / 2 - position.y) / zoom
    const sourceWidth = canvas.width / zoom
    const sourceHeight = canvas.height / zoom

    tempCtx.save()
    tempCtx.translate(tempCanvas.width / 2, tempCanvas.height / 2)
    tempCtx.rotate((rotation * Math.PI) / 180)
    tempCtx.scale(zoom, zoom)
    tempCtx.drawImage(
      originalImage!,
      -originalImage!.width / 2 + position.x,
      -originalImage!.height / 2 + position.y,
      originalImage!.width,
      originalImage!.height,
    )
    tempCtx.restore()

    // Create a new canvas for the final cropped image
    const finalCanvas = document.createElement("canvas")
    finalCanvas.width = outputWidth
    finalCanvas.height = outputHeight
    const finalCtx = finalCanvas.getContext("2d")
    if (!finalCtx) return

    // Draw the content from the temporary canvas onto the final canvas, cropping to desired output dimensions
    finalCtx.drawImage(
      tempCanvas,
      (tempCanvas.width - outputWidth) / 2,
      (tempCanvas.height - outputHeight) / 2,
      outputWidth,
      outputHeight,
      0,
      0,
      outputWidth,
      outputHeight,
    )

    finalCanvas.toBlob((blob) => {
      if (blob) {
        onSave(blob, fileName)
      } else {
        alert("Failed to save image.")
      }
    }, "image/png")
  }

  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const width = Number(e.target.value)
    if (!isNaN(width) && width >= minWidth && width <= maxWidth) {
      setOutputWidth(width)
      if (aspectRatio) {
        setOutputHeight(Math.round(width / aspectRatio))
      }
    }
  }

  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const height = Number(e.target.value)
    if (!isNaN(height) && height >= minHeight && height <= maxHeight) {
      setOutputHeight(height)
      if (aspectRatio) {
        setOutputWidth(Math.round(height * aspectRatio))
      }
    }
  }

  return (
    <Dialog open={!!src} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl bg-neumorphic-base text-white p-6 rounded-lg shadow-neumorphic-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-[#afcd4f]">Image Resizer & Cropper</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="relative w-full h-96 bg-neumorphic-inset rounded-lg overflow-hidden flex items-center justify-center">
            {!imageLoaded && src ? (
              <p className="text-muted-foreground">Loading image...</p>
            ) : !src ? (
              <p className="text-muted-foreground">No image selected.</p>
            ) : (
              <canvas
                ref={canvasRef}
                width={outputWidth}
                height={outputHeight}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp} // End drag if mouse leaves canvas
                className="cursor-grab active:cursor-grabbing"
                style={{
                  maxWidth: "100%",
                  maxHeight: "100%",
                  display: "block",
                  objectFit: "contain",
                }}
              />
            )}
          </div>
          <div className="space-y-4">
            <div>
              <Label htmlFor="output-width" className="text-muted-foreground">
                Output Width (px)
              </Label>
              <Input
                id="output-width"
                type="number"
                value={outputWidth}
                onChange={handleWidthChange}
                min={minWidth}
                max={maxWidth}
                className="bg-neumorphic-base shadow-inner-neumorphic text-white mt-1"
              />
            </div>
            <div>
              <Label htmlFor="output-height" className="text-muted-foreground">
                Output Height (px)
              </Label>
              <Input
                id="output-height"
                type="number"
                value={outputHeight}
                onChange={handleHeightChange}
                min={minHeight}
                max={maxHeight}
                className="bg-neumorphic-base shadow-inner-neumorphic text-white mt-1"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Zoom</Label>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={handleZoomOut} className="jupiter-button-dark h-8 w-8 p-0">
                  <ZoomOutIcon className="h-4 w-4" />
                </Button>
                <Slider
                  value={[zoom]}
                  onValueChange={([val]) => setZoom(val)}
                  min={0.1}
                  max={5}
                  step={0.01}
                  className="flex-1"
                />
                <Button variant="ghost" size="icon" onClick={handleZoomIn} className="jupiter-button-dark h-8 w-8 p-0">
                  <ZoomInIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Rotation</Label>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={handleRotate} className="jupiter-button-dark h-8 w-8 p-0">
                  <RotateCwIcon className="h-4 w-4" />
                </Button>
                <Slider
                  value={[rotation]}
                  onValueChange={([val]) => setRotation(val)}
                  min={0}
                  max={360}
                  step={1}
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        </div>
        <DialogFooter className="flex justify-end gap-2 mt-6">
          <Button onClick={onClose} variant="ghost" className="jupiter-button-dark h-10 px-4">
            Cancel
          </Button>
          <Button onClick={handleSave} className="jupiter-button-dark h-10 px-4">
            <CropIcon className="h-4 w-4 mr-2" /> Save & Crop
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
