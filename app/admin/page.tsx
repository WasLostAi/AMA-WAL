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
  EyeOffIcon,
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
      setBlogPostFeaturedImagePreview(URL.URL.createObjectURL(file))
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
            <CardTitle className="text-center text-2xl font-bold text-[#afcd4f]">Site Data & SEO Tools</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4 text-center">
              Manually revalidate your sitemap, RSS feed, and blog pages to ensure the latest content is reflected.
            </p>
            <Button
              onClick={handleRevalidateSiteData}
              className="jupiter-button-dark w-full h-12 px-6"
              disabled={isRevalidatingSiteData}
            >
              {isRevalidatingSiteData ? (
                "Revalidating..."
              ) : (
                <>
                  <RefreshCwIcon className="h-4 w-4 mr-2" /> Revalidate Site Data
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Content Generation Section */}
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
                className="jupiter-button-dark w-full h-12 px-6"
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
              <div className="mt-6 p-4 neumorphic-inset rounded-lg">
                <h3 className="text-lg font-semibold text-[#afcd4f] mb-2">Generated Content Preview:</h3>
                {generatedContentPreview.title && (
                  <p className="text-sm font-medium text-white mb-1">Title: {generatedContentPreview.title}</p>
                )}
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{generatedContentPreview.content}</p>
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
              <div className="space-y-2">
                <Label htmlFor="generated-hashtags" className="block text-sm font-medium text-muted-foreground mb-1">
                  Generated Hashtags
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="generated-hashtags"
                    type="text"
                    value={generatedHashtags}
                    onChange={(e) => setGeneratedHashtags(e.target.value)}
                    placeholder="Click 'Generate Hashtags' to populate"
                    className="flex-1 bg-neumorphic-base shadow-inner-neumorphic text-white"
                    readOnly
                  />
                  <Button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(generatedHashtags)}
                    className="jupiter-button-dark h-10 px-4 flex items-center gap-2"
                    disabled={!generatedHashtags || generatedHashtags.trim() === ""}
                  >
                    <CopyIcon className="h-4 w-4" />
                  </Button>
                </div>
                <Button
                  type="button"
                  onClick={handleGenerateHashtags}
                  className="jupiter-button-dark w-full h-10 px-4 flex items-center gap-2"
                  disabled={isGeneratingHashtags || !markdownContent.trim()}
                >
                  {isGeneratingHashtags ? "Generating..." : <SparklesIcon className="h-4 w-4 mr-2" />} Generate Hashtags
                </Button>
              </div>
              <Button type="submit" className="jupiter-button-dark w-full h-12 px-6" disabled={isSocialPostPending}>
                {isSocialPostPending ? "Committing..." : "COMMIT SOCIAL POST UPDATES"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Blog Post & SEO Manager Card */}
        <Card className="w-full jupiter-outer-panel p-6 mt-8">
          <CardHeader>
            <CardTitle className="text-center text-2xl font-bold text-[#afcd4f]">Blog Post & SEO Manager</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4 text-center">
              Create, edit, and manage your blog posts. Use AI to generate SEO-friendly meta descriptions and keywords.
            </p>

            <div className="flex justify-end mb-4">
              <Button onClick={handleNewBlogPost} className="jupiter-button-dark h-10 px-4 flex items-center gap-2">
                <PlusIcon className="h-4 w-4" /> New Blog Post
              </Button>
            </div>

            <form
              onSubmit={handleBlogPostSave}
              className="space-y-4 mb-8 p-4 neumorphic-inset rounded-lg"
              id="blog-post-form"
            >
              <h3 className="text-lg font-semibold text-white">
                {editingBlogPost ? "Edit Blog Post" : "Create New Blog Post"}
              </h3>
              <div>
                <Label htmlFor="blog-title" className="block text-sm font-medium text-muted-foreground mb-1">
                  Title
                </Label>
                <Input
                  id="blog-title"
                  type="text"
                  value={blogPostTitle}
                  onChange={(e) => setBlogPostTitle(e.target.value)}
                  placeholder="Your amazing blog post title"
                  className="bg-neumorphic-base shadow-inner-neumorphic text-white"
                  disabled={isBlogPostSaving}
                  required
                />
              </div>
              <div>
                <Label htmlFor="blog-slug" className="block text-sm font-medium text-muted-foreground mb-1">
                  Slug (URL Path)
                </Label>
                <Input
                  id="blog-slug"
                  type="text"
                  value={blogPostSlug}
                  onChange={(e) =>
                    setBlogPostSlug(
                      e.target.value
                        .toLowerCase()
                        .replace(/\s+/g, "-")
                        .replace(/[^a-z0-9-]/g, ""),
                    )
                  }
                  placeholder="your-amazing-blog-post-title"
                  className="bg-neumorphic-base shadow-inner-neumorphic text-white"
                  disabled={isBlogPostSaving}
                  required
                />
              </div>
              <div>
                <Label htmlFor="blog-content" className="block text-sm font-medium text-muted-foreground mb-1">
                  Content (Markdown)
                </Label>
                <div className="relative overflow-hidden">
                  <RichTextEditor
                    value={blogPostContent}
                    onChange={setBlogPostContent}
                    disabled={isBlogPostSaving}
                    placeholder="Write your blog post content here..."
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="blog-status" className="block text-sm font-medium text-muted-foreground mb-1">
                    Status
                  </Label>
                  <Select
                    value={blogPostStatus}
                    onValueChange={(value) => setBlogPostStatus(value as BlogPost["status"])}
                    disabled={isBlogPostSaving}
                  >
                    <SelectTrigger className="w-full bg-neumorphic-base shadow-inner-neumorphic text-white">
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent className="bg-neumorphic-base text-white">
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="featured-image" className="block text-sm font-medium text-muted-foreground mb-1">
                    Featured Image
                  </Label>
                  <Input
                    id="featured-image"
                    type="file"
                    accept="image/*"
                    onChange={handleBlogPostFeaturedImageChange}
                    ref={blogPostFeaturedImageInputRef}
                    className="bg-neumorphic-base shadow-inner-neumorphic text-white"
                    disabled={isBlogPostSaving}
                  />
                  {blogPostFeaturedImagePreview && (
                    <div className="mt-2 flex items-center gap-2">
                      <Image
                        src={blogPostFeaturedImagePreview || "/placeholder.svg"}
                        alt="Featured Image Preview"
                        width={100}
                        height={60}
                        className="rounded-md object-cover"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleClearBlogPostFeaturedImage}
                        className="text-red-500 hover:bg-red-500/20"
                      >
                        Clear Image
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <h4 className="text-md font-semibold text-white mt-4 mb-2">SEO Metadata</h4>
              <div className="space-y-2">
                <div>
                  <Label htmlFor="meta-description" className="block text-sm font-medium text-muted-foreground mb-1">
                    Meta Description (for search engines)
                  </Label>
                  <Textarea
                    id="meta-description"
                    value={blogPostMetaDescription}
                    onChange={(e) => setBlogPostMetaDescription(e.target.value)}
                    placeholder="A concise summary of your blog post for search results."
                    className="min-h-[80px] bg-neumorphic-base shadow-inner-neumorphic text-white"
                    disabled={isBlogPostSaving}
                    maxLength={160}
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {blogPostMetaDescription.length} / 160 characters
                  </p>
                </div>
                <div>
                  <Label htmlFor="keywords" className="block text-sm font-medium text-muted-foreground mb-1">
                    Keywords (comma-separated)
                  </Label>
                  <Input
                    id="keywords"
                    type="text"
                    value={blogPostKeywords}
                    onChange={(e) => setBlogPostKeywords(e.target.value)}
                    placeholder="e.g., AI, Web3, Solana, Trading"
                    className="bg-neumorphic-base shadow-inner-neumorphic text-white"
                    disabled={isBlogPostSaving}
                  />
                </div>
                <Button
                  type="button"
                  onClick={handleGenerateSeo}
                  className="jupiter-button-dark w-full h-10 px-6 flex items-center gap-2"
                  disabled={isGeneratingSeo || !blogPostTitle.trim() || !blogPostContent.trim()}
                >
                  {isGeneratingSeo ? "Generating..." : <SparklesIcon className="h-4 w-4 mr-2" />} Generate SEO Metadata
                </Button>
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  className="jupiter-button-dark flex-1 h-12 px-6"
                  disabled={
                    isBlogPostSaving || !blogPostTitle.trim() || !blogPostSlug.trim() || !blogPostContent.trim()
                  }
                >
                  {isBlogPostSaving ? (
                    editingBlogPost ? (
                      "Saving Changes..."
                    ) : (
                      "Creating Post..."
                    )
                  ) : (
                    <>
                      <SaveIcon className="h-4 w-4 mr-2" /> {editingBlogPost ? "SAVE BLOG POST" : "CREATE BLOG POST"}
                    </>
                  )}
                </Button>
                {editingBlogPost && (
                  <Button
                    type="button"
                    onClick={handleNewBlogPost}
                    variant="ghost"
                    className="h-12 px-6 text-muted-foreground hover:text-white"
                    disabled={isBlogPostSaving}
                  >
                    Cancel Edit
                  </Button>
                )}
              </div>
            </form>

            <Collapsible className="w-full mt-8">
              <CollapsibleTrigger className="flex items-center justify-between w-full p-4 neumorphic-inset rounded-lg text-white font-semibold text-lg mb-4">
                Existing Blog Posts
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
                          <p className="text-xs text-muted-foreground mt-1">Slug: {post.slug}</p>
                          <p className="text-xs text-muted-foreground mt-1">Status: {post.status}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Last Updated: {new Date(post.updated_at || post.generated_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2 flex-shrink-0 mt-2 md:mt-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditBlogPost(post)}
                            className="text-[#afcd4f] hover:bg-[#afcd4f]/20"
                            aria-label={`Edit blog post: ${post.title}`}
                          >
                            <EditIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteBlogPost(post.id)}
                            className="text-red-500 hover:bg-red-500/20"
                            aria-label={`Delete blog post: ${post.title}`}
                          >
                            <Trash2Icon className="h-4 w-4" />
                          </Button>
                          {post.status === "published" ? (
                            <a
                              href={`/blog/${post.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 w-10 p-0 text-[#2ed3b7] hover:bg-[#2ed3b7]/20"
                              aria-label={`View published blog post: ${post.title}`}
                            >
                              <EyeIcon className="h-4 w-4" />
                            </a>
                          ) : (
                            <span
                              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors h-10 w-10 p-0 text-muted-foreground cursor-not-allowed"
                              aria-label={`Blog post is not published: ${post.title}`}
                            >
                              <EyeOffIcon className="h-4 w-4" />
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
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
                  className="jupiter-button-dark h-10 px-4 flex items-center gap-2"
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
              className="jupiter-button-dark w-full h-12 px-6 mt-4"
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
                        className="jupiter-button-dark w-full h-10 px-4"
                        disabled={!agentAvatarFile || isUploadingAvatar || isProfilePending}
                      >
                        {isUploadingAvatar ? "Uploading..." : "Upload Avatar"}
                      </Button>
                    </div>
                  </div>
                  {agentAvatarPreviewUrl && (
                    <p className="text-xs text-muted-foreground">Current Avatar URL: {agentAvatarPreviewUrl}</p>
                  )}
                  <input type="hidden" name="avatarUrl" value={agentAvatarPreviewUrl || ""} />
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
                <Button type="submit" className="jupiter-button-dark w-full h-12 px-6" disabled={isProfilePending}>
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
                  className="jupiter-button-dark flex-1 h-10 px-4"
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

        {/* Adaptive Frontend Management */}
        <Card className="w-full jupiter-outer-panel p-6 mt-8">
          <CardHeader>
            <CardTitle className="text-center text-2xl font-bold text-[#afcd4f]">
              Adaptive Frontend Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeAdminTab} onValueChange={setActiveAdminTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-neumorphic-base">
                <TabsTrigger value="content">Content Manager</TabsTrigger>
                <TabsTrigger value="modes">Mode Selection</TabsTrigger>
                <TabsTrigger value="setup">Smart Setup</TabsTrigger>
                <TabsTrigger value="preview">Live Preview</TabsTrigger>
              </TabsList>

              <TabsContent value="content" className="mt-6">
                <ContentManager currentMode={currentMode || "none"} />
              </TabsContent>

              <TabsContent value="modes" className="mt-6">
                <ModeSelector
                  currentMode={currentMode || undefined}
                  onModeSelect={async (modeId) => {
                    await setMode(modeId as any)
                  }}
                />
              </TabsContent>

              <TabsContent value="setup" className="mt-6">
                <SmartSetup />
              </TabsContent>

              <TabsContent value="preview" className="mt-6">
                <div className="neumorphic-base p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-[#afcd4f] mb-4">Live Preview</h3>
                  <p className="text-white/70 mb-4">
                    Preview your adaptive frontend in real-time. Changes made in the Content Manager will be reflected
                    here.
                  </p>
                  <div className="bg-neumorphic-base border border-border/20 rounded-lg h-96 flex items-center justify-center">
                    <p className="text-white/60">Live preview will be rendered here</p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Admin Assistant - Always visible */}
        <AdminAssistant />
      </div>
    </main>
  )
}
