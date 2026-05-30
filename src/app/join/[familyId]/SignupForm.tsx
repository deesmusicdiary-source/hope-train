'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type Props = {
  familyId: string
  familyName: string
}

export function SignupForm({ familyId, familyName }: Props) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [confirmEmail, setConfirmEmail] = useState('')
  const supabase = createClient()
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!fullName.trim()) { setError('Please enter your name.'); return }
    setLoading(true)
    setError('')

    const { data, error: signUpError } = await supabase.auth.signUp({ email, password })
    if (signUpError) { setError(signUpError.message); setLoading(false); return }

    const userId = data.user?.id
    if (!userId) { setError('Something went wrong. Please try again.'); setLoading(false); return }

    const { error: insertError } = await supabase
      .from('volunteers')
      .insert({
        family_id: familyId,
        full_name: fullName.trim(),
        email,
        availability: 'available',
      })

    if (insertError) { setError(insertError.message); setLoading(false); return }

    if (data.session) {
      router.push('/volunteer')
    } else {
      setConfirmEmail(email)
      setLoading(false)
    }
  }

  if (confirmEmail) {
    return (
      <div className="text-center py-4">
        <div className="w-10 h-10 rounded-full bg-[#d1fae5] flex items-center justify-center mx-auto mb-3">
          <svg className="w-5 h-5 text-[#1D9E75]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-sm font-medium text-gray-900 mb-1">Check your email</p>
        <p className="text-xs text-gray-500 leading-relaxed">
          We sent a confirmation link to <strong>{confirmEmail}</strong>.
          Click it to activate your account, then{' '}
          <a href="/" className="text-[#7F77DD] hover:underline">sign in</a>.
        </p>
        <p className="text-xs text-gray-400 mt-3">
          You&apos;re joining <strong>{familyName}</strong>&apos;s village.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Your full name</label>
        <input
          type="text"
          required
          value={fullName}
          onChange={e => setFullName(e.target.value)}
          placeholder="Jane Smith"
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white text-gray-900"
        />
      </div>
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
        <label className="block text-xs font-medium text-gray-600 mb-1">Choose a password</label>
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="••••••••"
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white text-gray-900"
        />
        <p className="text-xs text-gray-400 mt-1">At least 6 characters</p>
      </div>
      {error && (
        <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium py-2 rounded-lg transition-colors disabled:opacity-50"
      >
        {loading ? 'Joining…' : 'Join the village'}
      </button>
      <p className="text-center text-xs text-gray-400">
        Already have an account?{' '}
        <a href="/" className="text-[#7F77DD] hover:underline">Sign in</a>
      </p>
    </form>
  )
}
