'use server'

import { createAdminClient } from '@/lib/supabase-admin'
import { sendPushToTask } from './pushActions'

export async function sendCallout(taskId: string, familyId: string, notes: string) {
  const admin = createAdminClient()

  // Get task name for the notification
  const { data: task } = await admin
    .from('tasks')
    .select('name')
    .eq('id', taskId)
    .single()

  const { data, error } = await admin
    .from('task_requests')
    .insert({
      task_id: taskId,
      family_id: familyId,
      notes: notes.trim() || null,
      status: 'open',
    })
    .select('id')
    .single()

  if (error) return { data: null, error: error.message }

  // Fire push notifications to signed-up volunteers (non-blocking)
  const taskName = task?.name ?? 'a task'
  const body = notes.trim()
    ? notes.trim()
    : 'Tap to see the details and respond.'

  sendPushToTask(taskId, {
    title: `Help needed — ${taskName}`,
    body,
    url: '/volunteer',
    tag: `callout-${taskId}`,
  }).catch(() => {})

  return { data, error: null }
}
