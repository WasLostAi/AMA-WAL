import { NextResponse } from "next/server"
// Temporarily comment out AI SDK and Blob imports to isolate the issue
// import { generateText } from "ai"
// import { openai } from "@ai-sdk/openai"
// import { getBlobContent } from "@/lib/blob-actions"
// import { initialCurrentProjectsMarkdown } from "@/lib/current-projects"

export async function GET(request: Request) {
  console.log("API Route: /api/generate-social-posts - Start of request")

  try {
    // Log environment variables to confirm they are accessible in the runtime
    console.log("API Route: Checking environment variables...")
    console.log("API Route: OPENAI_API_KEY present:", !!process.env.OPENAI_API_KEY)
    console.log("API Route: BLOB_READ_WRITE_TOKEN present:", !!process.env.BLOB_READ_WRITE_TOKEN)

    // --- TEMPORARY TEST: Return dummy data immediately ---
    // If this works, the issue is with AI SDK or Blob operations.
    // If this still fails, the issue is with the Vercel deployment/environment itself.
    console.log("API Route: Returning temporary hardcoded success response.")
    return NextResponse.json(
      [
        {
          id: "temp-1",
          type: "twitter",
          headline: "Test Tweet (Temp)",
          content: "This is a temporary tweet from the API. If you see this, the API route is fundamentally working!",
        },
        {
          id: "temp-2",
          type: "linkedin",
          headline: "Test LinkedIn Post (Temp)",
          content: "This is a temporary LinkedIn post. Check Vercel logs for real errors if this fails!",
        },
      ],
      {
        headers: {
          "Cache-Control": "s-maxage=86400, stale-while-revalidate", // Cache for 24 hours
        },
      },
    )
    // --- END TEMPORARY TEST ---

    // The original code for AI generation and Blob content fetching is commented out above.
    // Once the test passes, you can uncomment the original code and the imports.
  } catch (error: any) {
    console.error(`API Route: A top-level unhandled error occurred:`, error)
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
    console.log("API Route: /api/generate-social-posts - End of request (or error caught).")
  }
}
