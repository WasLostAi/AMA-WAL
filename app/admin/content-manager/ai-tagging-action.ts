"use server"

import { openai } from "@ai-sdk/openai"
// Removed pdf-parse and mammoth imports due to fs.readFileSync error
import { convert } from "html-to-text"

// Helper function to extract text from file (server-side only)
async function extractTextFromFile(fileBuffer: Buffer, contentType: string): Promise<string> {
  if (contentType.includes("text/plain") || contentType.includes("text/markdown")) {
    return fileBuffer.toString("utf-8")
  } else if (contentType.includes("text/html")) {
    return convert(fileBuffer.toString("utf-8"), {
      wordwrap: 130,
    })
  }
  // For PDFs, DOCX, images, or other unsupported types, return empty string
  console.warn(`Unsupported file type for text extraction for AI memory: ${contentType}`)
  return ""
}

export async function suggestTagsFromFile(
  formData: FormData,
): Promise<{ tags: string[]; success: boolean; message?: string }> {
  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY environment variable is not set.")
    return {
      tags: [],
      success: false,
      message: "Server configuration error: OpenAI API key is missing.",
    }
  }

  try {
    const file = formData.get("file") as File
    if (!file) {
      return {
        tags: [],
        success: false,
        message: "No file provided.",
      }
    }

    // Convert File to Buffer for processing
    const fileBuffer = Buffer.from(await file.arrayBuffer())

    // Extract text from file
    const fileContent = await extractTextFromFile(fileBuffer, file.type)
    if (!fileContent) {
      // If no text could be extracted (e.g., it's an image, PDF, or DOCX)
      return {
        tags: [],
        success: false,
        message: `Cannot extract text from file type "${file.type}" to suggest tags. Supported types: .txt, .md, .html.`,
      }
    }

    // Generate tags using OpenAI
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

    return {
      tags,
      success: true,
    }
  } catch (error) {
    console.error("Error suggesting tags with AI:", error)
    return {
      tags: [],
      success: false,
      message: `Error suggesting tags: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}
