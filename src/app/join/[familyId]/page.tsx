import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { SignupForm } from './SignupForm'

export type JoinMode =
  | { type: 'signup' }
  | { type: 'already_member' }
  | { type: 'family_account' }
  | { type: 'add_to_village'; email: string }

export default async function JoinPage({
  params,
}: {
  params: Promise<{ familyId: string }>
}) {
  const { familyId } = await params
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: family } = await admin
    .from('families')
    .select('id, name, patient_name')
    .eq('id', familyId)
    .maybeSingle()

  if (!family) notFound()

  const { data: { user } } = await supabase.auth.getUser()

  let mode: JoinMode = { type: 'signup' }

  if (user) {
    // Check if they're a family owner
    const { data: owned } = await admin
      .from('families')
      .select('id')
      .eq('owner_id', user.id)
      .maybeSingle()

    let isFamilyAccount = !!owned
    if (!isFamilyAccount) {
      const { data: mgr } = await admin
        .from('family_managers')
        .select('id')
        .eq('email', user.email!)
        .maybeSingle()
      isFamilyAccount = !!mgr
    }

    if (isFamilyAccount) {
      mode = { type: 'family_account' }
    } else {
      // Check if already a volunteer for this family
      const { data: existing } = await admin
        .from('volunteers')
        .select('id')
        .eq('family_id', familyId)
        .eq('email', user.email!)
        .maybeSingle()

      mode = existing
        ? { type: 'already_member' }
        : { type: 'add_to_village', email: user.email! }
    }
  }

  // Static states — no form needed
  const trainName = family.patient_name ? `${family.patient_name}'s Hope Train` : 'Hope Train'

  if (mode.type === 'already_member') {
    return (
      <JoinShell familyName={family.name} trainName={trainName}>
        <div className="text-center py-4">
          <div className="w-10 h-10 rounded-full bg-[#d1fae5] flex items-center justify-center mx-auto mb-3">
            <svg className="w-5 h-5 text-[#1D9E75]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-900 mb-1">You&apos;re already in this village</p>
          <p className="text-xs text-gray-500 mb-4">You&apos;re already signed up as a volunteer for {family.name}.</p>
          <a href="/volunteer" className="text-sm text-[#7F77DD] hover:underline font-medium">Go to your dashboard →</a>
        </div>
      </JoinShell>
    )
  }

  if (mode.type === 'family_account') {
    return (
      <JoinShell familyName={family.name} trainName={trainName}>
        <div className="text-center py-4">
          <p className="text-sm font-medium text-gray-900 mb-2">You&apos;re signed in as a family account</p>
          <p className="text-xs text-gray-500 mb-4">
            This link is for volunteers. Sign out first if you&apos;d like to join as a volunteer with a different account.
          </p>
          <a href="/dashboard" className="text-sm text-[#7F77DD] hover:underline font-medium">Back to your dashboard →</a>
        </div>
      </JoinShell>
    )
  }

  return (
    <JoinShell familyName={family.name} trainName={trainName}>
      <h2 className="text-base font-medium text-gray-800 mb-5">
        {mode.type === 'add_to_village' ? 'Join the village' : 'Create your account'}
      </h2>
      <SignupForm familyId={family.id} familyName={family.name} mode={mode} />
    </JoinShell>
  )
}

function JoinShell({ familyName, trainName, children }: { familyName: string; trainName: string; children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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
          <h1 className="text-2xl font-medium text-gray-900">{trainName}</h1>
          <p className="text-sm text-[#7F77DD] font-medium mt-1">
            You&apos;re joining {familyName}&apos;s village
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          {children}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          You&apos;ll be able to see tasks and updates from {familyName}.
        </p>

        <div className="mt-8 border-t border-gray-200 pt-6 pb-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">What is Hope Train?</h3>
          <p className="text-sm text-gray-500 leading-relaxed mb-3">
            When someone you love is navigating a health crisis, community support pours in — but coordinating it is its own full-time job. Hope Train helps families clearly delegate specific tasks to the people around them, so nothing falls through the cracks and no single person is overwhelmed.
          </p>
          <p className="text-sm text-gray-500 leading-relaxed">
            Instead of vague offers, volunteers browse the family&apos;s actual needs and choose exactly how they can contribute — turning{' '}
            <span className="italic">&ldquo;Let me know what I can do to help&rdquo;</span> into{' '}
            <span className="italic text-[#7F77DD]">&ldquo;Here&apos;s how I&apos;m capable of helping.&rdquo;</span>
          </p>
        </div>
      </div>
    </main>
  )
}
