import { NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export async function GET(request: Request) {
  console.log("API Route: /api/test-ai - Start of request")

  try {
    console.log("API Route: /api/test-ai - Checking OPENAI_API_KEY presence:", !!process.env.OPENAI_API_KEY)

    if (!process.env.OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY is NOT set for /api/test-ai.")
      return NextResponse.json(
        {
          error: "OPENAI_API_KEY is not configured.",
          suggestion: "Please set OPENAI_API_KEY in your Vercel project environment variables.",
        },
        { status: 500 },
      )
    }

    console.log("API Route: /api/test-ai - Attempting AI text generation...")
    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt: "Say hello in a friendly tone.",
    })
    console.log("API Route: /api/test-ai - AI generation successful.")

    return NextResponse.json({ message: "AI test successful!", response: text })
  } catch (error: any) {
    console.error("API Route: /api/test-ai - Error during AI test:", error)
    return NextResponse.json(
      {
        error: "Failed to run AI test.",
        details: error.message || "An unknown error occurred during AI test.",
        suggestion: "Check Vercel logs for /api/test-ai for more details, especially regarding OPENAI_API_KEY.",
      },
      { status: 500 },
    )
  } finally {
    console.log("API Route: /api/test-ai - End of request.")
  }
}
