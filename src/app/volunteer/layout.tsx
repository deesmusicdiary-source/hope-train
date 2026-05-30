import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { SignOutButton } from './SignOutButton'

export default async function VolunteerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: volunteer } = await supabase
    .from('volunteers')
    .select('full_name, family_id')
    .eq('email', user.email!)
    .maybeSingle()

  if (!volunteer) redirect('/dashboard')

  const { data: family } = await supabase
    .from('families')
    .select('name')
    .eq('id', volunteer.family_id)
    .single()

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#ede9ff] flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-[#7F77DD]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                <path d="M3 17l1 1h14l1 -1" />
                <path d="M8 17v-9h10v9" />
                <path d="M5 17v-5l3 -4" />
                <path d="M11 12h3" />
                <path d="M11 15h3" />
                <circle cx="7.5" cy="17.5" r="1.5" />
                <circle cx="16.5" cy="17.5" r="1.5" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-gray-900">Hope Train</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-medium text-gray-900">{volunteer.full_name}</p>
              {family?.name && (
                <p className="text-xs text-gray-400">helping {family.name}</p>
              )}
            </div>
            <a
              href="/helpers"
              className="text-xs text-[#7F77DD] hover:text-[#5c55b8] font-medium px-3 py-1.5 rounded-lg border border-[#7F77DD]/30 hover:border-[#7F77DD] transition-colors"
            >
              All helpers
            </a>
            <SignOutButton />
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
