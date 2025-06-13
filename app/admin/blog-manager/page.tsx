"use client"

import type React from "react"
import { useState, useEffect, useMemo, useCallback } from "react"
import { useActionState } from "react"
import { useRouter } from "next/navigation"
import { useWallet } from "@solana/wallet-adapter-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { XIcon, SparklesIcon, SaveIcon, Trash2Icon, FileTextIcon, SearchIcon } from "lucide-react"
import { generateBlogPost, saveBlogPost, getBlogPosts, deleteBlogPost } from "./blog-actions"
import { getFileMetadata } from "../content-manager/file-upload-actions" // To get available RAG tags

interface BlogPost {
  id: string
  title: string
  slug: string
  content: string
  keywords: string[] | null
  meta_description: string | null
  status: "draft" | "published"
  generated_at: string
  updated_at: string
}

interface FileMetadata {
  fileName: string
  filePath: string
  tags: string[]
  contentType: string
  uploadedAt: string
}

export default function BlogManagerPage() {
  const router = useRouter()
  const { publicKey, connected } = useWallet()

  const authorizedWalletAddress = useMemo(() => process.env.NEXT_PUBLIC_AUTHORIZED_SOLANA_WALLET, [])
  const isAuthorized = useMemo(() => {
    return connected && publicKey?.toBase58() === authorizedWalletAddress
  }, [connected, publicKey, authorizedWalletAddress])

  // Blog Generation State
  const [topic, setTopic] = useState("")
  const [generatedTitle, setGeneratedTitle] = useState("")
  const [generatedContent, setGeneratedContent] = useState("")
  const [generatedKeywords, setGeneratedKeywords] = useState<string[]>([])
  const [generatedMetaDescription, setGeneratedMetaDescription] = useState("")
  const [selectedTagsForGeneration, setSelectedTagsForGeneration] = useState<string[]>([])
  const [availableRAGTags, setAvailableRAGTags] = useState<string[]>([]) // Tags from uploaded RAG files

  const [generateState, generateFormAction, isGenerating] = useActionState(generateBlogPost, {
    success: false,
    message: "",
    generatedContent: "",
    generatedTitle: "",
    generatedKeywords: [],
    generatedMetaDescription: "",
  })

  // Blog Post Saving/Listing State
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([])
  const [isFetchingPosts, setIsFetchingPosts] = useState(true)
  const [saveState, saveFormAction, isSaving] = useActionState(saveBlogPost, {
    success: false,
    message: "",
  })

  const [editingPostId, setEditingPostId] = useState<string | null>(null) // For editing existing posts

  useEffect(() => {
    if (!connected || !isAuthorized) {
      router.push("/") // Redirect if not authorized
    }
  }, [connected, isAuthorized, router])

  // Fetch available RAG tags and existing blog posts on load
  const fetchData = useCallback(async () => {
    setIsFetchingPosts(true)
    try {
      const metadata = await getFileMetadata()
      setAvailableRAGTags(Array.from(new Set(metadata.files.flatMap((f: FileMetadata) => f.tags))))

      const { data: postsData, message: postsMessage } = await getBlogPosts()
      if (postsData) {
        setBlogPosts(postsData)
      } else {
        console.error(postsMessage || "Failed to fetch blog posts.")
        alert(postsMessage || "Failed to fetch blog posts.")
      }
    } catch (error) {
      console.error("Error fetching initial data:", error)
      alert("Failed to fetch initial data.")
    } finally {
      setIsFetchingPosts(false)
    }
  }, [])

  useEffect(() => {
    if (isAuthorized) {
      fetchData()
    }
  }, [isAuthorized, fetchData])

  // Handle generation action state changes
  useEffect(() => {
    if (generateState.message) {
      alert(generateState.message)
      if (generateState.success) {
        setGeneratedTitle(generateState.generatedTitle || "")
        setGeneratedContent(generateState.generatedContent || "")
        setGeneratedKeywords(generateState.generatedKeywords || [])
        setGeneratedMetaDescription(generateState.generatedMetaDescription || "")
      }
    }
  }, [generateState])

  // Handle save action state changes
  useEffect(() => {
    if (saveState.message) {
      alert(saveState.message)
      if (saveState.success) {
        // Clear generated content if a new post was saved
        if (!editingPostId) {
          setGeneratedTitle("")
          setGeneratedContent("")
          setGeneratedKeywords([])
          setGeneratedMetaDescription("")
          setTopic("") // Clear topic after successful save of new post
          setSelectedTagsForGeneration([])
        }
        setEditingPostId(null) // Exit editing mode
        fetchData() // Refresh list of posts
      }
    }
  }, [saveState, editingPostId, fetchData])

  const handleGeneratePost = (e: React.FormEvent) => {
    e.preventDefault()
    if (!topic.trim()) {
      alert("Please enter a topic to generate a blog post.")
      return
    }
    const formData = new FormData()
    formData.append("topic", topic)
    formData.append("selectedTags", selectedTagsForGeneration.join(","))
    generateFormAction(formData)
  }

  const handleSavePost = (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData()
    if (editingPostId) {
      formData.append("id", editingPostId)
    }
    formData.append("title", generatedTitle)
    formData.append("content", generatedContent)
    formData.append("keywords", generatedKeywords.join(", "))
    formData.append("metaDescription", generatedMetaDescription)
    // Default to 'draft' if no editing or status selection UI is present yet
    formData.append("status", "draft") // For now, always save as draft
    saveFormAction(formData)
  }

  const handleEditPost = (post: BlogPost) => {
    setEditingPostId(post.id)
    setGeneratedTitle(post.title)
    setGeneratedContent(post.content)
    setGeneratedKeywords(post.keywords || [])
    setGeneratedMetaDescription(post.meta_description || "")
    // Clear topic and selected tags as we are editing an existing post, not generating new
    setTopic("")
    setSelectedTagsForGeneration([])
    window.scrollTo({ top: 0, behavior: "smooth" }) // Scroll to top for editing form
  }

  const handleDeletePost = async (id: string) => {
    if (confirm("Are you sure you want to delete this blog post?")) {
      const { success, message } = await deleteBlogPost(id)
      alert(message)
      if (success) {
        fetchData() // Refresh list
      }
    }
  }

  const handleTagSelection = (tag: string) => {
    setSelectedTagsForGeneration((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  if (!connected || !isAuthorized) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4">
        <p className="text-red-500 text-lg">Unauthorized access. Redirecting...</p>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-8">
        {/* Close Button */}
        <div className="flex justify-end">
          <Button
            onClick={() => router.push("/")}
            className="jupiter-button-dark h-10 px-4 bg-neumorphic-base hover:bg-neumorphic-base flex items-center gap-2"
          >
            <XIcon className="h-4 w-4" /> Close Editor
          </Button>
        </div>

        {/* Blog Post Generation Card */}
        <Card className="w-full jupiter-outer-panel p-6">
          <CardHeader>
            <CardTitle className="text-center text-2xl font-bold text-[#afcd4f]">AI Blog Post Generator</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4 text-center">
              Generate a blog post by providing a topic and optionally selecting relevant RAG tags.
            </p>
            <form onSubmit={handleGeneratePost} className="space-y-4">
              <div>
                <Label htmlFor="topic" className="block text-sm font-medium text-muted-foreground mb-1">
                  Blog Post Topic
                </Label>
                <Input
                  id="topic"
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., The Future of Decentralized AI"
                  className="bg-neumorphic-base shadow-inner-neumorphic text-white"
                  disabled={isGenerating}
                  required
                />
              </div>

              <div>
                <Label className="block text-sm font-medium text-muted-foreground mb-1">
                  Relevant RAG Tags (Optional)
                </Label>
                <div className="flex flex-wrap gap-2">
                  {availableRAGTags.length === 0 && !isFetchingPosts ? (
                    <span className="text-xs text-muted-foreground">
                      No RAG tags available. Upload files with tags in Content Manager.
                    </span>
                  ) : (
                    availableRAGTags.map((tag) => (
                      <Button
                        key={tag}
                        type="button"
                        variant={selectedTagsForGeneration.includes(tag) ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleTagSelection(tag)}
                        className={`neumorphic-base text-sm px-3 py-1 rounded-full ${
                          selectedTagsForGeneration.includes(tag)
                            ? "bg-[#2ed3b7] text-white hover:bg-[#c7f284] hover:text-black"
                            : "bg-neumorphic-light text-muted-foreground hover:bg-neumorphic-base"
                        }`}
                        disabled={isGenerating}
                      >
                        {tag}
                      </Button>
                    ))
                  )}
                </div>
              </div>

              <Button
                type="submit"
                className="jupiter-button-dark w-full h-12 px-6 bg-neumorphic-base hover:bg-neumorphic-base"
                disabled={isGenerating || !topic.trim()}
              >
                {isGenerating ? (
                  "Generating..."
                ) : (
                  <>
                    <SparklesIcon className="h-4 w-4 mr-2" /> GENERATE BLOG POST
                  </>
                )}
              </Button>
            </form>

            {(generatedTitle || generatedContent) && (
              <div className="mt-8 p-4 neumorphic-inset rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-2">Generated Content Preview</h3>
                <Input
                  className="bg-neumorphic-base shadow-inner-neumorphic text-white mb-2"
                  value={generatedTitle}
                  onChange={(e) => setGeneratedTitle(e.target.value)}
                  placeholder="Generated Title"
                  disabled={isSaving}
                />
                <Textarea
                  className="min-h-[300px] bg-neumorphic-base shadow-inner-neumorphic text-white font-mono text-sm mb-2"
                  value={generatedContent}
                  onChange={(e) => setGeneratedContent(e.target.value)}
                  placeholder="Generated Markdown Content"
                  disabled={isSaving}
                />
                <Input
                  className="bg-neumorphic-base shadow-inner-neumorphic text-white mb-2"
                  value={generatedKeywords.join(", ")}
                  onChange={(e) => setGeneratedKeywords(e.target.value.split(",").map((k) => k.trim()))}
                  placeholder="Generated Keywords (comma-separated)"
                  disabled={isSaving}
                />
                <Textarea
                  className="min-h-[80px] bg-neumorphic-base shadow-inner-neumorphic text-white mb-2"
                  value={generatedMetaDescription}
                  onChange={(e) => setGeneratedMetaDescription(e.target.value)}
                  placeholder="Generated Meta Description (max 160 chars)"
                  disabled={isSaving}
                  maxLength={160}
                />
                <Button
                  onClick={handleSavePost}
                  className="jupiter-button-dark w-full h-10 px-4 bg-neumorphic-base hover:bg-neumorphic-base"
                  disabled={isSaving || !generatedTitle.trim() || !generatedContent.trim()}
                >
                  {isSaving ? (
                    "Saving..."
                  ) : (
                    <>
                      <SaveIcon className="h-4 w-4 mr-2" /> {editingPostId ? "UPDATE POST" : "SAVE NEW POST"}
                    </>
                  )}
                </Button>
                {editingPostId && (
                  <Button
                    onClick={() => {
                      setEditingPostId(null)
                      setGeneratedTitle("")
                      setGeneratedContent("")
                      setGeneratedKeywords([])
                      setGeneratedMetaDescription("")
                    }}
                    variant="ghost"
                    className="w-full mt-2 text-muted-foreground hover:text-white"
                  >
                    Cancel Edit
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Existing Blog Posts List */}
        <Card className="w-full jupiter-outer-panel p-6 mt-8">
          <CardHeader>
            <CardTitle className="text-center text-2xl font-bold text-[#afcd4f]">Existing Blog Posts</CardTitle>
          </CardHeader>
          <CardContent>
            {isFetchingPosts ? (
              <p className="text-center text-muted-foreground">Loading blog posts...</p>
            ) : blogPosts.length === 0 ? (
              <p className="text-center text-muted-foreground">No blog posts generated yet.</p>
            ) : (
              <div className="space-y-3">
                {blogPosts.map((post) => (
                  <div
                    key={post.id}
                    className="neumorphic-inset p-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{post.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Status:{" "}
                        <span className={post.status === "published" ? "text-[#2ed3b7]" : "text-yellow-500"}>
                          {post.status}
                        </span>{" "}
                        | Generated: {new Date(post.generated_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push(`/blog/${post.slug}`)}
                        className="text-muted-foreground hover:bg-muted-foreground/20"
                        aria-label={`View blog post: ${post.title}`}
                      >
                        <SearchIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditPost(post)}
                        className="text-[#afcd4f] hover:bg-[#afcd4f]/20"
                        aria-label={`Edit blog post: ${post.title}`}
                      >
                        <FileTextIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeletePost(post.id)}
                        className="text-red-500 hover:bg-red-500/20"
                        aria-label={`Delete blog post: ${post.title}`}
                      >
                        <Trash2Icon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
