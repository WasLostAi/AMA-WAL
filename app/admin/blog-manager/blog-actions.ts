"use server"

import { sql } from "@vercel/postgres"
import { revalidatePath } from "next/cache"
import { put, del } from "@vercel/blob"

export interface BlogPost {
  id: string
  slug: string
  title: string
  content: string
  status: "draft" | "published" | "archived"
  meta_description: string | null
  keywords: string[] | null // Stored as JSONB, retrieved as array or string
  featured_image_url: string | null
  generated_at: Date // Expecting Date object from DB
  updated_at: Date | null // Expecting Date object or null from DB
}

// Helper to convert FormData to BlogPost object (excluding ID, timestamps, and image URL)
function formDataToBlogPostData(
  formData: FormData,
): Omit<BlogPost, "id" | "generated_at" | "updated_at" | "featured_image_url"> {
  const title = formData.get("title") as string
  const slug = formData.get("slug") as string
  const content = formData.get("content") as string
  const status = formData.get("status") as BlogPost["status"]
  const meta_description = (formData.get("meta_description") as string) || null
  const keywordsString = (formData.get("keywords") as string) || ""
  const keywords = keywordsString
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean)

  return {
    title,
    slug,
    content,
    status,
    meta_description,
    keywords: keywords.length > 0 ? keywords : null,
  }
}

// Function to handle image upload to Vercel Blob
async function handleFeaturedImageUpload(
  imageFile: File | null,
  existingImageUrl: string | null,
  clearExisting: boolean,
): Promise<string | null> {
  if (clearExisting && existingImageUrl) {
    try {
      await del(existingImageUrl, { token: process.env.BLOB_READ_WRITE_TOKEN })
      console.log(`Deleted old blob: ${existingImageUrl}`)
    } catch (error) {
      console.error("Error deleting old blob:", error)
    }
    return null
  }

  if (imageFile && imageFile.size > 0) {
    const filename = `${Date.now()}-${imageFile.name.replace(/\s/g, "_")}`
    try {
      const blob = await put(filename, imageFile, { access: "public", token: process.env.BLOB_READ_WRITE_TOKEN })
      console.log(`Uploaded new blob: ${blob.url}`)
      return blob.url
    } catch (error) {
      console.error("Error uploading featured image to Vercel Blob:", error)
      throw new Error("Failed to upload featured image.")
    }
  }
  return existingImageUrl // Keep existing image if no new file and not explicitly cleared
}

// Helper to process rows fetched from SQL to match BlogPost interface types
function processBlogRows(rows: any[]): BlogPost[] {
  return rows.map((row) => ({
    ...row,
    generated_at: new Date(row.generated_at),
    updated_at: row.updated_at ? new Date(row.updated_at) : null,
    // Ensure keywords are an array or null. @vercel/postgres usually handles JSONB to array.
    // If it comes as a string, parse it.
    keywords: row.keywords ? (Array.isArray(row.keywords) ? row.keywords : JSON.parse(row.keywords)) : null,
  }))
}

export async function getBlogPosts(): Promise<{ data: BlogPost[] | null; message: string }> {
  try {
    if (!process.env.POSTGRES_URL) {
      console.error("POSTGRES_URL environment variable is not set.")
      return { data: null, message: "Database connection error: POSTGRES_URL is not configured." }
    }

    const { rows } = await sql<BlogPost>`SELECT * FROM blog_posts ORDER BY generated_at DESC;`
    return { data: processBlogRows(rows), message: "Blog posts fetched successfully." }
  } catch (error: any) {
    console.error("Error fetching blog posts:", error)
    let errorMessage =
      "Failed to fetch blog posts. Please check your database connection and ensure the 'blog_posts' table exists and is correctly migrated."

    if (error.message) {
      if (error.message.includes('relation "blog_posts" does not exist')) {
        errorMessage =
          "Failed to fetch blog posts: The 'blog_posts' table does not exist. Please run the database migration scripts."
      } else if (error.message.includes("Invalid response from database")) {
        errorMessage =
          "Failed to fetch blog posts: Invalid response from database. This might indicate a connection issue or a malformed query."
      } else {
        errorMessage = `Failed to fetch blog posts: ${error.message}`
      }
    }

    return { data: null, message: errorMessage }
  }
}

export async function getPublishedBlogPosts(): Promise<{ data: BlogPost[] | null; message: string }> {
  try {
    if (!process.env.POSTGRES_URL) {
      console.error("POSTGRES_URL environment variable is not set.")
      return { data: null, message: "Database connection error: POSTGRES_URL is not configured." }
    }

    const { rows } =
      await sql<BlogPost>`SELECT * FROM blog_posts WHERE status = 'published' ORDER BY generated_at DESC;`

    return { data: processBlogRows(rows), message: "Published blog posts fetched successfully." }
  } catch (error: any) {
    console.error("Error fetching published blog posts:", error)
    let errorMessage =
      "Failed to fetch published blog posts. Please check your database connection and ensure the 'blog_posts' table exists and is correctly migrated."

    if (error.message) {
      if (error.message.includes('relation "blog_posts" does not exist')) {
        errorMessage =
          "Failed to fetch published blog posts: The 'blog_posts' table does not exist. Please run the database migration scripts."
      } else if (error.message.includes("Invalid response from database")) {
        errorMessage =
          "Failed to fetch published blog posts: Invalid response from database. This might indicate a connection issue or a malformed query."
      } else {
        errorMessage = `Failed to fetch published blog posts: ${error.message}`
      }
    }

    return { data: null, message: errorMessage }
  }
}

