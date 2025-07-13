"use server"

import { revalidatePath } from "next/cache"
import { v4 as uuidv4 } from "uuid"

export type BlogPost = {
  id: string
  title: string
  slug: string
  content: string
  status: "draft" | "published" | "archived"
  generated_at: string
  updated_at?: string
  meta_description?: string
  keywords?: string[]
  featured_image_url?: string
}

// Mock database for blog posts
let blogPosts: BlogPost[] = [
  {
    id: "1",
    title: "The Future of AI in Web3",
    slug: "future-of-ai-web3",
    content: "This is a **mock** blog post about the exciting future of AI in Web3.",
    status: "published",
    generated_at: new Date().toISOString(),
    meta_description: "Explore the convergence of AI and Web3 technologies.",
    keywords: ["AI", "Web3", "Blockchain"],
    featured_image_url: "/placeholder.svg?height=400&width=600",
  },
  {
    id: "2",
    title: "Getting Started with Solana Development",
    slug: "solana-development-guide",
    content: "A comprehensive guide to starting your journey in Solana development.",
    status: "draft",
    generated_at: new Date().toISOString(),
    meta_description: "Begin your Solana development journey with this guide.",
    keywords: ["Solana", "Development", "Blockchain"],
    featured_image_url: "/placeholder.svg?height=400&width=600",
  },
]

// Helper to simulate image upload (replace with actual Blob/S3 upload in production)
async function uploadImageToMockStorage(file: File): Promise<string> {
  // In a real application, you would upload to Vercel Blob, S3, etc.
  // For now, we'll just create a blob URL or use a placeholder.
  return URL.createObjectURL(file) // This is client-side only, won't persist on server
  // Or for a server-side mock:
  // return `/placeholder.svg?height=400&width=600&query=${encodeURIComponent(file.name)}`;
}

export async function getBlogPosts(): Promise<{ data: BlogPost[] | null; message: string }> {
  try {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500))
    return { data: blogPosts, message: "Blog posts fetched successfully." }
  } catch (error) {
    console.error("Error fetching blog posts:", error)
    return { data: null, message: "Failed to fetch blog posts." }
  }
}

export async function getPublishedBlogPosts(): Promise<{ data: BlogPost[] | null; message: string }> {
  try {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500))
    const publishedPosts = blogPosts.filter((post) => post.status === "published")
    return { data: publishedPosts, message: "Published blog posts fetched successfully." }
  } catch (error) {
    console.error("Error fetching published blog posts:", error)
    return { data: null, message: "Failed to fetch published blog posts." }
  }
}

export async function getBlogPostBySlug(slug: string): Promise<{ data: BlogPost | null; message: string }> {
  try {
    await new Promise((resolve) => setTimeout(resolve, 500))
    const post = blogPosts.find((p) => p.slug === slug)
    if (post) {
      return { data: post, message: "Blog post fetched successfully." }
    } else {
      return { data: null, message: "Blog post not found." }
    }
  } catch (error) {
    console.error("Error fetching blog post by slug:", error)
    return { data: null, message: "Failed to fetch blog post." }
  }
}

export async function createBlogPost(
  prevState: any,
  formData: FormData,
): Promise<{ success: boolean; message: string; blogPost?: BlogPost }> {
  const title = formData.get("title") as string
  const slug = formData.get("slug") as string
  const content = formData.get("content") as string
  const status = formData.get("status") as BlogPost["status"]
  const meta_description = formData.get("meta_description") as string
  const keywords = formData.get("keywords") as string
  const featuredImage = formData.get("featuredImage") as File | null

  if (!title || !slug || !content || !status) {
    return { success: false, message: "Missing required fields." }
  }

  if (blogPosts.some((post) => post.slug === slug)) {
    return { success: false, message: "A blog post with this slug already exists." }
  }

  let featured_image_url: string | undefined
  if (featuredImage && featuredImage.size > 0) {
    // In a real app, upload to Vercel Blob or similar
    featured_image_url = await uploadImageToMockStorage(featuredImage)
  }

  const newPost: BlogPost = {
    id: uuidv4(),
    title,
    slug,
    content,
    status,
    generated_at: new Date().toISOString(),
    meta_description: meta_description || undefined,
    keywords: keywords ? keywords.split(",").map((k) => k.trim()) : undefined,
    featured_image_url,
  }

  blogPosts.push(newPost)

  // Revalidate paths for blog list and new post
  revalidatePath("/blog")
  revalidatePath(`/blog/${slug}`)
  revalidatePath("/sitemap.xml") // Assuming sitemap includes blog posts
  revalidatePath("/rss.xml") // Assuming RSS feed includes blog posts

  return { success: true, message: "Blog post created successfully!", blogPost: newPost }
}

export async function updateBlogPost(
  prevState: any,
  formData: FormData,
): Promise<{ success: boolean; message: string; blogPost?: BlogPost }> {
  const id = formData.get("id") as string
  const title = formData.get("title") as string
  const slug = formData.get("slug") as string
  const content = formData.get("content") as string
  const status = formData.get("status") as BlogPost["status"]
  const meta_description = formData.get("meta_description") as string
  const keywords = formData.get("keywords") as string
  const featuredImage = formData.get("featuredImage") as File | null
  const existingImageUrl = formData.get("existingImageUrl") as string | null
  const clearFeaturedImage = formData.get("clearFeaturedImage") === "true"

  if (!id || !title || !slug || !content || !status) {
    return { success: false, message: "Missing required fields." }
  }

  const index = blogPosts.findIndex((post) => post.id === id)
  if (index === -1) {
    return { success: false, message: "Blog post not found." }
  }

  // Check for slug conflict with other posts
  if (blogPosts.some((post) => post.slug === slug && post.id !== id)) {
    return { success: false, message: "A blog post with this slug already exists." }
  }

  let featured_image_url: string | undefined
  if (clearFeaturedImage) {
    featured_image_url = undefined
  } else if (featuredImage && featuredImage.size > 0) {
    featured_image_url = await uploadImageToMockStorage(featuredImage)
  } else {
    featured_image_url = existingImageUrl || undefined
  }

  const updatedPost: BlogPost = {
    ...blogPosts[index],
    title,
    slug,
    content,
    status,
    updated_at: new Date().toISOString(),
    meta_description: meta_description || undefined,
    keywords: keywords ? keywords.split(",").map((k) => k.trim()) : undefined,
    featured_image_url,
  }

  blogPosts[index] = updatedPost

  // Revalidate paths for blog list and updated post
  revalidatePath("/blog")
  revalidatePath(`/blog/${slug}`)
  revalidatePath("/sitemap.xml")
  revalidatePath("/rss.xml")

  return { success: true, message: "Blog post updated successfully!", blogPost: updatedPost }
}

export async function deleteBlogPost(id: string): Promise<{ success: boolean; message: string }> {
  const initialLength = blogPosts.length
  blogPosts = blogPosts.filter((post) => post.id !== id)

  if (blogPosts.length < initialLength) {
    // Revalidate paths for blog list and potentially the deleted post's slug
    revalidatePath("/blog")
    // If you know the slug of the deleted post, you might revalidate it specifically
    // revalidatePath(`/blog/${deletedPostSlug}`);
    revalidatePath("/sitemap.xml")
    revalidatePath("/rss.xml")
    return { success: true, message: "Blog post deleted successfully." }
  } else {
    return { success: false, message: "Blog post not found." }
  }
}
