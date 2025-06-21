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
  keywords: string[] | null // Stored as TEXT[], retrieved as string[]
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
  const meta_description = (formData.get("metaDescription") as string) || null // Corrected name
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
      // Ensure the URL is a full Blob URL before deleting
      const blobPath = existingImageUrl.startsWith("https://blob.vercel-storage.com/")
        ? existingImageUrl.substring("https://blob.vercel-storage.com".length)
        : existingImageUrl // Fallback if it's just a path

      await del(blobPath, { token: process.env.BLOB_READ_WRITE_TOKEN })
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
    // For TEXT[] columns, @vercel/postgres should return a JS array directly.
    // No JSON.parse needed here if the DB column is TEXT[].
    keywords: row.keywords || null,
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

    if (error.message && error.message.includes("Unexpected token") && error.message.includes("is not valid JSON")) {
      errorMessage =
        "Failed to fetch blog posts: The database returned an invalid response (not valid JSON). This usually means your POSTGRES_URL is incorrect or your database is unreachable. Please verify your POSTGRES_URL environment variable. Original error: ${error.message}"
    } else if (error.message && error.message.includes('relation "blog_posts" does not exist')) {
      errorMessage =
        "Failed to fetch blog posts: The 'blog_posts' table does not exist. Please run the database migration scripts."
    } else if (error.message && error.message.includes("Invalid response from database")) {
      errorMessage =
        "Failed to fetch blog posts: Invalid response from database. This might indicate a connection issue or a malformed query."
    } else if (error.message) {
      errorMessage = `Failed to fetch blog posts: ${error.message}`
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

    if (error.message && error.message.includes("Unexpected token") && error.message.includes("is not valid JSON")) {
      errorMessage =
        "Failed to fetch published blog posts: The database returned an invalid response (not valid JSON). This usually means your POSTGRES_URL is incorrect or your database is unreachable. Please verify your POSTGRES_URL environment variable. Original error: ${error.message}"
    } else if (error.message && error.message.includes('relation "blog_posts" does not exist')) {
      errorMessage =
        "Failed to fetch published blog posts: The 'blog_posts' table does not exist. Please run the database migration scripts."
    } else if (error.message && error.message.includes("Invalid response from database")) {
      errorMessage =
        "Failed to fetch published blog posts: Invalid response from database. This might indicate a connection issue or a malformed query."
    } else if (error.message) {
      errorMessage = `Failed to fetch published blog posts: ${error.message}`
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
    if (error.message && error.message.includes("Unexpected token") && error.message.includes("is not valid JSON")) {
      errorMessage =
        "Failed to fetch blog post: The database returned an invalid response (not valid JSON). This usually means your POSTGRES_URL is incorrect or your database is unreachable. Please verify your POSTGRES_URL environment variable. Original error: ${error.message}"
    } else if (error.message) {
      errorMessage = `Failed to fetch blog post: ${error.message}`
    }
    return { data: null, message: errorMessage }
  }
}

