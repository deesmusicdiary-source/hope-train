import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { redirect } from 'next/navigation'
import { TaskClaimer } from './TaskClaimer'
import { MyTasksPanel } from './MyTasksPanel'
import { RecipeUpload } from './RecipeUpload'
import { PushBanner } from '@/components/PushBanner'

type TaskNature = 'rotation' | 'random' | 'signup' | 'as_needed' | 'scheduled'

type TaskSignup = {
  id: string
  volunteer_id: string
  selected_days: string | null
  queue_position: number | null
}

type TaskSlot = {
  id: string
  slot_date: string
  claimed_by: string | null
}

type Task = {
  id: string
  name: string
  category: string | null
  frequency: string | null
  nature: TaskNature | null
  help_needed: boolean | null
  is_coordinator_task: boolean | null
  notes: string | null
  days: string | null
  task_signups: TaskSignup[]
  task_slots: TaskSlot[]
}

type Recipe = {
  id: string
  title: string
  recipe_url: string | null
  image_path: string | null
  saved_by_family: boolean | null
}

export default async function VolunteerPage() {
  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: volunteer } = await admin
    .from('volunteers')
    .select('id, full_name, family_id, availability')
    .eq('email', user.email!)
    .maybeSingle()

  if (!volunteer) redirect('/dashboard')

  const { data: family } = await admin
    .from('families')
    .select('id, name, patient_name, status_bubble, status_updated_at')
    .eq('id', volunteer.family_id)
    .single()

  const { data: tasks } = await admin
    .from('tasks')
    .select(`
      id, name, category, frequency, nature, help_needed, is_coordinator_task, notes, days,
      task_signups(id, volunteer_id, selected_days, queue_position),
      task_slots(id, slot_date, claimed_by)
    `)
    .eq('family_id', volunteer.family_id)
    .eq('is_deleted', false)
    .order('created_at') as { data: Task[] | null }

  const { data: myRecipes } = await admin
    .from('recipes')
    .select('id, title, recipe_url, image_path, saved_by_family')
    .eq('volunteer_id', volunteer.id)
    .order('created_at', { ascending: false }) as { data: Recipe[] | null }

  type MyTask = {
    id: string
    name: string
    nature: TaskNature | null
    is_coordinator_task: boolean | null
    signup: { id: string; selected_days: string | null; queue_position: number | null } | null
    slots: TaskSlot[]
  }

  // Derive "my tasks" — tasks signed up for or slots claimed
  const myTasks: MyTask[] = (tasks ?? []).flatMap((task): MyTask[] => {
    if (task.nature === 'scheduled') {
      const mySlots = task.task_slots.filter(s => s.claimed_by === volunteer.id)
      if (mySlots.length === 0) return []
      return [{ id: task.id, name: task.name, nature: task.nature, is_coordinator_task: task.is_coordinator_task, signup: null, slots: mySlots }]
    }
    const signup = task.task_signups.find(s => s.volunteer_id === volunteer.id)
    if (!signup) return []
    return [{ id: task.id, name: task.name, nature: task.nature, is_coordinator_task: task.is_coordinator_task, signup, slots: [] }]
  })

  const statusName = family?.patient_name ?? family?.name ?? 'the family'

  return (
    <div className="flex flex-col gap-5">
      {/* Push notification banner (dismissible) */}
      <PushBanner volunteerId={volunteer.id} />

      {/* Status bubble + My Tasks — side by side on tablet+, stacked on mobile */}
      {family && (
        <div className="grid sm:grid-cols-2 gap-4 items-start">
          {/* Status bubble */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-[#7F77DD] shrink-0" />
              <h2 className="text-sm font-medium text-gray-800">
                How {statusName} is doing
              </h2>
            </div>
            <p className="ml-4 text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
              {family.status_bubble || (
                <span className="text-gray-400 italic">No update yet.</span>
              )}
            </p>
            <a href="/updates" className="ml-4 inline-block mt-2 text-xs text-[#7F77DD] hover:text-[#5c55b8] font-medium">
              View all updates →
            </a>
          </div>

          {/* My tasks */}
          <MyTasksPanel tasks={myTasks} />
        </div>
      )}

      {/* Full task list */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-900">Tasks</h2>
          <span className="text-xs text-gray-400">Up to 5 tasks</span>
        </div>
        {tasks && tasks.length > 0 ? (
          <TaskClaimer tasks={tasks as Parameters<typeof TaskClaimer>[0]['tasks']} volunteerId={volunteer.id} />
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl px-5 py-10 text-center">
            <p className="text-gray-400 text-sm">No tasks posted yet.</p>
          </div>
        )}
      </section>

      {/* Recipes */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-900">Your recipes</h2>
          <RecipeUpload volunteerId={volunteer.id} familyId={volunteer.family_id} />
        </div>

        {!myRecipes || myRecipes.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl px-5 py-8 text-center">
            <p className="text-gray-400 text-sm">Share a recipe the family can save for later.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {myRecipes.map(recipe => {
              const card = (
                <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-[#7F77DD] transition-colors">
                  {recipe.image_path ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={recipe.image_path} alt={recipe.title} className="w-full h-28 object-cover" />
                  ) : (
                    <div className="w-full h-28 bg-[#ede9ff] flex items-center justify-center">
                      <svg className="w-6 h-6 text-[#7F77DD]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                      </svg>
                    </div>
                  )}
                  <div className="p-3">
                    <p className="text-sm font-medium text-gray-900 truncate">{recipe.title}</p>
                    {recipe.saved_by_family && (
                      <span className="inline-block mt-1 text-xs text-[#1D9E75] font-medium">★ Saved by family</span>
                    )}
                  </div>
                </div>
              )
              return recipe.recipe_url ? (
                <a key={recipe.id} href={recipe.recipe_url} target="_blank" rel="noopener noreferrer">{card}</a>
              ) : (
                <div key={recipe.id}>{card}</div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
