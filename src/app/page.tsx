'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

function TrainIcon() {
  return (
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
  )
}

export default function LoginPage() {
  const [mode, setMode] = useState<'signin' | 'register'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [familyName, setFamilyName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [confirmEmail, setConfirmEmail] = useState('')
  const router = useRouter()
  const supabase = createClient()

  function switchMode(m: 'signin' | 'register') {
    setMode(m)
    setError('')
    setConfirmEmail('')
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false) }
    else router.push('/dashboard')
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (!familyName.trim()) { setError('Please enter your family name.'); return }
    setLoading(true)
    setError('')

    const { data, error: signUpError } = await supabase.auth.signUp({ email, password })
    if (signUpError) { setError(signUpError.message); setLoading(false); return }

    const userId = data.user?.id
    if (!userId) { setError('Something went wrong. Please try again.'); setLoading(false); return }

    const { error: insertError } = await supabase
      .from('families')
      .insert({ name: familyName.trim(), owner_id: userId })

    if (insertError) { setError(insertError.message); setLoading(false); return }

    // If Supabase returned a session, email confirmation is disabled — go straight in
    if (data.session) {
      router.push('/dashboard')
    } else {
      setConfirmEmail(email)
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center mb-3">
            <TrainIcon />
          </div>
          <h1 className="text-2xl font-medium text-gray-900">Hope Train</h1>
          <p className="text-sm text-gray-500 mt-1">Community care coordinator</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6">

          {confirmEmail ? (
            <div className="text-center py-4">
              <div className="w-10 h-10 rounded-full bg-[#d1fae5] flex items-center justify-center mx-auto mb-3">
                <svg className="w-5 h-5 text-[#1D9E75]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-900 mb-1">Check your email</p>
              <p className="text-xs text-gray-500 leading-relaxed">
                We sent a confirmation link to <strong>{confirmEmail}</strong>.
                Click it to activate your account, then sign in.
              </p>
              <button
                onClick={() => switchMode('signin')}
                className="mt-4 text-xs text-[#7F77DD] hover:text-[#5c55b8] font-medium"
              >
                Back to sign in
              </button>
            </div>
          ) : (
            <>
              <div className="flex rounded-xl bg-gray-100 p-1 mb-5">
                <button
                  onClick={() => switchMode('signin')}
                  className={`flex-1 text-xs font-medium py-1.5 rounded-lg transition-colors ${mode === 'signin' ? 'bg-white text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Sign in
                </button>
                <button
                  onClick={() => switchMode('register')}
                  className={`flex-1 text-xs font-medium py-1.5 rounded-lg transition-colors ${mode === 'register' ? 'bg-white text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Register your family
                </button>
              </div>

              {mode === 'signin' ? (
                <form onSubmit={handleSignIn} className="flex flex-col gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Email address</label>
                    <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Password</label>
                    <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white text-gray-900" />
                  </div>
                  {error && <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
                  <button type="submit" disabled={loading} className="w-full bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium py-2 rounded-lg transition-colors disabled:opacity-50">
                    {loading ? 'Signing in…' : 'Sign in'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleRegister} className="flex flex-col gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Your family name</label>
                    <input type="text" required value={familyName} onChange={e => setFamilyName(e.target.value)} placeholder="e.g. The Johnson Family" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Email address</label>
                    <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Choose a password</label>
                    <input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white text-gray-900" />
                    <p className="text-xs text-gray-400 mt-1">At least 6 characters</p>
                  </div>
                  {error && <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
                  <button type="submit" disabled={loading} className="w-full bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium py-2 rounded-lg transition-colors disabled:opacity-50">
                    {loading ? 'Creating your account…' : 'Create family account'}
                  </button>
                </form>
              )}
            </>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          {mode === 'signin'
            ? 'A villager? Use the invite link your family shared with you.'
            : 'Villagers join via an invite link from their family.'}
        </p>
      </div>
    </main>
  )
}
