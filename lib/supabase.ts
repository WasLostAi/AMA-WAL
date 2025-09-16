import { createClient } from "@supabase/supabase-js"

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Validate environment variables
if (!supabaseUrl) {
  console.warn("SUPABASE_URL is not configured. Some features may not work.")
}

if (!supabaseServiceKey) {
  console.warn("SUPABASE_SERVICE_ROLE_KEY is not configured. Admin features may not work.")
}

if (!supabaseAnonKey) {
  console.warn("SUPABASE_ANON_KEY is not configured. Client features may not work.")
}

// Admin client for server-side operations (with service role key)
export const supabaseAdmin = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseServiceKey || "placeholder-key",
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
)

// Client-side Supabase client (singleton pattern)
let supabaseClient: ReturnType<typeof createClient> | null = null

export function getSupabaseClient() {
  if (!supabaseClient) {
    supabaseClient = createClient(
      supabaseUrl || "https://placeholder.supabase.co",
      supabaseAnonKey || "placeholder-key",
      {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
        },
      },
    )
  }
  return supabaseClient
}

// Export the client for backward compatibility
export const supabase = getSupabaseClient()
