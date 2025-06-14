import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createOpenAI, openai as textGenOpenai } from "@ai-sdk/openai"
import { generateText } from "ai"
import { supabaseAdmin } from "@/lib/supabase"

const openaiEmbeddings = createOpenAI({ apiKey: process.env.OPENAI_API_KEY! })

export async function POST(request: NextRequest) {
  try {
    const { message, history } = await request.json()

    if (!process.env.OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY environment variable is not set.")
      return NextResponse.json({ error: "Server configuration error: OpenAI API key is missing." }, { status: 500 })
    }

    // --- RAG: Retrieve relevant documents from Supabase ---
    let retrievedContext = ""
    try {
      const { embedding } = await openaiEmbeddings.embeddings.create({
        model: "text-embedding-3-small",
        input: message,
      })

      const { data: documents, error: dbError } = await supabaseAdmin.rpc("match_documents", {
        query_embedding: embedding,
        match_threshold: 0.5,
        match_count: 5,
      })

      if (dbError) {
        console.error("Error querying Supabase for documents:", dbError)
      } else if (documents && documents.length > 0) {
        retrievedContext = documents.map((doc: any) => doc.content).join("\n\n")
        console.log(`Retrieved ${documents.length} relevant document chunks for RAG.`)
      }
    } catch (ragError) {
      console.error("Error during RAG retrieval process:", ragError)
    }

    // Fetch agent profile data from Supabase
    let chatbotData: any = {}
    try {
      const { data: profileData, error: profileError } = await supabaseAdmin
        .from("agent_profile")
        .select("profile_data")
        .limit(1)
        .maybeSingle()

      if (profileError) {
        console.error("Error fetching agent profile from Supabase:", profileError)
        if (profileError.code === "42P01") {
          return NextResponse.json(
            {
              error: "Database table 'agent_profile' not found. Please run the SQL seed script.",
              details: profileError.message,
            },
            { status: 500 },
          )
        }
        console.warn("Using fallback chatbot data due to Supabase fetch error:", profileError.message)
      }

      if (!profileData) {
        console.warn("No agent profile data found in Supabase. Using fallback data.")
      }

      chatbotData = profileData?.profile_data || {
        personal: { name: "Michael P. Robinson", nickname: "Mike", mission: "empower through AI" },
        professional: { currentRole: "AI Developer", skills: ["AI", "Web3"], keyAchievements: [] },
        company: { name: "WasLost LLC", product: "WasLost.Ai", description: "AI agent ecosystem", projects: [] },
        chatbotInstructions: {
          role: "BETA Avatar Representative for Michael P. Robinson",
          style:
            "Respond as Michael (or Mike) would. Assure the user that talking to YOU is the same as talking to Michael.",
          approach: "Answer questions BRIEFLY, as this is a TEST/MVP.",
          limitations:
            "If asked about advanced functions, or $WSLST Tokenomics, say they are coming soon or reserved functionality.",
          initialGreeting:
            "Hello, I'm Michael Robinson's AI representative. I'm here to provide insights into his professional background and the innovative work at WasLost.Ai. How can I assist you?",
        },
      }
    } catch (dbFetchError) {
      console.error("Unexpected error during Supabase profile fetch:", dbFetchError)
      chatbotData = {
        personal: { name: "Michael P. Robinson", nickname: "Mike", mission: "empower through AI" },
        professional: { currentRole: "AI Developer", skills: ["AI", "Web3"], keyAchievements: [] },
        company: { name: "WasLost LLC", product: "WasLost.Ai", description: "AI agent ecosystem", projects: [] },
        chatbotInstructions: {
          role: "BETA Avatar Representative for Michael P. Robinson",
          style:
            "Respond as Michael (or Mike) would. Assure the user that talking to YOU is the same as talking to Michael.",
          approach: "Answer questions BRIEFLY, as this is a TEST/MVP.",
          limitations:
            "If asked about advanced functions, or $WSLST Tokenomics, say they are coming soon or reserved functionality.",
          initialGreeting:
            "Hello, I'm Michael Robinson's AI representative. I'm here to provide insights into his professional background and the innovative work at WasLost.Ai. How can I assist you?",
        },
      }
      console.warn("Using fallback chatbot data due to unexpected error during Supabase fetch.")
    }

    // Fetch training Q&A data from Supabase
    const { data: trainingData, error: trainingError } = await supabaseAdmin
      .from("agent_training_qa")
      .select("question, answer")

    if (trainingError) {
      console.error("Error fetching training data from Supabase:", trainingError)
    }

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
Previous Experience: ${chatbotData.professional.previousExperience.map((exp: string) => `- ${exp}`).join("\n")}
Skills: ${chatbotData.professional.skills.join("; ")}
Key Achievements: ${chatbotData.professional.keyAchievements.map((ach: string) => `- ${ach}`).join("\n")}

--- WasLost LLC & WasLost.Ai Company Information ---
Company Name: ${chatbotData.company.name}
Product: ${chatbotData.company.product}
Description: ${chatbotData.company.description}
Projects:
${chatbotData.company.projects.map((project: { name: string; details: string[] }) => `  - ${project.name}: ${project.details.join(", ")}`).join("\n")}
Tokenomics Status: ${chatbotData.company.tokenomics}

--- Additional Training Data (Q&A pairs for specific queries) ---
${trainingData ? trainingData.map((data: { question: string; answer: string }) => `Q: ${data.question}\nA: ${data.answer}`).join("\n\n") : "No additional training data available."}

${
  retrievedContext
    ? `--- Additional Context from Uploaded Documents (Prioritize this if relevant) ---
  ${retrievedContext}`
    : ""
}
`

    const formattedHistory = history.map((msg: { role: string; content: string }) => ({
      role: msg.role,
      content: msg.content,
    }))

    const { text } = await generateText({
      model: textGenOpenai("gpt-4o"),
      system: systemPrompt,
      messages: formattedHistory,
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
