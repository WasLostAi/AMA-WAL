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
import { XIcon, Trash2Icon, SaveIcon, SparklesIcon, EditIcon, LinkIcon } from "lucide-react"

import { generateBlogPost, saveBlogPost, getBlogPosts, deleteBlogPost, getBlogPostBySlugOrId } from "./blog-actions"

interface BlogPost {
  id: string
  slug: string
  title: string
  content: string
  description: string
  tags: string[] | null
  created_at: string
  updated_at: string
}

export default function BlogManagerPage() {
  const router = useRouter()
  const { publicKey, connected } = useWallet()

  const authorizedWalletAddress = useMemo(() => process.env.NEXT_PUBLIC_AUTHORIZED_SOLANA_WALLET, [])
  const isAuthorized = useMemo(() => {
    return connected && publicKey?.toBase58() === authorizedWalletAddress
  }, [connected, publicKey, authorizedWalletAddress])

  // Generate Post State
  const [topic, setTopic] = useState("")
  const [keywords, setKeywords] = useState("")
  const [style, setStyle] = useState("")
  const [generatedTitle, setGeneratedTitle] = useState("")
  const [generatedContent, setGeneratedContent] = useState("")
  const [generatedDescription, setGeneratedDescription] = useState("")
  const [generatedTags, setGeneratedTags] = useState("")
  const [generatedSlug, setGeneratedSlug] = useState("")

  const [generatePostState, generatePostFormAction, isGeneratingPost] = useActionState(generateBlogPost, {
    success: false,
    message: "",
  })

  // Save Post State
  const [currentEditPostId, setCurrentEditPostId] = useState<string | null>(null)
  const [savePostState, savePostFormAction, isSavingPost] = useActionState(saveBlogPost, {
    success: false,
    message: "",
  })

  // List Posts State
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([])
  const [isFetchingPosts, setIsFetchingPosts] = useState(true)

  useEffect(() => {
    if (!connected || !isAuthorized) {
      router.push("/") // Redirect if not authorized
    }
  }, [connected, isAuthorized, router])

  // Handle Generate Post result
  useEffect(() => {
    if (generatePostState.message) {
      alert(generatePostState.message)
      if (generatePostState.success && generatePostState.generatedContent) {
        setGeneratedTitle(generatePostState.generatedContent.title)
        setGeneratedContent(generatePostState.generatedContent.content)
        setGeneratedDescription(generatePostState.generatedContent.description)
        setGeneratedTags(generatePostState.generatedContent.tags.join(", "))
        setGeneratedSlug(generateSlug(generatePostState.generatedContent.title)) // Generate slug from title
        setCurrentEditPostId(null) // Clear ID for new generation
      }
    }
  }, [generatePostState])

  // Handle Save Post result
  useEffect(() => {
    if (savePostState.message) {
      alert(savePostState.message)
      if (savePostState.success) {
        // Clear generation fields after successful save
        setTopic("")
        setKeywords("")
        setStyle("")
        setGeneratedTitle("")
        setGeneratedContent("")
        setGeneratedDescription("")
        setGeneratedTags("")
        setGeneratedSlug("")
        setCurrentEditPostId(null)
        fetchBlogPosts() // Refresh the list of posts
      }
    }
  }, [savePostState])

  // Fetch Blog Posts
  const fetchBlogPosts = useCallback(async () => {
    setIsFetchingPosts(true)
    const { data, message } = await getBlogPosts()
    if (data) {
      setBlogPosts(data)
    } else {
      console.error(message || "Failed to fetch blog posts.")
    }
    setIsFetchingPosts(false)
  }, [])

  useEffect(() => {
    if (isAuthorized) {
      fetchBlogPosts()
    }
  }, [isAuthorized, fetchBlogPosts])

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData()
    formData.append("topic", topic)
    formData.append("keywords", keywords)
    formData.append("style", style)
    generatePostFormAction(formData)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData()
    if (currentEditPostId) {
      formData.append("id", currentEditPostId)
    }
    formData.append("title", generatedTitle)
    formData.append("content", generatedContent)
    formData.append("description", generatedDescription)
    formData.append("tags", generatedTags)
    formData.append("slug", generatedSlug) // Pass the potentially edited slug
    savePostFormAction(formData)
  }

  const handleEditPost = async (id: string) => {
    setIsFetchingPosts(true) // Indicate loading while fetching a single post for edit
    const { data, message } = await getBlogPostBySlugOrId(id)
    if (data) {
      setGeneratedTitle(data.title)
      setGeneratedContent(data.content)
      setGeneratedDescription(data.description)
      setGeneratedTags(data.tags?.join(", ") || "")
      setGeneratedSlug(data.slug)
      setCurrentEditPostId(data.id) // Set the ID for update
      setTopic("") // Clear generation inputs
      setKeywords("")
      setStyle("")
      window.scrollTo({ top: 0, behavior: "smooth" }) // Scroll to the generation section
    } else {
      alert(message || "Failed to load blog post for editing.")
    }
    setIsFetchingPosts(false)
  }

  const handleDeletePost = async (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete the blog post "${title}"?`)) {
      const { success, message } = await deleteBlogPost(id)
      alert(message)
      if (success) {
        fetchBlogPosts() // Refresh the list
        // If the deleted post was currently being edited, clear the editor
        if (currentEditPostId === id) {
          setGeneratedTitle("")
          setGeneratedContent("")
          setGeneratedDescription("")
          setGeneratedTags("")
          setGeneratedSlug("")
          setCurrentEditPostId(null)
        }
      }
    }
  }

  // Helper to generate a SEO-friendly slug (local to UI for preview)
  const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "") // Remove non-alphanumeric characters except spaces and hyphens
      .trim()
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/-+/g, "-") // Replace multiple hyphens with a single hyphen
      .substring(0, 60) // Limit length
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

        {/* Generate Blog Post Card */}
        <Card className="w-full jupiter-outer-panel p-6">
          <CardHeader>
            <CardTitle className="text-center text-2xl font-bold text-[#afcd4f]">AI Blog Post Generator</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4 text-center">
              Generate new blog posts using AI, powered by your uploaded RAG documents.
            </p>
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label htmlFor="topic" className="block text-sm font-medium text-muted-foreground mb-1">
                  Topic <span className="text-red-500">*</span>
                </label>
                <Input
                  id="topic"
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., The future of AI in Web3 gaming"
                  className="bg-neumorphic-base shadow-inner-neumorphic text-white"
                  disabled={isGeneratingPost}
                  required
                />
              </div>
              <div>
                <label htmlFor="keywords" className="block text-sm font-medium text-muted-foreground mb-1">
                  Keywords (comma-separated, optional)
                </label>
                <Input
                  id="keywords"
                  type="text"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="e.g., blockchain, decentralization, agentic-AI"
                  className="bg-neumorphic-base shadow-inner-neumorphic text-white"
                  disabled={isGeneratingPost}
                />
              </div>
              <div>
                <label htmlFor="style" className="block text-sm font-medium text-muted-foreground mb-1">
                  Writing Style (optional)
                </label>
                <Input
                  id="style"
                  type="text"
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  placeholder="e.g., technical, informal, thought-provoking"
                  className="bg-neumorphic-base shadow-inner-neumorphic text-white"
                  disabled={isGeneratingPost}
                />
              </div>
              <Button
                type="submit"
                className="jupiter-button-dark w-full h-12 px-6 bg-neumorphic-base hover:bg-neumorphic-base"
                disabled={isGeneratingPost || !topic.trim()}
              >
                {isGeneratingPost ? (
                  "Generating..."
                ) : (
                  <>
                    <SparklesIcon className="h-4 w-4 mr-2" /> GENERATE BLOG POST
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Generated/Edit Blog Post Section */}
        {(generatedContent || currentEditPostId) && (
          <Card className="w-full jupiter-outer-panel p-6 mt-8">
            <CardHeader>
              <CardTitle className="text-center text-2xl font-bold text-[#afcd4f]">
                {currentEditPostId ? "Edit Blog Post" : "Review & Edit Generated Post"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4 text-center">
                Review, edit, and save the generated content. This will be stored in your database.
              </p>
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label htmlFor="post-title" className="block text-sm font-medium text-muted-foreground mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="post-title"
                    type="text"
                    value={generatedTitle}
                    onChange={(e) => {
                      setGeneratedTitle(e.target.value)
                      setGeneratedSlug(generateSlug(e.target.value)) // Auto-update slug on title change
                    }}
                    placeholder="Blog Post Title"
                    className="bg-neumorphic-base shadow-inner-neumorphic text-white"
                    disabled={isSavingPost}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="post-slug" className="block text-sm font-medium text-muted-foreground mb-1">
                    Slug <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="post-slug"
                    type="text"
                    value={generatedSlug}
                    onChange={(e) => setGeneratedSlug(e.target.value)}
                    placeholder="seo-friendly-url-slug"
                    className="bg-neumorphic-base shadow-inner-neumorphic text-white"
                    disabled={isSavingPost}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="post-description" className="block text-sm font-medium text-muted-foreground mb-1">
                    Meta Description <span className="text-red-500">*</span>
                  </label>
                  <Textarea
                    id="post-description"
                    value={generatedDescription}
                    onChange={(e) => setGeneratedDescription(e.target.value)}
                    placeholder="A concise summary for search engines (max 160 characters)"
                    className="min-h-[80px] bg-neumorphic-base shadow-inner-neumorphic text-white"
                    disabled={isSavingPost}
                    maxLength={160}
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
                    value={generatedTags}
                    onChange={(e) => setGeneratedTags(e.target.value)}
                    placeholder="e.g., ai, web3, blockchain, trading-automation"
                    className="bg-neumorphic-base shadow-inner-neumorphic text-white"
                    disabled={isSavingPost}
                  />
                </div>
                <div>
                  <label htmlFor="post-content" className="block text-sm font-medium text-muted-foreground mb-1">
                    Content (Markdown) <span className="text-red-500">*</span>
                  </label>
                  <Textarea
                    id="post-content"
                    value={generatedContent}
                    onChange={(e) => setGeneratedContent(e.target.value)}
                    placeholder="Generated blog post content in Markdown..."
                    className="min-h-[400px] bg-neumorphic-base shadow-inner-neumorphic text-white p-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#afcd4f] font-mono text-sm"
                    disabled={isSavingPost}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="jupiter-button-dark w-full h-12 px-6 bg-neumorphic-base hover:bg-neumorphic-base"
                  disabled={
                    isSavingPost ||
                    !generatedTitle.trim() ||
                    !generatedContent.trim() ||
                    !generatedDescription.trim() ||
                    !generatedSlug.trim()
                  }
                >
                  {isSavingPost ? (
                    "Saving Post..."
                  ) : (
                    <>
                      <SaveIcon className="h-4 w-4 mr-2" /> {currentEditPostId ? "UPDATE POST" : "SAVE NEW POST"}
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Existing Blog Posts List */}
        <Card className="w-full jupiter-outer-panel p-6 mt-8">
          <CardHeader>
            <CardTitle className="text-center text-2xl font-bold text-[#afcd4f]">Existing Blog Posts</CardTitle>
          </CardHeader>
          <CardContent>
            {isFetchingPosts ? (
              <p className="text-center text-muted-foreground">Loading blog posts...</p>
            ) : blogPosts.length === 0 ? (
              <p className="text-center text-muted-foreground">No blog posts found yet.</p>
            ) : (
              <div className="space-y-3">
                {blogPosts.map((post) => (
                  <div
                    key={post.id}
                    className="neumorphic-inset p-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{post.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">Slug: `{post.slug}`</p>
                      <p className="text-xs text-muted-foreground">Tags: {post.tags?.join(", ") || "No tags"}</p>
                      <p className="text-xs text-muted-foreground">
                        Last Updated: {new Date(post.updated_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditPost(post.id)}
                        className="text-[#afcd4f] hover:bg-[#afcd4f]/20"
                        aria-label={`Edit ${post.title}`}
                      >
                        <EditIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => window.open(`/blog/${post.slug}`, "_blank")}
                        className="text-blue-400 hover:bg-blue-400/20"
                        aria-label={`View ${post.title}`}
                      >
                        <LinkIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeletePost(post.id, post.title)}
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
