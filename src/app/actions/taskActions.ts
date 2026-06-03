'use server'

import { createAdminClient } from '@/lib/supabase-admin'

type TaskNature = 'rotation' | 'random' | 'signup' | 'as_needed' | 'scheduled'

type TaskInput = {
  name: string
  category?: string
  frequency: string
  nature: TaskNature | ''
  notification: string
  help_needed: boolean
  notes: string
  days: string
  is_coordinator_task?: boolean
}

export async function createTask(familyId: string, input: TaskInput) {
  const admin = createAdminClient()
  const { error } = await admin.from('tasks').insert({
    family_id: familyId,
    name: input.name.trim(),
    category: input.category || null,
    frequency: input.frequency || null,
    nature: input.nature || null,
    notification: input.notification.trim() || null,
    help_needed: input.help_needed,
    notes: input.notes?.trim() || null,
    days: input.days || null,
    is_coordinator_task: input.is_coordinator_task ?? false,
    is_deleted: false,
  })
  return { error: error?.message ?? null }
}

export async function updateTask(taskId: string, input: TaskInput & { is_coordinator_task?: boolean }) {
  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updates: Record<string, any> = {
    name: input.name.trim(),
    notes: input.notes?.trim() || null,
  }
  if (!input.is_coordinator_task) {
    updates.frequency = input.frequency || null
    updates.nature = input.nature || null
    updates.notification = input.notification?.trim() || null
    updates.help_needed = input.help_needed ?? false
    updates.days = input.days || null
  }
  const { error } = await admin.from('tasks').update(updates).eq('id', taskId)
  return { error: error?.message ?? null }
}

export async function deleteTask(taskId: string) {
  const admin = createAdminClient()
  const { error } = await admin.from('tasks').update({ is_deleted: true }).eq('id', taskId)
  return { error: error?.message ?? null }
}

export async function seedDefaultTasks(familyId: string) {
  const admin = createAdminClient()
  const rows = DEFAULT_TASKS.map(t => ({ ...t, family_id: familyId, is_deleted: false }))
  const { error } = await admin.from('tasks').insert(rows)
  return { error: error?.message ?? null }
}

export async function addCategory(familyId: string, categoryName: string) {
  const admin = createAdminClient()
  const upper = categoryName.trim().toUpperCase()
  const coordinatorName = COORDINATOR_NAMES[upper] ?? `Act as ${categoryName.trim()} point person`
  const { error } = await admin.from('tasks').insert({
    family_id: familyId,
    name: coordinatorName,
    category: categoryName.trim().toUpperCase(),
    is_coordinator_task: true,
    is_deleted: false,
  })
  return { error: error?.message ?? null }
}

export async function designateVolunteer(taskId: string, volunteerId: string | null) {
  const admin = createAdminClient()
  const { error: clearErr } = await admin
    .from('task_signups')
    .update({ is_designated: false })
    .eq('task_id', taskId)
  if (clearErr) return { error: clearErr.message }
  if (volunteerId) {
    const { error } = await admin
      .from('task_signups')
      .update({ is_designated: true })
      .eq('task_id', taskId)
      .eq('volunteer_id', volunteerId)
    if (error) return { error: error.message }
  }
  return { error: null }
}

const COORDINATOR_NAMES: Record<string, string> = {
  FOOD: 'Act as meal train coordinator',
  HOUSE: 'Act as cleaning coordinator',
}

