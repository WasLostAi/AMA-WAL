"use client"

import type React from "react"
import { useState, useEffect, useMemo, useCallback, useRef, startTransition } from "react"
import { useActionState } from "react"
import { useRouter } from "next/navigation"
import { useWallet } from "@solana/wallet-adapter-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  XIcon,
  SparklesIcon,
  SaveIcon,
  Trash2Icon,
  FileTextIcon,
  PlusIcon,
  UploadCloudIcon,
  ImageIcon,
  FileIcon,
  ChevronDownIcon,
  Share2Icon,
  CopyIcon,
  PencilIcon,
} from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import Image from "next/image"
import RichTextEditor from "@/components/rich-text-editor" // Import RichTextEditor

// Import all necessary server actions
import { saveSocialPostsMarkdown } from "./content-manager/social-post-actions"
import { uploadFileWithTag, getFileMetadata, deleteFile } from "./content-manager/file-upload-actions"
import { suggestTagsFromFile } from "./content-manager/ai-tagging-action"
import {
  getAgentProfileData,
  updateAgentProfileData,
  uploadAgentAvatar,
  getTrainingQAs,
  addTrainingQA,
  updateTrainingQA,
  deleteTrainingQA,
} from "./agent-manager/agent-actions"
import { generateAndSyndicateContent, getSyndicationLogs } from "./content-manager/syndication-actions"
import { generateBlogPost, saveBlogPost, getBlogPosts, deleteBlogPost } from "./blog-manager/blog-actions" // Blog actions
import { uploadBlogImage } from "./blog-manager/blog-image-actions" // Blog image upload
import { initialProjectUpdatesMarkdown } from "@/lib/current-projects"

interface FileMetadata {
  fileName: string
  filePath: string
  tags: string[]
  contentType: string
  uploadedAt: string
}

interface AgentProfileData {
  personal: {
    name: string
    nickname: string
    age: number
    location: string
    background: string
    education: string
    mission: string
    contact: {
      email: string
      phone: string
    }
    personalStatement: string
    avatarUrl?: string
  }
  professional: any
  company: {
    name: string
    product: string
    description: string
    projects: any[]
    tokenomics: string
    config_data?: {
      content_guidelines?: {
        brand_voice: string
        tone: string
        keywords_focus: string[]
        audience: string
      }
      syndication_schedule?: {
        default_interval_hours: number
        platform_specific: { [key: string]: any }
      }
    }
  }
  chatbotInstructions: {
    role: string
    style: string
    approach: string
    limitations: string
    initialGreeting?: string
  }
}

interface TrainingQA {
  id: string
  question: string
  answer: string
}

interface GeneratedPost {
  id: string
  title?: string
  content: string
  platform: string
  content_type: string
  status: string
  generated_at: string
  syndicated_at?: string
  metadata?: {
    character_count?: number
    word_count?: number
  }
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
  featured_image_url: string | null
}

