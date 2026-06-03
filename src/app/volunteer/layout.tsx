import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { redirect } from 'next/navigation'
import { SignOutButton } from './SignOutButton'
import { SettingsMenu } from '@/components/SettingsMenu'

export default async function VolunteerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: volunteer } = await admin
    .from('volunteers')
    .select('id, full_name, family_id')
    .eq('email', user.email!)
    .maybeSingle()

  if (!volunteer) redirect('/dashboard')

  const { data: family } = await admin
    .from('families')
    .select('name, patient_name')
    .eq('id', volunteer.family_id)
    .single()

  const trainName = family?.patient_name ? `${family.patient_name}'s Hope Train` : 'Hope Train'

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-4 py-2.5 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-2">
          <SettingsMenu
            volunteerId={volunteer.id}
            volunteerName={volunteer.full_name}
            familyName={family?.name ?? ''}
            trainName={trainName}
          />

          <div className="flex items-center gap-2">
            <a
              href="/helpers"
              className="text-xs text-[#7F77DD] hover:text-[#5c55b8] font-medium px-3 py-2 rounded-lg border border-[#7F77DD]/30 hover:border-[#7F77DD] transition-colors whitespace-nowrap"
            >
              All helpers
            </a>
            <SignOutButton />
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}
