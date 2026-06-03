'use server'

import { createAdminClient } from '@/lib/supabase-admin'

export async function claimTask(taskId: string, volunteerId: string, selectedDays: string | null = null) {
  const admin = createAdminClient()

  // Get next queue position
  const { data: existing } = await admin
    .from('task_signups')
    .select('queue_position')
    .eq('task_id', taskId)
    .order('queue_position', { ascending: false })
    .limit(1)

  const nextPos =
    existing && existing.length > 0 && existing[0].queue_position != null
      ? existing[0].queue_position + 1
      : 1

  const { data, error } = await admin
    .from('task_signups')
    .insert({
      task_id: taskId,
      volunteer_id: volunteerId,
      selected_days: selectedDays,
      queue_position: nextPos,
    })
    .select('id, queue_position')
    .single()

  return { data, error: error?.message ?? null }
}

export async function unclaimTask(signupId: string) {
  const admin = createAdminClient()
  const { error } = await admin
    .from('task_signups')
    .delete()
    .eq('id', signupId)
  return { error: error?.message ?? null }
}

export async function updateSelectedDays(signupId: string, selectedDays: string | null) {
  const admin = createAdminClient()
  const { error } = await admin
    .from('task_signups')
    .update({ selected_days: selectedDays })
    .eq('id', signupId)
  return { error: error?.message ?? null }
}
