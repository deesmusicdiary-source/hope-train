'use server'

import { createAdminClient } from '@/lib/supabase-admin'

export async function createCoManager(
  familyId: string,
  fullName: string,
  email: string,
): Promise<{ error: string | null }> {
  const admin = createAdminClient()
  const { error } = await admin.from('family_managers').insert({
    family_id: familyId,
    full_name: fullName.trim(),
    email: email.trim().toLowerCase(),
  })
  return { error: error?.message ?? null }
}

export async function removeCoManager(managerId: string): Promise<{ error: string | null }> {
  const admin = createAdminClient()
  const { error } = await admin.from('family_managers').delete().eq('id', managerId)
  return { error: error?.message ?? null }
}
