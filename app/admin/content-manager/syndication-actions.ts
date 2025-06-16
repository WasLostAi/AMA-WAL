"use server"

import { supabaseAdmin } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import { generateText } from "ai"
// Import the 'openai' client directly for both text generation and embeddings
import { openai } from "@ai-sdk/openai"

interface AgentProfileData {
  personal: any
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
  chatbotInstructions: any
}

interface GeneratedPost {
  title?: string
  content: string
  platform: string
  contentType: string
  metadata?: Record<string, any>
}

// Helper to fetch agent profile data including config_data
async function getAgentProfileWithConfig(): Promise<{ data: AgentProfileData | null; message?: string }> {
  try {
    const { data, error } = await supabaseAdmin.from("agent_profile").select("profile_data").limit(1).maybeSingle()

    if (error) {
      console.error("Error fetching agent profile for syndication actions:", error)
      return { data: null, message: `Failed to fetch agent profile: ${error.message}` }
    }

    if (!data) {
      console.warn("No agent profile found in database for syndication actions.")
      return { data: null, message: "No agent profile found." }
    }

    return { data: data.profile_data as AgentProfileData }
  } catch (error) {
    console.error("Unexpected error in getAgentProfileWithConfig:", error)
    return {
      data: null,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

// Helper to fetch RAG context
async function getRagContext(query: string): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    console.warn("OPENAI_API_KEY not set, skipping RAG context retrieval.")
    return ""
  }

  // Use the imported 'openai' client directly for embeddings
  try {
    const { embedding } = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: query,
    })

    const { data: documents, error: dbError } = await supabaseAdmin.rpc("match_documents", {
      query_embedding: embedding,
      match_threshold: 0.5,
      match_count: 5,
    })

    if (dbError) {
      console.error("Error querying Supabase for RAG documents:", dbError)
      return ""
    }

    return documents && documents.length > 0 ? documents.map((doc: any) => doc.content).join("\n\n") : ""
  } catch (error) {
    console.error("Error during RAG context retrieval:", error)
    return ""
  }
}

export async function generateAndSyndicateContent(
  prevState: any,
  formData: FormData,
): Promise<{ success: boolean; message: string; generatedPost?: GeneratedPost }> {
  const topic = formData.get("topic") as string
  const platform = formData.get("platform") as string // 'twitter', 'linkedin', 'medium', 'github'
  const contentType = formData.get("contentType") as string // 'tweet', 'linkedin-post', 'blog-excerpt', 'code-snippet'

  if (!topic || !platform || !contentType) {
    return { success: false, message: "Topic, platform, and content type are required." }
  }

  if (!process.env.OPENAI_API_KEY) {
    return { success: false, message: "Server configuration error: OpenAI API key is missing." }
  }

  try {
    const { data: agentProfile, message: profileMessage } = await getAgentProfileWithConfig()
    if (!agentProfile) {
      return { success: false, message: profileMessage || "Failed to retrieve agent profile for content generation." }
    }

    const contentGuidelines = agentProfile.company?.config_data?.content_guidelines || {}
    const brandVoice = contentGuidelines.brand_voice || "professional, innovative"
    const tone = contentGuidelines.tone || "informative, confident"
    const keywordsFocus = contentGuidelines.keywords_focus?.join(", ") || "AI, Web3, Decentralized AI"
    const audience = contentGuidelines.audience || "tech enthusiasts, developers"

    const ragContext = await getRagContext(topic)

    const systemPrompt = `You are an AI content agent for WasLost.Ai, representing Michael P. Robinson.
                        Your goal is to generate concise, platform-optimized content based on the user's topic.
                        Adhere to the following brand guidelines:
                        Brand Voice: ${brandVoice}
                        Tone: ${tone}
                        Keywords Focus: ${keywordsFocus}
                        Audience: ${audience}
                        
                        If RAG context is provided, integrate it naturally to enhance depth and accuracy.
                        If no relevant RAG context, generate content based on general knowledge and WasLost.Ai's profile.
                        Output should be a JSON object with 'title' (optional, for internal reference) and 'content' (the actual post text).
                        Do NOT include any introductory or concluding text outside the JSON.`

    let userPrompt = `Generate a ${contentType} for ${platform} about: "${topic}".`

    if (platform === "twitter") {
      userPrompt += ` Keep it under 280 characters, use relevant hashtags, and be engaging.`
    } else if (platform === "linkedin") {
      userPrompt += ` Make it a professional, long-form post suitable for LinkedIn, encouraging engagement.`
    } else if (platform === "medium") {
      userPrompt += ` Generate a short blog excerpt suitable for a Medium article, focusing on key takeaways.`
    } else if (platform === "github") {
      userPrompt += ` Generate a concise code snippet or technical update relevant to the topic, suitable for a GitHub README or issue comment.`
    }

    if (ragContext) {
      userPrompt += `\n\nAdditional context from relevant documents:\n\n${ragContext}`
    }

    const { text: aiResponseText } = await generateText({
      model: openai("gpt-4o"),
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.7,
      max_tokens: 1000,
    })

    const jsonStartIndex = aiResponseText.indexOf("{")
    const jsonEndIndex = aiResponseText.lastIndexOf("}")

    if (jsonStartIndex === -1 || jsonEndIndex === -1 || jsonEndIndex < jsonStartIndex) {
      throw new Error("AI response did not contain a valid JSON object.")
    }

    const extractedJsonString = aiResponseText.substring(jsonStartIndex, jsonEndIndex + 1)
    const generatedData = JSON.parse(extractedJsonString)

    if (!generatedData.content) {
      throw new Error("AI response missing required 'content' field.")
    }

    const newPost: GeneratedPost = {
      title: generatedData.title || topic,
      content: generatedData.content,
      platform: platform,
      contentType: contentType,
      metadata: {
        character_count: generatedData.content.length,
        word_count: generatedData.content.split(/\s+/).filter(Boolean).length,
      },
    }

    // Simulate syndication by saving to Supabase
    const { error: insertError } = await supabaseAdmin.from("agent_posts").insert({
      title: newPost.title,
      content: newPost.content,
      platform: newPost.platform,
      content_type: newPost.contentType,
      status: "pending", // Set to pending, actual syndication would change to 'syndicated'
      metadata: newPost.metadata,
    })

    if (insertError) {
      console.error("Error saving generated post to Supabase:", insertError)
      return { success: false, message: `Failed to save generated post: ${insertError.message}` }
    }

    revalidatePath("/admin") // Revalidate admin page to show new logs
    console.log(`Generated and "syndicated" content for ${platform}:`, newPost.title)

    return { success: true, message: "Content generated and queued for syndication!", generatedPost: newPost }
  } catch (error) {
    console.error("Error generating and syndicating content:", error)
    return {
      success: false,
      message: `Failed to generate and syndicate content: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

export async function getSyndicationLogs(): Promise<{ data: GeneratedPost[] | null; message?: string }> {
  try {
    const { data, error } = await supabaseAdmin
      .from("agent_posts")
      .select("id, title, content, platform, content_type, status, generated_at, syndicated_at, metadata")
      .order("generated_at", { ascending: false })
      .limit(20) // Fetch last 20 logs

    if (error) {
      console.error("Error fetching syndication logs:", error)
      return { data: null, message: `Failed to fetch syndication logs: ${error.message}` }
    }

    return { data: data as GeneratedPost[] }
  } catch (error) {
    console.error("Unexpected error in getSyndicationLogs:", error)
    return {
      data: null,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}
