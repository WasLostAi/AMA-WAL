"use server"

import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export async function generateHashtags(
  content: string,
): Promise<{ success: boolean; hashtags: string[]; message?: string }> {
  try {
    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt: `Generate 5-10 relevant and popular hashtags for the following content. Return only the hashtags, separated by spaces, without any introductory or concluding remarks. Example: #AI #Web3 #Solana #Blockchain #Tech #Innovation #Future #Development #Crypto #Decentralized
      
      Content: ${content}`,
    })

    const hashtags = text
      .split(/\s+/)
      .filter(Boolean)
      .map((tag) => (tag.startsWith("#") ? tag : `#${tag}`))

    return { success: true, hashtags }
  } catch (error) {
    console.error("Error generating hashtags:", error)
    return { success: false, hashtags: [], message: "Failed to generate hashtags." }
  }
}
