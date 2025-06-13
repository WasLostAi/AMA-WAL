"use server"

import { supabaseAdmin } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import slugify from "slugify" // Will need to infer this module

interface BlogPost {
  id: string
  title: string
  slug: string
  content: string
  keywords: string[] | null // Optional keywords
  meta_description: string | null // Optional meta description
  status: "draft" | "published"
  generated_at: string
  updated_at: string
}

interface AllFileMetadata {
  files: {
    fileName: string
    filePath: string
    tags: string[]
    contentType: string
    uploadedAt: string
  }[]
}

// Helper to fetch current metadata for RAG document selection
async function fetchCurrentMetadata(): Promise<AllFileMetadata> {
  try {
    const response = await fetch(`https://blob.vercel-storage.com/file-metadata.json`, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    })
    if (response.ok) {
      const text = await response.text()
      return text ? (JSON.parse(text) as AllFileMetadata) : { files: [] }
    }
  } catch (error) {
    console.warn("No existing file metadata blob found or error fetching it for blog actions. Starting fresh.", error)
  }
  return { files: [] }
}

export async function generateBlogPost(
  prevState: any,
  formData: FormData,
): Promise<{
  success: boolean
  message: string
  generatedContent?: string
  generatedTitle?: string
  generatedKeywords?: string[]
  generatedMetaDescription?: string
}> {
  const topic = formData.get("topic") as string
  const selectedTagsString = formData.get("selectedTags") as string // Comma-separated tags

  if (!topic) {
    return { success: false, message: "Please provide a topic for the blog post." }
  }

  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY environment variable is not set.")
    return { success: false, message: "Server configuration error: OpenAI API key is missing." }
  }

  let ragContext = ""
  try {
    // 1. Fetch relevant RAG document paths based on selected tags (if any) or topic itself
    const fileMetadata = await fetchCurrentMetadata()
    let relevantFilePaths: string[] = []

    if (selectedTagsString) {
      const selectedTags = selectedTagsString
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
      relevantFilePaths = fileMetadata.files
        .filter((file) => file.tags.some((tag) => selectedTags.includes(tag)))
        .map((file) => file.filePath)
    }

    // Fallback: If no tags, or if tags didn't yield files,
    // generate embedding for the topic and search the 'documents' table directly
    if (relevantFilePaths.length === 0) {
      const { embedding } = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: topic,
      })

      const { data: documents, error: dbError } = await supabaseAdmin.rpc("match_documents", {
        query_embedding: embedding,
        match_threshold: 0.5,
        match_count: 5,
      })

      if (dbError) {
        console.error("Error querying Supabase for RAG documents for blog generation:", dbError)
      } else if (documents && documents.length > 0) {
        ragContext = documents.map((doc: any) => doc.content).join("\n\n")
        console.log(`Retrieved ${documents.length} relevant document chunks for blog generation via RAG.`)
      }
    } else {
      // If relevant files were found by tags, fetch their content
      for (const filePath of relevantFilePaths) {
        // This is a simplified approach. In a real scenario, you'd fetch the document content
        // from the `documents` table directly by `file_path` to avoid re-parsing.
        // For now, assuming `documents` table has content, we'd query it.
        // Since we don't have a direct "get content by file_path" in RAG yet,
        // and processFileForRAG just adds to Supabase, we'll use the embedding lookup for now.
        // To properly use tag-selected files for RAG, the `documents` table needs to be queried by file_path.
        // For this step, I'll rely on the embedding search for context.
      }
      // Revert to embedding search if tag-based retrieval is not fully integrated yet
      // To ensure RAG works, I'll rely on the existing `match_documents` RPC for context.
      const { embedding } = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: topic,
      })

      const { data: documents, error: dbError } = await supabaseAdmin.rpc("match_documents", {
        query_embedding: embedding,
        match_threshold: 0.5,
        match_count: 5,
      })

      if (dbError) {
        console.error("Error querying Supabase for RAG documents for blog generation:", dbError)
      } else if (documents && documents.length > 0) {
        ragContext = documents.map((doc: any) => doc.content).join("\n\n")
        console.log(`Retrieved ${documents.length} relevant document chunks for blog generation via RAG (fallback).`)
      }
    }
  } catch (ragError) {
    console.error("Error during RAG context retrieval for blog generation:", ragError)
    // Continue without RAG context if there's an error
  }

  const systemPrompt = `You are an expert blog post writer for WasLost.Ai.
  Generate a professional, engaging, and informative blog post based on the user's provided topic and any additional context.
  The blog post should be written in Markdown format.
  Include a compelling title, and suggest 3-5 keywords (comma-separated, lowercase, kebab-case) and a concise meta description (max 160 characters).
  The content should reflect expertise in AI, Web3, decentralized applications, and trading automation, aligning with WasLost.Ai's mission.
  If RAG context is provided, integrate it naturally and use it to enhance the depth and accuracy of the post.
  If no relevant RAG context is found, generate content based on general knowledge of the topic and WasLost.Ai's profile.
  Ensure the response is a JSON object with 'title', 'content', 'keywords' (array of strings), and 'meta_description' fields.
  Do NOT include any introductory or concluding text outside the JSON.
  `

  const userPrompt = `Generate a blog post about: "${topic}".
  ${ragContext ? `Here is additional context from relevant documents:\n\n${ragContext}\n\n` : ""}
  Remember to provide the output as a JSON object containing 'title', 'content' (in Markdown), 'keywords' (array), and 'meta_description'.`

  let rawJsonString: string | undefined
  let aiResponseText: string | undefined

  try {
    const { text } = await generateText({
      model: openai("gpt-4o"),
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.7, // A bit creative
      max_tokens: 3000, // Sufficient for a blog post
    })

    aiResponseText = text
    rawJsonString = aiResponseText.trim()
    if (rawJsonString.startsWith("```json")) {
      rawJsonString = rawJsonString.substring("```json".length)
    }
    if (rawJsonString.endsWith("```")) {
      rawJsonString = rawJsonString.substring(0, rawJsonString.length - "```".length)
    }
    rawJsonString = rawJsonString.trim()

    const generatedData = JSON.parse(rawJsonString)

    if (!generatedData.title || !generatedData.content) {
      throw new Error("AI response missing required 'title' or 'content' fields.")
    }

    return {
      success: true,
      message: "Blog post generated successfully!",
      generatedTitle: generatedData.title,
      generatedContent: generatedData.content,
      generatedKeywords: generatedData.keywords || [],
      generatedMetaDescription: generatedData.meta_description || "",
    }
  } catch (error) {
    console.error("Error generating blog post with AI:", error)
    return {
      success: false,
      message: `Failed to generate blog post: ${error instanceof Error ? error.message : String(error)}. Raw AI response: ${rawJsonString || aiResponseText}`,
    }
  }
}

