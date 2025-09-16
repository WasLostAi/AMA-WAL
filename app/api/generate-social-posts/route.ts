import { NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET(request: Request) {
  // Ensure API key is set first
  if (!process.env.OPENAI_API_KEY) {
    console.error("Error: OPENAI_API_KEY environment variable is not configured.")
    return NextResponse.json(
      {
        error: "Server configuration error: OpenAI API key is missing.",
        suggestion: "Please ensure the OPENAI_API_KEY environment variable is correctly set in Vercel.",
      },
      { status: 500 },
    )
  }

  const { searchParams } = new URL(request.url)
  const type = searchParams.get("type") // 'twitter' or 'linkedin'

  if (!type || (type !== "twitter" && type !== "linkedin")) {
    return NextResponse.json({ error: "Invalid or missing 'type' parameter." }, { status: 400 })
  }

  // --- Fetch agent profile data from Supabase with better error handling ---
  let chatbotData: any = {
    personal: {
      name: "Michael P. Robinson",
      nickname: "Mike",
      mission: "empower through AI",
    },
    professional: {
      currentRole: "AI Developer",
      skills: ["AI", "Web3"],
      keyAchievements: [],
    },
    company: {
      name: "WasLost LLC",
      product: "WasLost.Ai",
      description: "AI agent ecosystem",
      projects: [],
      config_data: {},
    },
  }

  try {
    console.log("Attempting to fetch agent profile from Supabase...")

    const { data: profileData, error: profileError } = await supabaseAdmin
      .from("agent_profile")
      .select("profile_data")
      .limit(1)
      .maybeSingle()

    if (profileError) {
      console.error("Supabase profile fetch error:", {
        message: profileError.message,
        details: profileError.details,
        hint: profileError.hint,
        code: profileError.code,
      })

      if (profileError.code === "42P01") {
        console.warn("Agent profile table not found, using fallback data")
      } else if (profileError.code === "42703") {
        console.warn("Profile data column not found, using fallback data")
      } else {
        console.warn(`Supabase error (${profileError.code}): ${profileError.message}, using fallback data`)
      }
    } else if (profileData?.profile_data) {
      // Validate the profile data structure
      if (typeof profileData.profile_data === "object" && profileData.profile_data !== null) {
        console.log("Successfully fetched agent profile from Supabase")
        chatbotData = {
          ...chatbotData,
          ...profileData.profile_data,
        }
      } else {
        console.warn("Invalid profile_data format, using fallback data")
      }
    } else {
      console.warn("No agent profile data found in Supabase, using fallback data")
    }
  } catch (dbFetchError) {
    console.error("Unexpected error during Supabase profile fetch:", dbFetchError)
    console.warn("Using fallback chatbot data due to database error")
  }

  // Extract content guidelines safely
  const contentGuidelines = chatbotData.company?.config_data?.content_guidelines || {}
  const brandVoice = contentGuidelines.brand_voice || "professional, innovative"
  const tone = contentGuidelines.tone || "informative, confident"
  const keywordsFocus = Array.isArray(contentGuidelines.keywords_focus)
    ? contentGuidelines.keywords_focus.join(", ")
    : "AI, Web3, Decentralized AI"
  const audience = contentGuidelines.audience || "tech enthusiasts, developers"

  // --- Fetch current project updates from local public directory ---
  let currentProjectUpdates = ""
  try {
    const baseUrl = process.env.NEXT_PUBLIC_VERCEL_URL
      ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
      : "http://localhost:3000"

    const response = await fetch(`${baseUrl}/social-posts-source.md`, {
      next: { revalidate: 86400 },
    })

    if (response.ok) {
      currentProjectUpdates = await response.text()
      console.log("Fetched current project updates successfully.")
    } else {
      console.warn(`Could not fetch project updates. Status: ${response.status}`)
      currentProjectUpdates = "No specific recent project updates available. Generate based on general profile."
    }
  } catch (localFetchError) {
    console.error("Error fetching current project updates:", localFetchError)
    currentProjectUpdates = "Error fetching recent project updates. Generate based on general profile."
  }

  const profileContext = `
    Here is general information about Michael P. Robinson and WasLost.Ai:
    Name: ${chatbotData.personal?.name || "Michael P. Robinson"} (${chatbotData.personal?.nickname || "Mike"})
    Current Role: ${chatbotData.professional?.currentRole || "AI Developer"}
    Skills: ${Array.isArray(chatbotData.professional?.skills) ? chatbotData.professional.skills.join("; ") : "AI, Web3, Trading"}
    Company: ${chatbotData.company?.name || "WasLost LLC"} - ${chatbotData.company?.product || "WasLost.Ai"}
    Company Description: ${chatbotData.company?.description || "An AI agent ecosystem."}
    Mission: ${chatbotData.personal?.mission || "To empower through AI."}
    Key Achievements: ${
      Array.isArray(chatbotData.professional?.keyAchievements) && chatbotData.professional.keyAchievements.length > 0
        ? chatbotData.professional.keyAchievements.map((ach: string) => `- ${ach}`).join("\n")
        : "No key achievements listed."
    }
    Projects:
    ${
      Array.isArray(chatbotData.company?.projects) && chatbotData.company.projects.length > 0
        ? chatbotData.company.projects
            .map(
              (project: { name: string; details: string[] }) =>
                `  - ${project.name}: ${Array.isArray(project.details) ? project.details.join(", ") : project.details}`,
            )
            .join("\n")
        : "No projects listed."
    }

    --- Recent Project Updates (Markdown format, use this primarily for content): ---
    ${currentProjectUpdates}
  `

  let systemPrompt = ""
  let prompt = ""
  const handle = "waslostai"

  if (type === "twitter") {
    systemPrompt = `You are a Twitter content generator for a user named @${handle}.
                    Adhere to the following brand guidelines:
                    Brand Voice: ${brandVoice}
                    Tone: ${tone}
                    Keywords Focus: ${keywordsFocus}
                    Generate 5 recent-looking tweets about AI, Web3, and trading automation.
                    Prioritize content from the "Recent Project Updates" section provided.
                    Each tweet should be concise, realistic, and sound like it comes from a professional in these fields.
                    Format your response as a JSON array of objects, where each object has a 'headline' (short summary) and 'content' (the full tweet text).
                    Do NOT include any introductory or concluding text, only the JSON array.
                    Ensure the content is relevant to @${handle}'s expertise.`
    prompt = `Generate 5 tweets for @${handle} using the following context:\n${profileContext}`
  } else if (type === "linkedin") {
    systemPrompt = `You are a LinkedIn content generator for a user named @${handle} (Michael P. Robinson).
                    Adhere to the following brand guidelines:
                    Brand Voice: ${brandVoice}
                    Tone: ${tone}
                    Keywords Focus: ${keywordsFocus}
                    Generate 5 recent-looking LinkedIn posts about professional topics like AI, Web3, decentralized applications, career insights, or company updates.
                    Prioritize content from the "Recent Project Updates" section provided.
                    Each post should be professional, concise, and realistic for a LinkedIn feed.
                    Format your response as a JSON array of objects, where each object has a 'headline' (short summary/topic) and 'content' (the full post text).
                    Do NOT include any introductory or concluding text, only the JSON array.
                    Ensure the content is relevant to Michael P. Robinson's professional background and WasLost.Ai.`
    prompt = `Generate 5 LinkedIn posts for Michael P. Robinson (@${handle}) using the following context:\n${profileContext}`
  }

  const { text } = await generateText({
    model: openai("gpt-4o"),
    system: systemPrompt,
    prompt: prompt,
  })

  const rawAiResponse = text.trim()
  console.log("Raw AI response before JSON parsing:", rawAiResponse.substring(0, 200) + "...")

  // Robust JSON extraction: find the first '[' and last ']' for an array
  const jsonStartIndex = rawAiResponse.indexOf("[")
  const jsonEndIndex = rawAiResponse.lastIndexOf("]")

  if (jsonStartIndex === -1 || jsonEndIndex === -1 || jsonEndIndex < jsonStartIndex) {
    throw new Error("AI response did not contain a valid JSON array.")
  }

  const extractedJsonString = rawAiResponse.substring(jsonStartIndex, jsonEndIndex + 1)

  let generatedPosts: any[] = []
  try {
    generatedPosts = JSON.parse(extractedJsonString)
    if (!Array.isArray(generatedPosts) || generatedPosts.some((p) => !p.headline || !p.content)) {
      throw new Error("AI response was not a valid array of post objects or missing required fields.")
    }
  } catch (parseError) {
    console.error(`Failed to parse AI generated text as JSON for ${type} posts:`, parseError)
    console.error("AI raw response (truncated):", rawAiResponse.substring(0, 500))
    console.error("Extracted JSON attempt:", extractedJsonString.substring(0, 500))
    return NextResponse.json(
      {
        error: `Failed to generate valid ${type} posts from AI. AI response format was unexpected.`,
        details: "AI returned non-JSON response",
      },
      { status: 500 },
    )
  }

  const posts = generatedPosts.map((post, index) => ({
    id: `${type}-ai-post-${index}-${Date.now()}`,
    type: type,
    headline: post.headline,
    content: post.content,
    createdAt: new Date().toISOString(),
  }))

  return NextResponse.json(posts)
}
