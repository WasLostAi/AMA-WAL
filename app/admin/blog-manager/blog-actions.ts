"use server"

import { supabaseAdmin } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import { openai } from "@ai-sdk/openai"

interface BlogPost {
  id: string
  title: string
  slug: string
  content: string
  tags: string[] | null
  status: "draft" | "published"
  created_at: string
  updated_at: string
}

// Helper to fetch content from selected RAG files
async function fetchRAGContent(filePaths: string[]): Promise<string> {
  let combinedContent = ""
  for (const filePath of filePaths) {
    try {
      const blobUrl = `https://blob.vercel-storage.com${filePath}`
      const response = await fetch(blobUrl)
      if (response.ok) {
        const text = await response.text()
        combinedContent += `\n\n--- Content from ${filePath.split("/").pop()} ---\n${text}`
      } else {
        console.warn(`Failed to fetch RAG file ${filePath}: ${response.statusText}`)
      }
    } catch (error) {
      console.error(`Error fetching RAG file ${filePath}:`, error)
    }
  }
  return combinedContent.trim()
}

// --- Blog Post Generation Action ---
export async function generateBlogPostContent(
  prompt: string,
  selectedFilePaths: string[],
): Promise<{ success: boolean; content?: string; message: string }> {
  if (!process.env.OPENAI_API_KEY) {
    return { success: false, message: "Server configuration error: OpenAI API key is missing." }
  }
  if (!prompt.trim()) {
    return { success: false, message: "Prompt cannot be empty." }
  }

  try {
    let ragContext = ""
    if (selectedFilePaths && selectedFilePaths.length > 0) {
      ragContext = await fetchRAGContent(selectedFilePaths)
      if (ragContext) {
        console.log(`Using RAG context from ${selectedFilePaths.length} files.`)
      } else {
        console.warn("Selected RAG files did not yield any content.")
      }
    }

    const systemPrompt = `You are an expert content writer for WasLost.Ai, specializing in AI, Web3, and trading automation.
                          Your task is to generate a concise blog post (around 300-500 words) based on the user's prompt and provided context.
                          The tone should be professional, insightful, and engaging.
                          Include a clear, compelling title at the beginning, followed by the blog post content in Markdown format.
                          Do NOT include any introductory or concluding remarks outside the blog post itself.
                          If RAG context is provided, prioritize and integrate information from it naturally into the post.
                          Ensure the content is unique and adds value.`

    const fullPrompt = `Generate a blog post about: "${prompt}"
                        ${ragContext ? `\n\n--- Relevant Information from WasLost.Ai Documents ---\n${ragContext}` : ""}
                        `

    const { text } = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: fullPrompt },
      ],
      temperature: 0.7,
      max_tokens: 1500, // Adjust based on desired length
    })

    return { success: true, content: text, message: "Blog post generated successfully!" }
  } catch (error) {
    console.error("Error generating blog post content:", error)
    return {
      success: false,
      message: `Failed to generate blog post: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

// --- Blog Post CRUD Actions ---

export async function saveBlogPost(
  prevState: any,
  formData: FormData,
): Promise<{ success: boolean; message: string; slug?: string }> {
  const id = formData.get("id") as string | null // Will be null for new posts
  const title = formData.get("title") as string
  const slug = formData.get("slug") as string
  const content = formData.get("content") as string
  const tagsString = formData.get("tags") as string
  const status = formData.get("status") as "draft" | "published"

  if (!title || !slug || !content) {
    return { success: false, message: "Title, slug, and content are required." }
  }

  const tags = tagsString
    .split(",")
    .map((tag) => tag.trim().toLowerCase().replace(/\s+/g, "-"))
    .filter(Boolean)

  try {
    let result
    if (id) {
      // Update existing post
      result = await supabaseAdmin
        .from("blog_posts")
        .update({ title, slug, content, tags, status, updated_at: new Date().toISOString() })
        .eq("id", id)
    } else {
      // Insert new post
      result = await supabaseAdmin.from("blog_posts").insert({ title, slug, content, tags, status })
    }

    if (result.error) {
      console.error("Error saving blog post:", result.error)
      return { success: false, message: `Failed to save blog post: ${result.error.message}` }
    }

    revalidatePath("/blog") // Revalidate the public blog page (if it exists)
    revalidatePath("/admin/blog-manager") // Revalidate this admin page
    return { success: true, message: "Blog post saved successfully!", slug: slug }
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
    const { data, error } = await supabaseAdmin.from("blog_posts").select("*").order("created_at", { ascending: false })

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
    const { data, error } = await supabaseAdmin.from("blog_posts").select("*").eq("slug", slug).maybeSingle()

    if (error) {
      console.error(`Error fetching blog post by slug ${slug}:`, error)
      return { data: null, message: `Failed to fetch blog post: ${error.message}` }
    }

    if (!data) {
      return { data: null, message: "Blog post not found." }
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

    revalidatePath("/blog") // Revalidate the public blog page
    revalidatePath("/admin/blog-manager") // Revalidate this admin page
    return { success: true, message: "Blog post deleted successfully!" }
  } catch (error) {
    console.error("Unexpected error in deleteBlogPost:", error)
    return {
      success: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}
