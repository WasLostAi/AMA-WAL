import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { chatbotData } from "@/lib/chatbot-data"
import { trainingData } from "@/lib/training-data"
import { supabaseAdmin } from "@/lib/supabase" // Import Supabase client

export async function POST(request: NextRequest) {
  try {
    const { message, history } = await request.json() // Destructure history

    if (!process.env.OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY environment variable is not set.")
      return NextResponse.json({ error: "Server configuration error: OpenAI API key is missing." }, { status: 500 })
    }

    // --- RAG: Retrieve relevant documents from Supabase ---
    let retrievedContext = ""
    try {
      // 1. Generate embedding for the user's current message
      const { embedding } = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: message,
      })

      // 2. Query Supabase for semantically similar document chunks
      const { data: documents, error: dbError } = await supabaseAdmin.rpc("match_documents", {
        query_embedding: embedding,
        match_threshold: 0.5, // Adjust this threshold as needed (0.7-0.8 is common for cosine similarity)
        match_count: 5, // Retrieve top 5 most relevant chunks
      })

      if (dbError) {
        console.error("Error querying Supabase for documents:", dbError)
      } else if (documents && documents.length > 0) {
        retrievedContext = documents.map((doc: any) => doc.content).join("\n\n")
        console.log(`Retrieved ${documents.length} relevant document chunks for RAG.`)
      }
    } catch (ragError) {
      console.error("Error during RAG retrieval process:", ragError)
      // Continue without RAG context if there's an error
    }

    // Combine chatbot instructions, training data, and retrieved context for prompt
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

    ${
      retrievedContext
        ? `--- Additional Context from Uploaded Documents (Prioritize this if relevant) ---
    ${retrievedContext}`
        : ""
    }
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
