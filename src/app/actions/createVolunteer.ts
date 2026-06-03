'use server'

import { createAdminClient } from '@/lib/supabase-admin'

export async function createVolunteer(
  familyId: string,
  fullName: string,
  email: string,
): Promise<{ error: string | null }> {
  const supabase = createAdminClient()

  const { data: existing } = await supabase
    .from('volunteers')
    .select('id')
    .eq('family_id', familyId)
    .eq('email', email)
    .maybeSingle()

  if (existing) return { error: null } // already a member, silently succeed

  const { error } = await supabase
    .from('volunteers')
    .insert({
      family_id: familyId,
      full_name: fullName,
      email,
      availability: 'available',
    })

  return { error: error?.message ?? null }
}
