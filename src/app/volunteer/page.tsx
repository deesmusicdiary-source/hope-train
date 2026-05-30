import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { TaskClaimer } from './TaskClaimer'
import { RecipeUpload } from './RecipeUpload'

type TaskNature = 'rotation' | 'random' | 'signup' | 'as_needed'

type TaskSignup = {
  id: string
  volunteer_id: string
  availability: string | null
  queue_position: number | null
}

type Task = {
  id: string
  name: string
  frequency: string | null
  nature: TaskNature | null
  help_needed: boolean | null
  task_signups: TaskSignup[]
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
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: volunteer } = await supabase
    .from('volunteers')
    .select('id, full_name, family_id, availability')
    .eq('email', user.email!)
    .maybeSingle()

  if (!volunteer) redirect('/dashboard')

  const { data: family } = await supabase
    .from('families')
    .select('id, name, status_bubble, status_updated_at')
    .eq('id', volunteer.family_id)
    .single()

  const { data: tasks } = await supabase
    .from('tasks')
    .select(`
      id, name, frequency, nature, help_needed,
      task_signups(id, volunteer_id, availability, queue_position)
    `)
    .eq('family_id', volunteer.family_id)
    .eq('is_deleted', false)
    .order('created_at') as { data: Task[] | null }

  const { data: myRecipes } = await supabase
    .from('recipes')
    .select('id, title, recipe_url, image_path, saved_by_family')
    .eq('volunteer_id', volunteer.id)
    .order('created_at', { ascending: false }) as { data: Recipe[] | null }

  return (
    <div className="flex flex-col gap-8">
      {/* Family status — read-only */}
      {family && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-[#7F77DD]" />
            <h2 className="text-sm font-medium text-gray-800">
              How {family.name} is doing
            </h2>
          </div>
          <p className="ml-4 text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
            {family.status_bubble || (
              <span className="text-gray-400 italic">No update from the family yet.</span>
            )}
          </p>
        </div>
      )}

      {/* Tasks */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-900">Tasks</h2>
          <span className="text-xs text-gray-400">Claim what you can help with</span>
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
