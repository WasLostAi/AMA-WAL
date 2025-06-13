// Removed getBlogPosts import
//- import { getBlogPosts } from "../admin/blog-manager/blog-actions"
import { NextResponse } from "next/server"

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_VERCEL_URL || "http://localhost:3000"

  // Removed blog post fetching logic
  //- const { data: blogPosts, message } = await getBlogPosts()

  //- if (!blogPosts) {
  //-   console.error("Failed to fetch blog posts for RSS feed:", message)
  //-   return new NextResponse(
  //-     `<?xml version="1.0" encoding="UTF-8"?>
  //-     <rss version="2.0">
  //-       <channel>
  //-         <title>WasLost.Ai Blog</title>
  //-         <link>${baseUrl}/blog</link>
  //-         <description>Latest insights on AI, Web3, and trading automation from WasLost.Ai</description>
  //-         <language>en-us</language>
  //-         <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
  //-       </channel>
  //-     </rss>`,
  //-     {
  //-       status: 200,
  //-       headers: {
  //-         "Content-Type": "application/xml",
  //-       },
  //-     },
  //-   )
  //- }

  // Removed RSS items for blog posts
  //- const rssItems = blogPosts
  //-   .filter((post) => post.status === "published")
  //-   .map((post) => {
  //-     const postUrl = `${baseUrl}/blog/${post.slug}`
  //-     const pubDate = new Date(post.generated_at).toUTCString()
  //-     const description = post.meta_description || post.content.substring(0, 200) + "..." // Use meta description or truncate content

  //-     return `
  //-       <item>
  //-         <title><![CDATA[${post.title}]]></title>
  //-         <link>${postUrl}</link>
  //-         <guid>${postUrl}</guid>
  //-         <pubDate>${pubDate}</pubDate>
  //-         <description><![CDATA[${description}]]></description>
  //-       </item>
  //-     `
  //-   })
  //-   .join("")

  const rssFeed = `<?xml version="1.0" encoding="UTF-8"?>
    <rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
      <channel>
        <title>WasLost.Ai</title>
        <link>${baseUrl}</link>
        <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml" />
        <description>Latest insights on AI, Web3, and trading automation from WasLost.Ai</description>
        <language>en-us</language>
        <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
        
      </channel>
    </rss>
  `

  return new NextResponse(rssFeed, {
    status: 200,
    headers: {
      "Content-Type": "application/xml",
    },
  })
}
