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
    <main className="min-h-screen lg:grid lg:grid-cols-2">

      {/* Brand panel — lavender, matches the app icon */}
      <section className="bg-[#ede9ff] flex flex-col justify-center px-6 py-10 lg:px-16 lg:py-0">
        <div className="max-w-md mx-auto lg:mx-0 w-full">
          <div className="flex items-center gap-3 lg:flex-col lg:items-start lg:gap-4">
            <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-2xl bg-white flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 lg:w-8 lg:h-8 text-[#7F77DD]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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
            <div>
              <h1 className="text-2xl lg:text-4xl font-semibold text-gray-900 tracking-tight">Hope Train</h1>
              <p className="text-sm lg:text-base text-[#5c55b8] mt-0.5 lg:mt-1">Community care coordinator</p>
            </div>
          </div>

          {/* rail divider */}
          <div className="hidden lg:block border-t-2 border-dashed border-[#c4bfff] my-8" />

          <div className="hidden lg:block">
            <h2 className="text-sm font-semibold text-gray-700 mb-2">What is Hope Train?</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Hope Train helps a family coordinate practical support during a health
              crisis. The family lists what&apos;s needed — meals, rides, errands — and
              volunteers sign up for specific tasks. Everyone can see what&apos;s covered,
              so nothing is missed and no one is overloaded.
            </p>
          </div>
        </div>
      </section>

      {/* Sign-in panel */}
      <section className="bg-[#f9fafb] flex flex-col justify-center px-4 py-10 lg:px-16 lg:py-0">
        <div className="w-full max-w-sm mx-auto lg:mx-0">
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
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c4bfff] bg-white text-gray-900"
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
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c4bfff] bg-white text-gray-900"
                />
              </div>
              {error && (
                <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#7F77DD] hover:bg-[#5c55b8] text-white text-sm font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
          </div>

          <p className="text-center lg:text-left text-xs text-gray-400 mt-5">
            Need access? Ask your coordinator for an invite link.
          </p>

          {/* Mobile-only explainer, below the card */}
          <div className="lg:hidden mt-10 border-t border-gray-200 pt-7">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">What is Hope Train?</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Hope Train helps a family coordinate practical support during a health
              crisis. The family lists what&apos;s needed — meals, rides, errands — and
              volunteers sign up for specific tasks. Everyone can see what&apos;s covered,
              so nothing is missed and no one is overloaded.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
