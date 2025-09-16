import { NextResponse } from "next/server"

// Default suggested questions as fallback
const DEFAULT_QUESTIONS = [
  "What is WasLost.Ai?",
  "How does AI trading automation work?",
  "What are your thoughts on Web3?",
  "Tell me about your AI projects",
  "How can I get started with AI development?",
  "What's the future of decentralized AI?",
  "How do you approach AI ethics?",
  "What programming languages do you recommend?",
]

export async function GET() {
  try {
    // For now, return default questions since Supabase might not be configured
    // This prevents the JSON parsing error
    console.log("Returning default suggested questions")
    return NextResponse.json(DEFAULT_QUESTIONS)

    // TODO: Uncomment this when Supabase is properly configured
    /*
    const { data, error } = await supabaseAdmin
      .from("agent_training_qa")
      .select("question")
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Error fetching suggested questions from Supabase:", error)
      return NextResponse.json(DEFAULT_QUESTIONS)
    }

    const questions = data.map((item) => item.question)
    return NextResponse.json(questions.length > 0 ? questions : DEFAULT_QUESTIONS)
    */
  } catch (error) {
    console.error("Unexpected error in suggested-questions API route:", error)
    return NextResponse.json(DEFAULT_QUESTIONS)
  }
}
