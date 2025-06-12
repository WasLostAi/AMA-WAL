import { NextResponse } from "next/server"
// Temporarily comment out AI SDK imports to isolate the issue
// import { generateText } from "ai"
// import { openai } from "@ai-sdk/openai"
import { getBlobContent } from "@/lib/blob-actions" // Re-enable Blob import
import { initialCurrentProjectsMarkdown } from "@/lib/current-projects" // Re-enable initial content import

// --- Module-level logging ---
console.log("API Route: /api/generate-social-posts - Module loaded.")
// Check environment variables at module load time (though they might not be fully available yet)
console.log("API Route: Module load - OPENAI_API_KEY present:", !!process.env.OPENAI_API_KEY)
console.log("API Route: Module load - BLOB2_READ_WRITE_TOKEN present:", !!process.env.BLOB2_READ_WRITE_TOKEN)
// --- End module-level logging ---

export async function GET(request: Request) {
  console.log("API Route: /api/generate-social-posts - Start of GET request handler.")

  try {
    // Log environment variables again inside the function
    console.log("API Route: GET handler - Checking environment variables...")
    console.log("API Route: GET handler - OPENAI_API_KEY present:", !!process.env.OPENAI_API_KEY)
    console.log("API Route: GET handler - BLOB2_READ_WRITE_TOKEN present:", !!process.env.BLOB2_READ_WRITE_TOKEN)

    // Explicitly check for environment variables at the start
    if (!process.env.OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY is not set in environment variables.")
      return NextResponse.json(
        {
          error: "Server configuration error: OPENAI_API_KEY is not set.",
          details: "The OPENAI_API_KEY environment variable is required but not found.",
          suggestion: "Please ensure OPENAI_API_KEY is configured in your Vercel project environment variables.",
        },
        { status: 500 },
      )
    }
    if (!process.env.BLOB2_READ_WRITE_TOKEN) {
      console.error("BLOB2_READ_WRITE_TOKEN is not set in environment variables.")
      return NextResponse.json(
        {
          error: "Server configuration error: BLOB2_READ_WRITE_TOKEN is not set.",
          details: "The BLOB2_READ_WRITE_TOKEN environment variable is required but not found.",
          suggestion:
            "Please ensure BLOB2_READ_WRITE_TOKEN is configured in your Vercel project environment variables.",
        },
        { status: 500 },
      )
    }

    const { searchParams } = new URL(request.url)
    const feedType = searchParams.get("type") || "twitter" // Default to twitter

    // --- Test Vercel Blob interaction only ---
    console.log("API Route: GET handler - Attempting to fetch content from Vercel Blob...")
    let currentProjectsContent = await getBlobContent()
    if (!currentProjectsContent) {
      currentProjectsContent = initialCurrentProjectsMarkdown
      console.log("API Route: GET handler - No content in Blob, using fallback.")
    } else {
      console.log("API Route: GET handler - Successfully fetched content from Vercel Blob.")
    }

    // Return a dummy response based on Blob content, without AI generation
    const dummyPosts = [
      {
        id: "blob-test-1",
        type: feedType,
        headline: `Blob Test (${feedType})`,
        content: currentProjectsContent
          ? `Content loaded from Blob! Length: ${currentProjectsContent.length}.`
          : "No content in Blob, using fallback.",
      },
      {
        id: "blob-test-2",
        type: feedType,
        headline: "Blob Status",
        content: currentProjectsContent ? "Blob content is available." : "Blob content is NOT available.",
      },
    ]
    console.log("API Route: GET handler - Returning Blob test response.")
    return NextResponse.json(dummyPosts, {
      headers: {
        "Cache-Control": "s-maxage=86400, stale-while-revalidate", // Cache for 24 hours
      },
    })
    // --- End Test Vercel Blob interaction only ---
  } catch (error: any) {
    console.error(`API Route: GET handler - A top-level unhandled error occurred:`, error)
    // Attempt to return a JSON error even if something went very wrong
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
    console.log("API Route: /api/generate-social-posts - End of GET request handler (or error caught).")
  }
}
