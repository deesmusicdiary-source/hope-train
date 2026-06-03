'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (error) { setError(error.message); setLoading(false) }
    else router.push('/dashboard')
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
          <p className="text-sm text-gray-500 mt-1">Community care coordinator</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h2 className="text-base font-medium text-gray-800 mb-5">Sign in to your account</h2>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Email address</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white text-gray-900"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white text-gray-900"
              />
            </div>
            {error && (
              <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Need access? Ask your coordinator for an invite link.
        </p>

        <div className="mt-10 border-t border-gray-200 pt-8 pb-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">What is Hope Train?</h3>
          <p className="text-sm text-gray-500 leading-relaxed mb-4">
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
