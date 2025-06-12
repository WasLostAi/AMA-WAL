import { NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { verifySignature } from "@solana/wallet-adapter-base"
import { PublicKey } from "@solana/web3.js"

const AUTHORIZED_WALLET_ADDRESS = "AuwUfiwsXA6VibDjR579HWLhDUUoa5s6T7i7KPyLUa9F"

export async function POST(request: Request) {
  try {
    const { content, publicKey, signature, message } = await request.json()

    if (!content || !publicKey || !signature || !message) {
      return NextResponse.json({ success: false, message: "Missing required parameters." }, { status: 400 })
    }

    // --- Solana Authentication Check ---
    const messageBytes = new TextEncoder().encode(message)
    const signatureBytes = new Uint8Array(signature.data)

    const isValid = verifySignature(new PublicKey(publicKey), messageBytes, signatureBytes)

    if (!isValid || publicKey !== AUTHORIZED_WALLET_ADDRESS) {
      return NextResponse.json(
        { success: false, message: "Authentication failed: Unauthorized wallet or invalid signature." },
        { status: 401 },
      )
    }
    // --- End Solana Authentication Check ---

    // Store the content in Vercel Blob
    const blob = await put("current-projects.md", content, {
      access: "public", // Make it publicly readable for the AI route
      contentType: "text/markdown",
    })

    console.log("Content successfully committed to Vercel Blob:", blob.url)

    return NextResponse.json({ success: true, message: "Current projects updated successfully!", url: blob.url })
  } catch (error: any) {
    console.error("Error updating current projects:", error)
    return NextResponse.json(
      { success: false, message: `Failed to update current projects: ${error.message}` },
      { status: 500 },
    )
  }
}
