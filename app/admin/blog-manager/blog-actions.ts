"use server"

import { supabaseAdmin } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import { put } from "@vercel/blob"

interface BlogPost {
  id: string
  title: string
  slug: string
  content: string
  excerpt: string
  published: boolean
  featured_image_url?: string
  keywords?: string[]
  created_at: string
  updated_at: string
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

export async function getPublishedBlogPosts(): Promise<{ data: BlogPost[] | null; message?: string }> {
  try {
    const { data, error } = await supabaseAdmin
      .from("blog_posts")
      .select("*")
      .eq("published", true)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching published blog posts:", error)
      return { data: null, message: `Failed to fetch published blog posts: ${error.message}` }
    }

    return { data: data as BlogPost[] }
  } catch (error) {
    console.error("Unexpected error in getPublishedBlogPosts:", error)
    return {
      data: null,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

export async function getBlogPostBySlug(slug: string): Promise<{ data: BlogPost | null; message?: string }> {
  try {
    const { data, error } = await supabaseAdmin
      .from("blog_posts")
      .select("*")
      .eq("slug", slug)
      .eq("published", true)
      .single()

    if (error) {
      console.error("Error fetching blog post by slug:", error)
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

export async function createBlogPost(
  prevState: any,
  formData: FormData,
): Promise<{ success: boolean; message: string; slug?: string }> {
  const title = formData.get("title") as string
  const content = formData.get("content") as string
  const excerpt = formData.get("excerpt") as string
  const published = formData.get("published") === "true"
  const featuredImageUrl = formData.get("featuredImageUrl") as string
  const keywordsString = formData.get("keywords") as string

  if (!title || !content) {
    return { success: false, message: "Title and content are required." }
  }

  try {
    const slug = title
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "")

    const keywords = keywordsString ? keywordsString.split(",").map((k) => k.trim()) : []

    const { data, error } = await supabaseAdmin
      .from("blog_posts")
      .insert({
        title,
        slug,
        content,
        excerpt,
        published,
        featured_image_url: featuredImageUrl || null,
        keywords,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating blog post:", error)
      return { success: false, message: `Failed to create blog post: ${error.message}` }
    }

    revalidatePath("/blog")
    revalidatePath("/admin/blog-manager")
    return { success: true, message: "Blog post created successfully!", slug }
  } catch (error) {
    console.error("Unexpected error in createBlogPost:", error)
    return {
      success: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

export async function updateBlogPost(
  id: string,
  prevState: any,
  formData: FormData,
): Promise<{ success: boolean; message: string }> {
  const title = formData.get("title") as string
  const content = formData.get("content") as string
  const excerpt = formData.get("excerpt") as string
  const published = formData.get("published") === "true"
  const featuredImageUrl = formData.get("featuredImageUrl") as string
  const keywordsString = formData.get("keywords") as string

  if (!title || !content) {
    return { success: false, message: "Title and content are required." }
  }

  try {
    const slug = title
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "")

    const keywords = keywordsString ? keywordsString.split(",").map((k) => k.trim()) : []

    const { error } = await supabaseAdmin
      .from("blog_posts")
      .update({
        title,
        slug,
        content,
        excerpt,
        published,
        featured_image_url: featuredImageUrl || null,
        keywords,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)

    if (error) {
      console.error("Error updating blog post:", error)
      return { success: false, message: `Failed to update blog post: ${error.message}` }
    }

    revalidatePath("/blog")
    revalidatePath("/admin/blog-manager")
    return { success: true, message: "Blog post updated successfully!" }
  } catch (error) {
    console.error("Unexpected error in updateBlogPost:", error)
    return {
      success: false,
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

    revalidatePath("/blog")
    revalidatePath("/admin/blog-manager")
    return { success: true, message: "Blog post deleted successfully!" }
  } catch (error) {
    console.error("Unexpected error in deleteBlogPost:", error)
    return {
      success: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

export async function uploadBlogImage(
  prevState: any,
  formData: FormData,
): Promise<{ success: boolean; message: string; imageUrl?: string }> {
  const file = formData.get("file") as File

  if (!file) {
    return { success: false, message: "No image file provided." }
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error("BLOB_READ_WRITE_TOKEN environment variable is not set.")
    return { success: false, message: "Server configuration error: Blob storage token is missing." }
  }

  try {
    if (!file.type.startsWith("image/")) {
      return { success: false, message: "Only image files are allowed." }
    }

    const filePath = `blog-images/${Date.now()}-${file.name}`
    const blob = await put(filePath, file, {
      access: "public",
      contentType: file.type,
      addRandomSuffix: false,
    })

    console.log("Blog image uploaded to Vercel Blob:", blob.url)
    return { success: true, message: "Image uploaded successfully!", imageUrl: blob.url }
  } catch (error) {
    console.error("Error uploading blog image:", error)
    return {
      success: false,
      message: `Failed to upload image: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}
