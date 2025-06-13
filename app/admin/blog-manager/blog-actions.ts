"use server"

import { supabaseAdmin } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

interface BlogPost {
  id: string
  slug: string
  title: string
  content: string
  description: string
  tags: string[] | null
  created_at: string
  updated_at: string
}

// Helper to generate a SEO-friendly slug
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // Remove non-alphanumeric characters except spaces and hyphens
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with a single hyphen
    .substring(0, 60) // Limit length for practical SEO
}

// Helper function to generate embedding for RAG
async function getEmbedding(text: string): Promise<number[]> {
  const { embedding } = await openai.embeddings.create({
    model: "text-embedding-3-small", // Use a suitable embedding model
    input: text,
  })
  return embedding
}

// --- Blog Post Generation Action ---
export async function generateBlogPost(
  prevState: any,
  formData: FormData,
): Promise<{
  success: boolean
  message: string
  generatedContent?: { title: string; content: string; description: string; tags: string[] }
}> {
  if (!process.env.OPENAI_API_KEY) {
    return { success: false, message: "Server configuration error: OpenAI API key is missing." }
  }

  const topic = formData.get("topic") as string
  const keywords = formData.get("keywords") as string
  const style = formData.get("style") as string

  if (!topic.trim()) {
    return { success: false, message: "A topic is required to generate a blog post." }
  }

  try {
    // 1. RAG: Retrieve relevant documents based on the topic and keywords
    let retrievedContext = ""
    if (topic || keywords) {
      const queryText = `${topic} ${keywords}`.trim()
      const queryEmbedding = await getEmbedding(queryText)

      const { data: documents, error: dbError } = await supabaseAdmin.rpc("match_documents", {
        query_embedding: queryEmbedding,
        match_threshold: 0.7, // Adjust threshold for relevance
        match_count: 5, // Get top 5 relevant documents
      })

      if (dbError) {
        console.error("Error querying Supabase for RAG documents:", dbError)
      } else if (documents && documents.length > 0) {
        retrievedContext = documents.map((doc: any) => doc.content).join("\n\n")
        console.log(`Retrieved ${documents.length} relevant RAG documents for blog post generation.`)
      }
    }

    // 2. AI Generation
    const systemPrompt = `You are a professional blog post writer for WasLost.Ai,
      focusing on AI, Web3, and trading automation.
      Generate a comprehensive and engaging blog post based on the user's topic.
      If provided, use the additional context from uploaded documents to enrich the content.
      The output MUST be in Markdown format.
      Include a clear, concise headline and a brief description (for SEO meta tag).
      Suggest 3-5 relevant tags (comma-separated, kebab-case) based on the content.

      Format your response as follows (use Markdown for content, JSON for metadata):
      ---JSON_METADATA_START---
      {
        "title": "Your Blog Post Title",
        "description": "A concise summary for SEO meta description.",
        "tags": ["tag-one", "tag-two"]
      }
      ---JSON_METADATA_END---

      # Your Blog Post Title
      ## Introduction
      ... (rest of your blog post content in Markdown)
      `

    const prompt = `Generate a blog post about: "${topic}".
      Keywords to include: ${keywords || "none"}.
      Writing style: ${style || "professional and informative"}.

      ${
        retrievedContext
          ? `--- Relevant Context from WasLost.Ai Documents ---
      ${retrievedContext}
      --- End of Context ---`
          : ""
      }
      `

    const { text } = await generateText({
      model: openai("gpt-4o"), // Using a powerful model for content generation
      system: systemPrompt,
      prompt: prompt,
      temperature: 0.7, // Allow for creativity
      max_tokens: 2000, // Sufficient tokens for a blog post
    })

    // Parse the AI's response to separate metadata and content
    const metadataStart = text.indexOf("---JSON_METADATA_START---")
    const metadataEnd = text.indexOf("---JSON_METADATA_END---")

    if (metadataStart === -1 || metadataEnd === -1) {
      console.error("Failed to parse AI response: Missing metadata delimiters.", text)
      return {
        success: false,
        message: "Failed to generate blog post: AI response format was unexpected. Please try again.",
      }
    }

    const jsonString = text.substring(metadataStart + "---JSON_METADATA_START---".length, metadataEnd).trim()
    const markdownContent = text.substring(metadataEnd + "---JSON_METADATA_END---".length).trim()

    let parsedMetadata: { title: string; description: string; tags: string[] }
    try {
      parsedMetadata = JSON.parse(jsonString)
    } catch (parseError) {
      console.error("Failed to parse AI generated metadata JSON:", parseError, jsonString)
      return { success: false, message: "Failed to parse AI generated metadata. Please try again." }
    }

    const generatedTitle = parsedMetadata.title || topic
    const generatedDescription = parsedMetadata.description || ""
    const generatedTags = parsedMetadata.tags || []

    return {
      success: true,
      message: "Blog post generated successfully!",
      generatedContent: {
        title: generatedTitle,
        content: markdownContent,
        description: generatedDescription,
        tags: generatedTags,
      },
    }
  } catch (error) {
    console.error("Error generating blog post:", error)
    return {
      success: false,
      message: `Failed to generate blog post: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

// --- Save Blog Post Action ---
export async function saveBlogPost(
  prevState: any,
  formData: FormData,
): Promise<{ success: boolean; message: string; slug?: string }> {
  const id = (formData.get("id") as string) || undefined // If id exists, it's an update
  const title = formData.get("title") as string
  const content = formData.get("content") as string
  const description = formData.get("description") as string
  const tagsString = formData.get("tags") as string
  const slug = (formData.get("slug") as string) || generateSlug(title) // Use provided slug or generate

  if (!title.trim() || !content.trim() || !description.trim() || !slug.trim()) {
    return { success: false, message: "Title, content, description, and slug are required." }
  }

  const tags = tagsString
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)

  try {
    let result
    if (id) {
      // Update existing post
      result = await supabaseAdmin
        .from("blog_posts")
        .update({ title, content, description, tags, slug, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select() // Select the updated row to get the slug
    } else {
      // Insert new post
      result = await supabaseAdmin.from("blog_posts").insert({ title, content, description, tags, slug }).select() // Select the inserted row to get the slug
    }

    const { data, error } = result

    if (error) {
      // Handle unique slug constraint error
      if (error.code === "23505" && error.constraint === "blog_posts_slug_key") {
        return {
          success: false,
          message: `A blog post with the slug '${slug}' already exists. Please change the title or edit the slug manually.`,
        }
      }
      console.error("Error saving blog post:", error)
      return { success: false, message: `Failed to save blog post: ${error.message}` }
    }

    revalidatePath("/blog") // Revalidate the blog list page
    revalidatePath(`/blog/${slug}`) // Revalidate the specific blog post page
    revalidatePath("/admin/blog-manager") // Revalidate this page

    return { success: true, message: `Blog post "${title}" saved successfully!`, slug: data?.[0]?.slug }
  } catch (error) {
    console.error("Unexpected error in saveBlogPost:", error)
    return {
      success: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

// --- Get All Blog Posts Action ---
export async function getBlogPosts(): Promise<{ data: BlogPost[] | null; message?: string }> {
  try {
    const { data, error } = await supabaseAdmin
      .from("blog_posts")
      .select("id, slug, title, description, tags, created_at, updated_at")
      .order("created_at", { ascending: false })

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

// --- Get Single Blog Post Action (for editing) ---
export async function getBlogPostBySlugOrId(identifier: string): Promise<{ data: BlogPost | null; message?: string }> {
  try {
    let query = supabaseAdmin.from("blog_posts").select("*").limit(1)

    // Check if identifier looks like a UUID
    if (identifier.match(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/)) {
      query = query.eq("id", identifier)
    } else {
      query = query.eq("slug", identifier)
    }

    const { data, error } = await query.single()

    if (error && error.code !== "PGRST116") {
      // PGRST116 is "No rows found"
      console.error("Error fetching single blog post:", error)
      return { data: null, message: `Failed to fetch blog post: ${error.message}` }
    }

    if (!data) {
      return { data: null, message: "Blog post not found." }
    }

    return { data: data as BlogPost }
  } catch (error) {
    console.error("Unexpected error in getBlogPostBySlugOrId:", error)
    return {
      data: null,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

// --- Delete Blog Post Action ---
export async function deleteBlogPost(id: string): Promise<{ success: boolean; message: string }> {
  try {
    const { error } = await supabaseAdmin.from("blog_posts").delete().eq("id", id)

    if (error) {
      console.error("Error deleting blog post:", error)
      return { success: false, message: `Failed to delete blog post: ${error.message}` }
    }

    revalidatePath("/blog") // Revalidate the blog list page
    // No need to revalidate specific slug if it's deleted.
    revalidatePath("/admin/blog-manager") // Revalidate this page
    return { success: true, message: "Blog post deleted successfully!" }
  } catch (error) {
    console.error("Unexpected error in deleteBlogPost:", error)
    return {
      success: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}
