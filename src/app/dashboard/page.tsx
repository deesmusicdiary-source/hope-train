import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { StatusBubble } from './StatusBubble'
import { InviteButton } from './InviteButton'

type TaskNature = 'rotation' | 'random' | 'signup' | 'as_needed'

type TaskSignup = {
  queue_position: number | null
  volunteers: { full_name: string } | null
}

type Task = {
  id: string
  name: string
  frequency: string | null
  nature: TaskNature | null
  notification: string | null
  help_needed: boolean | null
  task_signups: TaskSignup[]
}

type Recipe = {
  id: string
  title: string
  recipe_url: string | null
  image_path: string | null
  saved_by_family: boolean | null
  created_at: string
  volunteers: { full_name: string } | null
}

const NATURE_BADGE: Record<
  TaskNature,
  { label: string; bg: string; text: string }
> = {
  rotation: { label: 'Rotation', bg: '#ede9ff', text: '#5c55b8' },
  signup:   { label: 'Sign-up',  bg: '#d1fae5', text: '#065f46' },
  as_needed:{ label: 'As needed',bg: '#fee2e2', text: '#991b1b' },
  random:   { label: 'Random',   bg: '#fef3c7', text: '#92400e' },
}

function NatureBadge({ nature }: { nature: TaskNature | null }) {
  if (!nature) return null
  const badge = NATURE_BADGE[nature]
  return (
    <span
      className="inline-block text-xs font-medium px-2 py-0.5 rounded-full"
      style={{ backgroundColor: badge.bg, color: badge.text }}
    >
      {badge.label}
    </span>
  )
}

function formatFrequency(freq: string | null): string {
  if (!freq) return '—'
  return freq.charAt(0).toUpperCase() + freq.slice(1).replace(/_/g, ' ')
}

function volunteerNames(signups: TaskSignup[], nature: TaskNature | null): string {
  if (!signups || signups.length === 0) return '—'
  const sorted =
    nature === 'rotation'
      ? [...signups].sort((a, b) => (a.queue_position ?? 99) - (b.queue_position ?? 99))
      : signups
  return sorted
    .map(s => s.volunteers?.full_name)
    .filter(Boolean)
    .slice(0, 3)
    .join(', ') || '—'
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  // If this user is a volunteer, send them to their dashboard
  const { data: volunteerMatch } = await supabase
    .from('volunteers')
    .select('id')
    .eq('email', user.email!)
    .maybeSingle()

  if (volunteerMatch) redirect('/volunteer')

  const { data: family } = await supabase
    .from('families')
    .select('id, name, status_bubble, status_updated_at')
    .eq('owner_id', user.id)
    .single()

  const { data: tasks } = await supabase
    .from('tasks')
    .select(`
      id, name, frequency, nature, notification, help_needed,
      task_signups(
        queue_position,
        volunteers(full_name)
      )
    `)
    .eq('family_id', family?.id ?? '')
    .eq('is_deleted', false)
    .order('created_at') as { data: Task[] | null }

  const { data: recipes } = await supabase
    .from('recipes')
    .select(`
      id, title, recipe_url, image_path, saved_by_family, created_at,
      volunteers(full_name)
    `)
    .eq('family_id', family?.id ?? '')
    .order('created_at', { ascending: false })
    .limit(12) as { data: Recipe[] | null }

  if (!family) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-gray-500 text-sm">No family found for your account.</p>
        <p className="text-gray-400 text-xs mt-1">Ask your coordinator to set up your family.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Invite */}
      <InviteButton familyId={family.id} />

      {/* Status bubble */}
      <StatusBubble family={family} />

      {/* Tasks */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-900">Tasks</h2>
          <span className="text-xs text-gray-400">{tasks?.length ?? 0} task{tasks?.length !== 1 ? 's' : ''}</span>
        </div>

        {!tasks || tasks.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl px-5 py-10 text-center">
            <p className="text-gray-400 text-sm">No tasks yet.</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3 w-1/3">Task</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3 hidden sm:table-cell">Frequency</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Nature</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3 hidden md:table-cell">Volunteer(s)</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3 hidden lg:table-cell">Notification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {tasks.map(task => (
                  <tr key={task.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{task.name}</td>
                    <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">
                      {formatFrequency(task.frequency)}
                    </td>
                    <td className="px-4 py-3">
                      <NatureBadge nature={task.nature} />
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                      {volunteerNames(task.task_signups, task.nature)}
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">
                      {task.notification ? (
                        <span className="text-[#1D9E75]">✓ {task.notification}</span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

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
            {recipes.map(recipe => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function RecipeCard({ recipe }: { recipe: Recipe }) {
  const inner = (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-[#7F77DD] transition-colors group">
      {recipe.image_path ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={recipe.image_path}
          alt={recipe.title}
          className="w-full h-28 object-cover"
        />
      ) : (
        <div className="w-full h-28 bg-[#ede9ff] flex items-center justify-center">
          <svg
            className="w-6 h-6 text-[#7F77DD]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
          </svg>
        </div>
      )}
      <div className="p-3">
        <p className="text-sm font-medium text-gray-900 truncate">{recipe.title}</p>
        <p className="text-xs text-gray-400 mt-0.5">
          by {recipe.volunteers?.full_name ?? 'volunteer'}
        </p>
        {recipe.saved_by_family && (
          <span className="inline-block mt-1.5 text-xs text-[#1D9E75] font-medium">★ Saved</span>
        )}
      </div>
    </div>
  )

  if (recipe.recipe_url) {
    return (
      <a href={recipe.recipe_url} target="_blank" rel="noopener noreferrer">
        {inner}
      </a>
    )
  }
  return inner
}
