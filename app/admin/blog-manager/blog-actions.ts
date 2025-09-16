"use server"

import { supabaseAdmin } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import { put } from "@vercel/blob"

export interface BlogPost {
  id: string
  title: string
  slug: string
  content: string
  excerpt?: string
  featured_image?: string
  status: "draft" | "published" | "archived"
  tags?: string[]
  keywords?: string[]
  meta_description?: string
  author_id?: string
  created_at: string
  updated_at: string
  published_at?: string
}

export async function getAllBlogPosts(): Promise<{ data: BlogPost[] | null; message?: string }> {
  try {
    const { data, error } = await supabaseAdmin.from("blog_posts").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching blog posts:", error)
      return { data: null, message: `Failed to fetch blog posts: ${error.message}` }
    }

    return { data: data as BlogPost[] }
  } catch (error) {
    console.error("Unexpected error in getAllBlogPosts:", error)
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
      .eq("status", "published")
      .order("published_at", { ascending: false })

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
    const { data, error } = await supabaseAdmin.from("blog_posts").select("*").eq("slug", slug).single()

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
): Promise<{ success: boolean; message: string; postId?: string }> {
  const title = formData.get("title") as string
  const slug = formData.get("slug") as string
  const content = formData.get("content") as string
  const excerpt = formData.get("excerpt") as string
  const status = formData.get("status") as "draft" | "published"
  const tags = formData.get("tags") as string
  const keywords = formData.get("keywords") as string
  const metaDescription = formData.get("metaDescription") as string
  const featuredImage = formData.get("featuredImage") as string

  if (!title || !slug || !content) {
    return { success: false, message: "Title, slug, and content are required." }
  }

  try {
    const blogPost = {
      title,
      slug,
      content,
      excerpt: excerpt || null,
      featured_image: featuredImage || null,
      status,
      tags: tags ? tags.split(",").map((tag) => tag.trim()) : [],
      keywords: keywords ? keywords.split(",").map((keyword) => keyword.trim()) : [],
      meta_description: metaDescription || null,
      published_at: status === "published" ? new Date().toISOString() : null,
    }

    const { data, error } = await supabaseAdmin.from("blog_posts").insert(blogPost).select().single()

    if (error) {
      console.error("Error creating blog post:", error)
      return { success: false, message: `Failed to create blog post: ${error.message}` }
    }

    revalidatePath("/admin/blog-manager")
    revalidatePath("/blog")
    return { success: true, message: "Blog post created successfully!", postId: data.id }
  } catch (error) {
    console.error("Unexpected error in createBlogPost:", error)
    return {
      success: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

export async function updateBlogPost(
  prevState: any,
  formData: FormData,
): Promise<{ success: boolean; message: string }> {
  const id = formData.get("id") as string
  const title = formData.get("title") as string
  const slug = formData.get("slug") as string
  const content = formData.get("content") as string
  const excerpt = formData.get("excerpt") as string
  const status = formData.get("status") as "draft" | "published"
  const tags = formData.get("tags") as string
  const keywords = formData.get("keywords") as string
  const metaDescription = formData.get("metaDescription") as string
  const featuredImage = formData.get("featuredImage") as string

  if (!id || !title || !slug || !content) {
    return { success: false, message: "ID, title, slug, and content are required." }
  }

  try {
    const blogPost = {
      title,
      slug,
      content,
      excerpt: excerpt || null,
      featured_image: featuredImage || null,
      status,
      tags: tags ? tags.split(",").map((tag) => tag.trim()) : [],
      keywords: keywords ? keywords.split(",").map((keyword) => keyword.trim()) : [],
      meta_description: metaDescription || null,
      updated_at: new Date().toISOString(),
      published_at: status === "published" ? new Date().toISOString() : null,
    }

    const { error } = await supabaseAdmin.from("blog_posts").update(blogPost).eq("id", id)

    if (error) {
      console.error("Error updating blog post:", error)
      return { success: false, message: `Failed to update blog post: ${error.message}` }
    }

    revalidatePath("/admin/blog-manager")
    revalidatePath("/blog")
    revalidatePath(`/blog/${slug}`)
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

    revalidatePath("/admin/blog-manager")
    revalidatePath("/blog")
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
