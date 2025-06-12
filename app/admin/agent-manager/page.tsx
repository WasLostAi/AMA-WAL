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
import { XIcon, PlusIcon, Trash2Icon, SaveIcon } from "lucide-react"

import {
  getAgentProfileData,
  updateAgentProfileData,
  getTrainingQAs,
  addTrainingQA,
  deleteTrainingQA,
} from "./agent-actions"

interface AgentProfileData {
  personal: any
  professional: any
  company: any
  chatbotInstructions: any
}

interface TrainingQA {
  id: string
  question: string
  answer: string
}

export default function AgentManagerPage() {
  const router = useRouter()
  const { publicKey, connected } = useWallet()

  const authorizedWalletAddress = useMemo(() => process.env.NEXT_PUBLIC_AUTHORIZED_SOLANA_WALLET, [])
  const isAuthorized = useMemo(() => {
    return connected && publicKey?.toBase58() === authorizedWalletAddress
  }, [connected, publicKey, authorizedWalletAddress])

  const [profileJson, setProfileJson] = useState<string>("")
  const [profileState, profileFormAction, isProfilePending] = useActionState(updateAgentProfileData, {
    success: false,
    message: "",
  })
  const [isFetchingProfile, setIsFetchingProfile] = useState(true)

  const [trainingQAs, setTrainingQAs] = useState<TrainingQA[]>([])
  const [newQuestion, setNewQuestion] = useState("")
  const [newAnswer, setNewAnswer] = useState("")
  const [addQAState, addQAFormAction, isAddQAPending] = useActionState(addTrainingQA, {
    success: false,
    message: "",
  })
  const [isFetchingQAs, setIsFetchingQAs] = useState(true)

  useEffect(() => {
    if (!connected || !isAuthorized) {
      router.push("/") // Redirect if not authorized
    }
  }, [connected, isAuthorized, router])

  // Fetch Agent Profile Data
  const fetchAgentProfile = useCallback(async () => {
    setIsFetchingProfile(true)
    const { data, message } = await getAgentProfileData()
    if (data) {
      setProfileJson(JSON.stringify(data, null, 2))
    } else {
      console.error(message || "Failed to fetch agent profile.")
      alert(message || "Failed to fetch agent profile. Check console for details.")
    }
    setIsFetchingProfile(false)
  }, [])

  // Fetch Training Q&A Data
  const fetchTrainingQAs = useCallback(async () => {
    setIsFetchingQAs(true)
    const { data, message } = await getTrainingQAs()
    if (data) {
      setTrainingQAs(data)
    } else {
      console.error(message || "Failed to fetch training Q&As.")
      alert(message || "Failed to fetch training Q&As. Check console for details.")
    }
    setIsFetchingQAs(false)
  }, [])

  useEffect(() => {
    if (isAuthorized) {
      fetchAgentProfile()
      fetchTrainingQAs()
    }
  }, [isAuthorized, fetchAgentProfile, fetchTrainingQAs])

  useEffect(() => {
    if (profileState.message) {
      alert(profileState.message)
    }
  }, [profileState])

  useEffect(() => {
    if (addQAState.message) {
      alert(addQAState.message)
      if (addQAState.success) {
        setNewQuestion("")
        setNewAnswer("")
        fetchTrainingQAs() // Refresh Q&A list
      }
    }
  }, [addQAState, fetchTrainingQAs])

  const handleAddQA = async (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData()
    formData.append("question", newQuestion)
    formData.append("answer", newAnswer)
    addQAFormAction(formData)
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

        {/* Agent Profile Editor Card */}
        <Card className="w-full jupiter-outer-panel p-6">
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
                <Textarea
                  name="profileJson"
                  value={profileJson}
                  onChange={(e) => setProfileJson(e.target.value)}
                  placeholder="Paste agent profile JSON here..."
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

            {/* Add New Q&A Form */}
            <form onSubmit={handleAddQA} className="space-y-4 mb-8 p-4 neumorphic-inset rounded-lg">
              <h3 className="text-lg font-semibold text-white">Add New Q&A</h3>
              <div>
                <label htmlFor="new-question" className="block text-sm font-medium text-muted-foreground mb-1">
                  Question
                </label>
                <Input
                  id="new-question"
                  type="text"
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  placeholder="e.g., What is Michael's background in AI?"
                  className="bg-neumorphic-base shadow-inner-neumorphic text-white"
                  disabled={isAddQAPending}
                  required
                />
              </div>
              <div>
                <label htmlFor="new-answer" className="block text-sm font-medium text-muted-foreground mb-1">
                  Answer
                </label>
                <Textarea
                  id="new-answer"
                  value={newAnswer}
                  onChange={(e) => setNewAnswer(e.target.value)}
                  placeholder="e.g., Michael has extensive experience in AI development, including..."
                  className="min-h-[100px] bg-neumorphic-base shadow-inner-neumorphic text-white"
                  disabled={isAddQAPending}
                  required
                />
              </div>
              <Button
                type="submit"
                className="jupiter-button-dark w-full h-10 px-4 bg-neumorphic-base hover:bg-neumorphic-base"
                disabled={isAddQAPending || !newQuestion.trim() || !newAnswer.trim()}
              >
                {isAddQAPending ? (
                  "Adding Q&A..."
                ) : (
                  <>
                    <PlusIcon className="h-4 w-4 mr-2" /> ADD Q&A
                  </>
                )}
              </Button>
            </form>

            {/* Existing Q&A List */}
            <h3 className="text-xl font-bold text-[#afcd4f] mt-8 mb-4 text-center">Existing Q&A Pairs</h3>
            {isFetchingQAs ? (
              <p className="text-center text-muted-foreground">Loading Q&A pairs...</p>
            ) : trainingQAs.length === 0 ? (
              <p className="text-center text-muted-foreground">No Q&A pairs added yet.</p>
            ) : (
              <div className="space-y-3">
                {trainingQAs.map((qa) => (
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
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteQA(qa.id)}
                      className="text-red-500 hover:bg-red-500/20 flex-shrink-0"
                      aria-label={`Delete Q&A: ${qa.question}`}
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
