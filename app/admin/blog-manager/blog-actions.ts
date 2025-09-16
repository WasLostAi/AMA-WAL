"use server"
import { revalidatePath } from "next/cache"
import { customAlphabet } from "nanoid"

const nanoid = customAlphabet("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz", 7)

export interface BlogPost {
  id: string
  title: string
  slug: string
  content: string
  excerpt?: string
  status: "draft" | "published" | "archived"
  meta_description?: string
  keywords?: string[]
  featured_image_url?: string
  generated_at: string
  updated_at: string
  published: boolean
}

// Mock database for blog posts
let mockBlogPosts: BlogPost[] = [
  {
    id: "1",
    title: "The Rise of AI Agents in Web3",
    slug: "ai-agents-web3",
    content: "This is the content for the first blog post about AI agents in Web3...",
    excerpt: "Exploring the integration of AI with decentralized technologies.",
    status: "published",
    meta_description: "Learn about AI agents and their impact on Web3.",
    keywords: ["AI", "Web3", "Agents", "Blockchain"],
    featured_image_url: "/placeholder.svg?height=400&width=600",
    generated_at: new Date("2023-01-15T10:00:00Z").toISOString(),
    updated_at: new Date("2023-01-15T10:00:00Z").toISOString(),
    published: true,
  },
  {
    id: "2",
    title: "Solana Ecosystem Deep Dive",
    slug: "solana-ecosystem-deep-dive",
    content: "A comprehensive look into the Solana blockchain and its growing ecosystem.",
    excerpt: "Understanding the key projects and innovations on Solana.",
    status: "published",
    meta_description: "Dive deep into the Solana blockchain ecosystem.",
    keywords: ["Solana", "Blockchain", "Crypto", "Decentralized"],
    featured_image_url: "/placeholder.svg?height=400&width=600",
    generated_at: new Date("2023-02-20T11:30:00Z").toISOString(),
    updated_at: new Date("2023-02-20T11:30:00Z").toISOString(),
    published: true,
  },
  {
    id: "3",
    title: "Building Decentralized Applications with Next.js",
    slug: "building-dapps-nextjs",
    content: "A guide to developing dApps using Next.js and various Web3 libraries.",
    excerpt: "Step-by-step tutorial for dApp development.",
    status: "draft",
    meta_description: "Develop decentralized applications with Next.js.",
    keywords: ["dApps", "Next.js", "Web3", "Development"],
    featured_image_url: "/placeholder.svg?height=400&width=600",
    generated_at: new Date("2023-03-10T09:00:00Z").toISOString(),
    updated_at: new Date("2023-03-10T09:00:00Z").toISOString(),
    published: false,
  },
]

export async function getBlogPosts(): Promise<{ data: BlogPost[] | null; message: string }> {
  try {
    // Simulate database fetch
    await new Promise((resolve) => setTimeout(resolve, 500))
    return { data: mockBlogPosts, message: "Blog posts fetched successfully." }
  } catch (error) {
    console.error("Database query error:", error)
    return { data: null, message: "Failed to fetch blog posts." }
  }
}

export async function getPublishedBlogPosts(): Promise<{ data: BlogPost[] | null; message: string }> {
  try {
    // Simulate database fetch for published posts only
    await new Promise((resolve) => setTimeout(resolve, 500))
    const publishedPosts = mockBlogPosts.filter((post) => post.status === "published")
    return { data: publishedPosts, message: "Published blog posts fetched successfully." }
  } catch (error) {
    console.error("Database query error:", error)
    return { data: null, message: "Failed to fetch published blog posts." }
  }
}

