import { getPublishedBlogPosts } from "@/app/admin/blog-manager/blog-actions"
import { absoluteUrl } from "@/lib/utils"

export async function GET() {
  const baseUrl = absoluteUrl("/")
  const { data: blogPosts } = await getPublishedBlogPosts()

  const feedItems =
    blogPosts?.map(
      (post) => `
    <item>
      <title>${post.title}</title>
      <link>${baseUrl}blog/${post.slug}</link>
      <guid>${baseUrl}blog/${post.slug}</guid>
      <pubDate>${new Date(post.generated_at).toUTCString()}</pubDate>
      <description><![CDATA[${post.meta_description || post.content.substring(0, 150) + "..."}]]></description>
      ${post.featured_image_url ? `<enclosure url="${post.featured_image_url}" type="image/jpeg" />` : ""}
    </item>
  `,
    ) || []

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>
    <rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
      <channel>
        <title>Your Blog Name</title>
        <link>${baseUrl}</link>
        <description>The latest updates and insights from Your Blog Name.</description>
        <language>en-us</language>
        <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
        <atom:link href="${baseUrl}rss.xml" rel="self" type="application/rss+xml" />
        ${feedItems.join("")}
      </channel>
    </rss>`,
    {
      headers: {
        "Content-Type": "application/xml",
      },
    },
  )
}
