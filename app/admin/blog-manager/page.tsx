"use client"

import { useEffect, useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { getBlogPosts, deleteBlogPost, type BlogPost } from "@/app/admin/blog-manager/blog-actions"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon } from "lucide-react"

export default function BlogManagerPage() {
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([])
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  useEffect(() => {
    const fetchPosts = async () => {
      startTransition(async () => {
        const { data, message } = await getBlogPosts()
        if (data) {
          setBlogPosts(data)
        } else {
          toast({
            title: "Error fetching posts",
            description: message,
            variant: "destructive",
          })
        }
      })
    }
    fetchPosts()
  }, [toast])

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this blog post?")) {
      startTransition(async () => {
        const { success, message } = await deleteBlogPost(id)
        if (success) {
          setBlogPosts((prev) => prev.filter((post) => post.id !== id))
          toast({
            title: "Success!",
            description: message,
            variant: "default",
          })
        } else {
          toast({
            title: "Error!",
            description: message,
            variant: "destructive",
          })
        }
      })
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-bold">Blog Posts</CardTitle>
        <Button asChild>
          <Link href="/admin/blog-manager/create">
            <PlusIcon className="mr-2 h-4 w-4" />
            Create New Post
          </Link>
        </Button>
      </CardHeader>
      <CardDescription className="px-6">Manage your AI-generated and custom blog content.</CardDescription>
      <CardContent>
        {isPending && blogPosts.length === 0 ? (
          <div className="flex items-center justify-center p-8">Loading blog posts...</div>
        ) : blogPosts.length === 0 ? (
          <div className="flex items-center justify-center p-8 text-muted-foreground">
            No blog posts found. Create one to get started!
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Generated At</TableHead>
                <TableHead>Updated At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {blogPosts.map((post) => (
                <TableRow key={post.id}>
                  <TableCell className="font-medium">{post.title}</TableCell>
                  <TableCell>
                    <Badge variant={post.status === "published" ? "default" : "outline"}>{post.status}</Badge>
                  </TableCell>
                  <TableCell>{new Date(post.generated_at).toLocaleDateString()}</TableCell>
                  <TableCell>{post.updated_at ? new Date(post.updated_at).toLocaleDateString() : "N/A"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {post.status === "published" && (
                        <Button variant="outline" size="icon" asChild>
                          <Link href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer">
                            <EyeIcon className="h-4 w-4" />
                            <span className="sr-only">View</span>
                          </Link>
                        </Button>
                      )}
                      <Button variant="outline" size="icon" asChild>
                        <Link href={`/admin/blog-manager/${post.slug}/edit`}>
                          {" "}
                          {/* Using slug as ID for now */}
                          <PencilIcon className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Link>
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleDelete(post.id)}
                        disabled={isPending}
                      >
                        <TrashIcon className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
