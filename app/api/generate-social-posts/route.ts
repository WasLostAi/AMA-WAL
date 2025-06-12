import { NextResponse } from "next/server"
// import { getBlobContent } from "@/lib/blob-actions"

export async function GET(request: Request) {
  console.log("generate-social-posts API route invoked (TESTING MODE).") // Added for debugging
  try {
    // --- TEMPORARY TEST: Return dummy data immediately ---
    // If this works, the issue is with AI SDK or Blob operations.
    // If this still fails, the issue is with the Vercel deployment/environment itself.
    return NextResponse.json(
      [
        {
          id: "test-1",
          type: "twitter",
          headline: "Test Tweet",
          content: "This is a test tweet from the API. If you see this, the API route is working!",
        },
        {
          id: "test-2",
          type: "linkedin",
          headline: "Test LinkedIn Post",
          content: "This is a test LinkedIn post from the API. Check your Vercel logs for real errors!",
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
