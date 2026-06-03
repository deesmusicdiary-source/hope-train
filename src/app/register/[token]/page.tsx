import { notFound } from 'next/navigation'
import { FamilySignupForm } from './FamilySignupForm'

export default async function FamilyRegisterPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  if (token !== process.env.FAMILY_REGISTRATION_TOKEN) {
    notFound()
  }

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
          <h1 className="text-2xl font-medium text-gray-900">Hope Train</h1>
          <p className="text-sm text-gray-500 mt-1">Register your family</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h2 className="text-base font-medium text-gray-800 mb-5">Create your family account</h2>
          <FamilySignupForm />
        </div>
      </div>
    </main>
  )
}
