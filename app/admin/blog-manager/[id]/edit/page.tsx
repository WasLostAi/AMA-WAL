import BlogPostForm from "@/components/blog-post-form"
import { getBlogPostBySlug } from "@/app/admin/blog-manager/blog-actions"
import { notFound } from "next/navigation"

interface EditBlogPostPageProps {
  params: {
    id: string // This will be the slug, but we'll fetch by ID in a real app
  }
}

export default async function EditBlogPostPage({ params }: EditBlogPostPageProps) {
  // In a real application, you would fetch by ID. For now, we'll use slug
  // as the ID in the URL for simplicity, assuming slugs are unique.
  // If your IDs are UUIDs, you'd need to fetch by ID.
  const { data: blogPost } = await getBlogPostBySlug(params.id) // Assuming params.id is actually the slug

  if (!blogPost) {
    notFound()
  }

  return <BlogPostForm initialData={blogPost} />
}
