'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { createFamily } from '@/app/actions/createFamily'

export function FamilySignupForm() {
  const [coordinatorName, setCoordinatorName] = useState('')
  const [patientName, setPatientName] = useState('')
  const [familyName, setFamilyName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [confirmEmail, setConfirmEmail] = useState('')
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!coordinatorName.trim()) { setError('Please enter your name.'); return }
    if (!patientName.trim()) { setError('Please enter the name of the person being cared for.'); return }
    if (!familyName.trim()) { setError('Please enter a family name.'); return }
    setLoading(true)
    setError('')

    const { data, error: signUpError } = await supabase.auth.signUp({ email: email.trim(), password })
    if (signUpError) { setError(signUpError.message); setLoading(false); return }

    const userId = data.user?.id
    if (!userId) { setError('Something went wrong. Please try again.'); setLoading(false); return }

    const { error: familyError } = await createFamily(familyName.trim(), userId, coordinatorName.trim(), patientName.trim())
    if (familyError) { setError(familyError); setLoading(false); return }

    if (data.session) {
      window.location.href = '/dashboard'
    } else {
      setConfirmEmail(email.trim())
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
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Your name</label>
        <input type="text" required value={coordinatorName} onChange={e => setCoordinatorName(e.target.value)} placeholder="e.g. Sarah Johnson" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white text-gray-900" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Who are you caring for?</label>
        <input type="text" required value={patientName} onChange={e => setPatientName(e.target.value)} placeholder="e.g. Robert Johnson" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white text-gray-900" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Family name</label>
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
      <p className="text-center text-xs text-gray-400">
        Already have an account?{' '}
        <a href="/" className="text-[#7F77DD] hover:underline">Sign in</a>
      </p>
    </form>
  )
}
