import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// IMPORTANT: Replace with your actual PicaOS API URL and API Key
// You should store PICAOS_API_KEY in your Vercel Environment Variables.
const PICAOS_API_URL = process.env.PICAOS_API_URL || "https://api.picaos.com" // Placeholder URL
const PICAOS_API_KEY = process.env.PICAOS_API_KEY // Your PicaOS API Key

export async function POST(request: NextRequest) {
  if (!PICAOS_API_KEY) {
    console.error("PICAOS_API_KEY environment variable is not set.")
    return NextResponse.json({ error: "Server configuration error: PicaOS API key is missing." }, { status: 500 })
  }

  try {
    // Parse the incoming request body from your frontend
    const { endpoint, method, body, headers } = await request.json()

    // Construct the full PicaOS API URL
    const fullUrl = `${PICAOS_API_URL}${endpoint}`

    // Prepare headers for the PicaOS API request
    const picaosHeaders: HeadersInit = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${PICAOS_API_KEY}`, // Assuming Bearer token authentication
      ...headers, // Allow frontend to pass additional headers if needed
    }

    // Make the request to the PicaOS API
    const picaosResponse = await fetch(fullUrl, {
      method: method || "POST", // Default to POST if not specified
      headers: picaosHeaders,
      body: body ? JSON.stringify(body) : undefined, // Only send body for methods that require it
    })

    // Handle non-OK responses from PicaOS
    if (!picaosResponse.ok) {
      const errorText = await picaosResponse.text()
      console.error(`Error from PicaOS API (${picaosResponse.status}):`, errorText)
      return NextResponse.json(
        { error: `PicaOS API error: ${picaosResponse.statusText}`, details: errorText },
        { status: picaosResponse.status },
      )
    }

    // Parse and return the response from PicaOS
    const data = await picaosResponse.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error proxying request to PicaOS API:", error)
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 },
    )
  }
}

// You might also want to add a GET handler if PicaOS has GET endpoints
export async function GET(request: NextRequest) {
  if (!PICAOS_API_KEY) {
    console.error("PICAOS_API_KEY environment variable is not set.")
    return NextResponse.json({ error: "Server configuration error: PicaOS API key is missing." }, { status: 500 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const endpoint = searchParams.get("endpoint") // Get the PicaOS endpoint from query params

    if (!endpoint) {
      return NextResponse.json({ error: "Missing 'endpoint' query parameter." }, { status: 400 })
    }

    const fullUrl = `${PICAOS_API_URL}${endpoint}`

    const picaosResponse = await fetch(fullUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${PICAOS_API_KEY}`,
      },
    })

    if (!picaosResponse.ok) {
      const errorText = await picaosResponse.text()
      console.error(`Error from PicaOS API (${picaosResponse.status}):`, errorText)
      return NextResponse.json(
        { error: `PicaOS API error: ${picaosResponse.statusText}`, details: errorText },
        { status: picaosResponse.status },
      )
    }

    const data = await picaosResponse.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error proxying GET request to PicaOS API:", error)
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 },
    )
  }
}
