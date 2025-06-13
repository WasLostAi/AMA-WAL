import { notFound } from "next/navigation"
import { getBlogPostBySlug } from "../../admin/blog-manager/blog-actions"
import { remark } from "remark"
import html from "remark-html"
import type { Metadata } from "next"
import { Header } from "@/components/header" // Assuming you want the header on public pages
import { Footer } from "@/components/footer" // Assuming you want the footer on public pages

interface BlogPostPageProps {
  params: {
    slug: string
  }
}

// Generate static params for slugs at build time
export async function generateStaticParams() {
  // In a real application, you'd fetch all published blog post slugs from your database
  // and return them. For now, we'll return an empty array or a placeholder
  // if you don't have a public endpoint to fetch all slugs.
  // For dynamic routing to work, we'll rely on on-demand revalidation or
  // server-side rendering for now.
  // For demonstration, let's assume no pre-rendered slugs.
  return []
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { data: post } = await getBlogPostBySlug(params.slug)

  if (!post) {
    return {
      title: "Post Not Found - WasLost.Ai",
      description: "The requested blog post could not be found.",
    }
  }

  return {
    title: `${post.title} - WasLost.Ai Blog`,
    description: post.meta_description || `Read about ${post.title} on the WasLost.Ai blog.`,
    keywords: post.keywords?.join(", ") || "",
    openGraph: {
      title: `${post.title} - WasLost.Ai Blog`,
      description: post.meta_description || `Read about ${post.title} on the WasLost.Ai blog.`,
      url: `${process.env.NEXT_PUBLIC_VERCEL_URL || "http://localhost:3000"}/blog/${post.slug}`,
      type: "article",
      // Add more OpenGraph properties like images if available
    },
    twitter: {
      card: "summary_large_image",
      title: `${post.title} - WasLost.Ai Blog`,
      description: post.meta_description || `Read about ${post.title} on the WasLost.Ai blog.`,
      // Add Twitter image if available
    },
    // Add JSON-LD structured data
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_VERCEL_URL || "http://localhost:3000"}/blog/${post.slug}`,
    },
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { data: post } = await getBlogPostBySlug(params.slug)

  if (!post || post.status !== "published") {
    // Only show published posts publicly
    notFound()
  }

  // Convert Markdown content to HTML
  const processedContent = await remark().use(html).process(post.content)
  const contentHtml = processedContent.toString()

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.meta_description || `A blog post from WasLost.Ai about ${post.title}.`,
    image:
      post.featured_image_url ||
      `${process.env.NEXT_PUBLIC_VERCEL_URL || "http://localhost:3000"}/placeholder.svg?height=630&width=1200&query=blog%20post%20default%20image`, // Use featured image or a default
    datePublished: post.generated_at,
    dateModified: post.updated_at,
    author: {
      "@type": "Person",
      name: "Michael P. Robinson", // Or dynamically fetch from agent profile
      url: `${process.env.NEXT_PUBLIC_VERCEL_URL || "http://localhost:3000"}`,
    },
    publisher: {
      "@type": "Organization",
      name: "WasLost.Ai",
      logo: {
        "@type": "ImageObject",
        url: `${process.env.NEXT_PUBLIC_VERCEL_URL || "http://localhost:3000"}/images/waslost-logo.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${process.env.NEXT_PUBLIC_VERCEL_URL || "http://localhost:3000"}/blog/${post.slug}`,
    },
    keywords: post.keywords || [],
  }

  return (
    <div className="flex min-h-screen flex-col">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Header />
      <main className="flex-1 container max-w-4xl mx-auto px-4 py-8 md:py-12">
        <article className="prose prose-invert max-w-none jupiter-outer-panel p-6 rounded-lg">
          <h1 className="text-3xl md:text-4xl font-bold font-syne mb-4 text-[#afcd4f]">{post.title}</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Published on {new Date(post.generated_at).toLocaleDateString()}
            {post.keywords && post.keywords.length > 0 && (
              <span className="ml-4">Keywords: {post.keywords.join(", ")}</span>
            )}
          </p>
          {post.featured_image_url && (
            <div className="mb-6">
              <img
                src={post.featured_image_url || "/placeholder.svg"}
                alt={post.title}
                className="w-full h-auto rounded-lg object-cover neumorphic-inset"
                style={{ maxHeight: "400px" }} // Optional: limit height for consistency
              />
            </div>
          )}
          <div dangerouslySetInnerHTML={{ __html: contentHtml }} className="blog-content" />
        </article>
      </main>
      <div className="mt-auto">
        <Footer />
      </div>
    </div>
  )
}
