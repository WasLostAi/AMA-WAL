import { getBlogPosts } from "../admin/blog-manager/blog-actions"
import { NextResponse } from "next/server"

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_VERCEL_URL || "http://localhost:3000" // Use Vercel URL or fallback

  // Fetch all blog posts
  const { data: blogPosts, message } = await getBlogPosts()

  if (!blogPosts) {
    console.error("Failed to fetch blog posts for sitemap:", message)
    // Return an empty sitemap or an error response if fetching fails
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?>
      <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      </urlset>`,
      {
        status: 200,
        headers: {
          "Content-Type": "application/xml",
        },
      },
    )
  }

  const sitemapEntries = blogPosts
    .filter((post) => post.status === "published") // Only include published posts
    .map((post) => {
      const postUrl = `${baseUrl}/blog/${post.slug}`
      return `
        <url>
          <loc>${postUrl}</loc>
          <lastmod>${new Date(post.updated_at || post.generated_at).toISOString()}</lastmod>
          <changefreq>weekly</changefreq>
          <priority>0.8</priority>
        </url>
      `
    })
    .join("")

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      <url>
        <loc>${baseUrl}</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
        <changefreq>daily</changefreq>
        <priority>1.0</priority>
      </url>
      ${sitemapEntries}
    </urlset>
  `

  return new NextResponse(sitemap, {
    status: 200,
    headers: {
      "Content-Type": "application/xml",
    },
  })
}
