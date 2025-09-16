"use server"

import { supabaseAdmin } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import { put } from "@vercel/blob"

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
    config_data?: any
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

// Default fallback data
const DEFAULT_AGENT_DATA: AgentProfileData = {
  personal: {
    name: "Michael P. Robinson",
    nickname: "Mike",
    age: 35,
    location: "United States",
    background: "AI Developer and Entrepreneur",
    education: "Computer Science",
    mission: "To empower individuals and businesses through AI technology",
    contact: {
      email: "mike@waslost.ai",
      phone: "+1-555-0123",
    },
    personalStatement: "Passionate about creating AI solutions that make a real difference.",
    avatarUrl: "/placeholder-user.jpg",
  },
  professional: {
    currentRole: "AI Developer & Founder",
    skills: ["AI Development", "Web3", "Trading Automation", "Full-Stack Development"],
    keyAchievements: ["Built WasLost.Ai platform", "Developed AI trading systems", "Created decentralized AI agents"],
  },
  company: {
    name: "WasLost LLC",
    config_data: {
      content_guidelines: {
        brand_voice: "professional, innovative, approachable",
        tone: "informative, confident, helpful",
        keywords_focus: ["AI", "Web3", "Decentralized AI", "Trading", "Automation"],
        audience: "tech enthusiasts, developers, traders",
      },
    },
  },
  chatbotInstructions: {
    role: "AI Assistant and Developer Advocate",
    style: "Professional yet approachable, knowledgeable about AI and Web3",
    approach: "Provide helpful, accurate information while being engaging",
    limitations: "Cannot provide financial advice or make trades",
    initialGreeting: "Hello! I'm Mike's AI assistant. How can I help you today?",
  },
}

// --- Agent Profile Actions ---

export async function getAgentProfileData(): Promise<{ data: AgentProfileData | null; message?: string }> {
  try {
    // Test the connection first
    const { data: testData, error: testError } = await supabaseAdmin
      .from("agent_profile")
      .select("count", { count: "exact", head: true })

    if (testError) {
      console.error("Supabase connection test failed:", testError)

      if (testError.code === "42P01") {
        console.warn("Agent profile table does not exist. Using default data.")
        return {
          data: DEFAULT_AGENT_DATA,
          message: "Using default agent data. Database table not found.",
        }
      }

      console.warn("Database connection failed. Using default data.")
      return {
        data: DEFAULT_AGENT_DATA,
        message: "Using default agent data. Database connection failed.",
      }
    }

    // Now try to fetch the actual data
    const { data, error } = await supabaseAdmin.from("agent_profile").select("profile_data").limit(1).maybeSingle()

    if (error) {
      console.error("Error fetching agent profile:", error)
      return {
        data: DEFAULT_AGENT_DATA,
        message: "Using default agent data. Database query failed.",
      }
    }

    if (!data || !data.profile_data) {
      console.warn("No agent profile found in database. Using default data.")
      return {
        data: DEFAULT_AGENT_DATA,
        message: "Using default agent data. No profile found in database.",
      }
    }

    // Validate the profile data structure
    const profileData = data.profile_data as AgentProfileData
    if (!profileData.personal || !profileData.company || !profileData.chatbotInstructions) {
      console.warn("Invalid profile data structure. Using default data.")
      return {
        data: DEFAULT_AGENT_DATA,
        message: "Using default agent data. Invalid profile structure.",
      }
    }

    return { data: profileData }
  } catch (error) {
    console.error("Unexpected error in getAgentProfileData:", error)
    return {
      data: DEFAULT_AGENT_DATA,
      message: "Using default agent data. Unexpected error occurred.",
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
  const initialGreeting = formData.get("initialGreeting") as string
  const configDataJson = formData.get("configDataJson") as string
  const avatarUrl = formData.get("avatarUrl") as string

  if (!profileJsonString) {
    return { success: false, message: "No profile JSON provided." }
  }

  try {
    const baseProfile: AgentProfileData = JSON.parse(profileJsonString)

    // Parse config data safely
    let configData = {}
    if (configDataJson) {
      try {
        configData = JSON.parse(configDataJson)
      } catch (configError) {
        console.error("Error parsing config data JSON:", configError)
        return { success: false, message: "Invalid config data JSON format." }
      }
    }

    // Update chatbotInstructions and personal.avatarUrl
    const fullProfileData: AgentProfileData = {
      ...baseProfile,
      personal: {
        ...baseProfile.personal,
        avatarUrl: avatarUrl || baseProfile.personal?.avatarUrl,
      },
      company: {
        ...baseProfile.company,
        config_data: configData,
      },
      chatbotInstructions: {
        role: agentRole || baseProfile.chatbotInstructions?.role || "",
        style: agentStyle || baseProfile.chatbotInstructions?.style || "",
        approach: agentApproach || baseProfile.chatbotInstructions?.approach || "",
        limitations: agentLimitations || baseProfile.chatbotInstructions?.limitations || "",
        initialGreeting: initialGreeting || baseProfile.chatbotInstructions?.initialGreeting || "",
      },
    }

    const { data: existingProfile, error: fetchError } = await supabaseAdmin
      .from("agent_profile")
      .select("id")
      .limit(1)
      .maybeSingle()

    if (fetchError && fetchError.code !== "42P01") {
      console.error("Error checking for existing agent profile:", fetchError)
      return { success: false, message: `Failed to check profile existence: ${fetchError.message}` }
    }

    let updateError = null
    if (existingProfile) {
      const { error } = await supabaseAdmin
        .from("agent_profile")
        .update({
          profile_data: fullProfileData,
          updated_at: new Date().toISOString(),
        })
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
    revalidatePath("/")

    return { success: true, message: "Agent profile updated successfully!" }
  } catch (error) {
    console.error("Error parsing or updating agent profile:", error)
    return {
      success: false,
      message: `Invalid JSON or unexpected error: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

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

// --- Training Q&A Actions ---

export async function getTrainingQAs(): Promise<{ data: TrainingQA[] | null; message?: string }> {
  try {
    const { data, error } = await supabaseAdmin
      .from("agent_training_qa")
      .select("id, question, answer")
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Error fetching training Q&As:", error)
      return { data: [], message: `Failed to fetch training Q&As: ${error.message}` }
    }

    return { data: data as TrainingQA[] }
  } catch (error) {
    console.error("Unexpected error in getTrainingQAs:", error)
    return {
      data: [],
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
