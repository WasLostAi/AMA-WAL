"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSearchParams } from "next/navigation"
import RichTextEditor from "@/components/rich-text-editor" // Updated import
import { toast } from "react-hot-toast"

async function getBlogPost(id: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/blog/${id}`, {
      cache: "no-store",
    })

    if (!res.ok) {
      throw new Error("Failed to fetch blog post")
    }

    return res.json()
  } catch (error: any) {
    console.log("Failed to fetch blog post: ", error)
    return null
  }
}

async function updateBlogPost(id: string, title: string, content: string, imageUrl: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/blog/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title, content, imageUrl }),
    })

    if (!res.ok) {
      throw new Error("Failed to update blog post")
    }

    return res.json()
  } catch (error: any) {
    console.error("Failed to update blog post: ", error)
    return null
  }
}

export default function EditBlogPost() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const id = searchParams.get("id")

  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBlogPost = async () => {
      if (id) {
        const blogPost = await getBlogPost(id)
        if (blogPost) {
          setTitle(blogPost.title)
          setContent(blogPost.content)
          setImageUrl(blogPost.imageUrl)
        }
        setLoading(false)
      }
    }

    fetchBlogPost()
  }, [id])

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    if (!id) return

    const result = await updateBlogPost(id, title, content, imageUrl)

    if (result) {
      toast.success("Blog post updated successfully!")
      router.push("/admin/blog-manager")
    } else {
      toast.error("Failed to update blog post.")
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Edit Blog Post</h1>
      <form onSubmit={handleSubmit} className="max-w-lg">
        <div className="mb-4">
          <label htmlFor="title" className="block text-gray-700 text-sm font-bold mb-2">
            Title:
          </label>
          <input
            type="text"
            id="title"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="mb-4">
          <label htmlFor="imageUrl" className="block text-gray-700 text-sm font-bold mb-2">
            Image URL:
          </label>
          <input
            type="text"
            id="imageUrl"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
          />
        </div>
        <div className="mb-4">
          <label htmlFor="content" className="block text-gray-700 text-sm font-bold mb-2">
            Content:
          </label>
          <RichTextEditor value={content} onChange={setContent} />
        </div>
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Update Post
        </button>
      </form>
    </div>
  )
}
