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

  return (
    <div className="flex min-h-screen flex-col">
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
          <div dangerouslySetInnerHTML={{ __html: contentHtml }} className="blog-content" />
        </article>
      </main>
      <div className="mt-auto">
        <Footer />
      </div>
    </div>
  )
}
