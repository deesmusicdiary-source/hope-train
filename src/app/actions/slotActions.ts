'use server'

import { createAdminClient } from '@/lib/supabase-admin'

export async function addSlot(taskId: string, slotDate: string) {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('task_slots')
    .insert({ task_id: taskId, slot_date: slotDate })
    .select('id, slot_date, claimed_by')
    .single()
  return { data, error: error?.message ?? null }
}

export async function removeSlot(slotId: string) {
  const admin = createAdminClient()
  // Only remove if unclaimed
  const { error } = await admin
    .from('task_slots')
    .delete()
    .eq('id', slotId)
    .is('claimed_by', null)
  return { error: error?.message ?? null }
}

export async function claimSlot(slotId: string, volunteerId: string) {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('task_slots')
    .update({ claimed_by: volunteerId })
    .eq('id', slotId)
    .is('claimed_by', null)
    .select('id')
    .maybeSingle()
  if (!data && !error) return { data: null, error: 'This slot was just claimed by someone else.' }
  return { data, error: error?.message ?? null }
}

export async function unclaimSlot(slotId: string, volunteerId: string) {
  const admin = createAdminClient()
  const { error } = await admin
    .from('task_slots')
    .update({ claimed_by: null })
    .eq('id', slotId)
    .eq('claimed_by', volunteerId)
  return { error: error?.message ?? null }
}
