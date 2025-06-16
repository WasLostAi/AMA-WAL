"use server"

import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { revalidatePath } from "next/cache"

export async function generateSeoMetadata(
  content: string,
  title: string,
): Promise<{ success: boolean; metaDescription: string; keywords: string[]; message?: string }> {
  try {
    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt: `Based on the following blog post title and content, generate a concise meta description (max 160 characters) and 5-10 relevant keywords (comma-separated).
      
      Return the output in a JSON format like this:
      {
        "metaDescription": "Your meta description here.",
        "keywords": ["keyword1", "keyword2", "keyword3"]
      }

      Title: ${title}
      Content: ${content}`,
    })

    const rawAiResponse = text.trim()
    // Remove markdown code block fences if present
    const cleanedJsonString =
      rawAiResponse.startsWith("```json") && rawAiResponse.endsWith("```")
        ? rawAiResponse.substring(7, rawAiResponse.length - 3).trim()
        : rawAiResponse

    const parsedResult = JSON.parse(cleanedJsonString)
    const metaDescription = parsedResult.metaDescription || ""
    const keywords = Array.isArray(parsedResult.keywords) ? parsedResult.keywords : []

    return { success: true, metaDescription, keywords }
  } catch (error) {
    console.error("Error generating SEO metadata:", error)
    return { success: false, metaDescription: "", keywords: [], message: "Failed to generate SEO metadata." }
  }
}

export async function revalidateSiteData(
  prevState: any,
  formData: FormData | null, // formData is not used but required by useActionState signature
): Promise<{ success: boolean; message: string }> {
  try {
    revalidatePath("/sitemap.xml")
    revalidatePath("/rss.xml")
    revalidatePath("/blog", "layout") // Revalidate all blog pages
    return { success: true, message: "Site data (sitemap, RSS, blog pages) revalidated successfully!" }
  } catch (error) {
    console.error("Error revalidating site data:", error)
    return { success: false, message: "Failed to revalidate site data." }
  }
}
