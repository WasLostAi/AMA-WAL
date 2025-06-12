import { NextResponse } from "next/server"
import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dataDir = path.join(__dirname, "../../../data/social-posts") // Adjust path to reach data/social-posts from app/api

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get("type") // 'twitter' or 'linkedin'

  if (!type || (type !== "twitter" && type !== "linkedin")) {
    return NextResponse.json({ error: "Invalid or missing 'type' parameter." }, { status: 400 })
  }

  try {
    const files = await fs.readdir(dataDir)
    const posts = []

    for (const file of files) {
      if (file.startsWith(`${type}-`) && file.endsWith(".json")) {
        const filePath = path.join(dataDir, file)
        const fileContent = await fs.readFile(filePath, "utf-8")
        try {
          posts.push(JSON.parse(fileContent))
        } catch (parseError) {
          console.error(`Error parsing JSON file ${file}:`, parseError)
        }
      }
    }

    // Sort posts by creation date, newest first
    posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return NextResponse.json(posts)
  } catch (error: any) {
    if (error.code === "ENOENT") {
      // Directory not found, likely no posts generated yet
      return NextResponse.json(
        { error: `No social posts found for type '${type}'. Run the generation script.` },
        { status: 404 },
      )
    }
    console.error(`Error reading social posts from file system for type ${type}:`, error)
    return NextResponse.json({ error: `Internal server error reading ${type} posts.` }, { status: 500 })
  }
}
