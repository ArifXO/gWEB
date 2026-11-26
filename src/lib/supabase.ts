import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** null when the app is built without Supabase settings: it then runs on this device only. */
export const supabase: SupabaseClient | null = url && key ? createClient(url, key) : null