const DEFAULT_TASKS = [
  // FOOD
  { category: 'FOOD', name: 'Act as meal train coordinator', is_coordinator_task: true, frequency: null, nature: null, notification: null, help_needed: false, notes: null },
  { category: 'FOOD', name: 'Make and deliver a hot meal', is_coordinator_task: false, frequency: null, nature: 'signup', notification: null, help_needed: false, notes: null },
  { category: 'FOOD', name: 'Make and deliver a frozen meal', is_coordinator_task: false, frequency: 'biweekly', nature: 'rotation', notification: null, help_needed: false, notes: null },
  // HOUSE
  { category: 'HOUSE', name: 'Act as cleaning coordinator', is_coordinator_task: true, frequency: null, nature: null, notification: null, help_needed: false, notes: null },
  { category: 'HOUSE', name: 'Clean house', is_coordinator_task: false, frequency: 'biweekly', nature: 'rotation', notification: null, help_needed: false, notes: null },
  { category: 'HOUSE', name: 'Sanitize high-touch surfaces when family getting out of hospital', is_coordinator_task: false, frequency: 'as_needed', nature: 'as_needed', notification: null, help_needed: false, notes: null },
  { category: 'HOUSE', name: 'Water plants', is_coordinator_task: false, frequency: 'biweekly', nature: 'as_needed', notification: null, help_needed: false, notes: null },
  // OUTDOOR
  { category: 'OUTDOOR', name: 'Act as Outdoor point person', is_coordinator_task: true, frequency: null, nature: null, notification: null, help_needed: false, notes: null },
  { category: 'OUTDOOR', name: 'Mow lawn', is_coordinator_task: false, frequency: 'biweekly', nature: 'rotation', notification: null, help_needed: false, notes: null },
  { category: 'OUTDOOR', name: 'Shovel snow', is_coordinator_task: false, frequency: 'as_needed', nature: 'rotation', notification: null, help_needed: false, notes: null },
  // CHILDCARE
  { category: 'CHILDCARE', name: 'Act as Childcare point person', is_coordinator_task: true, frequency: null, nature: null, notification: null, help_needed: false, notes: null },
  { category: 'CHILDCARE', name: 'Sibling pick-up from school — short notice', is_coordinator_task: false, frequency: 'as_needed', nature: 'as_needed', notification: null, help_needed: false, notes: null },
  { category: 'CHILDCARE', name: 'Sibling pick-up from school — defined days', is_coordinator_task: false, frequency: 'weekly', nature: 'signup', notification: null, help_needed: true, notes: null },
  { category: 'CHILDCARE', name: 'Sibling playdates weekday — short notice', is_coordinator_task: false, frequency: 'as_needed', nature: 'as_needed', notification: null, help_needed: false, notes: null },
  { category: 'CHILDCARE', name: 'Sibling playdates weekend — short notice', is_coordinator_task: false, frequency: 'as_needed', nature: 'as_needed', notification: null, help_needed: false, notes: null },
  // PET CARE
  { category: 'PET CARE', name: 'Act as Pet Care point person', is_coordinator_task: true, frequency: null, nature: null, notification: null, help_needed: false, notes: null },
  { category: 'PET CARE', name: 'Walk dog', is_coordinator_task: false, frequency: 'as_needed', nature: 'rotation', notification: null, help_needed: false, notes: null },
  { category: 'PET CARE', name: 'Feed dog', is_coordinator_task: false, frequency: 'as_needed', nature: 'as_needed', notification: null, help_needed: false, notes: null },
  // CAR MAINTENANCE
  { category: 'CAR MAINTENANCE', name: 'Act as Car Maintenance point person', is_coordinator_task: true, frequency: null, nature: null, notification: null, help_needed: false, notes: null },
  { category: 'CAR MAINTENANCE', name: 'Take car to garage — oil change, tire change etc.', is_coordinator_task: false, frequency: 'as_needed', nature: 'as_needed', notification: null, help_needed: false, notes: null },
  // DONATIONS
  { category: 'DONATIONS', name: 'Act as Donations point person', is_coordinator_task: true, frequency: null, nature: null, notification: null, help_needed: false, notes: null },
  { category: 'DONATIONS', name: 'E-transfer $30/month to help cover the cost of a cleaning service', is_coordinator_task: false, frequency: 'monthly', nature: 'signup', notification: null, help_needed: false, notes: null },
]
