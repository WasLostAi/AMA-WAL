import { NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { chatbotData } from "@/lib/chatbot-data"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get("type") // 'twitter' or 'linkedin'

  if (!type || (type !== "twitter" && type !== "linkedin")) {
    return NextResponse.json({ error: "Invalid or missing 'type' parameter." }, { status: 400 })
  }

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

  let currentProjectSnippets = ""
  try {
    // Fetch current project snippets from Vercel Blob
    // Use a fixed filename for the content
    const blobUrl = `https://${process.env.VERCEL_BLOB_STORE_ID}.blob.vercel-storage.com/current-projects.md`
    const blobResponse = await fetch(blobUrl, {
      next: { revalidate: 86400 }, // Revalidate daily (24 hours * 60 min * 60 sec)
    })

    if (blobResponse.ok) {
      currentProjectSnippets = await blobResponse.text()
      console.log("Fetched current project snippets from Blob.")
    } else {
      console.warn(
        `Failed to fetch current-projects.md from Blob (Status: ${blobResponse.status}). Using default or empty.`,
      )
      // Fallback to default if Blob fetch fails
      // currentProjectSnippets = DEFAULT_PROJECT_SNIPPETS; // If you want to use a hardcoded default
    }
  } catch (blobError) {
    console.error("Error fetching current projects from Vercel Blob:", blobError)
    // currentProjectSnippets = DEFAULT_PROJECT_SNIPPETS; // If you want to use a hardcoded default
  }

  const profileContext = `
    Here is information about Michael P. Robinson and WasLost.Ai to help you generate realistic posts:
    Name: ${chatbotData.personal.name} (${chatbotData.personal.nickname})
    Current Role: ${chatbotData.professional.currentRole}
    Skills: ${chatbotData.professional.skills.join("; ")}
    Company: ${chatbotData.company.name} - ${chatbotData.company.product}
    Company Description: ${chatbotData.company.description}
    Mission: ${chatbotData.personal.mission}
    Key Achievements: ${chatbotData.professional.keyAchievements.map((ach) => `- ${ach}`).join("\n")}
    Projects:
    ${chatbotData.company.projects.map((project) => `  - ${project.name}: ${project.details.join(", ")}`).join("\n")}

    --- Latest Project Snippets (Prioritize this for recent posts) ---
    ${currentProjectSnippets || "No recent snippets provided. Generate based on general profile."}
  `

  let systemPrompt = ""
  let prompt = ""
  const handle = "waslostai" // Your consistent handle

  if (type === "twitter") {
    systemPrompt = `You are a Twitter content generator for a user named @${handle}.
                    Generate 5 recent-looking tweets about AI, Web3, and trading automation, based on the provided profile context and *especially* the "Latest Project Snippets".
                    Each tweet should be concise, realistic, and sound like it comes from a professional in these fields.
                    Format your response as a JSON array of objects, where each object has a 'headline' (short summary) and 'content' (the full tweet text).
                    Do NOT include any introductory or concluding text, only the JSON array.
                    Ensure the content is relevant to @${handle}'s expertise and recent activities.`
    prompt = `Generate 5 tweets for @${handle} using the following context:\n${profileContext}`
  } else if (type === "linkedin") {
    systemPrompt = `You are a LinkedIn content generator for a user named @${handle} (Michael P. Robinson).
                    Generate 5 recent-looking LinkedIn posts about professional topics like AI, Web3, decentralized applications, career insights, or company updates, based on the provided profile context and *especially* the "Latest Project Snippets".
                    Each post should be professional, concise, and realistic for a LinkedIn feed.
                    Format your response as a JSON array of objects, where each object has a 'headline' (short summary/topic) and 'content' (the full post text).
                    Do NOT include any introductory or concluding text, only the JSON array.
                    Ensure the content is relevant to Michael P. Robinson's professional background, WasLost.Ai, and recent activities.`
    prompt = `Generate 5 LinkedIn posts for Michael P. Robinson (@${handle}) using the following context:\n${profileContext}`
  }

  try {
    const { text } = await generateText({
      model: openai("gpt-4o"),
      system: systemPrompt,
      prompt: prompt,
    })

    let rawJsonString = text.trim()

    // Strip Markdown code block wrappers
    if (rawJsonString.startsWith("```json")) {
      rawJsonString = rawJsonString.substring("```json".length)
    }
    if (rawJsonString.endsWith("```")) {
      rawJsonString = rawJsonString.substring(0, rawJsonString.length - "```".length)
    }
    rawJsonString = rawJsonString.trim()

    let generatedPosts: any[] = []
    try {
      generatedPosts = JSON.parse(rawJsonString)
      if (!Array.isArray(generatedPosts) || generatedPosts.some((p) => !p.headline || !p.content)) {
        throw new Error("AI response was not a valid array of post objects or missing required fields.")
      }
    } catch (parseError) {
      console.error(`Failed to parse AI generated text as JSON for ${type} posts:`, parseError)
      console.error("AI raw response (after stripping):", rawJsonString)
      return NextResponse.json(
        {
          error: `Failed to generate valid ${type} posts from AI. AI response format was unexpected.`,
          details: rawJsonString,
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
  } catch (error) {
    console.error(`Error generating ${type} posts with AI:`, error)
    return NextResponse.json(
      { error: `Internal server error while generating ${type} posts with AI.` },
      { status: 500 },
    )
  }
}
