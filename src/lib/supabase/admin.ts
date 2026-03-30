import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

// Uses the service role key — bypasses RLS, never expose to the browser.
// Only import this in Server Actions or Route Handlers.
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
