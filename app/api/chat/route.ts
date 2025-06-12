import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { chatbotData } from "@/lib/chatbot-data"
import { trainingData } from "@/lib/training-data"

export async function POST(request: NextRequest) {
  try {
    const { message, history } = await request.json() // Destructure history

    // Combine chatbot instructions and training data for context
    const systemPrompt = `You are Michael Robinson's AI representative for WasLost.Ai.
    Your role is to respond as Michael (or Mike) would, answering questions BRIEFLY, as this is a TEST/MVP.
    If asked about advanced functions, say they are coming soon.

    Here is some information about Michael and WasLost.Ai:
    ${JSON.stringify(chatbotData.personal, null, 2)}
    ${JSON.stringify(chatbotData.professional, null, 2)}
    ${JSON.stringify(chatbotData.company, null, 2)}

    Here is some general training data about QuickNode (if relevant to the user's question):
    ${trainingData.map((data) => `Q: ${data.question}\nA: ${data.answer}`).join("\n\n")}
    `

    // Format history for the AI SDK
    const formattedHistory = history.map((msg: { role: string; content: string }) => ({
      role: msg.role,
      content: msg.content,
    }))

    const { text } = await generateText({
      model: openai("gpt-4o"),
      system: systemPrompt,
      messages: formattedHistory, // Pass the formatted history
    })

    const response = {
      text: text,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Error processing message:", error)
    return NextResponse.json({ error: "Failed to process message" }, { status: 500 })
  }
}
