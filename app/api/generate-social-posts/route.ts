import { NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { chatbotData } from "@/lib/chatbot-data"
import { getBlobContent } from "@/lib/blob-actions" // Import the blob reading action

export async function GET(request: Request) {
  try {
    // <--- New outer try block to catch all errors
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") // 'twitter' or 'linkedin'

    if (!type || (type !== "twitter" && type !== "linkedin")) {
      console.error("Error: Invalid or missing 'type' parameter in generate-social-posts API.")
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

    // Fetch dynamic content from Vercel Blob
    let dynamicContent = ""
    try {
      const blobContent = await getBlobContent()
      if (blobContent) {
        dynamicContent = `\n\n--- Latest Project Updates (from your editor) ---\n${blobContent}`
      }
    } catch (blobError) {
      console.error("Failed to retrieve dynamic content from Blob:", blobError)
      // Continue without dynamic content if there's an error, or handle as needed
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
    `

    let systemPrompt = ""
    let prompt = ""
    const handle = "waslostai" // Your consistent handle

    if (type === "twitter") {
      systemPrompt = `You are a Twitter content generator for a user named @${handle}.
                      Generate 5 recent-looking tweets about AI, Web3, and trading automation, based on the provided profile context and *especially* the latest project updates.
                      Each tweet should be concise, realistic, and sound like it comes from a professional in these fields.
                      Format your response as a JSON array of objects, where each object has a 'headline' (short summary) and 'content' (the full tweet text).
                      Do NOT include any introductory or concluding text, only the JSON array.
                      Ensure the content is relevant to @${handle}'s expertise and current activities.`
      prompt = `Generate 5 tweets for @${handle} using the following context:\n${profileContext}${dynamicContent}`
    } else if (type === "linkedin") {
      systemPrompt = `You are a LinkedIn content generator for a user named @${handle} (Michael P. Robinson).
                      Generate 5 recent-looking LinkedIn posts about professional topics like AI, Web3, decentralized applications, career insights, or company updates, based on the provided profile context and *especially* the latest project updates.
                      Each post should be professional, concise, and realistic for a LinkedIn feed.
                      Format your response as a JSON array of objects, where each object has a 'headline' (short summary/topic) and 'content' (the full post text).
                      Do NOT include any introductory or concluding text, only the JSON array.
                      Ensure the content is relevant to Michael P. Robinson's professional background, WasLost.Ai, and current activities.`
      prompt = `Generate 5 LinkedIn posts for Michael P. Robinson (@${handle}) using the following context:\n${profileContext}${dynamicContent}`
    }

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

    // Set revalidation for daily updates
    return NextResponse.json(posts, {
      headers: {
        "Cache-Control": "s-maxage=86400, stale-while-revalidate", // 24 hours
      },
    })
  } catch (error: any) {
    // <--- Outer catch block will now catch any error in the function
    console.error(`A top-level error occurred in generate-social-posts API:`, error)
    return NextResponse.json(
      {
        error: `A critical server error occurred.`,
        details: error.message || "An unknown error occurred during API execution.",
        suggestion:
          "This might indicate an issue with environment variables, module loading, or an unhandled exception. Please check Vercel logs for more details.",
      },
      { status: 500 },
    )
  }
}