export default function AdminPage() {
  const router = useRouter()
  const { publicKey, connected, disconnect } = useWallet()

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
  const [profileJson, setProfileJson] = useState<string>("") // For personal, professional, company (excluding chatbotInstructions and avatarUrl)
  const [agentRole, setAgentRole] = useState("")
  const [agentStyle, setAgentStyle] = useState("")
  const [agentApproach, setAgentApproach] = useState("")
  const [agentLimitations, setAgentLimitations] = useState("")
  const [initialGreeting, setInitialGreeting] = useState("") // New state for agent intro
  const [agentAvatarFile, setAgentAvatarFile] = useState<File | null>(null) // New state for avatar file
  const [agentAvatarPreviewUrl, setAgentAvatarPreviewUrl] = useState<string | null>(null) // New state for avatar preview
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false) // New state for avatar upload pending
  const agentAvatarInputRef = useRef<HTMLInputElement>(null) // Ref for avatar file input

  // New states for config_data
  const [brandVoice, setBrandVoice] = useState("")
  const [tone, setTone] = useState("")
  const [keywordsFocus, setKeywordsFocus] = useState("") // Comma-separated string
  const [audience, setAudience] = useState("")
  const [defaultIntervalHours, setDefaultIntervalHours] = useState<number | string>("")
  const [platformSpecificSchedule, setPlatformSpecificSchedule] = useState<string>("") // JSON string

  const [profileState, profileFormAction, isProfilePending] = useActionState(updateAgentProfileData, {
    success: false,
    message: "",
  })
  const [isFetchingProfile, setIsFetchingProfile] = useState(true)

  // --- Training Q&A Manager State ---
  const [trainingQAs, setTrainingQAs] = useState<TrainingQA[]>([])
  const [newQuestion, setNewQuestion] = useState("")
  const [newAnswer, setNewAnswer] = useState("")
  const [editingQAId, setEditingQAId] = useState<string | null>(null)
  const [qaFilterQuery, setQaFilterQuery] = useState("")
  const [addQAState, addQAFormAction, isAddQAPending] = useActionState(addTrainingQA, {
    success: false,
    message: "",
  })
  const [updateQAState, updateQAFormAction, isUpdateQAPending] = useActionState(updateTrainingQA, {
    success: false,
    message: "",
  })
  const [isFetchingQAs, setIsFetchingQAs] = useState(true)

  // --- Content Generation & Syndication State ---
  const [generationTopic, setGenerationTopic] = useState("")
  const [generationPlatform, setGenerationPlatform] = useState("twitter")
  const [generationContentType, setGenerationContentType] = useState("tweet")
  const [generatedContentPreview, setGeneratedContentPreview] = useState<{ title?: string; content: string } | null>(
    null,
  )
  const [syndicationState, syndicateFormAction, isSyndicationPending] = useActionState(generateAndSyndicateContent, {
    success: false,
    message: "",
  })
  const [syndicationLogs, setSyndicationLogs] = useState<GeneratedPost[]>([])
  const [isFetchingSyndicationLogs, setIsFetchingSyndicationLogs] = useState(true)

  // --- Blog Post Generation & Manager State ---
  const [blogTopic, setBlogTopic] = useState("")
  const [generatedBlogTitle, setGeneratedBlogTitle] = useState("")
  const [generatedBlogContent, setGeneratedBlogContent] = useState("")
  const [generatedBlogKeywords, setGeneratedBlogKeywords] = useState("")
  const [generatedBlogMetaDescription, setGeneratedBlogMetaDescription] = useState("")
  const [blogPostStatus, setBlogPostStatus] = useState<"draft" | "published">("draft")
  const [featuredImageUrl, setFeaturedImageUrl] = useState<string | null>(null)
  const [blogImageFile, setBlogImageFile] = useState<File | null>(null)
  const [blogImagePreviewUrl, setBlogImagePreviewUrl] = useState<string | null>(null)
  const blogImageInputRef = useRef<HTMLInputElement>(null)

  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([])
  const [editingBlogPostId, setEditingBlogPostId] = useState<string | null>(null)
  const [isFetchingBlogPosts, setIsFetchingBlogPosts] = useState(true)

  const [generateBlogState, generateBlogFormAction, isGenerateBlogPending] = useActionState(generateBlogPost, {
    success: false,
    message: "",
  })
  const [saveBlogState, saveBlogFormAction, isSaveBlogPending] = useActionState(saveBlogPost, {
    success: false,
    message: "",
  })
  const [uploadBlogImageState, uploadBlogImageFormAction, isUploadBlogImagePending] = useActionState(uploadBlogImage, {
    success: false,
    message: "",
  })

  // --- Authorization Effect ---
  useEffect(() => {
    if (!connected || !isAuthorized) {
      router.push("/")
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
      const { chatbotInstructions, personal, company, ...restOfProfile } = data
      setAgentRole(chatbotInstructions?.role || "")
      setAgentStyle(chatbotInstructions?.style || "")
      setAgentApproach(chatbotInstructions?.approach || "")
      setAgentLimitations(chatbotInstructions?.limitations || "")
      setInitialGreeting(chatbotInstructions?.initialGreeting || "") // Set initial greeting
      setAgentAvatarPreviewUrl(personal?.avatarUrl || null) // Set avatar URL

      // Set config_data states
      setBrandVoice(company?.config_data?.content_guidelines?.brand_voice || "")
      setTone(company?.config_data?.content_guidelines?.tone || "")
      setKeywordsFocus(company?.config_data?.content_guidelines?.keywords_focus?.join(", ") || "")
      setAudience(company?.config_data?.content_guidelines?.audience || "")
      setDefaultIntervalHours(company?.config_data?.syndication_schedule?.default_interval_hours || "")
      setPlatformSpecificSchedule(
        JSON.stringify(company?.config_data?.syndication_schedule?.platform_specific || {}, null, 2),
      )

      // Set the rest of the profile JSON to the textarea, ensuring it's an object
      setProfileJson(
        JSON.stringify(
          { personal, professional: restOfProfile.professional, company: { ...company, config_data: undefined } },
          null,
          2,
        ),
      )
    } else {
      console.error(message || "Failed to fetch agent profile.")
      setProfileJson("{}")
      setAgentRole("")
      setAgentStyle("")
      setAgentApproach("")
      setAgentLimitations("")
      setInitialGreeting("")
      setAgentAvatarPreviewUrl(null)
      setBrandVoice("")
      setTone("")
      setKeywordsFocus("")
      setAudience("")
      setDefaultIntervalHours("")
      setPlatformSpecificSchedule("{}")
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

  const fetchSyndicationLogs = useCallback(async () => {
    setIsFetchingSyndicationLogs(true)
    try {
      const { data, message } = await getSyndicationLogs()
      if (data) {
        setSyndicationLogs(data)
      } else {
        console.error(message || "Failed to fetch syndication logs.")
      }
    } catch (error) {
      console.error("Error fetching syndication logs:", error)
    } finally {
      setIsFetchingSyndicationLogs(false)
    }
  }, [])

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

  // --- Initial Data Fetching Effect ---
  useEffect(() => {
    if (isAuthorized) {
      fetchFileMetadata()
      fetchAgentProfile()
      fetchTrainingQAs()
      fetchSyndicationLogs()
      fetchBlogPosts() // Fetch blog posts on load
    }
  }, [isAuthorized, fetchFileMetadata, fetchAgentProfile, fetchTrainingQAs, fetchSyndicationLogs, fetchBlogPosts])

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
        setEditingQAId(null)
        fetchTrainingQAs()
      }
    }
  }, [addQAState, fetchTrainingQAs])

  useEffect(() => {
    if (updateQAState.message) {
      alert(updateQAState.message)
      if (updateQAState.success) {
        setNewQuestion("")
        setNewAnswer("")
        setEditingQAId(null)
        fetchTrainingQAs()
      }
    }
  }, [updateQAState, fetchTrainingQAs])

  useEffect(() => {
    if (syndicationState.message) {
      alert(syndicationState.message)
      if (syndicationState.success) {
        setGeneratedContentPreview(syndicationState.generatedPost || null)
        fetchSyndicationLogs() // Re-fetch logs to show new entry
      }
    }
  }, [syndicationState, fetchSyndicationLogs])

  useEffect(() => {
    if (generateBlogState.message) {
      alert(generateBlogState.message)
      if (generateBlogState.success) {
        setGeneratedBlogTitle(generateBlogState.generatedTitle || "")
        setGeneratedBlogContent(generateBlogState.generatedContent || "")
        setGeneratedBlogKeywords(generateBlogState.generatedKeywords?.join(", ") || "")
        setGeneratedBlogMetaDescription(generateBlogState.generatedMetaDescription || "")
      }
    }
  }, [generateBlogState])

  useEffect(() => {
    if (saveBlogState.message) {
      alert(saveBlogState.message)
      if (saveBlogState.success) {
        setEditingBlogPostId(null)
        setGeneratedBlogTitle("")
        setGeneratedBlogContent("")
        setGeneratedBlogKeywords("")
        setGeneratedBlogMetaDescription("")
        setBlogPostStatus("draft")
        setFeaturedImageUrl(null)
        setBlogImageFile(null)
        setBlogImagePreviewUrl(null)
        fetchBlogPosts()
      }
    }
  }, [saveBlogState, fetchBlogPosts])

  useEffect(() => {
    if (uploadBlogImageState.message) {
      alert(uploadBlogImageState.message)
      if (uploadBlogImageState.success && uploadBlogImageState.imageUrl) {
        setFeaturedImageUrl(uploadBlogImageState.imageUrl)
        setBlogImagePreviewUrl(uploadBlogImageState.imageUrl)
      }
    }
  }, [uploadBlogImageState])

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
      fetchFileMetadata()
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
          fetchFileMetadata()
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
  const handleAgentProfileSave = (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget as HTMLFormElement)
    formData.append("initialGreeting", initialGreeting)
    formData.append("avatarUrl", agentAvatarPreviewUrl || "")

    // Construct config_data JSON
    const configData = {
      company: {
        config_data: {
          content_guidelines: {
            brand_voice: brandVoice,
            tone: tone,
            keywords_focus: keywordsFocus
              .split(",")
              .map((k) => k.trim())
              .filter(Boolean),
            audience: audience,
          },
          syndication_schedule: {
            default_interval_hours: Number(defaultIntervalHours),
            platform_specific: JSON.parse(platformSpecificSchedule || "{}"),
          },
        },
      },
    }
    formData.append("configDataJson", JSON.stringify(configData))

    startTransition(() => {
      profileFormAction(formData)
    })
  }

  const handleAgentAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith("image/")) {
      setAgentAvatarFile(file)
      setAgentAvatarPreviewUrl(URL.createObjectURL(file)) // Show local preview immediately
    } else {
      setAgentAvatarFile(null)
      setAgentAvatarPreviewUrl(null)
      alert("Please select an image file (PNG, JPEG, GIF) for the avatar.")
    }
  }

  const handleUploadAgentAvatar = async () => {
    if (!agentAvatarFile) {
      alert("No avatar image selected for upload.")
      return
    }

    setIsUploadingAvatar(true)
    try {
      const formData = new FormData()
      formData.append("file", agentAvatarFile)

      const result = await uploadAgentAvatar(null, formData)
      if (result.success && result.imageUrl) {
        setAgentAvatarPreviewUrl(result.imageUrl) // Set the actual Blob URL
        alert(result.message)
      } else {
        alert(result.message)
      }
    } catch (error) {
      console.error("Error uploading agent avatar:", error)
      alert(`Failed to upload avatar: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  // --- Training Q&A Handlers ---
  const handleAddOrUpdateQA = async (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData()
    formData.append("question", newQuestion)
    formData.append("answer", newAnswer)

    if (editingQAId) {
      formData.append("id", editingQAId)
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
        fetchTrainingQAs()
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

  // --- Content Generation & Syndication Handlers ---
  const handleGenerateContent = (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData()
    formData.append("topic", generationTopic)
    formData.append("platform", generationPlatform)
    formData.append("contentType", generationContentType)
    startTransition(() => {
      syndicateFormAction(formData)
    })
  }

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert("Content copied to clipboard!")
  }

  // --- Blog Post Generation & Manager Handlers ---
  const handleGenerateBlog = (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData()
    formData.append("topic", blogTopic)
    startTransition(() => {
      generateBlogFormAction(formData)
    })
  }

  const handleSaveBlog = (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData()
    if (editingBlogPostId) {
      formData.append("id", editingBlogPostId)
    }
    formData.append("title", generatedBlogTitle)
    formData.append("content", generatedBlogContent)
    formData.append("keywords", generatedBlogKeywords)
    formData.append("metaDescription", generatedBlogMetaDescription)
    formData.append("status", blogPostStatus)
    formData.append("featuredImageUrl", featuredImageUrl || "")

    startTransition(() => {
      saveBlogFormAction(formData)
    })
  }

  const handleBlogImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith("image/")) {
      setBlogImageFile(file)
      setBlogImagePreviewUrl(URL.createObjectURL(file)) // Show local preview immediately
    } else {
      setBlogImageFile(null)
      setBlogImagePreviewUrl(null)
      alert("Please select an image file (PNG, JPEG, GIF) for the featured image.")
    }
  }

  const handleUploadBlogImage = async () => {
    if (!blogImageFile) {
      alert("No image selected for upload.")
      return
    }

    startTransition(async () => {
      const formData = new FormData()
      formData.append("file", blogImageFile)
      await uploadBlogImageFormAction(formData)
    })
  }

  const handleEditBlog = (post: BlogPost) => {
    setEditingBlogPostId(post.id)
    setGeneratedBlogTitle(post.title)
    setGeneratedBlogContent(post.content)
    setGeneratedBlogKeywords(post.keywords?.join(", ") || "")
    setGeneratedBlogMetaDescription(post.meta_description || "")
    setBlogPostStatus(post.status)
    setFeaturedImageUrl(post.featured_image_url || null)
    setBlogImagePreviewUrl(post.featured_image_url || null)
    window.scrollTo({ top: document.getElementById("blog-generation-section")?.offsetTop || 0, behavior: "smooth" })
  }

  const handleCancelEditBlog = () => {
    setEditingBlogPostId(null)
    setGeneratedBlogTitle("")
    setGeneratedBlogContent("")
    setGeneratedBlogKeywords("")
    setGeneratedBlogMetaDescription("")
    setBlogPostStatus("draft")
    setFeaturedImageUrl(null)
    setBlogImageFile(null)
    setBlogImagePreviewUrl(null)
  }

  const handleDeleteBlog = async (id: string) => {
    if (confirm("Are you sure you want to delete this blog post?")) {
      const { success, message } = await deleteBlogPost(id)
      alert(message)
      if (success) {
        fetchBlogPosts()
      }
    }
  }

  const blogContentWordCount = useMemo(() => {
    return generatedBlogContent.split(/\s+/).filter(Boolean).length
  }, [generatedBlogContent])

  const blogMetaDescriptionCharCount = useMemo(() => {
    return generatedBlogMetaDescription.length
  }, [generatedBlogMetaDescription])

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
            onClick={() => {
              disconnect() // Disconnect the wallet
              router.push("/") // Then navigate to the home page
            }}
            className="jupiter-button-dark h-10 px-4 bg-neumorphic-base hover:bg-neumorphic-base flex items-center gap-2"
          >
            <XIcon className="h-4 w-4" /> Close Editor
          </Button>
        </div>

        {/* AI Content Generation Section */}
        <Card className="w-full jupiter-outer-panel p-6">
          <CardHeader>
            <CardTitle className="text-center text-2xl font-bold text-[#afcd4f]">AI Content Generation</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4 text-center">
              Generate new content for various platforms using AI. The generated content will be saved and queued for
              "syndication".
            </p>
            <form onSubmit={handleGenerateContent} className="space-y-4">
              <div>
                <Label htmlFor="generation-topic" className="block text-sm font-medium text-muted-foreground mb-1">
                  Topic
                </Label>
                <Input
                  id="generation-topic"
                  type="text"
                  value={generationTopic}
                  onChange={(e) => setGenerationTopic(e.target.value)}
                  placeholder="e.g., Latest advancements in AI agents"
                  className="bg-neumorphic-base shadow-inner-neumorphic text-white"
                  disabled={isSyndicationPending}
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="generation-platform" className="block text-sm font-medium text-muted-foreground mb-1">
                    Platform
                  </Label>
                  <Select
                    value={generationPlatform}
                    onValueChange={setGenerationPlatform}
                    disabled={isSyndicationPending}
                  >
                    <SelectTrigger className="w-full bg-neumorphic-base shadow-inner-neumorphic text-white">
                      <SelectValue placeholder="Select Platform" />
                    </SelectTrigger>
                    <SelectContent className="bg-neumorphic-base text-white">
                      <SelectItem value="twitter">Twitter</SelectItem>
                      <SelectItem value="linkedin">LinkedIn</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="github">GitHub</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label
                    htmlFor="generation-content-type"
                    className="block text-sm font-medium text-muted-foreground mb-1"
                  >
                    Content Type
                  </Label>
                  <Select
                    value={generationContentType}
                    onValueChange={setGenerationContentType}
                    disabled={isSyndicationPending}
                  >
                    <SelectTrigger className="w-full bg-neumorphic-base shadow-inner-neumorphic text-white">
                      <SelectValue placeholder="Select Content Type" />
                    </SelectTrigger>
                    <SelectContent className="bg-neumorphic-base text-white">
                      <SelectItem value="tweet">Tweet</SelectItem>
                      <SelectItem value="linkedin-post">LinkedIn Post</SelectItem>
                      <SelectItem value="blog-excerpt">Blog Excerpt</SelectItem>
                      <SelectItem value="code-snippet">Code Snippet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                type="submit"
                className="jupiter-button-dark w-full h-12 px-6 bg-neumorphic-base hover:bg-neumorphic-base"
                disabled={isSyndicationPending || !generationTopic.trim()}
              >
                {isSyndicationPending ? (
                  "Generating..."
                ) : (
                  <>
                    <Share2Icon className="h-4 w-4 mr-2" /> GENERATE & QUEUE CONTENT
                  </>
                )}
              </Button>
            </form>

            {generatedContentPreview && (
              <div className="mt-6 p-4 neumorphic-inset rounded-lg relative">
                <h3 className="text-lg font-semibold text-[#afcd4f] mb-2">Generated Content Preview:</h3>
                {generatedContentPreview.title && (
                  <p className="text-sm font-medium text-white mb-1">Title: {generatedContentPreview.title}</p>
                )}
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{generatedContentPreview.content}</p>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleCopyToClipboard(generatedContentPreview.content)}
                  className="absolute top-2 right-2 text-muted-foreground hover:text-white"
                  aria-label="Copy to clipboard"
                >
                  <CopyIcon className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Syndication Monitor Section */}
        <Card className="w-full jupiter-outer-panel p-6 mt-8">
          <CardHeader>
            <CardTitle className="text-center text-2xl font-bold text-[#afcd4f]">Syndication Monitor</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4 text-center">
              View the history of AI-generated content and its syndication status.
            </p>
            {isFetchingSyndicationLogs ? (
              <p className="text-center text-muted-foreground">Loading syndication logs...</p>
            ) : syndicationLogs.length === 0 ? (
              <p className="text-center text-muted-foreground">No generated content logs yet.</p>
            ) : (
              <div className="space-y-3">
                {syndicationLogs.map((post) => (
                  <div
                    key={post.id}
                    className="neumorphic-inset p-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">
                        <span className="text-[#afcd4f]">Platform:</span> {post.platform} (
                        {post.content_type.replace("-", " ")})
                      </p>
                      {post.title && (
                        <p className="text-xs text-muted-foreground mt-1">
                          <span className="text-[#afcd4f]">Title:</span> {post.title}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        <span className="text-[#afcd4f]">Status:</span> {post.status}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        <span className="text-[#afcd4f]">Generated:</span>{" "}
                        {new Date(post.generated_at).toLocaleString()}
                      </p>
                      {post.syndicated_at && (
                        <p className="text-xs text-muted-foreground mt-1">
                          <span className="text-[#afcd4f]">Syndicated:</span>{" "}
                          {new Date(post.syndicated_at).toLocaleString()}
                        </p>
                      )}
                      {post.metadata?.word_count && (
                        <p className="text-xs text-muted-foreground mt-1">
                          <span className="text-[#afcd4f]">Words:</span> {post.metadata.word_count}
                        </p>
                      )}
                      {post.metadata?.character_count && (
                        <p className="text-xs text-muted-foreground mt-1">
                          <span className="text-[#afcd4f]">Chars:</span> {post.metadata.character_count}
                        </p>
                      )}
                      <Collapsible className="w-full mt-2">
                        <CollapsibleTrigger className="flex items-center gap-2 text-xs text-[#2ed3b7] hover:underline">
                          View Content{" "}
                          <ChevronDownIcon className="h-3 w-3 transition-transform data-[state=open]:rotate-180" />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-2 p-2 bg-neumorphic-base rounded-md text-xs text-white whitespace-pre-wrap">
                          {post.content}
                        </CollapsibleContent>
                      </Collapsible>
                    </div>
                    {/* Add actions like "Retry Syndication" or "Edit" here later */}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Blog Post Generation Section */}
        <Card className="w-full jupiter-outer-panel p-6 mt-8" id="blog-generation-section">
          <CardHeader>
            <CardTitle className="text-center text-2xl font-bold text-[#afcd4f]">AI Blog Post Generation</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4 text-center">
              Generate a full blog post using AI. You can then edit and save it.
            </p>
            <form onSubmit={handleGenerateBlog} className="space-y-4 mb-6">
              <div>
                <Label htmlFor="blog-topic" className="block text-sm font-medium text-muted-foreground mb-1">
                  Blog Topic
                </Label>
                <Input
                  id="blog-topic"
                  type="text"
                  value={blogTopic}
                  onChange={(e) => setBlogTopic(e.target.value)}
                  placeholder="e.g., The Future of Decentralized AI Agents"
                  className="bg-neumorphic-base shadow-inner-neumorphic text-white"
                  disabled={isGenerateBlogPending}
                  required
                />
              </div>
              <Button
                type="submit"
                className="jupiter-button-dark w-full h-12 px-6 bg-neumorphic-base hover:bg-neumorphic-base"
                disabled={isGenerateBlogPending || !blogTopic.trim()}
              >
                {isGenerateBlogPending ? (
                  "Generating Blog Post..."
                ) : (
                  <>
                    <SparklesIcon className="h-4 w-4 mr-2" /> GENERATE BLOG POST
                  </>
                )}
              </Button>
            </form>

            <form onSubmit={handleSaveBlog} className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-2">Edit & Save Blog Post</h3>
              <div>
                <Label htmlFor="blog-title" className="block text-sm font-medium text-muted-foreground mb-1">
                  Title
                </Label>
                <Input
                  id="blog-title"
                  type="text"
                  value={generatedBlogTitle}
                  onChange={(e) => setGeneratedBlogTitle(e.target.value)}
                  placeholder="Blog Post Title"
                  className="bg-neumorphic-base shadow-inner-neumorphic text-white"
                  disabled={isSaveBlogPending}
                  required
                />
              </div>
              <div>
                <Label htmlFor="blog-content" className="block text-sm font-medium text-muted-foreground mb-1">
                  Content (Markdown)
                </Label>
                <RichTextEditor
                  value={generatedBlogContent}
                  onChange={setGeneratedBlogContent}
                  disabled={isSaveBlogPending}
                  placeholder="Your blog post content goes here..."
                />
                <p className="text-xs text-muted-foreground mt-1 text-right">Word Count: {blogContentWordCount}</p>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleCopyToClipboard(generatedBlogContent)}
                  className="text-muted-foreground hover:text-white mt-2"
                  aria-label="Copy blog content to clipboard"
                >
                  <CopyIcon className="h-4 w-4 mr-2" /> Copy Content
                </Button>
              </div>
              <div>
                <Label htmlFor="blog-keywords" className="block text-sm font-medium text-muted-foreground mb-1">
                  Keywords (comma-separated)
                </Label>
                <Input
                  id="blog-keywords"
                  type="text"
                  value={generatedBlogKeywords}
                  onChange={(e) => setGeneratedBlogKeywords(e.target.value)}
                  placeholder="e.g., AI, Web3, Solana, Agents"
                  className="bg-neumorphic-base shadow-inner-neumorphic text-white"
                  disabled={isSaveBlogPending}
                />
              </div>
              <div>
                <Label htmlFor="blog-meta-description" className="block text-sm font-medium text-muted-foreground mb-1">
                  Meta Description (max 160 chars)
                </Label>
                <Textarea
                  id="blog-meta-description"
                  value={generatedBlogMetaDescription}
                  onChange={(e) => setGeneratedBlogMetaDescription(e.target.value)}
                  placeholder="A concise summary for search engines."
                  className="min-h-[80px] bg-neumorphic-base shadow-inner-neumorphic text-white"
                  disabled={isSaveBlogPending}
                  maxLength={160}
                />
                <p className="text-xs text-muted-foreground mt-1 text-right">
                  Characters: {blogMetaDescriptionCharCount}/160
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleCopyToClipboard(generatedBlogMetaDescription)}
                  className="text-muted-foreground hover:text-white mt-2"
                  aria-label="Copy meta description to clipboard"
                >
                  <CopyIcon className="h-4 w-4 mr-2" /> Copy Meta Description
                </Button>
              </div>
              <div>
                <Label htmlFor="blog-status" className="block text-sm font-medium text-muted-foreground mb-1">
                  Status
                </Label>
                <Select
                  value={blogPostStatus}
                  onValueChange={(value) => setBlogPostStatus(value as "draft" | "published")}
                  disabled={isSaveBlogPending}
                >
                  <SelectTrigger className="w-full bg-neumorphic-base shadow-inner-neumorphic text-white">
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-neumorphic-base text-white">
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="featured-image" className="block text-sm font-medium text-muted-foreground mb-1">
                  Featured Image
                </Label>
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 rounded-lg overflow-hidden neumorphic-inset flex items-center justify-center">
                    {blogImagePreviewUrl ? (
                      <Image
                        src={blogImagePreviewUrl || "/placeholder.svg"}
                        alt="Featured Image Preview"
                        width={96}
                        height={96}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="h-12 w-12 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <Input
                      id="featured-image"
                      type="file"
                      accept="image/*"
                      onChange={handleBlogImageChange}
                      ref={blogImageInputRef}
                      className="bg-neumorphic-base shadow-inner-neumorphic text-white"
                      disabled={isUploadBlogImagePending || isSaveBlogPending}
                    />
                    <Button
                      type="button"
                      onClick={handleUploadBlogImage}
                      className="jupiter-button-dark w-full h-10 px-4 bg-neumorphic-base hover:bg-neumorphic-base"
                      disabled={!blogImageFile || isUploadBlogImagePending || isSaveBlogPending}
                    >
                      {isUploadBlogImagePending ? "Uploading..." : "Upload Image"}
                    </Button>
                  </div>
                </div>
                {featuredImageUrl && (
                  <p className="text-xs text-muted-foreground">Current Image URL: {featuredImageUrl}</p>
                )}
                <input type="hidden" name="featuredImageUrl" value={featuredImageUrl || ""} />
              </div>
              <div className="flex gap-2">
                <Button
                  type="submit"
                  className="jupiter-button-dark flex-1 h-12 px-6 bg-neumorphic-base hover:bg-neumorphic-base"
                  disabled={isSaveBlogPending || !generatedBlogTitle.trim() || !generatedBlogContent.trim()}
                >
                  {isSaveBlogPending ? (
                    "Saving Blog Post..."
                  ) : (
                    <>
                      <SaveIcon className="h-4 w-4 mr-2" /> {editingBlogPostId ? "UPDATE POST" : "SAVE POST"}
                    </>
                  )}
                </Button>
                {editingBlogPostId && (
                  <Button
                    type="button"
                    onClick={handleCancelEditBlog}
                    variant="ghost"
                    className="h-12 px-6 text-muted-foreground hover:text-white"
                    disabled={isSaveBlogPending}
                  >
                    Cancel Edit
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Blog Post Manager Section */}
        <Card className="w-full jupiter-outer-panel p-6 mt-8">
          <CardHeader>
            <CardTitle className="text-center text-2xl font-bold text-[#afcd4f]">Blog Post Manager</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4 text-center">Manage your AI-generated blog posts.</p>
            {isFetchingBlogPosts ? (
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
                      <p className="text-xs text-muted-foreground mt-1">
                        Status: {post.status === "published" ? "Published" : "Draft"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Generated: {new Date(post.generated_at).toLocaleDateString()}
                      </p>
                      {post.featured_image_url && (
                        <div className="mt-2">
                          <Image
                            src={post.featured_image_url || "/placeholder.svg"}
                            alt={`Featured image for ${post.title}`}
                            width={64}
                            height={64}
                            className="rounded-md object-cover"
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 flex-shrink-0 mt-2 md:mt-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditBlog(post)}
                        className="text-[#afcd4f] hover:bg-[#afcd4f]/20"
                        aria-label={`Edit blog post: ${post.title}`}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteBlog(post.id)}
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
              <Label htmlFor="file-tag" className="block text-sm font-medium text-muted-foreground mb-1">
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
              <form onSubmit={handleAgentProfileSave} className="space-y-4">
                <h3 className="text-lg font-semibold text-white mb-2">Chatbot Instructions</h3>
                <div className="space-y-2">
                  <div>
                    <Label htmlFor="initial-greeting" className="block text-sm font-medium text-muted-foreground mb-1">
                      Initial Greeting Message
                    </Label>
                    <Textarea
                      id="initial-greeting"
                      name="initialGreeting"
                      value={initialGreeting}
                      onChange={(e) => setInitialGreeting(e.target.value)}
                      placeholder="e.g., Hello, I'm Michael Robinson's AI representative. How can I assist you?"
                      className="min-h-[80px] bg-neumorphic-base shadow-inner-neumorphic text-white"
                      disabled={isProfilePending}
                    />
                  </div>
                  <div>
                    <Label htmlFor="agent-role" className="block text-sm font-medium text-muted-foreground mb-1">
                      Role
                    </Label>
                    <Input
                      id="agent-role"
                      type="text"
                      name="agentRole"
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
                      name="agentStyle"
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
                      name="agentApproach"
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
                      name="agentLimitations"
                      value={agentLimitations}
                      onChange={(e) => setAgentLimitations(e.target.value)}
                      placeholder="e.g., If asked about advanced functions, or $WSLST Tokenomics, say they are coming soon or reserved functionality."
                      className="min-h-[80px] bg-neumorphic-base shadow-inner-neumorphic text-white"
                      disabled={isProfilePending}
                    />
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-white mb-2 mt-6">Agent Avatar</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-24 rounded-full overflow-hidden neumorphic-inset flex items-center justify-center">
                      {agentAvatarPreviewUrl ? (
                        <Image
                          src={agentAvatarPreviewUrl || "/placeholder.svg"}
                          alt="Agent Avatar Preview"
                          width={96}
                          height={96}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ImageIcon className="h-12 w-12 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <Input
                        id="agent-avatar-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleAgentAvatarChange}
                        ref={agentAvatarInputRef}
                        className="bg-neumorphic-base shadow-inner-neumorphic text-white"
                        disabled={isUploadingAvatar || isProfilePending}
                      />
                      <Button
                        type="button"
                        onClick={handleUploadAgentAvatar}
                        className="jupiter-button-dark w-full h-10 px-4 bg-neumorphic-base hover:bg-neumorphic-base"
                        disabled={!agentAvatarFile || isUploadingAvatar || isProfilePending}
                      >
                        {isUploadingAvatar ? "Uploading..." : "Upload Avatar"}
                      </Button>
                    </div>
                  </div>
                  {agentAvatarPreviewUrl && (
                    <p className="text-xs text-muted-foreground">Current Avatar URL: {agentAvatarPreviewUrl}</p>
                  )}
                  <input type="hidden" name="avatarUrl" value={agentAvatarPreviewUrl || ""} />{" "}
                  {/* Hidden input to pass URL to action */}
                </div>

                <h3 className="text-lg font-semibold text-white mb-2 mt-6">Content Guidelines (Config Data)</h3>
                <div className="space-y-2">
                  <div>
                    <Label htmlFor="brand-voice" className="block text-sm font-medium text-muted-foreground mb-1">
                      Brand Voice
                    </Label>
                    <Input
                      id="brand-voice"
                      type="text"
                      value={brandVoice}
                      onChange={(e) => setBrandVoice(e.target.value)}
                      placeholder="e.g., professional, innovative, futuristic"
                      className="bg-neumorphic-base shadow-inner-neumorphic text-white"
                      disabled={isProfilePending}
                    />
                  </div>
                  <div>
                    <Label htmlFor="tone" className="block text-sm font-medium text-muted-foreground mb-1">
                      Tone
                    </Label>
                    <Input
                      id="tone"
                      type="text"
                      value={tone}
                      onChange={(e) => setTone(e.target.value)}
                      placeholder="e.g., informative, confident, accessible"
                      className="bg-neumorphic-base shadow-inner-neumorphic text-white"
                      disabled={isProfilePending}
                    />
                  </div>
                  <div>
                    <Label htmlFor="keywords-focus" className="block text-sm font-medium text-muted-foreground mb-1">
                      Keywords Focus (comma-separated)
                    </Label>
                    <Input
                      id="keywords-focus"
                      type="text"
                      value={keywordsFocus}
                      onChange={(e) => setKeywordsFocus(e.target.value)}
                      placeholder="e.g., AI Agents, Web3, Solana, Trading Automation"
                      className="bg-neumorphic-base shadow-inner-neumorphic text-white"
                      disabled={isProfilePending}
                    />
                  </div>
                  <div>
                    <Label htmlFor="audience" className="block text-sm font-medium text-muted-foreground mb-1">
                      Audience
                    </Label>
                    <Input
                      id="audience"
                      type="text"
                      value={audience}
                      onChange={(e) => setAudience(e.target.value)}
                      placeholder="e.g., developers, investors, tech enthusiasts"
                      className="bg-neumorphic-base shadow-inner-neumorphic text-white"
                      disabled={isProfilePending}
                    />
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-white mb-2 mt-6">Syndication Schedule (Config Data)</h3>
                <div className="space-y-2">
                  <div>
                    <Label htmlFor="default-interval" className="block text-sm font-medium text-muted-foreground mb-1">
                      Default Interval (Hours)
                    </Label>
                    <Input
                      id="default-interval"
                      type="number"
                      value={defaultIntervalHours}
                      onChange={(e) => setDefaultIntervalHours(e.target.value)}
                      placeholder="e.g., 24"
                      className="bg-neumorphic-base shadow-inner-neumorphic text-white"
                      disabled={isProfilePending}
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="platform-specific-schedule"
                      className="block text-sm font-medium text-muted-foreground mb-1"
                    >
                      Platform Specific Schedule (JSON)
                    </Label>
                    <Textarea
                      id="platform-specific-schedule"
                      value={platformSpecificSchedule}
                      onChange={(e) => setPlatformSpecificSchedule(e.target.value)}
                      placeholder={`e.g., {"twitter": {"max_per_day": 3}, "linkedin": {"max_per_week": 5}}`}
                      className="min-h-[120px] bg-neumorphic-base shadow-inner-neumorphic text-white font-mono text-sm"
                      disabled={isProfilePending}
                    />
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-white mb-2 mt-6">Other Profile Data (JSON)</h3>
                <Textarea
                  name="profileJson"
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
      </div>
    </main>
  )
}
