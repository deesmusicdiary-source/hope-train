import { createClient } from '@supabase/supabase-js'

// Server-only admin client — uses service role key, bypasses RLS.
// Never import this in client components.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!.replace(/\/$/, '')
  return createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}
