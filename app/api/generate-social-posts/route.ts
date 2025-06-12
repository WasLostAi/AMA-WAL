import { NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { getBlobContent } from "@/lib/blob-actions"
import { initialCurrentProjectsMarkdown } from "@/lib/current-projects"

export async function GET(request: Request) {
  console.log("API Route: /api/generate-social-posts - Start of request (Full Logic Enabled)")

  try {
    // Log environment variables to confirm they are accessible in the runtime
    console.log("API Route: Checking environment variables...")
    console.log("API Route: OPENAI_API_KEY present:", !!process.env.OPENAI_API_KEY)
    // Corrected to use BLOB_READ_WRITE_TOKEN
    console.log("API Route: BLOB_READ_WRITE_TOKEN present:", !!process.env.BLOB_READ_WRITE_TOKEN)

    // Explicitly check for environment variables at the start
    if (!process.env.OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY is not set in environment variables.")
      return NextResponse.json(
        {
          error: "Server configuration error: OPENAI_API_KEY is not set.",
          suggestion: "Please ensure OPENAI_API_KEY is configured in your Vercel project environment variables.",
        },
        { status: 500 },
      )
    }
    // Corrected to use BLOB_READ_WRITE_TOKEN
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error("BLOB_READ_WRITE_TOKEN is not set in environment variables.")
      return NextResponse.json(
        {
          error: "Server configuration error: BLOB_READ_WRITE_TOKEN is not set.",
          suggestion: "Please ensure BLOB_READ_WRITE_TOKEN is configured in your Vercel project environment variables.",
        },
        { status: 500 },
      )
    }

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

    let text: string
    try {
      const result = await generateText({
        model: openai("gpt-4o"), // Using gpt-4o for generation [^4]
        prompt: `Generate 5 social media posts for ${feedType} based on the provided project updates.`,
        system: systemPrompt,
      })
      text = result.text
    } catch (aiError: any) {
      console.error("Error during AI text generation:", aiError)
      return NextResponse.json(
        {
          error: "AI generation failed.",
          details: aiError.message || "An unknown error occurred during AI processing.",
          suggestion:
            "This might be an issue with the OpenAI API key, rate limits, or the model's response. Check OpenAI status and Vercel logs.",
        },
        { status: 500 },
      )
    }

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
      console.error("AI raw response (if available):", text) // Log the raw text from AI
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
    console.error(`A top-level unhandled error occurred in generate-social-posts API:`, error)
    return NextResponse.json(
      {
        error: `A critical server error occurred.`,
        details: error.message || "An unknown error occurred during API execution.",
        suggestion:
          "This might indicate an issue with environment variables, module loading, or an unhandled exception. Please check Vercel logs for more details.",
      },
      { status: 500 },
    )
  } finally {
    console.log("API Route: /api/generate-social-posts - End of request (or error caught).")
  }
}
