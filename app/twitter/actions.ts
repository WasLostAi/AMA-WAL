"use server"

interface Tweet {
  id: string
  text: string
  author_id?: string
  created_at?: string
  // Add other fields as per twitterapi.io response
}

export async function fetchTweets(query: string): Promise<{ success: boolean; tweets?: Tweet[]; message: string }> {
  const TWITTERAPI_IO_API_KEY = process.env.TWITTERAPI_IO_API_KEY
  // This is a placeholder URL. You will need to get the actual base URL from twitterapi.io documentation.
  const TWITTERAPI_IO_BASE_URL = "https://api.twitterapi.io/v1"

  if (!TWITTERAPI_IO_API_KEY) {
    return { success: false, message: "Server configuration error: TWITTERAPI_IO_API_KEY is not set." }
  }

  if (!query.trim()) {
    return { success: false, message: "Query cannot be empty." }
  }

  try {
    // Construct the URL for the tweets endpoint. This is a hypothetical example.
    // Refer to twitterapi.io documentation for actual endpoint paths and query parameters.
    const response = await fetch(`${TWITTERAPI_IO_BASE_URL}/tweets/search?q=${encodeURIComponent(query)}`, {
      method: "GET",
      headers: {
        "X-API-Key": TWITTERAPI_IO_API_KEY, // Assuming an API key header
        "Content-Type": "application/json",
      },
      // You might need to adjust cache control based on your needs
      next: { revalidate: 60 }, // Revalidate data every 60 seconds
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Error fetching tweets from twitterapi.io: ${response.status} - ${errorText}`)
      return { success: false, message: `Failed to fetch tweets: ${response.status} - ${errorText}` }
    }

    const data = await response.json()
    console.log("Raw response from twitterapi.io:", data) // Log raw data for debugging

    // Assuming the response has a 'data' array containing tweets
    if (data && Array.isArray(data.tweets)) {
      // Adjust 'data.tweets' based on actual API response structure
      return { success: true, tweets: data.tweets as Tweet[], message: "Tweets fetched successfully." }
    } else {
      return { success: false, message: "Unexpected response format from twitterapi.io." }
    }
  } catch (error) {
    console.error("Error in fetchTweets server action:", error)
    return {
      success: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}
