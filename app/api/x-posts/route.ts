import { NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

const WASLOSTAI_X_USER_ID = "1835648511246807040" // Still kept for context, but not directly used for fetching

export async function GET() {
  // Ensure the OpenAI API key is available
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

  try {
    // Use AI to generate simulated tweets
    const { text } = await generateText({
      model: openai("gpt-4o"), // Using gpt-4o for better JSON formatting
      system: `You are a Twitter content generator for a user named @waslostai.
               Generate 5 recent-looking tweets about AI, Web3, and trading automation.
               Each tweet should be concise and realistic.
               Format your response as a JSON array of objects, where each object has a 'headline' (short summary) and 'content' (the full tweet text).
               Do NOT include any introductory or concluding text, only the JSON array.`,
      prompt: `Generate 5 tweets for @waslostai.`,
    })

    let rawJsonString = text.trim()

    // --- IMPORTANT FIX: Strip Markdown code block wrappers ---
    if (rawJsonString.startsWith("```json")) {
      rawJsonString = rawJsonString.substring("```json".length)
    }
    if (rawJsonString.endsWith("```")) {
      rawJsonString = rawJsonString.substring(0, rawJsonString.length - "```".length)
    }
    rawJsonString = rawJsonString.trim() // Trim again after stripping

    let generatedTweets: any[] = []
    try {
      // Attempt to parse the AI's response as JSON
      generatedTweets = JSON.parse(rawJsonString)
      // Ensure it's an array and each item has 'headline' and 'content'
      if (!Array.isArray(generatedTweets) || generatedTweets.some((t) => !t.headline || !t.content)) {
        throw new Error("AI response was not a valid array of tweet objects or missing required fields.")
      }
    } catch (parseError) {
      console.error("Failed to parse AI generated text as JSON:", parseError)
      console.error("AI raw response (after stripping):", rawJsonString)
      // Fallback to a generic error or default tweets if parsing fails
      return NextResponse.json(
        {
          error: "Failed to generate valid tweets from AI. AI response format was unexpected.",
          details: rawJsonString, // Show the stripped content for debugging
        },
        { status: 500 },
      )
    }

    // Map the AI-generated response to the SocialPost interface
    const tweets = generatedTweets.map((tweet, index) => ({
      id: `ai-tweet-${index}-${Date.now()}`, // Unique ID for each generated tweet
      type: "twitter",
      headline: tweet.headline,
      content: tweet.content,
      createdAt: new Date().toISOString(), // Use current time for generated tweets
    }))

    return NextResponse.json(tweets)
  } catch (error) {
    console.error("Error generating X posts with AI:", error)
    return NextResponse.json({ error: "Internal server error while generating X posts with AI." }, { status: 500 })
  }
}
