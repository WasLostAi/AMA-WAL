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
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { XIcon, SparklesIcon, SaveIcon, Trash2Icon, EditIcon, BookOpenIcon } from "lucide-react"
import { generateBlogPostContent, saveBlogPost, getBlogPosts, deleteBlogPost } from "./blog-actions"
import { getFileMetadata } from "../content-manager/file-upload-actions" // Re-use existing action

interface BlogPost {
  id: string
  title: string
  slug: string
  content: string
  tags: string[] | null
  status: "draft" | "published"
  created_at: string
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

  // Blog Post Generation State
  const [prompt, setPrompt] = useState("")
  const [generatedContent, setGeneratedContent] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationMessage, setGenerationMessage] = useState("")

  // Blog Post Form State
  const [currentPostId, setCurrentPostId] = useState<string | null>(null)
  const [postTitle, setPostTitle] = useState("")
  const [postSlug, setPostSlug] = useState("")
  const [postContent, setPostContent] = useState("")
  const [postTags, setPostTags] = useState("")
  const [postStatus, setPostStatus] = useState<"draft" | "published">("draft")

  const [savePostState, savePostAction, isSavePending] = useActionState(saveBlogPost, {
    success: false,
    message: "",
  })

  // RAG File Selection State
  const [availableRAGFiles, setAvailableRAGFiles] = useState<FileMetadata[]>([])
  const [selectedRAGFilePaths, setSelectedRAGFilePaths] = useState<string[]>([])
  const [isFetchingRAGFiles, setIsFetchingRAGFiles] = useState(true)

  // Existing Blog Posts List State
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([])
  const [isFetchingBlogPosts, setIsFetchingBlogPosts] = useState(true)

  useEffect(() => {
    if (!connected || !isAuthorized) {
      router.push("/") // Redirect if not authorized
    }
  }, [connected, isAuthorized, router])

  // Fetch RAG files
  const fetchRAGFiles = useCallback(async () => {
    setIsFetchingRAGFiles(true)
    try {
      const metadata = await getFileMetadata()
      // Filter for text-extractable files that are useful for RAG
      const ragFiles = metadata.files.filter(
        (f) =>
          f.contentType.includes("text/plain") ||
          f.contentType.includes("text/markdown") ||
          f.contentType.includes("text/html"),
      )
      setAvailableRAGFiles(ragFiles)
    } catch (error) {
      console.error("Failed to fetch RAG file metadata:", error)
    } finally {
      setIsFetchingRAGFiles(false)
    }
  }, [])

  // Fetch existing blog posts
  const fetchBlogPosts = useCallback(async () => {
    setIsFetchingBlogPosts(true)
    try {
      const { data, message } = await getBlogPosts()
      if (data) {
        setBlogPosts(data)
      } else {
        console.error(message || "Failed to fetch blog posts.")
      }
    } catch (error) {
      console.error("Error fetching blog posts:", error)
    } finally {
      setIsFetchingBlogPosts(false)
    }
  }, [])

  useEffect(() => {
    if (isAuthorized) {
      fetchRAGFiles()
      fetchBlogPosts()
    }
  }, [isAuthorized, fetchRAGFiles, fetchBlogPosts])

  useEffect(() => {
    if (savePostState.message) {
      alert(savePostState.message)
      if (savePostState.success) {
        // Reset form after successful save
        setCurrentPostId(null)
        setPostTitle("")
        setPostSlug("")
        setPostContent("")
        setPostTags("")
        setPostStatus("draft")
        setGeneratedContent("") // Clear generated content after saving
        setPrompt("") // Clear prompt
        setSelectedRAGFilePaths([]) // Clear selected RAG files
        fetchBlogPosts() // Refresh list of posts
      }
    }
  }, [savePostState, fetchBlogPosts])

  const handleGeneratePost = async () => {
    if (!prompt.trim()) {
      alert("Please enter a prompt for the blog post.")
      return
    }

    setIsGenerating(true)
    setGenerationMessage("Generating blog post...")
    try {
      const result = await generateBlogPostContent(prompt, selectedRAGFilePaths)
      if (result.success && result.content) {
        setGeneratedContent(result.content)
        setPostContent(result.content) // Pre-fill content for editing
        // Attempt to extract title and suggest slug
        const firstLine = result.content.split("\n")[0]
        if (firstLine.startsWith("# ")) {
          const extractedTitle = firstLine.substring(2).trim()
          setPostTitle(extractedTitle)
          setPostSlug(
            extractedTitle
              .toLowerCase()
              .replace(/[^a-z0-9\s-]/g, "")
              .replace(/\s+/g, "-")
              .replace(/^-+|-+$/g, ""),
          )
        }
        setGenerationMessage(result.message)
      } else {
        setGenerationMessage(result.message)
      }
    } catch (error) {
      console.error("Error during blog post generation:", error)
      setGenerationMessage(`Failed to generate blog post: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSavePost = (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData()
    if (currentPostId) {
      formData.append("id", currentPostId)
    }
    formData.append("title", postTitle)
    formData.append("slug", postSlug)
    formData.append("content", postContent)
    formData.append("tags", postTags)
    formData.append("status", postStatus)
    savePostAction(formData)
  }

  const handleEditPost = (post: BlogPost) => {
    setCurrentPostId(post.id)
    setPostTitle(post.title)
    setPostSlug(post.slug)
    setPostContent(post.content)
    setPostTags(post.tags?.join(", ") || "")
    setPostStatus(post.status)
    setGeneratedContent("") // Clear generated content when editing an existing post
    setPrompt("") // Clear prompt
    setSelectedRAGFilePaths([]) // Clear selected RAG files
    window.scrollTo({ top: 0, behavior: "smooth" }) // Scroll to top to show form
  }

  const handleDeletePost = async (id: string) => {
    if (confirm("Are you sure you want to delete this blog post?")) {
      try {
        const { success, message } = await deleteBlogPost(id)
        alert(message)
        if (success) {
          fetchBlogPosts() // Refresh list
        }
      } catch (error) {
        console.error("Error deleting blog post:", error)
        alert("Failed to delete blog post.")
      }
    }
  }

  const handleRAGFileToggle = (filePath: string) => {
    setSelectedRAGFilePaths((prev) =>
      prev.includes(filePath) ? prev.filter((p) => p !== filePath) : [...prev, filePath],
    )
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

        {/* Blog Post Generator Card */}
        <Card className="w-full jupiter-outer-panel p-6">
          <CardHeader>
            <CardTitle className="text-center text-2xl font-bold text-[#afcd4f]">AI Blog Post Generator</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4 text-center">
              Enter a prompt to generate a new blog post. Select relevant RAG documents to provide context for the AI.
            </p>
            <div className="space-y-4">
              <div>
                <label htmlFor="prompt" className="block text-sm font-medium text-muted-foreground mb-1">
                  Prompt for Blog Post
                </label>
                <Textarea
                  id="prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g., Write a blog post about the future of AI in decentralized finance."
                  className="min-h-[100px] bg-neumorphic-base shadow-inner-neumorphic text-white p-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#afcd4f]"
                  disabled={isGenerating}
                />
              </div>

              {/* RAG File Selection */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-muted-foreground">
                  Select RAG Documents for Context (Optional)
                </label>
                {isFetchingRAGFiles ? (
                  <p className="text-muted-foreground text-sm">Loading available RAG files...</p>
                ) : availableRAGFiles.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    No RAG-compatible files uploaded yet. Upload .txt, .md, or .html files in Content Manager.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 neumorphic-inset rounded-md">
                    {availableRAGFiles.map((file) => (
                      <div key={file.filePath} className="flex items-center space-x-2">
                        <Checkbox
                          id={`rag-file-${file.filePath}`}
                          checked={selectedRAGFilePaths.includes(file.filePath)}
                          onCheckedChange={() => handleRAGFileToggle(file.filePath)}
                          disabled={isGenerating}
                          className="data-[state=checked]:bg-[#afcd4f] data-[state=checked]:text-black"
                        />
                        <Label htmlFor={`rag-file-${file.filePath}`} className="text-sm text-white cursor-pointer">
                          {file.fileName} ({file.tags.join(", ") || "no tags"})
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button
                onClick={handleGeneratePost}
                className="jupiter-button-dark w-full h-12 px-6 bg-neumorphic-base hover:bg-neumorphic-base"
                disabled={isGenerating || !prompt.trim()}
              >
                {isGenerating ? (
                  "Generating..."
                ) : (
                  <>
                    <SparklesIcon className="h-4 w-4 mr-2" /> GENERATE BLOG POST
                  </>
                )}
              </Button>
              {generationMessage && <p className="text-center text-sm text-muted-foreground">{generationMessage}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Blog Post Editor Card */}
        <Card className="w-full jupiter-outer-panel p-6 mt-8">
          <CardHeader>
            <CardTitle className="text-center text-2xl font-bold text-[#afcd4f]">
              {currentPostId ? "Edit Blog Post" : "New Blog Post"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4 text-center">
              Review and refine the generated content, then save or publish your blog post.
            </p>
            <form onSubmit={handleSavePost} className="space-y-4">
              <div>
                <label htmlFor="post-title" className="block text-sm font-medium text-muted-foreground mb-1">
                  Title
                </label>
                <Input
                  id="post-title"
                  type="text"
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  placeholder="Your blog post title"
                  className="bg-neumorphic-base shadow-inner-neumorphic text-white"
                  required
                />
              </div>
              <div>
                <label htmlFor="post-slug" className="block text-sm font-medium text-muted-foreground mb-1">
                  Slug (for URL)
                </label>
                <Input
                  id="post-slug"
                  type="text"
                  value={postSlug}
                  onChange={(e) =>
                    setPostSlug(
                      e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9\s-]/g, "")
                        .replace(/\s+/g, "-")
                        .replace(/^-+|-+$/g, ""),
                    )
                  }
                  placeholder="your-blog-post-slug"
                  className="bg-neumorphic-base shadow-inner-neumorphic text-white"
                  required
                />
              </div>
              <div>
                <label htmlFor="post-content" className="block text-sm font-medium text-muted-foreground mb-1">
                  Content (Markdown)
                </label>
                <Textarea
                  id="post-content"
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder="Your blog post content in Markdown..."
                  className="min-h-[400px] bg-neumorphic-base shadow-inner-neumorphic text-white p-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#afcd4f] font-mono text-sm"
                  required
                />
              </div>
              <div>
                <label htmlFor="post-tags" className="block text-sm font-medium text-muted-foreground mb-1">
                  Tags (comma-separated)
                </label>
                <Input
                  id="post-tags"
                  type="text"
                  value={postTags}
                  onChange={(e) => setPostTags(e.target.value)}
                  placeholder="e.g., ai, web3, trading, blockchain"
                  className="bg-neumorphic-base shadow-inner-neumorphic text-white"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="post-status"
                  checked={postStatus === "published"}
                  onCheckedChange={(checked) => setPostStatus(checked ? "published" : "draft")}
                  className="data-[state=checked]:bg-[#afcd4f] data-[state=checked]:text-black"
                />
                <Label htmlFor="post-status" className="text-sm text-white">
                  Publish Post (uncheck for draft)
                </Label>
              </div>
              <Button
                type="submit"
                className="jupiter-button-dark w-full h-12 px-6 bg-neumorphic-base hover:bg-neumorphic-base"
                disabled={isSavePending || !postTitle.trim() || !postSlug.trim() || !postContent.trim()}
              >
                {isSavePending ? (
                  "Saving Post..."
                ) : (
                  <>
                    <SaveIcon className="h-4 w-4 mr-2" /> SAVE BLOG POST
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Existing Blog Posts List */}
        <Card className="w-full jupiter-outer-panel p-6 mt-8">
          <CardHeader>
            <CardTitle className="text-center text-2xl font-bold text-[#afcd4f]">Existing Blog Posts</CardTitle>
          </CardHeader>
          <CardContent>
            {isFetchingBlogPosts ? (
              <p className="text-center text-muted-foreground">Loading blog posts...</p>
            ) : blogPosts.length === 0 ? (
              <p className="text-center text-muted-foreground">No blog posts created yet.</p>
            ) : (
              <div className="space-y-3">
                {blogPosts.map((post) => (
                  <div
                    key={post.id}
                    className="neumorphic-inset p-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white flex items-center gap-2">
                        <BookOpenIcon className="h-4 w-4 text-[#afcd4f]" />
                        {post.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Slug: <span className="font-mono">{post.slug}</span> | Status:{" "}
                        <span className={post.status === "published" ? "text-green-400" : "text-yellow-400"}>
                          {post.status.toUpperCase()}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">Tags: {post.tags?.join(", ") || "None"}</p>
                      <p className="text-xs text-muted-foreground">
                        Last Updated: {new Date(post.updated_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditPost(post)}
                        className="text-blue-400 hover:bg-blue-400/20"
                        aria-label={`Edit ${post.title}`}
                      >
                        <EditIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeletePost(post.id)}
                        className="text-red-500 hover:bg-red-500/20"
                        aria-label={`Delete ${post.title}`}
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
