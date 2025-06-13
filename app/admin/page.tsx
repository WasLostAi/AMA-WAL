"use client"

import type React from "react"
import { useState, useEffect, useMemo, useCallback, startTransition, useRef } from "react" // Import startTransition
import { useActionState } from "react"
import { useRouter } from "next/navigation"
import { useWallet } from "@solana/wallet-adapter-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  XIcon,
  SparklesIcon,
  SaveIcon,
  Trash2Icon,
  FileTextIcon,
  SearchIcon,
  PlusIcon,
  UploadCloudIcon,
  ImageIcon,
  FileIcon,
  ChevronDownIcon,
} from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Import the new RichTextEditor
import RichTextEditor from "@/components/rich-text-editor"

// Import all necessary server actions
import { saveSocialPostsMarkdown } from "./content-manager/social-post-actions"
import { uploadFileWithTag, getFileMetadata, deleteFile } from "./content-manager/file-upload-actions"
import { suggestTagsFromFile } from "./content-manager/ai-tagging-action"
import {
  getAgentProfileData,
  updateAgentProfileData,
  getTrainingQAs,
  addTrainingQA,
  updateTrainingQA, // New import
  deleteTrainingQA,
} from "./agent-manager/agent-actions"
import { generateBlogPost, saveBlogPost, getBlogPosts, deleteBlogPost } from "./blog-manager/blog-actions"
import { initialProjectUpdatesMarkdown } from "@/lib/current-projects" // For social post editor default
import { uploadBlogImage } from "./blog-manager/blog-image-actions" // New import
import { resizeImage } from "@/lib/image-processing" // Import client-side image resizer

interface FileMetadata {
  fileName: string
  filePath: string
  tags: string[]
  contentType: string
  uploadedAt: string
}

interface AgentProfileData {
  personal: any
  professional: any
  company: any
  chatbotInstructions: {
    role: string
    style: string
    approach: string
    limitations: string
  }
}

interface TrainingQA {
  id: string
  question: string
  answer: string
}

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
  featured_image_url: string | null // Add this line
}

