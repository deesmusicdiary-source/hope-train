'use server'

import webpush from 'web-push'
import { createAdminClient } from '@/lib/supabase-admin'
import { revalidatePath } from 'next/cache'

export type UpdateVisibility = 'private' | 'close' | 'all'

function initWebPush() {
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const priv = process.env.VAPID_PRIVATE_KEY
  const email = process.env.VAPID_EMAIL
  if (!pub || !priv || !email) return false
  webpush.setVapidDetails(email, pub, priv)
  return true
}

/** Push to volunteers on this family's train who opted in to updates.
 *  'close' visibility only reaches close family/friends; 'private' reaches no one. */
async function pushUpdateToOptedIn(
  familyId: string,
  visibility: UpdateVisibility,
  payload: { title: string; body: string; url?: string; tag?: string }
) {
  if (visibility === 'private') return { sent: 0 }
  if (!initWebPush()) return { sent: 0 }

  const admin = createAdminClient()

  let query = admin
    .from('volunteers')
    .select('id')
    .eq('family_id', familyId)
    .eq('notify_updates', true)
  if (visibility === 'close') query = query.eq('is_close_friend', true)

  const { data: vols } = await query
  if (!vols || vols.length === 0) return { sent: 0 }

  const { data: subs } = await admin
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .in('volunteer_id', vols.map(v => v.id))

  if (!subs || subs.length === 0) return { sent: 0 }

  const results = await Promise.allSettled(
    subs.map(sub =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload)
      )
    )
  )

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

  return { sent: results.filter(r => r.status === 'fulfilled').length }
}

async function familyPushTitle(familyId: string) {
  const admin = createAdminClient()
  const { data } = await admin
    .from('families')
    .select('patient_name, name')
    .eq('id', familyId)
    .single()
  const who = data?.patient_name || data?.name || 'The family'
  return `Update from ${who}'s Hope Train`
}

export async function addTimelineEntry(
  familyId: string,
  eventDate: string,
  body: string,
  visibility: UpdateVisibility
) {
  const admin = createAdminClient()
  const { error } = await admin.from('family_updates').insert({
    family_id: familyId,
    kind: 'timeline',
    body: body.trim(),
    event_date: eventDate,
    visibility,
  })
  if (error) return { error: error.message }

  await pushUpdateToOptedIn(familyId, visibility, {
    title: await familyPushTitle(familyId),
    body: body.trim().slice(0, 140),
    url: '/updates',
    tag: 'family-update',
  })

  revalidatePath('/updates')
  return { error: null }
}

export async function addNowPost(
  familyId: string,
  body: string,
  imageUrls: string[],
  visibility: UpdateVisibility
) {
  const admin = createAdminClient()

  // Archive the current "now" post into the timeline, dated to when it was posted
  const { data: current } = await admin
    .from('family_updates')
    .select('id, created_at')
    .eq('family_id', familyId)
    .eq('kind', 'now')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (current) {
    await admin
      .from('family_updates')
      .update({ kind: 'timeline', event_date: current.created_at.slice(0, 10) })
      .eq('id', current.id)
  }

  const { error } = await admin.from('family_updates').insert({
    family_id: familyId,
    kind: 'now',
    body: body.trim(),
    image_urls: imageUrls,
    visibility,
  })
  if (error) return { error: error.message }

  await pushUpdateToOptedIn(familyId, visibility, {
    title: await familyPushTitle(familyId),
    body: body.trim().slice(0, 140) || 'New photos posted',
    url: '/updates',
    tag: 'family-update',
  })

  revalidatePath('/updates')
  return { error: null }
}

export async function deleteUpdate(updateId: string) {
  const admin = createAdminClient()
  const { error } = await admin.from('family_updates').delete().eq('id', updateId)
  revalidatePath('/updates')
  return { error: error?.message ?? null }
}

export async function savePlan(
  familyId: string,
  text: string,
  visibility: UpdateVisibility
) {
  const admin = createAdminClient()
  const { error } = await admin
    .from('families')
    .update({ treatment_plan: text.trim() || null, treatment_plan_visibility: visibility })
    .eq('id', familyId)
  revalidatePath('/updates')
  return { error: error?.message ?? null }
}

export async function setCloseFriend(volunteerId: string, isClose: boolean) {
  const admin = createAdminClient()
  const { error } = await admin
    .from('volunteers')
    .update({ is_close_friend: isClose })
    .eq('id', volunteerId)
  revalidatePath('/helpers')
  revalidatePath('/updates')
  return { error: error?.message ?? null }
}

export async function setNotifyUpdates(volunteerId: string, enabled: boolean) {
  const admin = createAdminClient()
  const { error } = await admin
    .from('volunteers')
    .update({ notify_updates: enabled })
    .eq('id', volunteerId)
  revalidatePath('/updates')
  return { error: error?.message ?? null }
}
