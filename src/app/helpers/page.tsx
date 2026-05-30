import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

type TaskNature = 'rotation' | 'random' | 'signup' | 'as_needed'

type Volunteer = {
  id: string
  full_name: string
  email: string
  phone: string | null
  availability: string | null
  task_signups: {
    availability: string | null
    queue_position: number | null
    tasks: {
      name: string
      nature: TaskNature | null
    } | null
  }[]
}

const NATURE_BADGE: Record<TaskNature, { label: string; bg: string; text: string }> = {
  rotation:  { label: 'Rotation',  bg: '#ede9ff', text: '#5c55b8' },
  signup:    { label: 'Sign-up',   bg: '#d1fae5', text: '#065f46' },
  as_needed: { label: 'As needed', bg: '#fee2e2', text: '#991b1b' },
  random:    { label: 'Random',    bg: '#fef3c7', text: '#92400e' },
}

const AVAIL_COLOR: Record<string, string> = {
  available:   'text-[#1D9E75]',
  sometimes:   'text-amber-600',
  unavailable: 'text-red-500',
}

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export default async function HelpersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  // Figure out the family this user is associated with
  const { data: volunteer } = await supabase
    .from('volunteers')
    .select('family_id')
    .eq('email', user.email!)
    .maybeSingle()

  // Family coordinators can also see this page
  const { data: family } = volunteer
    ? await supabase.from('families').select('id, name, status_bubble, status_updated_at').eq('id', volunteer.family_id).single()
    : await supabase.from('families').select('id, name, status_bubble, status_updated_at').single()

  if (!family) redirect('/')

  const { data: volunteers } = await supabase
    .from('volunteers')
    .select(`
      id, full_name, email, phone, availability,
      task_signups(
        availability,
        queue_position,
        tasks(name, nature)
      )
    `)
    .eq('family_id', family.id)
    .order('full_name') as { data: Volunteer[] | null }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#ede9ff] flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-[#7F77DD]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                <path d="M3 17l1 1h14l1 -1" /><path d="M8 17v-9h10v9" />
                <path d="M5 17v-5l3 -4" /><path d="M11 12h3" /><path d="M11 15h3" />
                <circle cx="7.5" cy="17.5" r="1.5" /><circle cx="16.5" cy="17.5" r="1.5" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-gray-900">Hope Train</span>
          </div>
          <Link href="/volunteer" className="text-xs text-[#7F77DD] hover:text-[#5c55b8] font-medium">
            ← My dashboard
          </Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-8 flex flex-col gap-8">
        {/* Family status — read-only */}
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

        {/* Helpers roster */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-900">All helpers</h2>
            <span className="text-xs text-gray-400">{volunteers?.length ?? 0} volunteer{(volunteers?.length ?? 0) !== 1 ? 's' : ''}</span>
          </div>

          {!volunteers || volunteers.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-2xl px-5 py-10 text-center">
              <p className="text-gray-400 text-sm">No volunteers yet.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {volunteers.map(vol => (
                <div key={vol.id} className="bg-white border border-gray-200 rounded-2xl p-4">
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full bg-[#ede9ff] flex items-center justify-center shrink-0">
                      <span className="text-xs font-semibold text-[#5c55b8]">{initials(vol.full_name)}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-gray-900">{vol.full_name}</p>
                        {vol.availability && (
                          <span className={`text-xs font-medium capitalize ${AVAIL_COLOR[vol.availability] ?? 'text-gray-500'}`}>
                            {vol.availability}
                          </span>
                        )}
                      </div>

                      {vol.phone && (
                        <a
                          href={`tel:${vol.phone}`}
                          className="text-xs text-gray-400 hover:text-[#7F77DD] transition-colors"
                        >
                          {vol.phone}
                        </a>
                      )}

                      {/* Tasks this volunteer has claimed */}
                      {vol.task_signups && vol.task_signups.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {vol.task_signups.map((s, i) => {
                            const nature = s.tasks?.nature
                            const badge = nature ? NATURE_BADGE[nature] : null
                            return (
                              <span
                                key={i}
                                className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border border-gray-200 text-gray-600"
                              >
                                {s.tasks?.name}
                                {badge && (
                                  <span
                                    className="inline-block text-xs font-medium px-1.5 py-px rounded-full"
                                    style={{ backgroundColor: badge.bg, color: badge.text }}
                                  >
                                    {badge.label}
                                  </span>
                                )}
                                {nature === 'rotation' && s.queue_position != null && (
                                  <span className="text-gray-400">#{s.queue_position}</span>
                                )}
                              </span>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
