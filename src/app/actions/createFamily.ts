'use server'

import { createAdminClient } from '@/lib/supabase-admin'

export async function createFamily(familyName: string, userId: string): Promise<{ error: string | null }> {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('families')
    .insert({ name: familyName, owner_id: userId })

  return { error: error?.message ?? null }
}
