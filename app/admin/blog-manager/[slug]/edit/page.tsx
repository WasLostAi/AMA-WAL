import BlogPostForm from "@/components/blog-post-form"
import { getBlogPostBySlug } from "@/app/admin/blog-manager/blog-actions"
import { notFound } from "next/navigation"

interface EditBlogPostPageProps {
  params: {
    slug: string
  }
}

export default async function EditBlogPostPage({ params }: EditBlogPostPageProps) {
  const { data: blogPost } = await getBlogPostBySlug(params.slug)

  if (!blogPost) {
    notFound()
  }

  return (
    <div className="container mx-auto py-10">
      <BlogPostForm initialData={blogPost} />
    </div>
  )
}
