"use server"

import { supabaseAdmin } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import { put } from "@vercel/blob" // Import put for image uploads

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
    avatarUrl?: string // New field for avatar URL
  }
  professional: any
  company: {
    name: string
    config_data?: any // Add this new field
  }
  chatbotInstructions: {
    role: string
    style: string
    approach: string
    limitations: string
    initialGreeting?: string // New field for initial greeting
  }
}

interface TrainingQA {
  id: string
  question: string
  answer: string
}

// --- Agent Profile Actions ---

export async function getAgentProfileData(): Promise<{ data: AgentProfileData | null; message?: string }> {
  try {
    const { data, error } = await supabaseAdmin.from("agent_profile").select("profile_data").maybeSingle()

    if (error) {
      console.error("Error fetching agent profile:", error)
      return { data: null, message: `Failed to fetch agent profile: ${error.message}` }
    }

    if (!data) {
      console.warn("No agent profile found in database. Please run the seed script.")
      return { data: null, message: "No agent profile found. Please run the seed script." }
    }

    return { data: data.profile_data as AgentProfileData }
  } catch (error) {
    console.error("Unexpected error in getAgentProfileData:", error)
    return {
      data: null,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

export async function updateAgentProfileData(
  prevState: any,
  formData: FormData,
): Promise<{ success: boolean; message: string }> {
  const profileJsonString = formData.get("profileJson") as string
  const agentRole = formData.get("agentRole") as string
  const agentStyle = formData.get("agentStyle") as string
  const agentApproach = formData.get("agentApproach") as string
  const agentLimitations = formData.get("agentLimitations") as string
  const initialGreeting = formData.get("initialGreeting") as string // New field
  const configDataJson = formData.get("configDataJson") as string // New field for config data
  const avatarUrl = formData.get("avatarUrl") as string // New field

  if (!profileJsonString) {
    return { success: false, message: "No profile JSON provided." }
  }

  try {
    const baseProfile: AgentProfileData = JSON.parse(profileJsonString)

    // Update chatbotInstructions and personal.avatarUrl
    const fullProfileData: AgentProfileData = {
      ...baseProfile,
      personal: {
        ...baseProfile.personal,
        avatarUrl: avatarUrl || baseProfile.personal?.avatarUrl, // Use new URL or keep existing
      },
      company: {
        ...baseProfile.company,
        ...(configDataJson ? JSON.parse(configDataJson) : {}), // Merge parsed config data
      },
      chatbotInstructions: {
        role: agentRole,
        style: agentStyle,
        approach: agentApproach,
        limitations: agentLimitations,
        initialGreeting: initialGreeting, // Set new initial greeting
      },
    }

    const { data: existingProfile, error: fetchError } = await supabaseAdmin
      .from("agent_profile")
      .select("id")
      .maybeSingle()

    if (fetchError) {
      console.error("Error checking for existing agent profile:", fetchError)
      return { success: false, message: `Failed to check profile existence: ${fetchError.message}` }
    }

    let updateError = null
    if (existingProfile) {
      const { error } = await supabaseAdmin
        .from("agent_profile")
        .update({ profile_data: fullProfileData, updated_at: new Date().toISOString() })
        .eq("id", existingProfile.id)
      updateError = error
    } else {
      const { error } = await supabaseAdmin.from("agent_profile").insert({ profile_data: fullProfileData })
      updateError = error
    }

    if (updateError) {
      console.error("Error updating agent profile:", updateError)
      return { success: false, message: `Failed to update agent profile: ${updateError.message}` }
    }

    revalidatePath("/api/chat")
    revalidatePath("/api/generate-social-posts")
    revalidatePath("/admin/agent-manager")
    revalidatePath("/admin")
    revalidatePath("/") // Revalidate home page to pick up new intro/avatar

    return { success: true, message: "Agent profile updated successfully!" }
  } catch (error) {
    console.error("Error parsing or updating agent profile:", error)
    return {
      success: false,
      message: `Invalid JSON or unexpected error: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

// New action for uploading agent avatar
export async function uploadAgentAvatar(
  prevState: any,
  formData: FormData,
): Promise<{ success: boolean; message: string; imageUrl?: string }> {
  const file = formData.get("file") as File

  if (!file) {
    return { success: false, message: "No image file provided." }
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error("BLOB_READ_WRITE_TOKEN environment variable is not set.")
    return { success: false, message: "Server configuration error: Blob storage token is missing." }
  }

  try {
    if (!file.type.startsWith("image/")) {
      return { success: false, message: "Only image files are allowed for avatar." }
    }

    const filePath = `agent-avatars/${Date.now()}-${file.name}`
    const blob = await put(filePath, file, {
      access: "public",
      contentType: file.type,
      addRandomSuffix: false,
    })

    console.log("Agent avatar uploaded to Vercel Blob:", blob.url)
    return { success: true, message: "Avatar uploaded successfully!", imageUrl: blob.url }
  } catch (error) {
    console.error("Error uploading agent avatar:", error)
    return {
      success: false,
      message: `Failed to upload avatar: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

// --- Training Q&A Actions (unchanged) ---

export async function getTrainingQAs(): Promise<{ data: TrainingQA[] | null; message?: string }> {
  try {
    const { data, error } = await supabaseAdmin
      .from("agent_training_qa")
      .select("id, question, answer")
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Error fetching training Q&As:", error)
      return { data: null, message: `Failed to fetch training Q&As: ${error.message}` }
    }

    return { data: data as TrainingQA[] }
  } catch (error) {
    console.error("Unexpected error in getTrainingQAs:", error)
    return {
      data: null,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

export async function addTrainingQA(
  prevState: any,
  formData: FormData,
): Promise<{ success: boolean; message: string }> {
  const question = formData.get("question") as string
  const answer = formData.get("answer") as string

  if (!question || !answer) {
    return { success: false, message: "Question and Answer are required." }
  }

  try {
    const { error } = await supabaseAdmin.from("agent_training_qa").insert({ question, answer })

    if (error) {
      console.error("Error adding training Q&A:", error)
      return { success: false, message: `Failed to add Q&A: ${error.message}` }
    }

    revalidatePath("/api/chat")
    revalidatePath("/admin")
    return { success: true, message: "Q&A added successfully!" }
  } catch (error) {
    console.error("Unexpected error in addTrainingQA:", error)
    return {
      success: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

export async function updateTrainingQA(
  prevState: any,
  formData: FormData,
): Promise<{ success: boolean; message: string }> {
  const id = formData.get("id") as string
  const question = formData.get("question") as string
  const answer = formData.get("answer") as string

  if (!id || !question || !answer) {
    return { success: false, message: "ID, Question, and Answer are required for update." }
  }

  try {
    const { error } = await supabaseAdmin.from("agent_training_qa").update({ question, answer }).eq("id", id)

    if (error) {
      console.error("Error updating training Q&A:", error)
      return { success: false, message: `Failed to update Q&A: ${error.message}` }
    }

    revalidatePath("/api/chat")
    revalidatePath("/admin")
    return { success: true, message: "Q&A updated successfully!" }
  } catch (error) {
    console.error("Unexpected error in updateTrainingQA:", error)
    return {
      success: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

export async function deleteTrainingQA(id: string): Promise<{ success: boolean; message: string }> {
  try {
    const { error } = await supabaseAdmin.from("agent_training_qa").delete().eq("id", id)

    if (error) {
      console.error("Error deleting training Q&A:", error)
      return { success: false, message: `Failed to delete Q&A: ${error.message}` }
    }

    revalidatePath("/api/chat")
    revalidatePath("/admin")
    return { success: true, message: "Q&A deleted successfully!" }
  } catch (error) {
    console.error("Unexpected error in deleteTrainingQA:", error)
    return {
      success: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}
