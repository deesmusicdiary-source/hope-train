import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { SignupForm } from './SignupForm'

export default async function JoinPage({
  params,
}: {
  params: Promise<{ familyId: string }>
}) {
  const { familyId } = await params
  const supabase = await createClient()

  const { data: family } = await supabase
    .from('families')
    .select('id, name')
    .eq('id', familyId)
    .maybeSingle()

  if (!family) notFound()

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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
          <h1 className="text-2xl font-medium text-gray-900">Hope Train</h1>
          <p className="text-sm text-[#7F77DD] font-medium mt-1">
            You&apos;re joining {family.name}&apos;s village
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h2 className="text-base font-medium text-gray-800 mb-5">Create your account</h2>
          <SignupForm familyId={family.id} familyName={family.name} />
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          You&apos;ll be able to see tasks and updates from {family.name}.
        </p>
      </div>
    </main>
  )
}
