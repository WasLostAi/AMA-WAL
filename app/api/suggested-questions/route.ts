import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("agent_training_qa")
      .select("question") // Only fetch the question field
      .order("created_at", { ascending: true }) // Order them consistently

    if (error) {
      console.error("Error fetching suggested questions from Supabase:", error)
      return NextResponse.json(
        { error: "Failed to fetch suggested questions.", details: error.message },
        { status: 500 },
      )
    }

    // Extract just the question strings
    const questions = data.map((item) => item.question)

    return NextResponse.json(questions)
  } catch (error) {
    console.error("Unexpected error in suggested-questions API route:", error)
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 },
    )
  }
}
