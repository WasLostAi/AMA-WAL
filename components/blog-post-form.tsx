"use client"

import { useEffect, useState, useTransition } from "react"
import { useFormState } from "react-dom"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RichTextEditor } from "@/components/rich-text-editor"
import { type BlogPost, createBlogPost, updateBlogPost } from "@/app/admin/blog-manager/blog-actions"
import { useToast } from "@/hooks/use-toast"
import slugify from "slugify"
import { ImageResizer } from "@/components/image-resizer" // Assuming this component exists for image handling
import { XIcon } from "lucide-react" // For clear image button

interface BlogPostFormProps {
  initialData?: BlogPost | null
}

const initialState = {
  success: false,
  message: "",
}

export default function BlogPostForm({ initialData }: BlogPostFormProps) {
  const [state, formAction] = useFormState(initialData ? updateBlogPost : createBlogPost, initialState)
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  const [title, setTitle] = useState(initialData?.title || "")
  const [slug, setSlug] = useState(initialData?.slug || "")
  const [content, setContent] = useState(initialData?.content || "")
  const [metaDescription, setMetaDescription] = useState(initialData?.meta_description || "")
  const [keywords, setKeywords] = useState(initialData?.keywords?.join(", ") || "")
  const [status, setStatus] = useState<BlogPost["status"]>(initialData?.status || "draft")
  const [featuredImageFile, setFeaturedImageFile] = useState<File | null>(null)
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(initialData?.featured_image_url || null)
  const [clearExistingImage, setClearExistingImage] = useState(false)

  useEffect(() => {
    if (state.message) {
      toast({
        title: state.success ? "Success!" : "Error!",
        description: state.message,
        variant: state.success ? "default" : "destructive",
      })
    }
  }, [state, toast])

  const generateSlug = () => {
    if (title) {
      setSlug(slugify(title, { lower: true, strict: true }))
    }
  }

  const wordCount = content.split(/\s+/).filter(Boolean).length
  const metaDescriptionCharCount = metaDescription.length

  const handleImageChange = (file: File | null) => {
    setFeaturedImageFile(file)
    if (file) {
      setPreviewImageUrl(URL.createObjectURL(file))
      setClearExistingImage(false) // If a new image is selected, don't clear existing
    } else {
      setPreviewImageUrl(null)
    }
  }

  const handleClearImage = () => {
    setFeaturedImageFile(null)
    setPreviewImageUrl(null)
    setClearExistingImage(true) // Mark for deletion on save
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>{initialData ? "Edit Blog Post" : "Create New Blog Post"}</CardTitle>
        <CardDescription>
          {initialData ? "Update the details of your blog post." : "Fill in the details to create a new blog post."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          action={(formData) => {
            // Append file and clear image flag to FormData
            if (featuredImageFile) {
              formData.append("featuredImage", featuredImageFile)
            }
            if (initialData?.featured_image_url) {
              formData.append("existingImageUrl", initialData.featured_image_url)
            }
            formData.append("clearFeaturedImage", String(clearExistingImage))

            // Append other form fields
            formData.append("title", title)
            formData.append("slug", slug)
            formData.append("content", content)
            formData.append("metaDescription", metaDescription)
            formData.append("keywords", keywords)
            formData.append("status", status)

            if (initialData?.id) {
              formData.append("id", initialData.id)
            }

            startTransition(() => formAction(formData))
          }}
          className="space-y-6"
        >
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              placeholder="Enter blog post title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="slug">Slug</Label>
            <div className="flex gap-2">
              <Input
                id="slug"
                name="slug"
                placeholder="Enter unique slug (e.g., my-awesome-post)"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                required
              />
              <Button type="button" onClick={generateSlug} variant="outline">
                Generate Slug
              </Button>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="content">Content (Markdown)</Label>
            <RichTextEditor content={content} onContentChange={setContent} />
            <p className="text-sm text-muted-foreground">Word count: {wordCount}</p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={(value: BlogPost["status"]) => setStatus(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="featuredImage">Featured Image</Label>
            <ImageResizer onFileChange={handleImageChange} />
            {previewImageUrl && (
              <div className="relative w-full h-48 rounded-md overflow-hidden mt-2">
                <img
                  src={previewImageUrl || "/placeholder.svg"}
                  alt="Featured Image Preview"
                  className="w-full h-full object-cover"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 rounded-full"
                  onClick={handleClearImage}
                >
                  <XIcon className="h-4 w-4" />
                </Button>
              </div>
            )}
            <p className="text-sm text-muted-foreground">Upload an image for your blog post. Max size 5MB.</p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="metaDescription">Meta Description (for search engines)</Label>
            <Textarea
              id="metaDescription"
              name="metaDescription"
              placeholder="A concise summary for search engines (max 160 characters)"
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              maxLength={160}
            />
            <p className="text-sm text-muted-foreground">{metaDescriptionCharCount} / 160 characters</p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="keywords">Keywords (comma-separated)</Label>
            <Input
              id="keywords"
              name="keywords"
              placeholder="e.g., AI, Web3, Blockchain, Trading"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">Comma-separated keywords for SEO.</p>
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending
              ? initialData
                ? "Updating..."
                : "Creating..."
              : initialData
                ? "Update Blog Post"
                : "Create Blog Post"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
