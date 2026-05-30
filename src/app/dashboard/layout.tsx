import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { SignOutButton } from './SignOutButton'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: family } = await supabase
    .from('families')
    .select('name')
    .eq('owner_id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#ede9ff] flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4 text-[#7F77DD]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
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
            {family?.name && (
              <span className="hidden sm:inline text-xs font-medium text-[#7F77DD] bg-[#ede9ff] px-2.5 py-1 rounded-full">
                {family.name}
              </span>
            )}
            <SignOutButton />
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
