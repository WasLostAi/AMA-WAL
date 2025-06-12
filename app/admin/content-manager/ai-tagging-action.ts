"use server"

import { openai } from "@ai-sdk/openai"

export async function suggestTagsFromFileContent(fileContent: string): Promise<string[]> {
  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY environment variable is not set.")
    throw new Error("Server configuration error: OpenAI API key is missing.")
  }

  try {
    const { text } = await openai.chat.completions.create({
      model: "gpt-4o", // Using a chat model for better instruction following
      messages: [
        {
          role: "system",
          content: `You are an expert tag generator. Analyze the provided document content and suggest 3-5 concise, relevant, comma-separated tags.
                    Tags should be lowercase, kebab-case (e.g., "project-planning", "Q1-report").
                    Do NOT include any other text, just the comma-separated tags.`,
        },
        {
          role: "user",
          content: `Document content:\n\n${fileContent.substring(0, 4000)}`, // Limit content to avoid token limits
        },
      ],
      temperature: 0.3, // Keep it focused
      max_tokens: 100,
    })

    // Parse the comma-separated string into an array
    const tags = text
      .split(",")
      .map((tag) => tag.trim().toLowerCase().replace(/\s+/g, "-")) // Clean and format tags
      .filter(Boolean) // Remove empty strings

    return tags
  } catch (error) {
    console.error("Error suggesting tags with AI:", error)
    return [] // Return empty array on error
  }
}
