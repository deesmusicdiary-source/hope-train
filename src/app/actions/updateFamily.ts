'use server'

import { createAdminClient } from '@/lib/supabase-admin'

export async function updateFamily(
  familyId: string,
  data: { name?: string; coordinator_name?: string; patient_name?: string }
): Promise<{ error: string | null }> {
  const admin = createAdminClient()
  const { error } = await admin.from('families').update(data).eq('id', familyId)
  return { error: error?.message ?? null }
}
