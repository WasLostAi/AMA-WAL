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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  EditIcon,
  EyeIcon,
  CopyIcon,
  RefreshCwIcon,
} from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import Image from "next/image"
import RichTextEditor from "@/components/rich-text-editor"
import { ContentManager } from "@/components/adaptive/content-manager"
import { SmartSetup } from "@/components/adaptive/smart-setup"
import { AdminAssistant } from "@/components/adaptive/admin-assistant"
import { ModeSelector } from "@/components/adaptive/mode-selector"
import { useModeStore } from "@/lib/mode-manager"

// Import all necessary server actions
import { saveSocialPostsMarkdown } from "./content-manager/social-post-actions"
import { uploadFileWithTag, getFileMetadata, deleteFile } from "./content-manager/file-upload-actions"
import { suggestTagsFromFile } from "./content-manager/ai-tagging-action"
import { generateHashtags } from "./content-manager/hashtag-actions"
import { generateSeoMetadata, revalidateSiteData } from "./content-manager/seo-actions"
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
import {
  getBlogPosts,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  type BlogPost,
} from "./blog-manager/blog-actions"
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
  metadata?: Record<string, any>
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
  const [generatedHashtags, setGeneratedHashtags] = useState<string>("")
  const [isGeneratingHashtags, setIsGeneratingHashtags] = useState(false)

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
  const [profileJson, setProfileJson] = useState<string>("")
  const [agentRole, setAgentRole] = useState("")
  const [agentStyle, setAgentStyle] = useState("")
  const [agentApproach, setAgentApproach] = useState("")
  const [agentLimitations, setAgentLimitations] = useState("")
  const [initialGreeting, setInitialGreeting] = useState("")
  const [agentAvatarFile, setAgentAvatarFile] = useState<File | null>(null)
  const [agentAvatarPreviewUrl, setAgentAvatarPreviewUrl] = useState<string | null>(null)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const agentAvatarInputRef = useRef<HTMLInputElement>(null)

  // New states for config_data
  const [brandVoice, setBrandVoice] = useState("")
  const [tone, setTone] = useState("")
  const [keywordsFocus, setKeywordsFocus] = useState("")
  const [audience, setAudience] = useState("")
  const [defaultIntervalHours, setDefaultIntervalHours] = useState<number | string>("")
  const [platformSpecificSchedule, setPlatformSpecificSchedule] = useState<string>("")

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

  // --- Blog Post & SEO Manager State ---
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([])
  const [isFetchingBlogPosts, setIsFetchingBlogPosts] = useState(true)
  const [editingBlogPost, setEditingBlogPost] = useState<BlogPost | null>(null)
  const [blogPostTitle, setBlogPostTitle] = useState("")
  const [blogPostSlug, setBlogPostSlug] = useState("")
  const [blogPostContent, setBlogPostContent] = useState("")
  const [blogPostStatus, setBlogPostStatus] = useState<BlogPost["status"]>("draft")
  const [blogPostMetaDescription, setBlogPostMetaDescription] = useState("")
  const [blogPostKeywords, setBlogPostKeywords] = useState("")
  const [blogPostFeaturedImage, setBlogPostFeaturedImage] = useState<File | null>(null)
  const [blogPostFeaturedImagePreview, setBlogPostFeaturedImagePreview] = useState<string | null>(null)
  const blogPostFeaturedImageInputRef = useRef<HTMLInputElement>(null)
  const [isGeneratingSeo, setIsGeneratingSeo] = useState(false)
  const [isBlogPostSaving, setIsBlogPostSaving] = useState(false)
  const [revalidateSiteDataState, revalidateSiteDataAction, isRevalidatingSiteData] = useActionState(
    revalidateSiteData,
    {
      success: false,
      message: "",
    },
  )

  const [activeAdminTab, setActiveAdminTab] = useState("content")
  const { currentMode, setMode } = useModeStore()

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
      const { chatbotInstructions, personal, company, ...restOfProfile } = data
      setAgentRole(chatbotInstructions?.role || "")
      setAgentStyle(chatbotInstructions?.style || "")
      setAgentApproach(chatbotInstructions?.approach || "")
      setAgentLimitations(chatbotInstructions?.limitations || "")
      setInitialGreeting(chatbotInstructions?.initialGreeting || "")
      setAgentAvatarPreviewUrl(personal?.avatarUrl || null)

      setBrandVoice(company?.config_data?.content_guidelines?.brand_voice || "")
      setTone(company?.config_data?.content_guidelines?.tone || "")
      setKeywordsFocus(company?.config_data?.content_guidelines?.keywords_focus?.join(", ") || "")
      setAudience(company?.config_data?.content_guidelines?.audience || "")
      setDefaultIntervalHours(company?.config_data?.syndication_schedule?.default_interval_hours || "")
      setPlatformSpecificSchedule(
        JSON.stringify(company?.config_data?.syndication_schedule?.platform_specific || {}, null, 2),
      )

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
      fetchBlogPosts()
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
        fetchAgentProfile()
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
        fetchSyndicationLogs()
      }
    }
  }, [syndicationState, fetchSyndicationLogs])

  useEffect(() => {
    if (revalidateSiteDataState.message) {
      alert(revalidateSiteDataState.message)
    }
  }, [revalidateSiteDataState])

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
      setAgentAvatarPreviewUrl(URL.createObjectURL(file))
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
        setAgentAvatarPreviewUrl(result.imageUrl)
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

  // --- Hashtag Generator Handler ---
  const handleGenerateHashtags = async () => {
    if (!markdownContent.trim()) {
      alert("Please enter some content in the Social Post Editor to generate hashtags.")
      return
    }
    setIsGeneratingHashtags(true)
    try {
      const result = await generateHashtags(markdownContent)
      if (result.success && result.hashtags.length > 0) {
        setGeneratedHashtags(result.hashtags.join(" "))
      } else {
        alert(result.message || "Failed to generate hashtags.")
      }
    } catch (error) {
      console.error("Error generating hashtags:", error)
      alert("An error occurred while generating hashtags.")
    } finally {
      setIsGeneratingHashtags(false)
    }
  }

  // --- Blog Post & SEO Manager Handlers ---
  const handleNewBlogPost = () => {
    setEditingBlogPost(null)
    setBlogPostTitle("")
    setBlogPostSlug("")
    setBlogPostContent("")
    setBlogPostStatus("draft")
    setBlogPostMetaDescription("")
    setBlogPostKeywords("")
    setBlogPostFeaturedImage(null)
    setBlogPostFeaturedImagePreview(null)
    window.scrollTo({ top: document.getElementById("blog-post-form")?.offsetTop || 0, behavior: "smooth" })
  }

  const handleEditBlogPost = (post: BlogPost) => {
    setEditingBlogPost(post)
    setBlogPostTitle(post.title)
    setBlogPostSlug(post.slug)
    setBlogPostContent(post.content)
    setBlogPostStatus(post.status)
    setBlogPostMetaDescription(post.meta_description || "")
    setBlogPostKeywords(post.keywords?.join(", ") || "")
    setBlogPostFeaturedImage(null)
    setBlogPostFeaturedImagePreview(post.featured_image_url || null)
    window.scrollTo({ top: document.getElementById("blog-post-form")?.offsetTop || 0, behavior: "smooth" })
  }

  const handleBlogPostSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsBlogPostSaving(true)

    const formData = new FormData()
    formData.append("title", blogPostTitle)
    formData.append("slug", blogPostSlug)
    formData.append("content", blogPostContent)
    formData.append("status", blogPostStatus)
    formData.append("meta_description", blogPostMetaDescription)
    formData.append("keywords", blogPostKeywords)

    if (blogPostFeaturedImage) {
      formData.append("featuredImage", blogPostFeaturedImage)
    } else if (blogPostFeaturedImagePreview) {
      formData.append("existingImageUrl", blogPostFeaturedImagePreview)
    } else {
      formData.append("clearFeaturedImage", "true")
    }

    let result
    if (editingBlogPost) {
      formData.append("id", editingBlogPost.id)
      result = await updateBlogPost(null, formData)
    } else {
      result = await createBlogPost(null, formData)
    }

    if (result.success) {
      alert(result.message)
      handleNewBlogPost()
      fetchBlogPosts()
    } else {
      alert(result.message)
    }
    setIsBlogPostSaving(false)
  }

  const handleDeleteBlogPost = async (id: string) => {
    if (confirm("Are you sure you want to delete this blog post? This action cannot be undone.")) {
      const { success, message } = await deleteBlogPost(id)
      alert(message)
      if (success) {
        fetchBlogPosts()
      }
    }
  }

  const handleGenerateSeo = async () => {
    if (!blogPostTitle.trim() || !blogPostContent.trim()) {
      alert("Please enter a title and content for the blog post to generate SEO metadata.")
      return
    }
    setIsGeneratingSeo(true)
    try {
      const result = await generateSeoMetadata(blogPostContent, blogPostTitle)
      if (result.success) {
        setBlogPostMetaDescription(result.metaDescription)
        setBlogPostKeywords(result.keywords.join(", "))
        alert("SEO metadata generated successfully!")
      } else {
        alert(result.message || "Failed to generate SEO metadata.")
      }
    } catch (error) {
      console.error("Error generating SEO metadata:", error)
      alert("An error occurred while generating SEO metadata.")
    } finally {
      setIsGeneratingSeo(false)
    }
  }

  const handleBlogPostFeaturedImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith("image/")) {
      setBlogPostFeaturedImage(file)
      setBlogPostFeaturedImagePreview(URL.createObjectURL(file))
    } else {
      setBlogPostFeaturedImage(null)
      setBlogPostFeaturedImagePreview(null)
      alert("Please select an image file (PNG, JPEG, GIF) for the featured image.")
    }
  }

  const handleClearBlogPostFeaturedImage = () => {
    setBlogPostFeaturedImage(null)
    setBlogPostFeaturedImagePreview(null)
    if (blogPostFeaturedImageInputRef.current) {
      blogPostFeaturedImageInputRef.current.value = ""
    }
  }

  const handleRevalidateSiteData = () => {
    startTransition(() => {
      revalidateSiteDataAction(null)
    })
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
            onClick={() => {
              disconnect()
              router.push("/")
            }}
            className="jupiter-button-dark h-10 px-4 flex items-center gap-2"
          >
            <XIcon className="h-4 w-4" /> Close Editor
          </Button>
        </div>

        {/* Site Data Revalidation */}
        <Card className="w-full jupiter-outer-panel p-6">
          <CardHeader>
            <CardTitle className="text-center text-2xl font-bold text-[#afcd4f]">Site Data Revalidation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-4">
              <p className="text-center text-muted-foreground">
                Revalidate cached site data to reflect changes in blog posts, agent profile, and other content.
              </p>
              <Button
                onClick={handleRevalidateSiteData}
                disabled={isRevalidatingSiteData}
                className="jupiter-button-dark h-10 px-6 flex items-center gap-2"
              >
                <RefreshCwIcon className="h-4 w-4" />
                {isRevalidatingSiteData ? "Revalidating..." : "Revalidate Site Data"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Mode Selector */}
        <Card className="w-full jupiter-outer-panel p-6">
          <CardHeader>
            <CardTitle className="text-center text-2xl font-bold text-[#afcd4f]">Site Mode</CardTitle>
          </CardHeader>
          <CardContent>
            <ModeSelector />
          </CardContent>
        </Card>

        {/* Adaptive Components */}
        <div className="space-y-6">
          <SmartSetup />
          <AdminAssistant />
        </div>

        {/* Main Admin Tabs */}
        <Tabs value={activeAdminTab} onValueChange={setActiveAdminTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="agent">Agent</TabsTrigger>
            <TabsTrigger value="training">Training</TabsTrigger>
            <TabsTrigger value="syndication">Syndication</TabsTrigger>
            <TabsTrigger value="blog">Blog & SEO</TabsTrigger>
          </TabsList>

          {/* Content Manager Tab */}
          <TabsContent value="content" className="space-y-6">
            <ContentManager />

            {/* Social Post Editor */}
            <Card className="w-full jupiter-outer-panel p-6">
              <CardHeader>
                <CardTitle className="text-center text-2xl font-bold text-[#afcd4f]">Social Post Editor</CardTitle>
              </CardHeader>
              <CardContent>
                <form action={socialPostFormAction} className="space-y-4">
                  <div>
                    <Label htmlFor="markdown-content">Markdown Content</Label>
                    <Textarea
                      id="markdown-content"
                      name="markdownContent"
                      value={markdownContent}
                      onChange={(e) => setMarkdownContent(e.target.value)}
                      placeholder="Enter your social post content in Markdown format..."
                      className="min-h-[200px] jupiter-input"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      disabled={isSocialPostPending}
                      className="jupiter-button-dark h-10 px-4 flex items-center gap-2"
                    >
                      <SaveIcon className="h-4 w-4" />
                      {isSocialPostPending ? "Saving..." : "Save Social Posts"}
                    </Button>
                    <Button
                      type="button"
                      onClick={handleGenerateHashtags}
                      disabled={isGeneratingHashtags}
                      className="jupiter-button-dark h-10 px-4 flex items-center gap-2"
                    >
                      <SparklesIcon className="h-4 w-4" />
                      {isGeneratingHashtags ? "Generating..." : "Generate Hashtags"}
                    </Button>
                  </div>

                  {generatedHashtags && (
                    <div className="p-4 bg-muted rounded-lg">
                      <Label className="text-sm font-medium">Generated Hashtags:</Label>
                      <p className="text-sm text-muted-foreground mt-1">{generatedHashtags}</p>
                      <Button
                        type="button"
                        onClick={() => navigator.clipboard.writeText(generatedHashtags)}
                        className="mt-2 h-8 px-3 text-xs"
                      >
                        <CopyIcon className="h-3 w-3 mr-1" />
                        Copy
                      </Button>
                    </div>
                  )}
                </form>
              </CardContent>
            </Card>

            {/* File Upload Manager */}
            <Card className="w-full jupiter-outer-panel p-6">
              <CardHeader>
                <CardTitle className="text-center text-2xl font-bold text-[#afcd4f]">File Upload Manager</CardTitle>
                <p className="text-center text-muted-foreground">
                  Upload files to give the AI agent memory and context. Supported formats: .txt, .md, .html for AI
                  processing.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* File Upload Form */}
                <form onSubmit={handleFileUpload} className="space-y-4">
                  <div
                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                      isDragging ? "border-[#afcd4f] bg-[#afcd4f]/10" : "border-muted-foreground/25"
                    }`}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                  >
                    <UploadCloudIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-lg font-medium mb-2">Drag & drop files here, or click to select</p>
                    <input
                      type="file"
                      multiple
                      onChange={handleFileChange}
                      className="hidden"
                      id="file-upload"
                      accept=".txt,.md,.html,.pdf,.docx,.png,.jpg,.jpeg,.gif"
                    />
                    <label
                      htmlFor="file-upload"
                      className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md cursor-pointer hover:bg-primary/90"
                    >
                      Select Files
                    </label>
                  </div>

                  {selectedFiles.length > 0 && (
                    <div className="space-y-2">
                      <Label>Selected Files:</Label>
                      <div className="space-y-1">
                        {selectedFiles.map((file, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            {getFileIcon(file.type)}
                            <span>{file.name}</span>
                            <span className="text-muted-foreground">({(file.size / 1024).toFixed(1)} KB)</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="file-tags">Tags (comma-separated)</Label>
                    <div className="flex gap-2">
                      <Input
                        id="file-tags"
                        value={fileTagInput}
                        onChange={(e) => setFileTagInput(e.target.value)}
                        placeholder="e.g., documentation, tutorial, reference"
                        className="jupiter-input flex-1"
                      />
                      <Button
                        type="button"
                        onClick={handleSuggestTags}
                        disabled={isSuggestingTags || selectedFiles.length === 0}
                        className="jupiter-button-dark h-10 px-4 flex items-center gap-2"
                      >
                        <SparklesIcon className="h-4 w-4" />
                        {isSuggestingTags ? "Suggesting..." : "Suggest"}
                      </Button>
                    </div>
                    {previouslyUsedTags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        <span className="text-xs text-muted-foreground">Previously used:</span>
                        {previouslyUsedTags.map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => {
                              const currentTags = fileTagInput
                                .split(",")
                                .map((t) => t.trim())
                                .filter(Boolean)
                              if (!currentTags.includes(tag)) {
                                setFileTagInput(currentTags.concat(tag).join(", "))
                              }
                            }}
                            className="text-xs px-2 py-1 bg-muted rounded-md hover:bg-muted/80"
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={isFileUploadPending || selectedFiles.length === 0}
                    className="jupiter-button-dark h-10 px-4 flex items-center gap-2"
                  >
                    <UploadCloudIcon className="h-4 w-4" />
                    {isFileUploadPending ? "Uploading..." : `Upload ${selectedFiles.length} File(s)`}
                  </Button>
                </form>

                {/* Uploaded Files List */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Uploaded Files</h3>
                    <Button onClick={fetchFileMetadata} disabled={isFetchingFiles} className="h-8 px-3 text-xs">
                      <RefreshCwIcon className="h-3 w-3 mr-1" />
                      Refresh
                    </Button>
                  </div>

                  {isFetchingFiles ? (
                    <p className="text-center text-muted-foreground">Loading files...</p>
                  ) : uploadedFiles.length === 0 ? (
                    <p className="text-center text-muted-foreground">No files uploaded yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {uploadedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            {getFileIcon(file.contentType)}
                            <div>
                              <p className="font-medium">{file.fileName}</p>
                              <p className="text-sm text-muted-foreground">
                                Tags: {file.tags.join(", ")} • Uploaded:{" "}
                                {new Date(file.uploadedAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <Button
                            onClick={() => handleDeleteFile(file.filePath)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive-foreground hover:bg-destructive"
                          >
                            <Trash2Icon className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Agent Profile Tab */}
          <TabsContent value="agent" className="space-y-6">
            <Card className="w-full jupiter-outer-panel p-6">
              <CardHeader>
                <CardTitle className="text-center text-2xl font-bold text-[#afcd4f]">Agent Profile Manager</CardTitle>
                <p className="text-center text-muted-foreground">
                  Configure your AI agent's personality, knowledge, and behavior.
                </p>
              </CardHeader>
              <CardContent>
                {isFetchingProfile ? (
                  <p className="text-center text-muted-foreground">Loading agent profile...</p>
                ) : (
                  <form onSubmit={handleAgentProfileSave} className="space-y-6">
                    {/* Agent Avatar Section */}
                    <div className="space-y-4">
                      <Label className="text-lg font-semibold">Agent Avatar</Label>
                      <div className="flex items-center gap-4">
                        {agentAvatarPreviewUrl && (
                          <div className="relative">
                            <Image
                              src={agentAvatarPreviewUrl || "/placeholder.svg"}
                              alt="Agent Avatar"
                              width={80}
                              height={80}
                              className="rounded-full object-cover"
                            />
                          </div>
                        )}
                        <div className="space-y-2">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleAgentAvatarChange}
                            ref={agentAvatarInputRef}
                            className="hidden"
                            id="agent-avatar-upload"
                          />
                          <div className="flex gap-2">
                            <label
                              htmlFor="agent-avatar-upload"
                              className="inline-flex items-center px-3 py-2 bg-secondary text-secondary-foreground rounded-md cursor-pointer hover:bg-secondary/80 text-sm"
                            >
                              Choose Image
                            </label>
                            {agentAvatarFile && (
                              <Button
                                type="button"
                                onClick={handleUploadAgentAvatar}
                                disabled={isUploadingAvatar}
                                className="h-9 px-3 text-sm"
                              >
                                {isUploadingAvatar ? "Uploading..." : "Upload"}
                              </Button>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">Recommended: Square image, at least 200x200px</p>
                        </div>
                      </div>
                    </div>

                    {/* Chatbot Instructions */}
                    <div className="space-y-4">
                      <Label className="text-lg font-semibold">Chatbot Instructions</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="agent-role">Role</Label>
                          <Input
                            id="agent-role"
                            name="role"
                            value={agentRole}
                            onChange={(e) => setAgentRole(e.target.value)}
                            placeholder="e.g., AI Assistant for Michael Robinson"
                            className="jupiter-input"
                          />
                        </div>
                        <div>
                          <Label htmlFor="agent-style">Style</Label>
                          <Input
                            id="agent-style"
                            name="style"
                            value={agentStyle}
                            onChange={(e) => setAgentStyle(e.target.value)}
                            placeholder="e.g., Professional, friendly, informative"
                            className="jupiter-input"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="agent-approach">Approach</Label>
                        <Textarea
                          id="agent-approach"
                          name="approach"
                          value={agentApproach}
                          onChange={(e) => setAgentApproach(e.target.value)}
                          placeholder="Describe how the agent should approach conversations..."
                          className="jupiter-input"
                        />
                      </div>
                      <div>
                        <Label htmlFor="agent-limitations">Limitations</Label>
                        <Textarea
                          id="agent-limitations"
                          name="limitations"
                          value={agentLimitations}
                          onChange={(e) => setAgentLimitations(e.target.value)}
                          placeholder="What should the agent avoid or redirect..."
                          className="jupiter-input"
                        />
                      </div>
                      <div>
                        <Label htmlFor="initial-greeting">Initial Greeting</Label>
                        <Textarea
                          id="initial-greeting"
                          value={initialGreeting}
                          onChange={(e) => setInitialGreeting(e.target.value)}
                          placeholder="The first message users see when they start a conversation..."
                          className="jupiter-input"
                        />
                      </div>
                    </div>

                    {/* Content Guidelines */}
                    <div className="space-y-4">
                      <Label className="text-lg font-semibold">Content Guidelines</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="brand-voice">Brand Voice</Label>
                          <Input
                            id="brand-voice"
                            value={brandVoice}
                            onChange={(e) => setBrandVoice(e.target.value)}
                            placeholder="e.g., professional, innovative"
                            className="jupiter-input"
                          />
                        </div>
                        <div>
                          <Label htmlFor="tone">Tone</Label>
                          <Input
                            id="tone"
                            value={tone}
                            onChange={(e) => setTone(e.target.value)}
                            placeholder="e.g., informative, confident"
                            className="jupiter-input"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="keywords-focus">Keywords Focus (comma-separated)</Label>
                        <Input
                          id="keywords-focus"
                          value={keywordsFocus}
                          onChange={(e) => setKeywordsFocus(e.target.value)}
                          placeholder="e.g., AI, Web3, Decentralized AI"
                          className="jupiter-input"
                        />
                      </div>
                      <div>
                        <Label htmlFor="audience">Target Audience</Label>
                        <Input
                          id="audience"
                          value={audience}
                          onChange={(e) => setAudience(e.target.value)}
                          placeholder="e.g., tech enthusiasts, developers"
                          className="jupiter-input"
                        />
                      </div>
                    </div>

                    {/* Syndication Schedule */}
                    <div className="space-y-4">
                      <Label className="text-lg font-semibold">Syndication Schedule</Label>
                      <div>
                        <Label htmlFor="default-interval-hours">Default Interval (hours)</Label>
                        <Input
                          id="default-interval-hours"
                          type="number"
                          value={defaultIntervalHours}
                          onChange={(e) => setDefaultIntervalHours(e.target.value)}
                          placeholder="24"
                          className="jupiter-input"
                        />
                      </div>
                      <div>
                        <Label htmlFor="platform-specific-schedule">Platform Specific Schedule (JSON)</Label>
                        <Textarea
                          id="platform-specific-schedule"
                          value={platformSpecificSchedule}
                          onChange={(e) => setPlatformSpecificSchedule(e.target.value)}
                          placeholder='{"twitter": {"interval_hours": 4}, "linkedin": {"interval_hours": 24}}'
                          className="jupiter-input font-mono text-sm"
                        />
                      </div>
                    </div>

                    {/* Profile JSON Editor */}
                    <div className="space-y-4">
                      <Label className="text-lg font-semibold">Profile Data (JSON)</Label>
                      <Textarea
                        name="profileJson"
                        value={profileJson}
                        onChange={(e) => setProfileJson(e.target.value)}
                        placeholder="Enter agent profile data in JSON format..."
                        className="min-h-[300px] jupiter-input font-mono text-sm"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isProfilePending}
                      className="jupiter-button-dark h-10 px-4 flex items-center gap-2"
                    >
                      <SaveIcon className="h-4 w-4" />
                      {isProfilePending ? "Saving..." : "Save Agent Profile"}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Training Q&A Tab */}
          <TabsContent value="training" className="space-y-6">
            <Card className="w-full jupiter-outer-panel p-6">
              <CardHeader>
                <CardTitle className="text-center text-2xl font-bold text-[#afcd4f]">Training Q&A Manager</CardTitle>
                <p className="text-center text-muted-foreground">
                  Add specific question-answer pairs to train your AI agent on particular topics.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Add/Edit Q&A Form */}
                <form onSubmit={handleAddOrUpdateQA} className="space-y-4" id="qa-add-form">
                  <div>
                    <Label htmlFor="new-question">Question</Label>
                    <Input
                      id="new-question"
                      value={newQuestion}
                      onChange={(e) => setNewQuestion(e.target.value)}
                      placeholder="Enter a question..."
                      className="jupiter-input"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="new-answer">Answer</Label>
                    <Textarea
                      id="new-answer"
                      value={newAnswer}
                      onChange={(e) => setNewAnswer(e.target.value)}
                      placeholder="Enter the answer..."
                      className="min-h-[100px] jupiter-input"
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      disabled={isAddQAPending || isUpdateQAPending}
                      className="jupiter-button-dark h-10 px-4 flex items-center gap-2"
                    >
                      <PlusIcon className="h-4 w-4" />
                      {editingQAId
                        ? isUpdateQAPending
                          ? "Updating..."
                          : "Update Q&A"
                        : isAddQAPending
                          ? "Adding..."
                          : "Add Q&A"}
                    </Button>
                    {editingQAId && (
                      <Button type="button" onClick={handleCancelEditQA} className="h-10 px-4">
                        Cancel Edit
                      </Button>
                    )}
                  </div>
                </form>

                {/* Q&A Filter */}
                <div>
                  <Label htmlFor="qa-filter">Filter Q&As</Label>
                  <Input
                    id="qa-filter"
                    value={qaFilterQuery}
                    onChange={(e) => setQaFilterQuery(e.target.value)}
                    placeholder="Search questions and answers..."
                    className="jupiter-input"
                  />
                </div>

                {/* Q&A List */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Training Q&As ({filteredQAs.length})</h3>
                    <Button onClick={fetchTrainingQAs} disabled={isFetchingQAs} className="h-8 px-3 text-xs">
                      <RefreshCwIcon className="h-3 w-3 mr-1" />
                      Refresh
                    </Button>
                  </div>

                  {isFetchingQAs ? (
                    <p className="text-center text-muted-foreground">Loading Q&As...</p>
                  ) : filteredQAs.length === 0 ? (
                    <p className="text-center text-muted-foreground">
                      {qaFilterQuery ? "No Q&As match your search." : "No training Q&As added yet."}
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {filteredQAs.map((qa) => (
                        <Collapsible key={qa.id}>
                          <div className="border rounded-lg p-4">
                            <CollapsibleTrigger className="flex items-center justify-between w-full text-left">
                              <div className="flex-1">
                                <p className="font-medium">{qa.question}</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {qa.answer.length > 100 ? `${qa.answer.substring(0, 100)}...` : qa.answer}
                                </p>
                              </div>
                              <ChevronDownIcon className="h-4 w-4 ml-2" />
                            </CollapsibleTrigger>
                            <CollapsibleContent className="mt-4 space-y-3">
                              <div>
                                <Label className="text-sm font-medium">Full Answer:</Label>
                                <p className="text-sm mt-1 p-3 bg-muted rounded-md">{qa.answer}</p>
                              </div>
                              <div className="flex gap-2">
                                <Button onClick={() => handleEditQA(qa)} className="h-8 px-3 text-xs">
                                  <EditIcon className="h-3 w-3 mr-1" />
                                  Edit
                                </Button>
                                <Button
                                  onClick={() => handleDeleteQA(qa.id)}
                                  className="h-8 px-3 text-xs text-destructive hover:text-destructive-foreground hover:bg-destructive"
                                >
                                  <Trash2Icon className="h-3 w-3 mr-1" />
                                  Delete
                                </Button>
                              </div>
                            </CollapsibleContent>
                          </div>
                        </Collapsible>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Content Generation & Syndication Tab */}
          <TabsContent value="syndication" className="space-y-6">
            <Card className="w-full jupiter-outer-panel p-6">
              <CardHeader>
                <CardTitle className="text-center text-2xl font-bold text-[#afcd4f]">
                  Content Generation & Syndication
                </CardTitle>
                <p className="text-center text-muted-foreground">
                  Generate platform-optimized content and manage syndication across social media.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Content Generation Form */}
                <form onSubmit={handleGenerateContent} className="space-y-4">
                  <div>
                    <Label htmlFor="generation-topic">Topic</Label>
                    <Input
                      id="generation-topic"
                      value={generationTopic}
                      onChange={(e) => setGenerationTopic(e.target.value)}
                      placeholder="Enter a topic to generate content about..."
                      className="jupiter-input"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="generation-platform">Platform</Label>
                      <Select value={generationPlatform} onValueChange={setGenerationPlatform}>
                        <SelectTrigger className="jupiter-input">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="twitter">Twitter</SelectItem>
                          <SelectItem value="linkedin">LinkedIn</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="github">GitHub</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="generation-content-type">Content Type</Label>
                      <Select value={generationContentType} onValueChange={setGenerationContentType}>
                        <SelectTrigger className="jupiter-input">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
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
                    disabled={isSyndicationPending}
                    className="jupiter-button-dark h-10 px-4 flex items-center gap-2"
                  >
                    <Share2Icon className="h-4 w-4" />
                    {isSyndicationPending ? "Generating..." : "Generate & Queue Content"}
                  </Button>
                </form>

                {/* Generated Content Preview */}
                {generatedContentPreview && (
                  <div className="p-4 bg-muted rounded-lg">
                    <Label className="text-sm font-medium">Generated Content Preview:</Label>
                    {generatedContentPreview.title && (
                      <p className="text-sm font-medium mt-2">Title: {generatedContentPreview.title}</p>
                    )}
                    <p className="text-sm mt-2 whitespace-pre-wrap">{generatedContentPreview.content}</p>
                    <Button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(generatedContentPreview.content)}
                      className="mt-2 h-8 px-3 text-xs"
                    >
                      <CopyIcon className="h-3 w-3 mr-1" />
                      Copy Content
                    </Button>
                  </div>
                )}

                {/* Syndication Logs */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Syndication Logs</h3>
                    <Button
                      onClick={fetchSyndicationLogs}
                      disabled={isFetchingSyndicationLogs}
                      className="h-8 px-3 text-xs"
                    >
                      <RefreshCwIcon className="h-3 w-3 mr-1" />
                      Refresh
                    </Button>
                  </div>

                  {isFetchingSyndicationLogs ? (
                    <p className="text-center text-muted-foreground">Loading syndication logs...</p>
                  ) : syndicationLogs.length === 0 ? (
                    <p className="text-center text-muted-foreground">No content generated yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {syndicationLogs.map((log) => (
                        <Collapsible key={log.id}>
                          <div className="border rounded-lg p-4">
                            <CollapsibleTrigger className="flex items-center justify-between w-full text-left">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-sm font-medium">{log.platform}</span>
                                  <span className="text-xs px-2 py-1 bg-muted rounded-md">{log.content_type}</span>
                                  <span
                                    className={`text-xs px-2 py-1 rounded-md ${
                                      log.status === "syndicated"
                                        ? "bg-green-100 text-green-800"
                                        : "bg-yellow-100 text-yellow-800"
                                    }`}
                                  >
                                    {log.status}
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {log.title || "Untitled"} • Generated:{" "}
                                  {new Date(log.generated_at).toLocaleDateString()}
                                </p>
                                <p className="text-sm mt-1">
                                  {log.content.length > 100 ? `${log.content.substring(0, 100)}...` : log.content}
                                </p>
                              </div>
                              <ChevronDownIcon className="h-4 w-4 ml-2" />
                            </CollapsibleTrigger>
                            <CollapsibleContent className="mt-4 space-y-3">
                              <div>
                                <Label className="text-sm font-medium">Full Content:</Label>
                                <p className="text-sm mt-1 p-3 bg-muted rounded-md whitespace-pre-wrap">
                                  {log.content}
                                </p>
                              </div>
                              {log.metadata && (
                                <div>
                                  <Label className="text-sm font-medium">Metadata:</Label>
                                  <p className="text-xs mt-1 p-2 bg-muted rounded-md font-mono">
                                    {JSON.stringify(log.metadata, null, 2)}
                                  </p>
                                </div>
                              )}
                              <Button
                                onClick={() => navigator.clipboard.writeText(log.content)}
                                className="h-8 px-3 text-xs"
                              >
                                <CopyIcon className="h-3 w-3 mr-1" />
                                Copy Content
                              </Button>
                            </CollapsibleContent>
                          </div>
                        </Collapsible>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Blog Post & SEO Manager Tab */}
          <TabsContent value="blog" className="space-y-6">
            <Card className="w-full jupiter-outer-panel p-6">
              <CardHeader>
                <CardTitle className="text-center text-2xl font-bold text-[#afcd4f]">Blog Post & SEO Manager</CardTitle>
                <p className="text-center text-muted-foreground">
                  Create, edit, and manage blog posts with AI-powered SEO optimization.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Blog Post Form */}
                <form onSubmit={handleBlogPostSave} className="space-y-4" id="blog-post-form">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">
                      {editingBlogPost ? "Edit Blog Post" : "Create New Blog Post"}
                    </h3>
                    {editingBlogPost && (
                      <Button type="button" onClick={handleNewBlogPost} className="h-8 px-3 text-xs">
                        <PlusIcon className="h-3 w-3 mr-1" />
                        New Post
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="blog-post-title">Title</Label>
                      <Input
                        id="blog-post-title"
                        value={blogPostTitle}
                        onChange={(e) => setBlogPostTitle(e.target.value)}
                        placeholder="Enter blog post title..."
                        className="jupiter-input"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="blog-post-slug">Slug</Label>
                      <Input
                        id="blog-post-slug"
                        value={blogPostSlug}
                        onChange={(e) => setBlogPostSlug(e.target.value)}
                        placeholder="url-friendly-slug"
                        className="jupiter-input"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="blog-post-content">Content</Label>
                    <RichTextEditor
                      value={blogPostContent}
                      onChange={setBlogPostContent}
                      placeholder="Write your blog post content here..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="blog-post-status">Status</Label>
                      <Select
                        value={blogPostStatus}
                        onValueChange={(value: BlogPost["status"]) => setBlogPostStatus(value)}
                      >
                        <SelectTrigger className="jupiter-input">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="published">Published</SelectItem>
                          <SelectItem value="archived">Archived</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="blog-post-featured-image">Featured Image</Label>
                      <div className="flex gap-2">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleBlogPostFeaturedImageChange}
                          ref={blogPostFeaturedImageInputRef}
                          className="hidden"
                          id="blog-post-featured-image-upload"
                        />
                        <label
                          htmlFor="blog-post-featured-image-upload"
                          className="inline-flex items-center px-3 py-2 bg-secondary text-secondary-foreground rounded-md cursor-pointer hover:bg-secondary/80 text-sm flex-1 justify-center"
                        >
                          Choose Image
                        </label>
                        {blogPostFeaturedImagePreview && (
                          <Button type="button" onClick={handleClearBlogPostFeaturedImage} className="h-9 px-3 text-sm">
                            Clear
                          </Button>
                        )}
                      </div>
                      {blogPostFeaturedImagePreview && (
                        <div className="mt-2">
                          <Image
                            src={blogPostFeaturedImagePreview || "/placeholder.svg"}
                            alt="Featured Image Preview"
                            width={200}
                            height={120}
                            className="rounded-md object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label htmlFor="blog-post-meta-description">Meta Description</Label>
                      <Button
                        type="button"
                        onClick={handleGenerateSeo}
                        disabled={isGeneratingSeo}
                        className="h-8 px-3 text-xs"
                      >
                        <SparklesIcon className="h-3 w-3 mr-1" />
                        {isGeneratingSeo ? "Generating..." : "Generate SEO"}
                      </Button>
                    </div>
                    <Textarea
                      id="blog-post-meta-description"
                      value={blogPostMetaDescription}
                      onChange={(e) => setBlogPostMetaDescription(e.target.value)}
                      placeholder="Brief description for search engines (150-160 characters)..."
                      className="jupiter-input"
                      maxLength={160}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {blogPostMetaDescription.length}/160 characters
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="blog-post-keywords">Keywords (comma-separated)</Label>
                    <Input
                      id="blog-post-keywords"
                      value={blogPostKeywords}
                      onChange={(e) => setBlogPostKeywords(e.target.value)}
                      placeholder="keyword1, keyword2, keyword3"
                      className="jupiter-input"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isBlogPostSaving}
                    className="jupiter-button-dark h-10 px-4 flex items-center gap-2"
                  >
                    <SaveIcon className="h-4 w-4" />
                    {isBlogPostSaving ? "Saving..." : editingBlogPost ? "Update Blog Post" : "Create Blog Post"}
                  </Button>
                </form>

                {/* Blog Posts List */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Blog Posts ({blogPosts.length})</h3>
                    <div className="flex gap-2">
                      <Button onClick={handleNewBlogPost} className="h-8 px-3 text-xs">
                        <PlusIcon className="h-3 w-3 mr-1" />
                        New Post
                      </Button>
                      <Button onClick={fetchBlogPosts} disabled={isFetchingBlogPosts} className="h-8 px-3 text-xs">
                        <RefreshCwIcon className="h-3 w-3 mr-1" />
                        Refresh
                      </Button>
                    </div>
                  </div>

                  {isFetchingBlogPosts ? (
                    <p className="text-center text-muted-foreground">Loading blog posts...</p>
                  ) : blogPosts.length === 0 ? (
                    <p className="text-center text-muted-foreground">No blog posts created yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {blogPosts.map((post) => (
                        <div key={post.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-medium">{post.title}</h4>
                                <span
                                  className={`text-xs px-2 py-1 rounded-md ${
                                    post.status === "published"
                                      ? "bg-green-100 text-green-800"
                                      : post.status === "draft"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : "bg-gray-100 text-gray-800"
                                  }`}
                                >
                                  {post.status}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                Slug: /{post.slug} • Created: {new Date(post.created_at).toLocaleDateString()}
                                {post.updated_at && post.updated_at !== post.created_at && (
                                  <> • Updated: {new Date(post.updated_at).toLocaleDateString()}</>
                                )}
                              </p>
                              {post.meta_description && (
                                <p className="text-sm text-muted-foreground">{post.meta_description}</p>
                              )}
                              {post.keywords && post.keywords.length > 0 && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Keywords: {post.keywords.join(", ")}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-2 ml-4">
                              {post.status === "published" && (
                                <Button
                                  onClick={() => window.open(`/blog/${post.slug}`, "_blank")}
                                  className="h-8 w-8 p-0"
                                  title="View Post"
                                >
                                  <EyeIcon className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                onClick={() => handleEditBlogPost(post)}
                                className="h-8 w-8 p-0"
                                title="Edit Post"
                              >
                                <EditIcon className="h-4 w-4" />
                              </Button>
                              <Button
                                onClick={() => handleDeleteBlogPost(post.id)}
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive-foreground hover:bg-destructive"
                                title="Delete Post"
                              >
                                <Trash2Icon className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
