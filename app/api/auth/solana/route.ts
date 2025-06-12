import { NextResponse } from "next/server"
import { verifySignature } from "@solana/wallet-adapter-base"
import { PublicKey } from "@solana/web3.js"

// Your specific wallet address that is authorized
const AUTHORIZED_WALLET_ADDRESS = "AuwUfiwsXA6VibDjR579HWLhDUUoa5s6T7i7KPyLUa9F"

export async function POST(request: Request) {
  try {
    const { publicKey, signature, message } = await request.json()

    if (!publicKey || !signature || !message) {
      return NextResponse.json(
        { success: false, message: "Missing required authentication parameters." },
        { status: 400 },
      )
    }

    const messageBytes = new TextEncoder().encode(message)
    const signatureBytes = new Uint8Array(signature.data) // Convert array to Uint8Array

    const isValid = verifySignature(new PublicKey(publicKey), messageBytes, signatureBytes)

    if (isValid && publicKey === AUTHORIZED_WALLET_ADDRESS) {
      return NextResponse.json({ success: true, message: "Authentication successful." })
    } else {
      return NextResponse.json(
        { success: false, message: "Authentication failed: Invalid signature or unauthorized wallet." },
        { status: 401 },
      )
    }
  } catch (error: any) {
    console.error("Solana authentication error:", error)
    return NextResponse.json(
      { success: false, message: `Server error during authentication: ${error.message}` },
      { status: 500 },
    )
  }
}
