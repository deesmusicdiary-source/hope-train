import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { redirect } from 'next/navigation'
import { StatusBubble } from './StatusBubble'
import { InviteButton } from './InviteButton'
import { TaskTable, type Task } from './TaskTable'
import { CoManagerSection } from './CoManagerSection'
import { FamilyProfile } from './FamilyProfile'
import { CalloutSection } from './CalloutSection'

type Recipe = {
  id: string
  title: string
  recipe_url: string | null
  image_path: string | null
  saved_by_family: boolean | null
  created_at: string
  volunteers: { full_name: string } | null
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  // Check family ownership FIRST — family owners/co-managers always land here
  // even if they also exist in the volunteers table.
  let family: {
    id: string; name: string; coordinator_name: string | null;
    patient_name: string | null; status_bubble: string | null; status_updated_at: string | null
  } | null = null

  const { data: ownedFamily } = await admin
    .from('families')
    .select('id, name, coordinator_name, patient_name, status_bubble, status_updated_at')
    .eq('owner_id', user.id)
    .maybeSingle()

  if (ownedFamily) {
    family = ownedFamily
  } else {
    const { data: managerRecord } = await admin
      .from('family_managers')
      .select('family_id')
      .eq('email', user.email!)
      .maybeSingle()
    if (managerRecord) {
      const { data } = await admin
        .from('families')
        .select('id, name, coordinator_name, patient_name, status_bubble, status_updated_at')
        .eq('id', managerRecord.family_id)
        .single()
      family = data
    }
  }

  // No family account — check if volunteer and redirect
  if (!family) {
    const { data: volunteerMatch } = await admin
      .from('volunteers')
      .select('id')
      .eq('email', user.email!)
      .maybeSingle()
    if (volunteerMatch) redirect('/volunteer')

    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-gray-500 text-sm">No family found for your account.</p>
        <p className="text-gray-400 text-xs mt-1">Ask your coordinator to set up your family.</p>
      </div>
    )
  }

  const [{ data: tasks }, { data: recipes }, { data: managers }] = await Promise.all([
    admin
      .from('tasks')
      .select('id, name, category, frequency, nature, notification, help_needed, notes, days, is_coordinator_task, task_signups(volunteer_id, is_designated, volunteers(full_name)), task_slots(id, slot_date, claimed_by)')
      .eq('family_id', family.id)
      .eq('is_deleted', false)
      .order('created_at'),
    admin
      .from('recipes')
      .select('id, title, recipe_url, image_path, saved_by_family, created_at, volunteers(full_name)')
      .eq('family_id', family.id)
      .order('created_at', { ascending: false })
      .limit(12),
    admin
      .from('family_managers')
      .select('id, full_name, email')
      .eq('family_id', family.id)
      .order('created_at'),
  ])

  return (
    <div className="flex flex-col gap-6">
      <FamilyProfile family={family} />
      <InviteButton familyId={family.id} />
      <CoManagerSection familyId={family.id} initialManagers={managers ?? []} />
      <StatusBubble family={family} />

      <a
        href="/updates"
        className="bg-white border border-gray-200 rounded-2xl px-5 py-4 flex items-center justify-between hover:border-[#5A50B5] transition-colors"
      >
        <div>
          <p className="text-sm font-medium text-gray-900">Family updates</p>
          <p className="text-xs text-gray-400 mt-0.5">Timeline, photos, and the plan — you choose who sees each post.</p>
        </div>
        <span className="text-[#5A50B5] text-sm font-medium shrink-0">Open →</span>
      </a>

      <CalloutSection
        tasks={(tasks ?? [])
          .filter(t => t.nature === 'as_needed' && !t.is_coordinator_task)
          .map(t => ({ id: t.id, name: t.name, signupCount: (t.task_signups ?? []).length }))}
        familyId={family.id}
      />

      <TaskTable initialTasks={(tasks ?? []) as unknown as Task[]} familyId={family.id} />

      {/* Recipes */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-900">Recipes from volunteers</h2>
          <span className="text-xs text-gray-400">{recipes?.length ?? 0} saved</span>
        </div>
        {!recipes || recipes.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl px-5 py-10 text-center">
            <p className="text-gray-400 text-sm">No recipes yet — volunteers can add them from their dashboard.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {(recipes as unknown as Recipe[]).map(recipe => <RecipeCard key={recipe.id} recipe={recipe} />)}
          </div>
        )}
      </section>
    </div>
  )
}

function RecipeCard({ recipe }: { recipe: Recipe }) {
  const inner = (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-[#5A50B5] transition-colors">
      {recipe.image_path ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={recipe.image_path} alt={recipe.title} className="w-full h-28 object-cover" />
      ) : (
        <div className="w-full h-28 bg-[#dcd6f7] flex items-center justify-center">
          <svg className="w-6 h-6 text-[#5A50B5]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
          </svg>
        </div>
      )}
      <div className="p-3">
        <p className="text-sm font-medium text-gray-900 truncate">{recipe.title}</p>
        <p className="text-xs text-gray-400 mt-0.5">by {recipe.volunteers?.full_name ?? 'volunteer'}</p>
        {recipe.saved_by_family && <span className="inline-block mt-1.5 text-xs text-[#1D9E75] font-medium">★ Saved</span>}
      </div>
    </div>
  )
  return recipe.recipe_url
    ? <a href={recipe.recipe_url} target="_blank" rel="noopener noreferrer">{inner}</a>
    : inner
}
