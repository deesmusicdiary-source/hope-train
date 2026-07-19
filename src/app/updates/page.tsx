import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { TimelineSection, type TimelineEntry } from './TimelineSection'
import { NowSection, type NowPost } from './NowSection'
import { PlanSection } from './PlanSection'
import { NotifyToggle } from './NotifyToggle'
import type { Visibility } from './visibility'

type FamilyRow = {
  id: string
  name: string
  patient_name: string | null
  treatment_plan: string | null
  treatment_plan_visibility: Visibility | null
}

const FAMILY_COLS = 'id, name, patient_name, treatment_plan, treatment_plan_visibility'

export default async function UpdatesPage() {
  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  // Who is looking? Family (owner/co-manager) sees everything and can post.
  // Close family/friends see 'close' + 'all'. Other volunteers see 'all' only.
  let family: FamilyRow | null = null
  let isFamily = false
  let volunteer: { id: string; is_close_friend: boolean | null; notify_updates: boolean | null } | null = null

  const { data: owned } = await admin
    .from('families').select(FAMILY_COLS).eq('owner_id', user.id).maybeSingle()

  if (owned) {
    family = owned as FamilyRow
    isFamily = true
  } else {
    const { data: mgr } = await admin
      .from('family_managers').select('family_id').eq('email', user.email!).maybeSingle()
    if (mgr) {
      const { data } = await admin
        .from('families').select(FAMILY_COLS).eq('id', mgr.family_id).single()
      family = data as FamilyRow
      isFamily = true
    } else {
      const { data: vol } = await admin
        .from('volunteers')
        .select('id, family_id, is_close_friend, notify_updates')
        .eq('email', user.email!)
        .maybeSingle()
      if (vol) {
        volunteer = vol
        const { data } = await admin
          .from('families').select(FAMILY_COLS).eq('id', vol.family_id).single()
        family = data as FamilyRow
      }
    }
  }

  if (!family) redirect('/')

  const allowedVisibilities: Visibility[] = isFamily
    ? ['private', 'close', 'all']
    : volunteer?.is_close_friend
      ? ['close', 'all']
      : ['all']

  const { data: updates } = await admin
    .from('family_updates')
    .select('id, kind, body, event_date, image_urls, visibility, created_at')
    .eq('family_id', family.id)
    .in('visibility', allowedVisibilities)
    .order('created_at', { ascending: false })

  const timeline: TimelineEntry[] = (updates ?? [])
    .filter(u => u.kind === 'timeline')
    .sort((a, b) => (b.event_date ?? '').localeCompare(a.event_date ?? ''))
    .map(u => ({ id: u.id, body: u.body, event_date: u.event_date, image_urls: u.image_urls ?? [], visibility: u.visibility as Visibility }))

  const nowPosts: NowPost[] = (updates ?? [])
    .filter(u => u.kind === 'now')
    .map(u => ({
      id: u.id,
      body: u.body,
      image_urls: u.image_urls ?? [],
      visibility: u.visibility as Visibility,
      created_at: u.created_at,
    }))

  const planVisibility = (family.treatment_plan_visibility ?? 'all') as Visibility
  const canSeePlan = isFamily || allowedVisibilities.includes(planVisibility)

  const displayName = family.patient_name || family.name
  const trainName = family.patient_name ? `${family.patient_name}'s Hope Train` : 'Hope Train'
  const backHref = isFamily ? '/dashboard' : '/volunteer'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#ede9ff] flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-[#7F77DD]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                <path d="M2 20h20" />
                <circle cx="8" cy="18" r="2" />
                <circle cx="17" cy="18" r="2" />
                <path d="M3 9h12v7h-12z" />
                <path d="M15 6h5v10h-5z" />
                <path d="M5 9v-3" />
                <path d="M4 6h2" />
                <path d="M16 8h3v3h-3z" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-gray-900">{trainName}</span>
          </div>
          <Link href={backHref} className="text-xs text-[#7F77DD] hover:text-[#5c55b8] font-medium">
            ← My dashboard
          </Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-8 flex flex-col gap-8">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">How {displayName} is doing</h1>
          <p className="text-sm text-gray-500 mt-1">
            {isFamily
              ? 'Share updates with your volunteer community — you control who sees each post.'
              : 'Updates shared by the family.'}
          </p>
        </div>

        {!isFamily && volunteer && (
          <NotifyToggle
            volunteerId={volunteer.id}
            initialEnabled={volunteer.notify_updates ?? false}
          />
        )}

        <NowSection posts={nowPosts} familyId={family.id} isFamily={isFamily} />

        {canSeePlan && (
          <PlanSection
            familyId={family.id}
            plan={family.treatment_plan}
            planVisibility={planVisibility}
            isFamily={isFamily}
          />
        )}

        <TimelineSection entries={timeline} familyId={family.id} isFamily={isFamily} />
      </main>
    </div>
  )
}