export async function getBlogPostBySlug(slug: string): Promise<{ data: BlogPost | null; message: string }> {
  try {
    if (!process.env.POSTGRES_URL) {
      console.error("POSTGRES_URL environment variable is not set.")
      return { data: null, message: "Database connection error: POSTGRES_URL is not configured." }
    }

    const { rows } = await sql<BlogPost>`SELECT * FROM blog_posts WHERE slug = ${slug};`

    if (rows.length === 0) {
      return { data: null, message: "Blog post not found." }
    }

    return { data: processBlogRows(rows)[0], message: "Blog post fetched successfully." }
  } catch (error: any) {
    console.error(`Error fetching blog post with slug ${slug}:`, error)
    let errorMessage = "Failed to fetch blog post."
    if (error.message) {
      errorMessage = `Failed to fetch blog post: ${error.message}`
    }
    return { data: null, message: errorMessage }
  }
}

export async function createBlogPost(
  prevState: any,
  formData: FormData,
): Promise<{ success: boolean; message: string }> {
  try {
    const { title, slug, content, status, meta_description, keywords } = formDataToBlogPostData(formData)
    const featuredImageFile = formData.get("featuredImage") as File | null

    if (!process.env.POSTGRES_URL) {
      return { success: false, message: "Database connection error: POSTGRES_URL is not configured." }
    }

    // Check for existing slug
    const { rowCount: existingSlugCount } = await sql`SELECT 1 FROM blog_posts WHERE slug = ${slug};`
    if (existingSlugCount > 0) {
      return { success: false, message: "A blog post with this slug already exists. Please choose a different one." }
    }

    let featured_image_url: string | null = null
    if (featuredImageFile && featuredImageFile.size > 0) {
      featured_image_url = await handleFeaturedImageUpload(featuredImageFile, null, false)
    }

    await sql`
      INSERT INTO blog_posts (title, slug, content, status, meta_description, keywords, featured_image_url, generated_at)
      VALUES (${title}, ${slug}, ${content}, ${status}, ${meta_description}, ${keywords ? JSON.stringify(keywords) : null}::jsonb, ${featured_image_url}, NOW());
    `

    revalidatePath("/blog")
    revalidatePath("/sitemap.xml")
    revalidatePath("/rss.xml")
    return { success: true, message: "Blog post created successfully!" }
  } catch (error: any) {
    console.error("Error creating blog post:", error)
    let errorMessage = "Failed to create blog post."
    if (error.message) {
      errorMessage = `Failed to create blog post: ${error.message}`
    }
    return { success: false, message: errorMessage }
  }
}

export async function updateBlogPost(
  prevState: any,
  formData: FormData,
): Promise<{ success: boolean; message: string }> {
  try {
    const id = formData.get("id") as string
    const { title, slug, content, status, meta_description, keywords } = formDataToBlogPostData(formData)
    const featuredImageFile = formData.get("featuredImage") as File | null
    const existingImageUrl = formData.get("existingImageUrl") as string | null
    const clearFeaturedImage = formData.get("clearFeaturedImage") === "true"

    if (!process.env.POSTGRES_URL) {
      return { success: false, message: "Database connection error: POSTGRES_URL is not configured." }
    }

    // Check for existing slug, excluding the current post being updated
    const { rowCount: existingSlugCount } = await sql`SELECT 1 FROM blog_posts WHERE slug = ${slug} AND id != ${id};`
    if (existingSlugCount > 0) {
      return { success: false, message: "A blog post with this slug already exists. Please choose a different one." }
    }

    const new_featured_image_url: string | null = await handleFeaturedImageUpload(
      featuredImageFile,
      existingImageUrl,
      clearFeaturedImage,
    )

    await sql`
      UPDATE blog_posts
      SET
        title = ${title},
        slug = ${slug},
        content = ${content},
        status = ${status},
        meta_description = ${meta_description},
        keywords = ${keywords ? JSON.stringify(keywords) : null}::jsonb,
        featured_image_url = ${new_featured_image_url},
        updated_at = NOW()
      WHERE id = ${id};
    `

    revalidatePath("/blog")
    revalidatePath(`/blog/${slug}`)
    revalidatePath("/sitemap.xml")
    revalidatePath("/rss.xml")
    return { success: true, message: "Blog post updated successfully!" }
  } catch (error: any) {
    console.error("Error updating blog post:", error)
    let errorMessage = "Failed to update blog post."
    if (error.message) {
      errorMessage = `Failed to update blog post: ${error.message}`
    }
    return { success: false, message: errorMessage }
  }
}

export async function deleteBlogPost(id: string): Promise<{ success: boolean; message: string }> {
  try {
    if (!process.env.POSTGRES_URL) {
      return { success: false, message: "Database connection error: POSTGRES_URL is not configured." }
    }

    // Optionally, delete the associated blob image here if it exists
    const { rows } = await sql<{
      featured_image_url: string | null
    }>`SELECT featured_image_url FROM blog_posts WHERE id = ${id};`
    if (rows.length > 0 && rows[0].featured_image_url) {
      try {
        await del(rows[0].featured_image_url, { token: process.env.BLOB_READ_WRITE_TOKEN })
        console.log(`Deleted associated blob: ${rows[0].featured_image_url}`)
      } catch (blobError) {
        console.error("Error deleting associated blob image:", blobError)
      }
    }

    await sql`DELETE FROM blog_posts WHERE id = ${id};`
    revalidatePath("/blog")
    revalidatePath("/sitemap.xml")
    revalidatePath("/rss.xml")
    return { success: true, message: "Blog post deleted successfully!" }
  } catch (error: any) {
    console.error("Error deleting blog post:", error)
    let errorMessage = "Failed to delete blog post."
    if (error.message) {
      errorMessage = `Failed to delete blog post: ${error.message}`
    }
    return { success: false, message: errorMessage }
  }
}