// NEW: Function to get a blog post by ID
export async function getBlogPostById(id: string): Promise<{ data: BlogPost | null; message?: string }> {
  try {
    if (!process.env.POSTGRES_URL) {
      console.error("POSTGRES_URL environment variable is not set.")
      return { data: null, message: "Database connection error: POSTGRES_URL is not configured." }
    }
    const { rows } = await sql<BlogPost>`SELECT * FROM blog_posts WHERE id = ${id};`

    if (rows.length === 0) {
      return { data: null, message: "Blog post not found." }
    }

    return { data: processBlogRows(rows)[0], message: "Blog post fetched successfully." }
  } catch (error: any) {
    console.error(`Error fetching blog post with ID ${id}:`, error)
    let errorMessage = "Failed to fetch blog post by ID."
    if (error.message && error.message.includes("Unexpected token") && error.message.includes("is not valid JSON")) {
      errorMessage =
        "Failed to fetch blog post by ID: The database returned an invalid response (not valid JSON). This usually means your POSTGRES_URL is incorrect or your database is unreachable. Please verify your POSTGRES_URL environment variable. Original error: ${error.message}"
    } else if (error.message) {
      errorMessage = `Failed to fetch blog post by ID: ${error.message}`
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

    // Correctly pass the keywords array to the TEXT[] column
    await sql`
    INSERT INTO blog_posts (title, slug, content, status, meta_description, keywords, featured_image_url, generated_at)
    VALUES (${title}, ${slug}, ${content}, ${status}, ${meta_description}, ${keywords}, ${featured_image_url}, NOW());
  `

    revalidatePath("/admin/blog-manager") // Revalidate admin page
    revalidatePath("/blog")
    revalidatePath("/sitemap.xml")
    revalidatePath("/rss.xml")
    return { success: true, message: "Blog post created successfully!" }
  } catch (error: any) {
    console.error("Error creating blog post:", error)
    let errorMessage = "Failed to create blog post."
    if (error.message && error.message.includes("Unexpected token") && error.message.includes("is not valid JSON")) {
      errorMessage =
        "Failed to create blog post: The database returned an invalid response (not valid JSON). This usually means your POSTGRES_URL is incorrect or your database is unreachable. Please verify your POSTGRES_URL environment variable. Original error: ${error.message}"
    } else if (error.message && error.message.includes('relation "blog_posts" does not exist')) {
      errorMessage =
        "Failed to create blog post: The 'blog_posts' table does not exist. Please run the database migration scripts."
    } else if (error.message && error.message.includes("Invalid response from database")) {
      errorMessage =
        "Failed to create blog post: Invalid response from database. This might indicate a connection issue or a malformed query."
    } else if (error.message) {
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

    // Correctly pass the keywords array to the TEXT[] column
    await sql`
    UPDATE blog_posts
    SET
      title = ${title},
      slug = ${slug},
      content = ${content},
      status = ${status},
      meta_description = ${meta_description},
      keywords = ${keywords},
      featured_image_url = ${new_featured_image_url},
      updated_at = NOW()
    WHERE id = ${id};
  `

    revalidatePath("/admin/blog-manager") // Revalidate admin page
    revalidatePath("/blog")
    revalidatePath(`/blog/${slug}`)
    revalidatePath("/sitemap.xml")
    revalidatePath("/rss.xml")
    return { success: true, message: "Blog post updated successfully!" }
  } catch (error: any) {
    console.error("Error updating blog post:", error)
    let errorMessage = "Failed to update blog post."
    if (error.message && error.message.includes("Unexpected token") && error.message.includes("is not valid JSON")) {
      errorMessage =
        "Failed to update blog post: The database returned an invalid response (not valid JSON). This usually means your POSTGRES_URL is incorrect or your database is unreachable. Please verify your POSTGRES_URL environment variable. Original error: ${error.message}"
    } else if (error.message && error.message.includes('relation "blog_posts" does not exist')) {
      errorMessage =
        "Failed to update blog post: The 'blog_posts' table does not exist. Please run the database migration scripts."
    } else if (error.message && error.message.includes("Invalid response from database")) {
      errorMessage =
        "Failed to update blog post: Invalid response from database. This might indicate a connection issue or a malformed query."
    } else if (error.message) {
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
        // Ensure the URL is a full Blob URL before deleting
        const blobPath = rows[0].featured_image_url.startsWith("https://blob.vercel-storage.com/")
          ? rows[0].featured_image_url.substring("https://blob.vercel-storage.com".length)
          : rows[0].featured_image_url // Fallback if it's just a path

        await del(blobPath, { token: process.env.BLOB_READ_WRITE_TOKEN })
        console.log(`Deleted associated blob: ${rows[0].featured_image_url}`)
      } catch (blobError) {
        console.error("Error deleting associated blob image:", blobError)
      }
    }

    await sql`DELETE FROM blog_posts WHERE id = ${id};`
    revalidatePath("/admin/blog-manager") // Revalidate admin page
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
