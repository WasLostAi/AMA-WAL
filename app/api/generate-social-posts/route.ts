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

  // --- Fetch current project updates from Vercel Blob ---
  let currentProjectUpdates = ""
  try {
    // Fetch the latest markdown content from Vercel Blob
    // The 'revalidate' option here ensures the data is fresh from Blob at most once every 24 hours
    const blobResponse = await fetch(
      `https://blob.vercel-storage.com/social-posts-source.md`, // Replace with your actual Blob URL if different
      { next: { revalidate: 86400 } }, // Revalidate every 24 hours (86400 seconds)
    )

    if (blobResponse.ok) {
      currentProjectUpdates = await blobResponse.text()
      console.log("Fetched current project updates from Blob successfully.")
    } else {
      console.warn(
        "Could not fetch current project updates from Blob. Using default context. Status:",
        blobResponse.status,
      )
      // Optionally, set a default message if Blob is empty or not found
      currentProjectUpdates = "No specific recent project updates available. Generate based on general profile."
    }
  } catch (blobError) {
    console.error("Error fetching current project updates from Vercel Blob:", blobError)
    currentProjectUpdates = "Error fetching recent project updates. Generate based on general profile."
  }

  const profileContext = `
    Here is general information about Michael P. Robinson and WasLost.Ai:
    Name: ${chatbotData.personal.name} (${chatbotData.personal.nickname})
    Current Role: ${chatbotData.professional.currentRole}
    Skills: ${chatbotData.professional.skills.join("; ")}
    Company: ${chatbotData.company.name} - ${chatbotData.company.product}
    Company Description: ${chatbotData.company.description}
    Mission: ${chatbotData.personal.mission}
    Key Achievements: ${chatbotData.professional.keyAchievements.map((ach) => `- ${ach}`).join("\n")}
    Projects:
    ${chatbotData.company.projects.map((project) => `  - ${project.name}: ${project.details.join(", ")}`).join("\n")}

    --- Recent Project Updates (Markdown format, use this primarily for content): ---
    ${currentProjectUpdates}
  `

  let systemPrompt = ""
  let prompt = ""
  const handle = "waslostai" // Your consistent handle

  if (type === "twitter") {
    systemPrompt = `You are a Twitter content generator for a user named @${handle}.
                    Generate 5 recent-looking tweets about AI, Web3, and trading automation.
                    Prioritize content from the "Recent Project Updates" section provided.
                    Each tweet should be concise, realistic, and sound like it comes from a professional in these fields.
                    Format your response as a JSON array of objects, where each object has a 'headline' (short summary) and 'content' (the full tweet text).
                    Do NOT include any introductory or concluding text, only the JSON array.
                    Ensure the content is relevant to @${handle}'s expertise.`
    prompt = `Generate 5 tweets for @${handle} using the following context:\n${profileContext}`
  } else if (type === "linkedin") {
    systemPrompt = `You are a LinkedIn content generator for a user named @${handle} (Michael P. Robinson).
                    Generate 5 recent-looking LinkedIn posts about professional topics like AI, Web3, decentralized applications, career insights, or company updates.
                    Prioritize content from the "Recent Project Updates" section provided.
                    Each post should be professional, concise, and realistic for a LinkedIn feed.
                    Format your response as a JSON array of objects, where each object has a 'headline' (short summary/topic) and 'content' (the full post text).
                    Do NOT include any introductory or concluding text, only the JSON array.
                    Ensure the content is relevant to Michael P. Robinson's professional background and WasLost.Ai.`
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
