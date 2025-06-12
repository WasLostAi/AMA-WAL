import { NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { getBlobContent } from "@/lib/blob-actions"
import { initialCurrentProjectsMarkdown } from "@/lib/current-projects" // Import initial content as fallback

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const feedType = searchParams.get("type") || "twitter" // Default to twitter

    // Fetch content from Vercel Blob, or use fallback if not found
    let currentProjectsContent = await getBlobContent()
    if (!currentProjectsContent) {
      currentProjectsContent = initialCurrentProjectsMarkdown
      console.log("Using initialCurrentProjectsMarkdown as fallback for social posts.")
    }

    const systemPrompt = `You are an expert social media content generator for WasLost.Ai, specializing in ${feedType} posts.
    Your task is to create 5 concise and engaging social media posts based on the provided project updates.
    Each post should have a 'headline' (short, catchy title) and 'content' (the actual post text).
    For Twitter, keep content very brief (under 280 characters). For LinkedIn, content can be slightly longer and more professional.
    Include relevant emojis and hashtags where appropriate for the platform.
    The output MUST be a JSON array of objects, each with 'id', 'type', 'headline', and 'content' properties.
    The 'id' should be a unique string (e.g., "post-1", "post-2").
    The 'type' should be "${feedType}".

    Example JSON format:
    [
      {
        "id": "post-1",
        "type": "${feedType}",
        "headline": "Exciting Update!",
        "content": "Check out our latest progress on Project X! #AI #Web3"
      },
      {
        "id": "post-2",
        "type": "${feedType}",
        "headline": "New Feature Alert",
        "content": "We just launched Y! Read more here. #Innovation"
      }
    ]

    Here are the current project updates in Markdown:
    ${currentProjectsContent}
    `

    const { text } = await generateText({
      model: openai("gpt-4o"), // Using gpt-4o for generation [^4]
      prompt: `Generate 5 social media posts for ${feedType} based on the provided project updates.`,
      system: systemPrompt,
    })

    // Attempt to parse the AI's response as JSON
    let generatedPosts
    try {
      generatedPosts = JSON.parse(text)
      // Basic validation to ensure it's an array of objects with expected properties
      if (!Array.isArray(generatedPosts) || generatedPosts.length === 0 || !generatedPosts[0].headline) {
        throw new Error("AI response was not a valid array of social posts.")
      }
    } catch (parseError) {
      console.error("Failed to parse AI generated text as JSON:", parseError)
      console.error("AI raw response:", text)
      // Fallback to a generic error message or a single default post
      return NextResponse.json(
        {
          error: "AI generated an invalid response format. Please try again.",
          suggestion: "The AI might be struggling to produce valid JSON. Check the prompt or try a different query.",
        },
        { status: 500 },
      )
    }

    return NextResponse.json(generatedPosts, {
      headers: {
        "Cache-Control": "s-maxage=86400, stale-while-revalidate", // Cache for 24 hours
      },
    })
  } catch (error: any) {
    console.error(`Error in generate-social-posts API:`, error)
    return NextResponse.json(
      {
        error: `Failed to generate social posts.`,
        details: error.message || "An unknown error occurred.",
        suggestion:
          "This might indicate an issue with environment variables (OPENAI_API_KEY, BLOB_READ_WRITE_TOKEN), or an unhandled exception during AI generation or Blob access. Please check Vercel logs for more details.",
      },
      { status: 500 },
    )
  }
}
