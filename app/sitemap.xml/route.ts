import { getPublishedBlogPosts } from "@/app/admin/blog-manager/blog-actions"
import { absoluteUrl } from "@/lib/utils"

export async function GET() {
  const baseUrl = absoluteUrl("/")

  const { data: blogPosts } = await getPublishedBlogPosts()

  const blogPostUrls =
    blogPosts?.map((post) => ({
      url: `${baseUrl}blog/${post.slug}`,
      lastModified: post.updated_at || post.generated_at,
    })) || []

  return new Response(
    `<?xml version="1.0" encoding="UTF-8" ?>
    <urlset xmlns="https://www.sitemaps.org/schemas/sitemap/0.9">
      <url>
        <loc>${baseUrl}</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
      </url>
      <url>
        <loc>${baseUrl}blog</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
      </url>
      <url>
        <loc>${baseUrl}contact</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
      </url>
      <url>
        <loc>${baseUrl}admin</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
      </url>
      ${blogPostUrls
        .map(
          (url) => `
        <url>
          <loc>${url.url}</loc>
          <lastmod>${new Date(url.lastModified).toISOString()}</lastmod>
        </url>
      `,
        )
        .join("")}
    </urlset>`,
    {
      headers: {
        "Content-Type": "text/xml",
      },
    },
  )
}
