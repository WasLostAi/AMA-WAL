"use client"

import type React from "react"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useActionState } from "react"
import { saveSocialPostsMarkdown } from "./social-post-actions" // Renamed import
import { uploadFileWithTag, getFileMetadata, deleteFile } from "./file-upload-actions" // New actions
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input" // Assuming you have Input
import { initialProjectUpdatesMarkdown } from "@/lib/current-projects"
import { useWallet } from "@solana/wallet-adapter-react"
import { useRouter } from "next/navigation"
import { XIcon, UploadCloudIcon, FileTextIcon, ImageIcon, FileIcon, Trash2Icon } from "lucide-react" // Icons

interface FileMetadata {
  fileName: string
  filePath: string
  tags: string[]
  contentType: string
  uploadedAt: string
}

export default function ContentManagerPage() {
  const router = useRouter()
  const { publicKey, connected } = useWallet()

  // Your specific authorized wallet address
  const authorizedWalletAddress = useMemo(() => process.env.NEXT_PUBLIC_AUTHORIZED_SOLANA_WALLET, [])

  // Check if the connected wallet is YOUR authorized wallet
  const isAuthorized = useMemo(() => {
    return connected && publicKey?.toBase58() === authorizedWalletAddress
  }, [connected, publicKey, authorizedWalletAddress])

  // State for Social Post Editor
  const [markdownContent, setMarkdownContent] = useState(initialProjectUpdatesMarkdown)
  const [socialPostState, socialPostFormAction, isSocialPostPending] = useActionState(saveSocialPostsMarkdown, {
    message: "",
    success: false,
  })

  // State for File Uploads
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileTagInput, setFileTagInput] = useState<string>("")
  const [previouslyUsedTags, setPreviouslyUsedTags] = useState<string[]>([])
  const [uploadedFiles, setUploadedFiles] = useState<FileMetadata[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [fileUploadState, fileUploadAction, isFileUploadPending] = useActionState(uploadFileWithTag, {
    message: "",
    success: false,
  })
  const [isFetchingFiles, setIsFetchingFiles] = useState(true)

  useEffect(() => {
    if (!connected || !isAuthorized) {
      router.push("/") // Redirect if not authorized
    }
  }, [connected, isAuthorized, router])

  useEffect(() => {
    if (socialPostState.message) {
      alert(socialPostState.message)
    }
  }, [socialPostState])

  useEffect(() => {
    if (fileUploadState.message) {
      alert(fileUploadState.message)
      if (fileUploadState.success) {
        setSelectedFile(null)
        setFileTagInput("")
        fetchFileMetadata() // Refresh the list of uploaded files
      }
    }
  }, [fileUploadState])

  const fetchFileMetadata = useCallback(async () => {
    setIsFetchingFiles(true)
    try {
      const metadata = await getFileMetadata()
      setUploadedFiles(metadata.files)
      setPreviouslyUsedTags(Array.from(new Set(metadata.files.flatMap((f) => f.tags))))
    } catch (error) {
      console.error("Failed to fetch file metadata:", error)
      alert("Failed to load uploaded files.")
    } finally {
      setIsFetchingFiles(false)
    }
  }, [])

  useEffect(() => {
    if (isAuthorized) {
      fetchFileMetadata()
    }
  }, [isAuthorized, fetchFileMetadata])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0])
      // Prompt for tag if dropped, or require it before upload
      // For now, we'll just set the file and rely on the input field
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile) {
      alert("Please select a file to upload.")
      return
    }
    if (!fileTagInput.trim()) {
      alert("Please provide at least one tag for the file.")
      return
    }

    const formData = new FormData()
    formData.append("file", selectedFile)
    formData.append("tags", fileTagInput.trim())

    // Call the server action via useActionState's action function
    fileUploadAction(formData)
  }

  const handleDeleteFile = async (filePath: string) => {
    if (confirm(`Are you sure you want to delete ${filePath}?`)) {
      try {
        const result = await deleteFile(filePath)
        if (result.success) {
          alert(result.message)
          fetchFileMetadata() // Refresh the list
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
    if (contentType.includes("pdf") || contentType.includes("document") || contentType.includes("text")) {
      return <FileTextIcon className="h-6 w-6 text-[#afcd4f]" />
    }
    return <FileIcon className="h-6 w-6 text-[#afcd4f]" />
  }

  // Only render the editor if authorized
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
              Upload images, planning documents, or other files for the AI agent to reference. Tag them for easy
              retrieval.
            </p>
            <form onSubmit={handleFileUpload} className="space-y-4">
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
                  {selectedFile ? selectedFile.name : "Drag & drop files here, or click to select"}
                </p>
                <input
                  id="file-input"
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={isFileUploadPending}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="file-tag" className="block text-sm font-medium text-muted-foreground">
                  Tags (comma-separated)
                </label>
                <Input
                  id="file-tag"
                  type="text"
                  value={fileTagInput}
                  onChange={(e) => setFileTagInput(e.target.value)}
                  placeholder="e.g., project-alpha, roadmap, image, Q1-planning"
                  list="previously-used-tags"
                  className="bg-neumorphic-base shadow-inner-neumorphic text-white"
                  disabled={isFileUploadPending}
                />
                <datalist id="previously-used-tags">
                  {previouslyUsedTags.map((tag) => (
                    <option key={tag} value={tag} />
                  ))}
                </datalist>
              </div>

              <Button
                type="submit"
                className="jupiter-button-dark w-full h-12 px-6 bg-neumorphic-base hover:bg-neumorphic-base"
                disabled={isFileUploadPending || !selectedFile || !fileTagInput.trim()}
              >
                {isFileUploadPending ? "Uploading..." : "UPLOAD FILE"}
              </Button>
            </form>

            {/* Uploaded Files List */}
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
      </div>
    </main>
  )
}
