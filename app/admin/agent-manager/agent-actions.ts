"use server"

import { supabaseAdmin } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

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

// --- Agent Profile Actions ---

export async function getAgentProfileData(): Promise<{ data: AgentProfileData | null; message?: string }> {
  try {
    const { data, error } = await supabaseAdmin.from("agent_profile").select("profile_data").maybeSingle() // Use maybeSingle to handle 0 or 1 row

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

  if (!profileJsonString) {
    return { success: false, message: "No profile JSON provided." }
  }

  try {
    const profileData = JSON.parse(profileJsonString)

    // Attempt to update the existing single row.
    // If no row exists, insert it. This assumes the ID is known or we upsert.
    // For simplicity, we'll assume one row exists and update it.
    // A more robust solution might involve checking if a row exists first.
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
        .update({ profile_data: profileData, updated_at: new Date().toISOString() })
        .eq("id", existingProfile.id) // Update the existing row
      updateError = error
    } else {
      // If no profile exists, insert a new one.
      const { error } = await supabaseAdmin.from("agent_profile").insert({ profile_data: profileData })
      updateError = error
    }

    if (updateError) {
      console.error("Error updating agent profile:", updateError)
      return { success: false, message: `Failed to update agent profile: ${updateError.message}` }
    }

    revalidatePath("/api/chat") // Revalidate chat API to pick up new profile
    revalidatePath("/api/generate-social-posts") // Revalidate social posts API
    revalidatePath("/admin/agent-manager") // Revalidate this page

    return { success: true, message: "Agent profile updated successfully!" }
  } catch (error) {
    console.error("Error parsing or updating agent profile:", error)
    return {
      success: false,
      message: `Invalid JSON or unexpected error: ${error instanceof Error ? error.message : String(error)}`,
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

    revalidatePath("/api/chat") // Revalidate chat API
    revalidatePath("/admin/agent-manager") // Revalidate this page
    return { success: true, message: "Q&A added successfully!" }
  } catch (error) {
    console.error("Unexpected error in addTrainingQA:", error)
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

    revalidatePath("/api/chat") // Revalidate chat API
    revalidatePath("/admin/agent-manager") // Revalidate this page
    return { success: true, message: "Q&A deleted successfully!" }
  } catch (error) {
    console.error("Unexpected error in deleteTrainingQA:", error)
    return {
      success: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}