export async function saveBlogPost(prevState: any, formData: FormData): Promise<{ success: boolean; message: string }> {
  const id = formData.get("id") as string | undefined
  const title = formData.get("title") as string
  const content = formData.get("content") as string
  const keywordsString = formData.get("keywords") as string // Comma-separated
  const metaDescription = formData.get("metaDescription") as string
  const status = formData.get("status") as "draft" | "published"

  if (!title || !content) {
    return { success: false, message: "Title and Content are required." }
  }

  const slug = slugify(title, { lower: true, strict: true })
  const keywords = keywordsString
    ? keywordsString
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean)
    : []

  try {
    if (id) {
      // Update existing post
      const { error } = await supabaseAdmin
        .from("blog_posts")
        .update({
          title,
          slug,
          content,
          keywords,
          meta_description: metaDescription,
          status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)

      if (error) {
        console.error("Error updating blog post:", error)
        return { success: false, message: `Failed to update blog post: ${error.message}` }
      }
    } else {
      // Insert new post
      const { error } = await supabaseAdmin
        .from("blog_posts")
        .insert({ title, slug, content, keywords, meta_description: metaDescription, status })

      if (error) {
        console.error("Error inserting blog post:", error)
        return { success: false, message: `Failed to create blog post: ${error.message}` }
      }
    }

    revalidatePath("/admin/blog-manager") // Revalidate admin page
    revalidatePath("/blog/[slug]") // Revalidate public blog page
    revalidatePath("/sitemap.xml") // Potentially for dynamic sitemap later

    return { success: true, message: `Blog post ${id ? "updated" : "created"} successfully!` }
  } catch (error) {
    console.error("Error saving blog post:", error)
    return {
      success: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

export async function getBlogPosts(): Promise<{ data: BlogPost[] | null; message?: string }> {
  try {
    const { data, error } = await supabaseAdmin
      .from("blog_posts")
      .select("id, title, slug, status, generated_at, updated_at")
      .order("generated_at", { ascending: false })

    if (error) {
      console.error("Error fetching blog posts:", error)
      return { data: null, message: `Failed to fetch blog posts: ${error.message}` }
    }

    return { data: data as BlogPost[] }
  } catch (error) {
    console.error("Unexpected error in getBlogPosts:", error)
    return {
      data: null,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

export async function getBlogPostBySlug(slug: string): Promise<{ data: BlogPost | null; message?: string }> {
  try {
    const { data, error } = await supabaseAdmin.from("blog_posts").select("*").eq("slug", slug).single()

    if (error) {
      console.error(`Error fetching blog post with slug ${slug}:`, error)
      return { data: null, message: `Failed to fetch blog post: ${error.message}` }
    }

    return { data: data as BlogPost }
  } catch (error) {
    console.error("Unexpected error in getBlogPostBySlug:", error)
    return {
      data: null,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

export async function deleteBlogPost(id: string): Promise<{ success: boolean; message: string }> {
  try {
    const { error } = await supabaseAdmin.from("blog_posts").delete().eq("id", id)

    if (error) {
      console.error("Error deleting blog post:", error)
      return { success: false, message: `Failed to delete blog post: ${error.message}` }
    }

    revalidatePath("/admin/blog-manager")
    revalidatePath("/blog/[slug]") // Revalidate public blog page
    revalidatePath("/sitemap.xml") // Potentially for dynamic sitemap later

    return { success: true, message: "Blog post deleted successfully!" }
  } catch (error) {
    console.error("Unexpected error in deleteBlogPost:", error)
    return {
      success: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}
