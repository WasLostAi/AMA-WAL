"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Upload,
  Save,
  Eye,
  Trash2,
  Plus,
  ShoppingCart,
  User,
  FileText,
  Zap,
  Crown,
  ImageIcon,
  Link,
} from "lucide-react"
import type { ModeType } from "@/lib/mode-manager"
import ImageComponent from "next/image"

interface ContentItem {
  id: string
  type: "image" | "text" | "product" | "link"
  title: string
  description: string
  imageUrl?: string
  price?: number
  url?: string
  featured: boolean
  mode: string[]
}

interface LayoutConfig {
  mode: ModeType
  layout: "grid" | "list" | "carousel" | "featured" | "masonry"
  columns: number
  showDescriptions: boolean
  showPricing: boolean
  maxItems: number
}

const MODE_ICONS = {
  "traditional-portfolio": <User className="h-5 w-5" />,
  "traditional-blog": <FileText className="h-5 w-5" />,
  "traditional-ecommerce": <ShoppingCart className="h-5 w-5" />,
  "hybrid-commerce": <ShoppingCart className="h-5 w-5" />,
  "monetized-agent": <Crown className="h-5 w-5" />,
  "agentic-ui": <Zap className="h-5 w-5" />,
}

export function ContentManager({ currentMode }: { currentMode: string }) {
  const [contentItems, setContentItems] = useState<ContentItem[]>([])
  const [layoutConfig, setLayoutConfig] = useState<LayoutConfig>({
    mode: currentMode || "traditional-portfolio",
    layout: "grid",
    columns: 3,
    showDescriptions: true,
    showPricing: false,
    maxItems: 12,
  })
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newItem, setNewItem] = useState<Partial<ContentItem>>({
    type: "image",
    title: "",
    description: "",
    featured: false,
    mode: [currentMode],
  })

  // Initialize with sample content based on current mode
  useEffect(() => {
    if (currentMode) {
      setLayoutConfig((prev) => ({ ...prev, mode: currentMode }))
      loadSampleContent(currentMode)
    }
  }, [currentMode])

  const loadSampleContent = (mode: ModeType) => {
    let sampleContent: ContentItem[] = []

    switch (mode) {
      case "traditional-portfolio":
        sampleContent = [
          {
            id: "1",
            type: "project",
            title: "WasLost.Ai Platform",
            description: "Revolutionary adaptive AI platform with dynamic frontend modes",
            imageUrl: "/placeholder.svg?height=300&width=400",
            technologies: ["Next.js", "TypeScript", "OpenAI"],
            featured: true,
            order: 1,
            mode: [mode],
          },
          {
            id: "2",
            type: "skill",
            title: "JavaScript/TypeScript",
            level: 95,
            category: "Frontend",
            featured: true,
            order: 2,
            mode: [mode],
          },
        ]
        break
      case "hybrid-commerce":
      case "traditional-ecommerce":
        sampleContent = [
          {
            id: "1",
            type: "product",
            title: "AI Strategy Consultation",
            description: "1-hour deep dive into AI implementation",
            imageUrl: "/placeholder.svg?height=200&width=200",
            price: 299,
            featured: true,
            order: 1,
            mode: [mode],
          },
          {
            id: "2",
            type: "product",
            title: "Custom AI Agent Development",
            description: "Fully custom AI agent tailored to your needs",
            imageUrl: "/placeholder.svg?height=200&width=200",
            price: 2499,
            featured: true,
            order: 2,
            mode: [mode],
          },
        ]
        break
      case "monetized-agent":
        sampleContent = [
          {
            id: "1",
            type: "product",
            title: "Premium AI Course",
            description: "Complete guide to AI implementation",
            imageUrl: "/placeholder.svg?height=300&width=300",
            price: 199,
            featured: true,
            order: 1,
            mode: [mode],
          },
        ]
        break
    }

    setContentItems(sampleContent)
  }

  const handleImageUpload = async (file: File) => {
    setIsUploading(true)
    try {
      // In real implementation, upload to Vercel Blob
      const imageUrl = URL.createObjectURL(file)
      return imageUrl
    } catch (error) {
      console.error("Upload failed:", error)
      return null
    } finally {
      setIsUploading(false)
    }
  }

  const handleSaveItem = (item: ContentItem) => {
    if (editingItem) {
      setContentItems(contentItems.map((i) => (i.id === item.id ? item : i)))
    } else {
      setContentItems([...contentItems, { ...item, id: Date.now().toString() }])
    }
    setEditingItem(null)
  }

  const handleAddItem = () => {
    if (newItem.title && newItem.description) {
      const item: ContentItem = {
        id: Date.now().toString(),
        type: newItem.type as ContentItem["type"],
        title: newItem.title,
        description: newItem.description,
        imageUrl: newItem.imageUrl,
        price: newItem.price,
        url: newItem.url,
        featured: newItem.featured || false,
        mode: newItem.mode || [currentMode],
      }
      setContentItems([...contentItems, item])
      setNewItem({
        type: "image",
        title: "",
        description: "",
        featured: false,
        mode: [currentMode],
      })
      setShowAddForm(false)
    }
  }

  const handleDeleteItem = (id: string) => {
    setContentItems(contentItems.filter((item) => item.id !== id))
  }

  const getContentTypeForMode = (mode: ModeType): string[] => {
    switch (mode) {
      case "traditional-portfolio":
        return ["project", "skill", "image"]
      case "hybrid-commerce":
      case "traditional-ecommerce":
        return ["product", "image"]
      case "monetized-agent":
        return ["product", "text", "image"]
      default:
        return ["text", "image"]
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "image":
        return <ImageIcon className="w-4 h-4" />
      case "text":
        return <FileText className="w-4 h-4" />
      case "product":
        return <ShoppingCart className="w-4 h-4" />
      case "link":
        return <Link className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  const renderContentForm = () => {
    const allowedTypes = getContentTypeForMode(layoutConfig.mode)

    return (
      <Card className="neumorphic-base">
        <CardHeader>
          <CardTitle className="text-[#afcd4f] font-syne">{editingItem ? "Edit Content" : "Add New Content"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="content-type">Content Type</Label>
            <Select
              value={editingItem?.type || "image"}
              onValueChange={(value) =>
                setEditingItem({ ...editingItem, type: value as ContentItem["type"] } as ContentItem)
              }
            >
              <SelectTrigger className="bg-neumorphic-base">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-neumorphic-base">
                {allowedTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={editingItem?.title || ""}
              onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value } as ContentItem)}
              className="bg-neumorphic-base"
              placeholder="Enter title..."
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={editingItem?.description || ""}
              onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value } as ContentItem)}
              className="bg-neumorphic-base"
              placeholder="Enter description..."
            />
          </div>

          {(editingItem?.type === "product" || layoutConfig.mode.includes("commerce")) && (
            <div>
              <Label htmlFor="price">Price ($)</Label>
              <Input
                id="price"
                type="number"
                value={editingItem?.price || ""}
                onChange={(e) => setEditingItem({ ...editingItem, price: Number(e.target.value) } as ContentItem)}
                className="bg-neumorphic-base"
                placeholder="0.00"
              />
            </div>
          )}

          {editingItem?.type === "skill" && (
            <>
              <div>
                <Label htmlFor="level">Skill Level (%)</Label>
                <Input
                  id="level"
                  type="number"
                  min="0"
                  max="100"
                  value={editingItem?.level || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, level: Number(e.target.value) } as ContentItem)}
                  className="bg-neumorphic-base"
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={editingItem?.category || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value } as ContentItem)}
                  className="bg-neumorphic-base"
                  placeholder="e.g., Frontend, Backend, AI"
                />
              </div>
            </>
          )}

          {editingItem?.type === "link" && (
            <div>
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                type="url"
                value={editingItem?.url || ""}
                onChange={(e) => setEditingItem({ ...editingItem, url: e.target.value } as ContentItem)}
                className="bg-neumorphic-base"
                placeholder="https://..."
              />
            </div>
          )}

          <div>
            <Label htmlFor="image-upload">Image</Label>
            <div className="flex gap-2">
              <Input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    const imageUrl = await handleImageUpload(file)
                    if (imageUrl) {
                      setEditingItem({ ...editingItem, imageUrl } as ContentItem)
                    }
                  }
                }}
                className="bg-neumorphic-base"
                disabled={isUploading}
              />
              <Button variant="outline" disabled={isUploading}>
                <Upload className="h-4 w-4" />
              </Button>
            </div>
            {editingItem?.imageUrl && (
              <div className="mt-2">
                <ImageComponent
                  src={editingItem.imageUrl || "/placeholder.svg"}
                  alt="Preview"
                  width={100}
                  height={100}
                  className="rounded-md object-cover"
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="featured"
              checked={editingItem?.featured || false}
              onChange={(e) => setEditingItem({ ...editingItem, featured: e.target.checked } as ContentItem)}
              className="rounded"
            />
            <Label htmlFor="featured">Featured Item</Label>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => {
                if (editingItem?.title) {
                  handleSaveItem({
                    ...editingItem,
                    order: contentItems.length + 1,
                  })
                }
              }}
              className="jupiter-button-dark"
              disabled={!editingItem?.title}
            >
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
            <Button variant="outline" onClick={() => setEditingItem(null)}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-[#afcd4f]">Content Manager</h2>
          <p className="text-white/70">Manage content for your adaptive frontend modes</p>
        </div>
        <Badge variant="outline" className="border-[#afcd4f] text-[#afcd4f]">
          {currentMode === "none" ? "No Mode Selected" : `${currentMode} Mode`}
        </Badge>
      </div>

      <Tabs defaultValue="items" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-neumorphic-base">
          <TabsTrigger value="items" className="text-white data-[state=active]:text-[#afcd4f]">
            Content Items
          </TabsTrigger>
          <TabsTrigger value="layout" className="text-white data-[state=active]:text-[#afcd4f]">
            Layout Settings
          </TabsTrigger>
          <TabsTrigger value="preview" className="text-white data-[state=active]:text-[#afcd4f]">
            Preview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold text-[#afcd4f]">Content Items</h3>
            <button onClick={() => setShowAddForm(true)} className="jupiter-button-dark flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Item
            </button>
          </div>

          {showAddForm && (
            <Card className="bg-neumorphic-base border-white/10">
              <CardHeader>
                <CardTitle className="text-[#afcd4f]">Add New Content</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Content Type</label>
                  <Select
                    value={newItem.type}
                    onValueChange={(value) => setNewItem({ ...newItem, type: value as ContentItem["type"] })}
                  >
                    <SelectTrigger className="bg-neumorphic-inset border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-neumorphic-base border-white/10">
                      <SelectItem value="image">Image</SelectItem>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="product">Product</SelectItem>
                      <SelectItem value="link">Link</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Title</label>
                  <Input
                    value={newItem.title || ""}
                    onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                    placeholder="Enter title..."
                    className="bg-neumorphic-inset border-white/10 text-white placeholder:text-white/50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Description</label>
                  <Textarea
                    value={newItem.description || ""}
                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                    placeholder="Enter description..."
                    className="bg-neumorphic-inset border-white/10 text-white placeholder:text-white/50"
                  />
                </div>

                {(newItem.type === "image" || newItem.type === "product") && (
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Image</label>
                    <Input
                      type="file"
                      accept="image/*"
                      className="bg-neumorphic-inset border-white/10 text-white file:bg-neumorphic-base file:border-0 file:text-white"
                    />
                  </div>
                )}

                {newItem.type === "product" && (
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Price</label>
                    <Input
                      type="number"
                      value={newItem.price || ""}
                      onChange={(e) => setNewItem({ ...newItem, price: Number.parseFloat(e.target.value) })}
                      placeholder="0.00"
                      className="bg-neumorphic-inset border-white/10 text-white placeholder:text-white/50"
                    />
                  </div>
                )}

                {newItem.type === "link" && (
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">URL</label>
                    <Input
                      type="url"
                      value={newItem.url || ""}
                      onChange={(e) => setNewItem({ ...newItem, url: e.target.value })}
                      placeholder="https://..."
                      className="bg-neumorphic-inset border-white/10 text-white placeholder:text-white/50"
                    />
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="featured"
                    checked={newItem.featured || false}
                    onChange={(e) => setNewItem({ ...newItem, featured: e.target.checked })}
                    className="rounded border-white/10"
                  />
                  <label htmlFor="featured" className="text-sm text-white">
                    Featured Item
                  </label>
                </div>

                <div className="flex gap-2">
                  <button onClick={handleAddItem} className="jupiter-button-dark">
                    Save
                  </button>
                  <button onClick={() => setShowAddForm(false)} className="jupiter-button-dark">
                    Cancel
                  </button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4">
            {contentItems.map((item) => (
              <Card key={item.id} className="bg-neumorphic-base border-white/10">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-neumorphic-inset">{getTypeIcon(item.type)}</div>
                      <div>
                        <h4 className="font-semibold text-white">{item.title}</h4>
                        <p className="text-sm text-white/70">{item.description}</p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline" className="border-[#afcd4f] text-[#afcd4f]">
                            {item.type}
                          </Badge>
                          {item.featured && (
                            <Badge variant="outline" className="border-yellow-500 text-yellow-500">
                              Featured
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setEditingItem(item)} className="jupiter-button-dark p-2">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteItem(item.id)} className="jupiter-button-dark p-2">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="layout" className="space-y-4">
          <Card className="bg-neumorphic-base border-white/10">
            <CardHeader>
              <CardTitle className="text-[#afcd4f]">Layout Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Layout Style</label>
                <Select
                  value={layoutConfig.layout}
                  onValueChange={(value) =>
                    setLayoutConfig({ ...layoutConfig, layout: value as LayoutConfig["layout"] })
                  }
                >
                  <SelectTrigger className="bg-neumorphic-inset border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-neumorphic-base border-white/10">
                    <SelectItem value="grid">Grid Layout</SelectItem>
                    <SelectItem value="list">List Layout</SelectItem>
                    <SelectItem value="carousel">Carousel</SelectItem>
                    <SelectItem value="featured">Featured Items</SelectItem>
                    <SelectItem value="masonry">Masonry</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {layoutConfig.layout === "grid" && (
                <div>
                  <Label>Grid Columns</Label>
                  <Select
                    value={layoutConfig.columns.toString()}
                    onValueChange={(value) => setLayoutConfig({ ...layoutConfig, columns: Number(value) })}
                  >
                    <SelectTrigger className="bg-neumorphic-inset border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-neumorphic-base border-white/10">
                      <SelectItem value="1">1 Column</SelectItem>
                      <SelectItem value="2">2 Columns</SelectItem>
                      <SelectItem value="3">3 Columns</SelectItem>
                      <SelectItem value="4">4 Columns</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="show-descriptions"
                    checked={layoutConfig.showDescriptions}
                    onChange={(e) => setLayoutConfig({ ...layoutConfig, showDescriptions: e.target.checked })}
                  />
                  <Label htmlFor="show-descriptions">Show Descriptions</Label>
                </div>

                {layoutConfig.mode.includes("commerce") && (
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="show-pricing"
                      checked={layoutConfig.showPricing}
                      onChange={(e) => setLayoutConfig({ ...layoutConfig, showPricing: e.target.checked })}
                    />
                    <Label htmlFor="show-pricing">Show Pricing</Label>
                  </div>
                )}
              </div>

              <div>
                <Label>Maximum Items to Display</Label>
                <Input
                  type="number"
                  value={layoutConfig.maxItems}
                  onChange={(e) => setLayoutConfig({ ...layoutConfig, maxItems: Number(e.target.value) })}
                  className="bg-neumorphic-inset border-white/10 text-white placeholder:text-white/50"
                  min="1"
                  max="50"
                />
              </div>

              <Button className="jupiter-button-dark">
                <Save className="h-4 w-4 mr-2" />
                Save Layout
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          <Card className="bg-neumorphic-base border-white/10">
            <CardHeader>
              <CardTitle className="text-[#afcd4f]">Live Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-neumorphic-inset rounded-lg p-8 text-center">
                <p className="text-white/70">Preview will show here based on selected mode and content</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
