import { Pica } from "@picahq/ai"

// Initialize the Pica AI SDK client
// Ensure PICA_SECRET_KEY and PICA_VERCEL_CONNECTOR_KEY are set in your Vercel environment variables.
const pica = new Pica(process.env.PICA_SECRET_KEY!, {
  serverUrl: process.env.PICAOS_API_URL || "https://api.picaos.com",
  connectors: [
    process.env.PICA_VERCEL_CONNECTOR_KEY || "test::vercel::default::YOUR_CONNECTOR_KEY_HERE", // Replace with your actual connector key
  ],
  // Add any other optional configurations here as per PicaHQ documentation
  // e.g., identity, identityType, authkit, knowledgeAgent
})

// Assuming the Pica SDK provides a model compatible with @ai-sdk/openai's generateText
// If the SDK exposes a specific model function (e.g., pica.model('agent-name')),
// you would use that instead. For now, we'll assume the 'pica' instance itself
// can be used as the model or provides a direct text generation method.
// For the purpose of AI SDK compatibility, we'll export a function that acts as a model.
export const picaModel = (modelName: string) => {
  // This is a placeholder. The actual implementation depends on how @picahq/ai
  // exposes its models for the Vercel AI SDK.
  // It might be `pica.textModel(modelName)` or `pica.agent(modelName)`.
  // For now, we'll return the pica instance itself, assuming it's compatible.
  // You might need to adjust this based on the exact @picahq/ai API.
  console.log(`Using Pica model: ${modelName}`)
  return pica // Assuming the Pica instance itself can act as an AI SDK model
}

// You can also export the raw pica client if you need to use its other methods directly
export { pica }
