import { NextResponse } from "next/server"

// --- Module-level logging for this test route ---
console.log("API Route: /api/test-blob-env - Module loaded.")
console.log("API Route: Module load - BLOB2_READ_WRITE_TOKEN present:", !!process.env.BLOB2_READ_WRITE_TOKEN)
// --- End module-level logging ---

export async function GET(request: Request) {
  console.log("API Route: /api/test-blob-env - Start of GET request handler.")

  try {
    console.log("API Route: GET handler - Checking BLOB2_READ_WRITE_TOKEN presence...")
    if (!process.env.BLOB2_READ_WRITE_TOKEN) {
      console.error("BLOB2_READ_WRITE_TOKEN is NOT set for /api/test-blob-env.")
      return NextResponse.json(
        {
          error: "BLOB2_READ_WRITE_TOKEN is not configured.",
          suggestion: "Please set BLOB2_READ_WRITE_TOKEN in your Vercel project environment variables.",
        },
        { status: 500 },
      )
    }

    console.log("API Route: GET handler - BLOB2_READ_WRITE_TOKEN is present. Blob import successful.")
    return NextResponse.json({
      message: "Blob environment test successful!",
      blobTokenPresent: true,
      details: "The @vercel/blob library imported successfully and BLOB2_READ_WRITE_TOKEN is accessible.",
    })
  } catch (error: any) {
    console.error("API Route: /api/test-blob-env - Error during Blob environment test:", error)
    return NextResponse.json(
      {
        error: "Failed to run Blob environment test.",
        details: error.message || "An unknown error occurred during Blob environment test.",
        suggestion: "Check Vercel logs for /api/test-blob-env for more details.",
      },
      { status: 500 },
    )
  } finally {
    console.log("API Route: /api/test-blob-env - End of request.")
  }
}
