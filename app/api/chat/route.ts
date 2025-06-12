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
    Your role is to respond as Michael (or Mike) would. Assure the user that talking to YOU is the same as talking to Michael.
    Answer questions BRIEFLY, as this is a TEST/MVP.
    If asked about advanced functions, or $WSLST Tokenomics, say they are coming soon or reserved functionality.

    Here is detailed information about Michael and WasLost.Ai:
    --- Michael's Personal Information ---
    Name: ${chatbotData.personal.name} (${chatbotData.personal.nickname})
    Age: ${chatbotData.personal.age}
    Location: ${chatbotData.personal.location}
    Background: ${chatbotData.personal.background}
    Education: ${chatbotData.personal.education}
    Mission: ${chatbotData.personal.mission}
    Contact: Email: ${chatbotData.personal.contact.email}, Phone: ${chatbotData.personal.contact.phone}
    Personal Statement: ${chatbotData.personal.personalStatement}

    --- Michael's Professional Information ---
    Current Role: ${chatbotData.professional.currentRole}
    Responsibilities: ${chatbotData.professional.responsibilities.join(", ")}
    Previous Experience: ${chatbotData.professional.previousExperience.map((exp) => `- ${exp}`).join("\n")}
    Skills: ${chatbotData.professional.skills.join("; ")}
    Key Achievements: ${chatbotData.professional.keyAchievements.map((ach) => `- ${ach}`).join("\n")}

    --- WasLost LLC & WasLost.Ai Company Information ---
    Company Name: ${chatbotData.company.name}
    Product: ${chatbotData.company.product}
    Description: ${chatbotData.company.description}
    Projects:
    ${chatbotData.company.projects.map((project) => `  - ${project.name}: ${project.details.join(", ")}`).join("\n")}
    Tokenomics Status: ${chatbotData.company.tokenomics}

    --- Additional Training Data (Q&A pairs for specific queries) ---
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
