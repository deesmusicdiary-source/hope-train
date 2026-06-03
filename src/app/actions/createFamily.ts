'use server'

import { createAdminClient } from '@/lib/supabase-admin'

export async function createFamily(
  familyName: string,
  userId: string,
  coordinatorName: string,
  patientName: string,
): Promise<{ error: string | null }> {
  const supabase = createAdminClient()
  const { error } = await supabase.from('families').insert({
    name: familyName.trim(),
    owner_id: userId,
    coordinator_name: coordinatorName.trim(),
    patient_name: patientName.trim(),
  })
  return { error: error?.message ?? null }
}