export async function getBlogPostBySlug(slug: string): Promise<{ data: BlogPost | null; message: string }> {
  try {
    // Simulate database fetch
    await new Promise((resolve) => setTimeout(resolve, 500))
    const post = mockBlogPosts.find((p) => p.slug === slug)
    if (post) {
      return { data: post, message: "Blog post fetched successfully." }
    } else {
      return { data: null, message: "Blog post not found." }
    }
  } catch (error) {
    console.error("Database query error:", error)
    return { data: null, message: "Failed to fetch blog post by slug." }
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

  if (!title || !slug || !content) {
    return { success: false, message: "Title, slug, and content are required." }
  }

  // Check for duplicate slug
  if (mockBlogPosts.some((post) => post.slug === slug)) {
    return { success: false, message: "A blog post with this slug already exists." }
  }

  let featured_image_url: string | undefined = undefined
  if (featuredImage && featuredImage.size > 0) {
    try {
      // Simulate blob upload
      const filename = `${nanoid()}-${featuredImage.name}`
      // In a real scenario, you'd upload to Vercel Blob here
      // const blob = await put(filename, featuredImage, { access: 'public' });
      featured_image_url = `/placeholder.svg?height=400&width=600&query=${encodeURIComponent(filename)}`
    } catch (error) {
      console.error("Error uploading featured image:", error)
      return { success: false, message: "Failed to upload featured image." }
    }
  }

  const newBlogPost: BlogPost = {
    id: nanoid(),
    title,
    slug,
    content,
    excerpt: content.substring(0, 150) + "...", // Simple excerpt
    status,
    meta_description: meta_description || undefined,
    keywords: keywords ? keywords.split(",").map((k) => k.trim()) : undefined,
    featured_image_url,
    generated_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    published: status === "published",
  }

  mockBlogPosts.push(newBlogPost)
  revalidatePath("/admin/blog-manager")
  revalidatePath(`/blog/${slug}`)
  revalidatePath("/blog")
  revalidatePath("/sitemap.xml")
  revalidatePath("/rss.xml")

  return { success: true, message: "Blog post created successfully!", blogPost: newBlogPost }
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

  if (!id || !title || !slug || !content) {
    return { success: false, message: "ID, title, slug, and content are required." }
  }

  const postIndex = mockBlogPosts.findIndex((post) => post.id === id)
  if (postIndex === -1) {
    return { success: false, message: "Blog post not found." }
  }

  const originalPost = mockBlogPosts[postIndex]

  // Check for duplicate slug, excluding the current post
  if (mockBlogPosts.some((post) => post.slug === slug && post.id !== id)) {
    return { success: false, message: "A blog post with this slug already exists." }
  }

  let newFeaturedImageUrl: string | undefined = originalPost.featured_image_url

  if (clearFeaturedImage) {
    newFeaturedImageUrl = undefined
    // In a real scenario, you'd delete the blob here if it existed
    // if (originalPost.featured_image_url) {
    //   await del(originalPost.featured_image_url);
    // }
  } else if (featuredImage && featuredImage.size > 0) {
    try {
      // Simulate blob upload
      const filename = `${nanoid()}-${featuredImage.name}`
      // In a real scenario, you'd upload to Vercel Blob here
      // const blob = await put(filename, featuredImage, { access: 'public' });
      newFeaturedImageUrl = `/placeholder.svg?height=400&width=600&query=${encodeURIComponent(filename)}`
      // If there was an old image, delete it
      // if (originalPost.featured_image_url) {
      //   await del(originalPost.featured_image_url);
      // }
    } catch (error) {
      console.error("Error uploading new featured image:", error)
      return { success: false, message: "Failed to upload new featured image." }
    }
  } else if (existingImageUrl) {
    newFeaturedImageUrl = existingImageUrl
  }

  const updatedBlogPost: BlogPost = {
    ...originalPost,
    title,
    slug,
    content,
    excerpt: content.substring(0, 150) + "...", // Simple excerpt
    status,
    meta_description: meta_description || undefined,
    keywords: keywords ? keywords.split(",").map((k) => k.trim()) : undefined,
    featured_image_url: newFeaturedImageUrl,
    updated_at: new Date().toISOString(),
    published: status === "published",
  }

  mockBlogPosts[postIndex] = updatedBlogPost

  revalidatePath("/admin/blog-manager")
  revalidatePath(`/blog/${slug}`)
  revalidatePath("/blog")
  revalidatePath("/sitemap.xml")
  revalidatePath("/rss.xml")

  // If slug changed, revalidate old slug path
  if (originalPost.slug !== slug) {
    revalidatePath(`/blog/${originalPost.slug}`)
  }

  return { success: true, message: "Blog post updated successfully!", blogPost: updatedBlogPost }
}

export async function deleteBlogPost(id: string): Promise<{ success: boolean; message: string }> {
  const postIndex = mockBlogPosts.findIndex((post) => post.id === id)
  if (postIndex === -1) {
    return { success: false, message: "Blog post not found." }
  }

  const postToDelete = mockBlogPosts[postIndex]

  // In a real scenario, you'd delete the blob here if it existed
  // if (postToDelete.featured_image_url) {
  //   try {
  //     await del(postToDelete.featured_image_url);
  //   } catch (error) {
  //     console.error('Error deleting featured image blob:', error);
  //     // Don't fail the entire deletion if blob deletion fails
  //   }
  // }

  mockBlogPosts = mockBlogPosts.filter((post) => post.id !== id)

  revalidatePath("/admin/blog-manager")
  revalidatePath(`/blog/${postToDelete.slug}`)
  revalidatePath("/blog")
  revalidatePath("/sitemap.xml")
  revalidatePath("/rss.xml")

  return { success: true, message: "Blog post deleted successfully!" }
}
