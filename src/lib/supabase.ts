import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

/**
 * Singleton Supabase browser client, typed against the generated `Database`
 * schema (see database.types.ts — regenerate after any migration).
 *
 * The anon/publishable key is safe to ship in the frontend — Row-Level Security
 * protects the data. The service-role key must NEVER appear here or in any
 * `VITE_`-prefixed variable; it only belongs in Edge Functions / server code.
 */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Set VITE_SUPABASE_URL and ' +
      'VITE_SUPABASE_ANON_KEY in your .env.local (copy .env.example to get started).',
  )
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
