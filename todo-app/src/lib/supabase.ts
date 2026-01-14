import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Check for missing environment variables
export const hasSupabaseConfig = !!(supabaseUrl && supabaseAnonKey)

if (!hasSupabaseConfig) {
  console.error('Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY')
}

// Create client - will fail gracefully if env vars are missing
export const supabase = hasSupabaseConfig
  ? createClient<Database>(supabaseUrl!, supabaseAnonKey!)
  : createClient<Database>('https://placeholder.supabase.co', 'placeholder-key')
