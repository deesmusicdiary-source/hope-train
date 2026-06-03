'use server'

import webpush from 'web-push'
import { createAdminClient } from '@/lib/supabase-admin'

function initWebPush() {
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const priv = process.env.VAPID_PRIVATE_KEY
  const email = process.env.VAPID_EMAIL
  if (!pub || !priv || !email) return false
  webpush.setVapidDetails(email, pub, priv)
  return true
}

export async function saveSubscription(
  volunteerId: string,
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } }
) {
  const admin = createAdminClient()
  const { error } = await admin.from('push_subscriptions').upsert(
    {
      volunteer_id: volunteerId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
    { onConflict: 'volunteer_id,endpoint' }
  )
  return { error: error?.message ?? null }
}

export async function sendPushToTask(
  taskId: string,
  payload: { title: string; body: string; url?: string; tag?: string }
) {
  if (!initWebPush()) return { sent: 0, error: 'Push not configured' }

  const admin = createAdminClient()

  // Get volunteer IDs signed up for this task
  const { data: signups } = await admin
    .from('task_signups')
    .select('volunteer_id')
    .eq('task_id', taskId)

  if (!signups || signups.length === 0) return { sent: 0 }

  const volunteerIds = signups.map(s => s.volunteer_id)

  // Get their push subscriptions
  const { data: subs } = await admin
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .in('volunteer_id', volunteerIds)

  if (!subs || subs.length === 0) return { sent: 0 }

  const results = await Promise.allSettled(
    subs.map(sub =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload)
      )
    )
  )

  // Clean up expired subscriptions
  const expired: string[] = []
  results.forEach((result, i) => {
    if (result.status === 'rejected') {
      const err = result.reason as { statusCode?: number }
      if (err?.statusCode === 410 || err?.statusCode === 404) {
        expired.push(subs[i].endpoint)
      }
    }
  })
  if (expired.length > 0) {
    await admin.from('push_subscriptions').delete().in('endpoint', expired)
  }

  const sent = results.filter(r => r.status === 'fulfilled').length
  return { sent }
}
