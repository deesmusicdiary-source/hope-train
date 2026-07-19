import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
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

  const admin = createAdminClient()
  let familyName: string | null = null
  let patientName: string | null = null

  const { data: owned } = await admin
    .from('families').select('name, patient_name').eq('owner_id', user.id).maybeSingle()
  if (owned) {
    familyName = owned.name
    patientName = owned.patient_name ?? null
  } else {
    const { data: mgr } = await admin
      .from('family_managers').select('family_id').eq('email', user.email!).maybeSingle()
    if (mgr) {
      const { data: f } = await admin
        .from('families').select('name, patient_name').eq('id', mgr.family_id).single()
      familyName = f?.name ?? null
      patientName = f?.patient_name ?? null
    }
  }

  const family = familyName ? { name: familyName } : null
  const trainName = patientName ? `${patientName}'s Hope Train` : 'Hope Train'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="bg-[#453E8C] border-b border-[#38326e] px-4 py-3 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4 text-[#453E8C]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
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
            <span className="text-sm font-semibold text-white truncate max-w-[160px] sm:max-w-none">{trainName}</span>
          </div>

          <div className="flex items-center gap-3">
            {family?.name && (
              <span className="hidden sm:inline text-xs font-medium text-white bg-white/15 px-2.5 py-1 rounded-full">
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