export default function AdminPage() {
  const router = useRouter()
  const { publicKey, connected } = useWallet()

  const authorizedWalletAddress = useMemo(() => process.env.NEXT_PUBLIC_AUTHORIZED_SOLANA_WALLET, [])
  const isAuthorized = useMemo(() => {
    return connected && publicKey?.toBase58() === authorizedWalletAddress
  }, [connected, publicKey, authorizedWalletAddress])

  // --- Social Post Editor State ---
  const [markdownContent, setMarkdownContent] = useState(initialProjectUpdatesMarkdown)
  const [socialPostState, socialPostFormAction, isSocialPostPending] = useActionState(saveSocialPostsMarkdown, {
    message: "",
    success: false,
  })

  // --- File Uploads State ---
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [fileTagInput, setFileTagInput] = useState<string>("")
  const [previouslyUsedTags, setPreviouslyUsedTags] = useState<string[]>([])
  const [uploadedFiles, setUploadedFiles] = useState<FileMetadata[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isFileUploadPending, setIsFileUploadPending] = useState(false)
  const [isFetchingFiles, setIsFetchingFiles] = useState(true)
  const [isSuggestingTags, setIsSuggestingTags] = useState(false)

  // --- Agent Profile Editor State ---
  const [profileJson, setProfileJson] = useState<string>("") // For personal, professional, company
  const [agentRole, setAgentRole] = useState("")
  const [agentStyle, setAgentStyle] = useState("")
  const [agentApproach, setAgentApproach] = useState("")
  const [agentLimitations, setAgentLimitations] = useState("")

  const [profileState, profileFormAction, isProfilePending] = useActionState(updateAgentProfileData, {
    success: false,
    message: "",
  })
  const [isFetchingProfile, setIsFetchingProfile] = useState(true)

  // --- Training Q&A Manager State ---
  const [trainingQAs, setTrainingQAs] = useState<TrainingQA[]>([])
  const [newQuestion, setNewQuestion] = useState("")
  const [newAnswer, setNewAnswer] = useState("")
  const [editingQAId, setEditingQAId] = useState<string | null>(null) // State for editing Q&A
  const [qaFilterQuery, setQaFilterQuery] = useState("") // State for Q&A filter
  const [addQAState, addQAFormAction, isAddQAPending] = useActionState(addTrainingQA, {
    success: false,
    message: "",
  })
  const [updateQAState, updateQAFormAction, isUpdateQAPending] = useActionState(updateTrainingQA, {
    success: false,
    message: "",
  })
  const [isFetchingQAs, setIsFetchingQAs] = useState(true)

  // --- Blog Post Generation State ---
  const [topic, setTopic] = useState("")
  const [generatedTitle, setGeneratedTitle] = useState("")
  const [generatedContent, setGeneratedContent] = useState("")
  const [generatedKeywords, setGeneratedKeywords] = useState<string[]>([])
  const [generatedMetaDescription, setGeneratedMetaDescription] = useState("")
  const [selectedTagsForGeneration, setSelectedTagsForGeneration] = useState<string[]>([])
  const [availableRAGTags, setAvailableRAGTags] = useState<string[]>([]) // Tags from uploaded RAG files
  const [postStatus, setPostStatus] = useState<"draft" | "published">("draft") // New state for blog post status
  const [featuredImageFile, setFeaturedImageFile] = useState<File | null>(null)
  const [featuredImageUrl, setFeaturedImageUrl] = useState<string | null>(null) // URL of the uploaded/resized image
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const featuredImageInputRef = useRef<HTMLInputElement>(null) // Ref for file input

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

  // --- Authorization Effect ---
  useEffect(() => {
    if (!connected || !isAuthorized) {
      router.push("/") // Redirect if not authorized
    }
  }, [connected, isAuthorized, router])

  // --- Data Fetching Callbacks ---
  const fetchFileMetadata = useCallback(async () => {
    setIsFetchingFiles(true)
    try {
      const metadata = await getFileMetadata()
      setUploadedFiles(metadata.files)
      setPreviouslyUsedTags(Array.from(new Set(metadata.files.flatMap((f) => f.tags))))
    } catch (error) {
      console.error("Failed to fetch file metadata:", error)
    } finally {
      setIsFetchingFiles(false)
    }
  }, [])

  const fetchAgentProfile = useCallback(async () => {
    setIsFetchingProfile(true)
    const { data, message } = await getAgentProfileData()
    if (data) {
      // Extract chatbotInstructions and set separate states
      const { chatbotInstructions, ...restOfProfile } = data
      setAgentRole(chatbotInstructions?.role || "")
      setAgentStyle(chatbotInstructions?.style || "")
      setAgentApproach(chatbotInstructions?.approach || "")
      setAgentLimitations(chatbotInstructions?.limitations || "")
      // Set the rest of the profile JSON to the textarea, ensuring it's an object
      setProfileJson(JSON.stringify(restOfProfile || {}, null, 2))
    } else {
      console.error(message || "Failed to fetch agent profile.")
      // Default to empty JSON object string and clear chatbot instruction states if no data
      setProfileJson("{}")
      setAgentRole("")
      setAgentStyle("")
      setAgentApproach("")
      setAgentLimitations("")
    }
    setIsFetchingProfile(false)
  }, [])

  const fetchTrainingQAs = useCallback(async () => {
    setIsFetchingQAs(true)
    const { data, message } = await getTrainingQAs()
    if (data) {
      setTrainingQAs(data)
    } else {
      console.error(message || "Failed to fetch training Q&As.")
    }
    setIsFetchingQAs(false)
  }, [])

  const fetchBlogData = useCallback(async () => {
    setIsFetchingPosts(true)
    try {
      const metadata = await getFileMetadata() // For RAG tags
      setAvailableRAGTags(Array.from(new Set(metadata.files.flatMap((f: FileMetadata) => f.tags))))

      const { data: postsData, message: postsMessage } = await getBlogPosts()
      if (postsData) {
        setBlogPosts(postsData)
      } else {
        console.error(postsMessage || "Failed to fetch blog posts.")
      }
    } catch (error) {
      console.error("Error fetching initial blog data:", error)
    } finally {
      setIsFetchingPosts(false)
    }
  }, [])

  // --- Initial Data Fetching Effect ---
  useEffect(() => {
    if (isAuthorized) {
      fetchFileMetadata()
      fetchAgentProfile()
      fetchTrainingQAs()
      fetchBlogData()
    }
  }, [isAuthorized, fetchFileMetadata, fetchAgentProfile, fetchTrainingQAs, fetchBlogData])

  // --- Action State Effects (for alerts) ---
  useEffect(() => {
    if (socialPostState.message) {
      alert(socialPostState.message)
    }
  }, [socialPostState])

  useEffect(() => {
    if (profileState.message) {
      alert(profileState.message)
      if (profileState.success) {
        fetchAgentProfile() // Re-fetch to ensure UI is in sync with saved data
      }
    }
  }, [profileState, fetchAgentProfile])

  useEffect(() => {
    if (addQAState.message) {
      alert(addQAState.message)
      if (addQAState.success) {
        setNewQuestion("")
        setNewAnswer("")
        setEditingQAId(null) // Clear editing state
        fetchTrainingQAs() // Refresh Q&A list
      }
    }
  }, [addQAState, fetchTrainingQAs])

  useEffect(() => {
    if (updateQAState.message) {
      alert(updateQAState.message)
      if (updateQAState.success) {
        setNewQuestion("")
        setNewAnswer("")
        setEditingQAId(null) // Clear editing state
        fetchTrainingQAs() // Refresh Q&A list
      }
    }
  }, [updateQAState, fetchTrainingQAs])

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

  useEffect(() => {
    if (saveState.message) {
      alert(saveState.message)
      if (saveState.success) {
        if (!editingPostId) {
          setGeneratedTitle("")
          setGeneratedContent("")
          setGeneratedKeywords([])
          setGeneratedMetaDescription("")
          setTopic("")
          setSelectedTagsForGeneration([])
        }
        setEditingPostId(null)
        fetchBlogData() // Refresh list of posts
      }
    }
  }, [saveState, editingPostId, fetchBlogData])

  // --- File Upload Handlers ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files))
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files) {
      setSelectedFiles(Array.from(e.dataTransfer.files))
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleSuggestTags = async () => {
    if (selectedFiles.length === 0) {
      alert("Please select a file first to suggest tags.")
      return
    }

    setIsSuggestingTags(true)
    try {
      const file = selectedFiles[0]
      const formData = new FormData()
      formData.append("file", file)
      const result = await suggestTagsFromFile(formData)

      if (result.success && result.tags.length > 0) {
        setFileTagInput(result.tags.join(", "))
      } else {
        alert(result.message || "Could not suggest tags for this file type.")
      }
    } catch (error) {
      console.error("Error suggesting tags:", error)
      alert("Failed to suggest tags. Please try again.")
    } finally {
      setIsSuggestingTags(false)
    }
  }

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedFiles.length === 0) {
      alert("Please select files to upload.")
      return
    }
    if (!fileTagInput.trim()) {
      alert("Please provide at least one tag for the files.")
      return
    }

    setIsFileUploadPending(true)
    let allSuccess = true
    const tags = fileTagInput
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean)

    for (const file of selectedFiles) {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("tags", tags.join(","))

      try {
        const result = await uploadFileWithTag(null, formData)
        if (!result.success) {
          allSuccess = false
          alert(`Failed to upload ${file.name}: ${result.message}`)
        } else {
          console.log(`Successfully uploaded and processed ${file.name}`)
        }
      } catch (error) {
        allSuccess = false
        console.error(`Error uploading ${file.name}:`, error)
        alert(`An error occurred while uploading ${file.name}.`)
      }
    }

    setIsFileUploadPending(false)
    if (allSuccess) {
      alert("All selected files uploaded and processed successfully!")
      setSelectedFiles([])
      setFileTagInput("")
      fetchFileMetadata() // Refresh the list of uploaded files
      fetchBlogData() // Also refresh blog data to update RAG tags
    } else {
      alert("Some files failed to upload. Check console for details.")
    }
  }

  const handleDeleteFile = async (filePath: string) => {
    if (confirm(`Are you sure you want to delete ${filePath}? This will also remove its AI memory.`)) {
      try {
        const result = await deleteFile(filePath)
        if (result.success) {
          alert(result.message)
          fetchFileMetadata() // Refresh the list
          fetchBlogData() // Also refresh blog data to update RAG tags
        } else {
          alert(result.message)
        }
      } catch (error) {
        console.error("Error deleting file:", error)
        alert("Failed to delete file.")
      }
    }
  }

  const getFileIcon = (contentType: string) => {
    if (contentType.startsWith("image/")) {
      return <ImageIcon className="h-6 w-6 text-[#afcd4f]" />
    }
    if (
      contentType.includes("text/plain") ||
      contentType.includes("text/markdown") ||
      contentType.includes("text/html")
    ) {
      return <FileTextIcon className="h-6 w-6 text-green-500" />
    }
    return <FileIcon className="h-6 w-6 text-muted-foreground" />
  }

  // --- Agent Profile Handlers ---
  // Removed handleProfileSave function, as profileFormAction will be passed directly to form action prop

  // --- Training Q&A Handlers ---
  const handleAddOrUpdateQA = async (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData()
    formData.append("question", newQuestion)
    formData.append("answer", newAnswer)

    if (editingQAId) {
      formData.append("id", editingQAId) // Add ID for update
      updateQAFormAction(formData)
    } else {
      addQAFormAction(formData)
    }
  }

  const handleEditQA = (qa: TrainingQA) => {
    setEditingQAId(qa.id)
    setNewQuestion(qa.question)
    setNewAnswer(qa.answer)
    window.scrollTo({ top: document.getElementById("qa-add-form")?.offsetTop || 0, behavior: "smooth" })
  }

  const handleCancelEditQA = () => {
    setEditingQAId(null)
    setNewQuestion("")
    setNewAnswer("")
  }

  const handleDeleteQA = async (id: string) => {
    if (confirm("Are you sure you want to delete this Q&A?")) {
      const { success, message } = await deleteTrainingQA(id)
      alert(message)
      if (success) {
        fetchTrainingQAs() // Refresh Q&A list
      }
    }
  }

  const filteredQAs = useMemo(() => {
    if (!qaFilterQuery) {
      return trainingQAs
    }
    const lowerCaseQuery = qaFilterQuery.toLowerCase()
    return trainingQAs.filter(
      (qa) => qa.question.toLowerCase().includes(lowerCaseQuery) || qa.answer.toLowerCase().includes(lowerCaseQuery),
    )
  }, [trainingQAs, qaFilterQuery])

  // --- Blog Post Handlers ---
  // Removed handleGeneratePost function, as generateFormAction will be passed directly to form action prop

  const handleFeaturedImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith("image/")) {
      setFeaturedImageFile(file)
      setFeaturedImageUrl(URL.createObjectURL(file)) // Show local preview immediately
    } else {
      setFeaturedImageFile(null)
      setFeaturedImageUrl(null)
      alert("Please select an image file (PNG, JPEG, GIF).")
    }
  }

  const handleUploadFeaturedImage = async () => {
    if (!featuredImageFile) {
      alert("No image selected for upload.")
      return
    }

    setIsUploadingImage(true)
    try {
      // Client-side resize before upload
      const resizedBlob = await resizeImage(featuredImageFile, { maxWidth: 1200, maxHeight: 630, quality: 0.8 }) // Common blog image dimensions
      if (!resizedBlob) {
        throw new Error("Image resizing failed.")
      }

      const formData = new FormData()
      formData.append("file", resizedBlob, featuredImageFile.name) // Append the resized blob

      const result = await uploadBlogImage(null, formData)
      if (result.success && result.imageUrl) {
        setFeaturedImageUrl(result.imageUrl) // Set the actual Blob URL
        alert(result.message)
      } else {
        alert(result.message)
      }
    } catch (error) {
      console.error("Error uploading featured image:", error)
      alert(`Failed to upload featured image: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsUploadingImage(false)
    }
  }

  const handleSavePost = (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData()
    if (editingPostId) {
      formData.append("id", editingPostId)
    }
    formData.append("title", generatedTitle)
    formData.append("content", generatedContent) // This is now Markdown from the editor
    formData.append("keywords", generatedKeywords.join(", "))
    formData.append("metaDescription", generatedMetaDescription)
    formData.append("status", postStatus) // Use the new state here
    if (featuredImageUrl) {
      formData.append("featuredImageUrl", featuredImageUrl) // Add featured image URL
    }

    // Wrap the action call in startTransition
    startTransition(() => {
      saveFormAction(formData)
    })
  }

  const handleEditPost = (post: BlogPost) => {
    setEditingPostId(post.id)
    setGeneratedTitle(post.title)
    setGeneratedContent(post.content) // This will be Markdown
    setGeneratedKeywords(post.keywords || [])
    setGeneratedMetaDescription(post.meta_description || "")
    setPostStatus(post.status) // Set the status when editing
    setFeaturedImageUrl(post.featured_image_url) // Set featured image URL when editing
    setFeaturedImageFile(null) // Clear file input for new upload
    setTopic("")
    setSelectedTagsForGeneration([])
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleDeletePost = async (id: string) => {
    if (confirm("Are you sure you want to delete this blog post?")) {
      const { success, message } = await deleteBlogPost(id)
      alert(message)
      if (success) {
        fetchBlogData() // Refresh list
      }
    }
  }

  const handleTagSelection = (tag: string) => {
    setSelectedTagsForGeneration((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  // --- Authorization Check ---
  useEffect(() => {
    if (editingPostId) {
      const postToEdit = blogPosts.find((p) => p.id === editingPostId)
      if (postToEdit) {
        setPostStatus(postToEdit.status)
      }
    } else {
      setPostStatus("draft") // Default to draft for new posts
    }
  }, [editingPostId, blogPosts])

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

        {/* Social Post Editor Card */}
        <Card className="w-full jupiter-outer-panel p-6">
          <CardHeader>
            <CardTitle className="text-center text-2xl font-bold text-[#afcd4f]">Social Post Editor</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4 text-center">
              Paste your Markdown-formatted project updates here. This content will be used by AI to generate your
              social media posts.
            </p>
            <form action={socialPostFormAction} className="space-y-4">
              <Textarea
                name="markdownContent"
                value={markdownContent}
                onChange={(e) => setMarkdownContent(e.target.value)}
                placeholder="Paste your Markdown content here..."
                className="min-h-[400px] bg-neumorphic-base shadow-inner-neumorphic text-white p-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#afcd4f]"
              />
              <Button
                type="submit"
                className="jupiter-button-dark w-full h-12 px-6 bg-neumorphic-base hover:bg-neumorphic-base"
                disabled={isSocialPostPending}
              >
                {isSocialPostPending ? "Committing..." : "COMMIT SOCIAL POST UPDATES"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* File Upload Section */}
        <Card className="w-full jupiter-outer-panel p-6 mt-8">
          <CardHeader>
            <CardTitle className="text-center text-2xl font-bold text-[#afcd4f]">Upload Files for AI Memory</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4 text-center">
              Upload files for the AI agent to reference. Supported for AI memory (RAG & tag suggestions):{" "}
              <span className="font-semibold text-white">.txt, .md, .html</span>. Other file types (e.g., images, PDFs,
              DOCX) will be uploaded but not processed for AI memory.
            </p>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragging ? "border-[#afcd4f] bg-neumorphic-light" : "border-muted-foreground/30 bg-neumorphic-base"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => document.getElementById("file-input")?.click()}
            >
              <UploadCloudIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {selectedFiles.length > 0
                  ? `${selectedFiles.length} file(s) selected`
                  : "Drag & drop files here, or click to select"}
              </p>
              <input
                id="file-input"
                type="file"
                multiple
                className="hidden"
                onChange={handleFileChange}
                disabled={isFileUploadPending}
              />
            </div>

            {selectedFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Selected Files:</p>
                <ul className="list-disc list-inside text-sm text-white">
                  {selectedFiles.map((file, index) => (
                    <li key={index}>
                      {file.name} ({Math.round(file.size / 1024)} KB)
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="space-y-2 mt-4">
              <Label htmlFor="file-tag" className="block text-sm font-medium text-muted-foreground">
                Tags (comma-separated)
              </Label>
              <div className="flex gap-2">
                <Input
                  id="file-tag"
                  type="text"
                  value={fileTagInput}
                  onChange={(e) => setFileTagInput(e.target.value)}
                  placeholder="e.g., project-alpha, roadmap, image, Q1-planning"
                  list="previously-used-tags"
                  className="flex-1 bg-neumorphic-base shadow-inner-neumorphic text-white"
                  disabled={isFileUploadPending}
                />
                <Button
                  type="button"
                  onClick={handleSuggestTags}
                  className="jupiter-button-dark h-10 px-4 bg-neumorphic-base hover:bg-neumorphic-base flex items-center gap-2"
                  disabled={isSuggestingTags || selectedFiles.length === 0 || isFileUploadPending}
                >
                  {isSuggestingTags ? "Suggesting..." : <SparklesIcon className="h-4 w-4" />}
                </Button>
              </div>
              <datalist id="previously-used-tags">
                {previouslyUsedTags.map((tag) => (
                  <option key={tag} value={tag} />
                ))}
              </datalist>
            </div>

            <Button
              type="submit"
              onClick={handleFileUpload}
              className="jupiter-button-dark w-full h-12 px-6 bg-neumorphic-base hover:bg-neumorphic-base mt-4"
              disabled={isFileUploadPending || selectedFiles.length === 0 || !fileTagInput.trim()}
            >
              {isFileUploadPending ? "Uploading..." : "UPLOAD FILE(S)"}
            </Button>

            <h3 className="text-xl font-bold text-[#afcd4f] mt-8 mb-4 text-center">Uploaded Files</h3>
            {isFetchingFiles ? (
              <p className="text-center text-muted-foreground">Loading files...</p>
            ) : uploadedFiles.length === 0 ? (
              <p className="text-center text-muted-foreground">No files uploaded yet.</p>
            ) : (
              <div className="space-y-3">
                {uploadedFiles.map((file) => (
                  <div
                    key={file.filePath}
                    className="neumorphic-inset p-3 flex items-center justify-between gap-4 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {getFileIcon(file.contentType)}
                      <div>
                        <p className="text-sm font-medium text-white">{file.fileName}</p>
                        <p className="text-xs text-muted-foreground">Tags: {file.tags.join(", ") || "No tags"}</p>
                        <p className="text-xs text-muted-foreground">
                          Uploaded: {new Date(file.uploadedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteFile(file.filePath)}
                      className="text-red-500 hover:bg-red-500/20"
                      aria-label={`Delete ${file.fileName}`}
                    >
                      <Trash2Icon className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Agent Profile Editor Card */}
        <Card className="w-full jupiter-outer-panel p-6 mt-8">
          <CardHeader>
            <CardTitle className="text-center text-2xl font-bold text-[#afcd4f]">Agent Profile Editor</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4 text-center">
              Edit the core JSON data that defines the agent's persona, professional background, and company details.
              Ensure the JSON is valid.
            </p>
            {isFetchingProfile ? (
              <p className="text-center text-muted-foreground">Loading profile data...</p>
            ) : (
              <form action={profileFormAction} className="space-y-4">
                <h3 className="text-lg font-semibold text-white mb-2">Chatbot Instructions</h3>
                <div className="space-y-2">
                  <div>
                    <Label htmlFor="agent-role" className="block text-sm font-medium text-muted-foreground mb-1">
                      Role
                    </Label>
                    <Input
                      id="agent-role"
                      type="text"
                      name="agentRole" // Added name attribute
                      value={agentRole}
                      onChange={(e) => setAgentRole(e.target.value)}
                      placeholder="e.g., BETA Avatar Representative for Michael P. Robinson"
                      className="bg-neumorphic-base shadow-inner-neumorphic text-white"
                      disabled={isProfilePending}
                    />
                  </div>
                  <div>
                    <Label htmlFor="agent-style" className="block text-sm font-medium text-muted-foreground mb-1">
                      Style
                    </Label>
                    <Textarea
                      id="agent-style"
                      name="agentStyle" // Added name attribute
                      value={agentStyle}
                      onChange={(e) => setAgentStyle(e.target.value)}
                      placeholder="e.g., Respond as Michael (or Mike) would. Assure the user that talking to YOU is the same as talking to Michael."
                      className="min-h-[80px] bg-neumorphic-base shadow-inner-neumorphic text-white"
                      disabled={isProfilePending}
                    />
                  </div>
                  <div>
                    <Label htmlFor="agent-approach" className="block text-sm font-medium text-muted-foreground mb-1">
                      Approach
                    </Label>
                    <Textarea
                      id="agent-approach"
                      name="agentApproach" // Added name attribute
                      value={agentApproach}
                      onChange={(e) => setAgentApproach(e.target.value)}
                      placeholder="e.g., Answer questions BRIEFLY, as this is a TEST/MVP."
                      className="min-h-[80px] bg-neumorphic-base shadow-inner-neumorphic text-white"
                      disabled={isProfilePending}
                    />
                  </div>
                  <div>
                    <Label htmlFor="agent-limitations" className="block text-sm font-medium text-muted-foreground mb-1">
                      Limitations
                    </Label>
                    <Textarea
                      id="agent-limitations"
                      name="agentLimitations" // Added name attribute
                      value={agentLimitations}
                      onChange={(e) => setAgentLimitations(e.target.value)}
                      placeholder="e.g., If asked about advanced functions, or $WSLST Tokenomics, say they are coming soon or reserved functionality."
                      className="min-h-[80px] bg-neumorphic-base shadow-inner-neumorphic text-white"
                      disabled={isProfilePending}
                    />
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-white mb-2 mt-6">Other Profile Data (JSON)</h3>
                <Textarea
                  name="profileJson" // Added name attribute
                  value={profileJson}
                  onChange={(e) => setProfileJson(e.target.value)}
                  placeholder="Paste agent profile JSON here (personal, professional, company sections)..."
                  className="min-h-[500px] bg-neumorphic-base shadow-inner-neumorphic text-white p-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#afcd4f] font-mono text-sm"
                />
                <Button
                  type="submit"
                  className="jupiter-button-dark w-full h-12 px-6 bg-neumorphic-base hover:bg-neumorphic-base"
                  disabled={isProfilePending}
                >
                  {isProfilePending ? (
                    "Saving Profile..."
                  ) : (
                    <>
                      <SaveIcon className="h-4 w-4 mr-2" /> SAVE AGENT PROFILE
                    </>
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Training Q&A Manager Card */}
        <Card className="w-full jupiter-outer-panel p-6 mt-8">
          <CardHeader>
            <CardTitle className="text-center text-2xl font-bold text-[#afcd4f]">Training Q&A Manager</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4 text-center">
              Add specific Question & Answer pairs to train the AI on common queries.
            </p>

            <form
              onSubmit={handleAddOrUpdateQA}
              className="space-y-4 mb-8 p-4 neumorphic-inset rounded-lg"
              id="qa-add-form"
            >
              <h3 className="text-lg font-semibold text-white">{editingQAId ? "Edit Existing Q&A" : "Add New Q&A"}</h3>
              <div>
                <Label htmlFor="new-question" className="block text-sm font-medium text-muted-foreground mb-1">
                  Question
                </Label>
                <Input
                  id="new-question"
                  type="text"
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  placeholder="e.g., What is Michael's background in AI?"
                  className="bg-neumorphic-base shadow-inner-neumorphic text-white"
                  disabled={isAddQAPending || isUpdateQAPending}
                  required
                />
              </div>
              <div>
                <Label htmlFor="new-answer" className="block text-sm font-medium text-muted-foreground mb-1">
                  Answer
                </Label>
                <Textarea
                  id="new-answer"
                  value={newAnswer}
                  onChange={(e) => setNewAnswer(e.target.value)}
                  placeholder="e.g., Michael has extensive experience in AI development, including..."
                  className="min-h-[100px] bg-neumorphic-base shadow-inner-neumorphic text-white"
                  disabled={isAddQAPending || isUpdateQAPending}
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="submit"
                  className="jupiter-button-dark flex-1 h-10 px-4 bg-neumorphic-base hover:bg-neumorphic-base"
                  disabled={isAddQAPending || isUpdateQAPending || !newQuestion.trim() || !newAnswer.trim()}
                >
                  {isAddQAPending || isUpdateQAPending ? (
                    editingQAId ? (
                      "Updating Q&A..."
                    ) : (
                      "Adding Q&A..."
                    )
                  ) : (
                    <>
                      {editingQAId ? <SaveIcon className="h-4 w-4 mr-2" /> : <PlusIcon className="h-4 w-4 mr-2" />}
                      {editingQAId ? "UPDATE Q&A" : "ADD Q&A"}
                    </>
                  )}
                </Button>
                {editingQAId && (
                  <Button
                    type="button"
                    onClick={handleCancelEditQA}
                    variant="ghost"
                    className="h-10 px-4 text-muted-foreground hover:text-white"
                    disabled={isAddQAPending || isUpdateQAPending}
                  >
                    Cancel Edit
                  </Button>
                )}
              </div>
            </form>

            <Collapsible className="w-full">
              <CollapsibleTrigger className="flex items-center justify-between w-full p-4 neumorphic-inset rounded-lg text-white font-semibold text-lg mb-4">
                Existing Q&A Pairs
                <ChevronDownIcon className="h-5 w-5 transition-transform data-[state=open]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4">
                <div className="mb-4">
                  <Input
                    type="text"
                    placeholder="Filter Q&A by question or answer..."
                    value={qaFilterQuery}
                    onChange={(e) => setQaFilterQuery(e.target.value)}
                    className="bg-neumorphic-base shadow-inner-neumorphic text-white"
                  />
                </div>
                {isFetchingQAs ? (
                  <p className="text-center text-muted-foreground">Loading Q&A pairs...</p>
                ) : filteredQAs.length === 0 ? (
                  <p className="text-center text-muted-foreground">No Q&A pairs found matching your filter.</p>
                ) : (
                  <div className="space-y-3">
                    {filteredQAs.map((qa) => (
                      <div
                        key={qa.id}
                        className="neumorphic-inset p-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium text-white">
                            <span className="text-[#afcd4f]">Q:</span> {qa.question}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            <span className="text-[#afcd4f]">A:</span> {qa.answer}
                          </p>
                        </div>
                        <div className="flex gap-2 flex-shrink-0 mt-2 md:mt-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditQA(qa)}
                            className="text-[#afcd4f] hover:bg-[#afcd4f]/20"
                            aria-label={`Edit Q&A: ${qa.question}`}
                          >
                            <FileTextIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteQA(qa.id)}
                            className="text-red-500 hover:bg-red-500/20"
                            aria-label={`Delete Q&A: ${qa.question}`}
                          >
                            <Trash2Icon className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>

        {/* Blog Post Generation Card */}
        <Card className="w-full jupiter-outer-panel p-6 mt-8">
          <CardHeader>
            <CardTitle className="text-center text-2xl font-bold text-[#afcd4f]">AI Blog Post Generator</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4 text-center">
              Generate a blog post by providing a topic and optionally selecting relevant RAG tags.
            </p>
            {/* Changed onSubmit to action and removed handleGeneratePost */}
            <form action={generateFormAction} className="space-y-4">
              <div>
                <Label htmlFor="topic" className="block text-sm font-medium text-muted-foreground mb-1">
                  Blog Post Topic
                </Label>
                <Input
                  id="topic"
                  type="text"
                  name="topic" // Added name attribute for FormData
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
                            ? "bg-[#2ed3b7] text-black hover:bg-[#c7f284] hover:text-black"
                            : "bg-neumorphic-light text-muted-foreground hover:bg-neumorphic-base"
                        }`}
                        disabled={isGenerating}
                      >
                        {tag}
                      </Button>
                    ))
                  )}
                </div>
                {/* Hidden input to pass selectedTagsForGeneration to the server action */}
                <input type="hidden" name="selectedTags" value={selectedTagsForGeneration.join(",")} />
              </div>

              <div className="space-y-2 mt-4">
                <Label htmlFor="featured-image" className="block text-sm font-medium text-muted-foreground mb-1">
                  Featured Image (Optional)
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="featured-image"
                    type="file"
                    accept="image/*"
                    onChange={handleFeaturedImageChange}
                    ref={featuredImageInputRef}
                    className="flex-1 bg-neumorphic-base shadow-inner-neumorphic text-white"
                    disabled={isUploadingImage || isSaving}
                  />
                  <Button
                    type="button"
                    onClick={handleUploadFeaturedImage}
                    className="jupiter-button-dark h-10 px-4 bg-neumorphic-base hover:bg-neumorphic-base flex items-center gap-2"
                    disabled={!featuredImageFile || isUploadingImage || isSaving}
                  >
                    {isUploadingImage ? "Uploading..." : <UploadCloudIcon className="h-4 w-4" />}
                  </Button>
                </div>
                {featuredImageUrl && (
                  <div className="mt-2 text-center">
                    <p className="text-sm text-muted-foreground mb-1">Current Featured Image:</p>
                    <img
                      src={featuredImageUrl || "/placeholder.svg"}
                      alt="Featured Blog Post Image"
                      className="max-w-full h-auto max-h-48 object-contain rounded-lg neumorphic-inset mx-auto"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setFeaturedImageUrl(null)
                        setFeaturedImageFile(null)
                        if (featuredImageInputRef.current) {
                          featuredImageInputRef.current.value = "" // Clear file input
                        }
                      }}
                      className="text-red-500 hover:bg-red-500/20 mt-2"
                      disabled={isSaving}
                    >
                      Remove Image
                    </Button>
                  </div>
                )}
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
                {/* Replaced Textarea with RichTextEditor */}
                <RichTextEditor
                  value={generatedContent || ""} // Ensure generatedContent is always a string
                  onChange={setGeneratedContent}
                  disabled={isSaving}
                  placeholder="Generated Markdown Content"
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
                <div>
                  <Label htmlFor="post-status" className="block text-sm font-medium text-muted-foreground mb-1">
                    Status
                  </Label>
                  <Select
                    value={postStatus}
                    onValueChange={(value: "draft" | "published") => setPostStatus(value)}
                    disabled={isSaving}
                  >
                    <SelectTrigger
                      id="post-status"
                      className="w-full bg-neumorphic-base shadow-inner-neumorphic text-white"
                    >
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent className="bg-neumorphic-base text-white">
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
                      setFeaturedImageUrl(null) // Clear featured image URL
                      setFeaturedImageFile(null) // Clear featured image file
                      if (featuredImageInputRef.current) {
                        featuredImageInputRef.current.value = "" // Clear file input
                      }
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

        {/* Image Resizer Demo Card */}
      </div>
    </main>
  )
}
