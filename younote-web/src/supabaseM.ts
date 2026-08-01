// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const realSupabase = createClient(supabaseUrl, supabaseAnonKey)

// 1. Create a fake mock object that mirrors the Supabase API chain
const mockSupabase = {
  auth: {
    getUser: async () => ({ data: { user: { id: "mock-user-id" } }, error: null }),
    getSession: async () => ({ data: { session: {} }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
  },
  from: (table: string) => ({
    select: () => ({
      eq: () => ({
        order: () => ({
          limit: async () => {
            if (table === "notes") return { data: [{ id: "1", content: "Mock Note", video_id: "1", video: { youtube_video_id: "dQw4w9WgXcQ" } }] };
            if (table === "video_ratings") return { data: [{ profile_id: "1", video_id: "1", rating: 4, video: { youtube_video_id: "dQw4w9WgXcQ" } }] };
            return { data: [] };
          }
        }),
        limit: async () => ({ data: [] }) // backup catch-all
      }),
      limit: async () => {
        if (table === "videos") return { data: [{ id: "1", title: "Mock Trending Video", youtube_video_id: "dQw4w9WgXcQ" }] };
        return { data: [] };
      }
    })
  })
}

// 2. Export the fake client locally, swap to realSupabase when building for production
export const supabase = import.meta.env.DEV ? (mockSupabase as any) : realSupabase;