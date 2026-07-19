'use client'

import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export function SignOutButton() {
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <button
      onClick={handleSignOut}
      className="text-xs text-white/80 hover:text-white px-3 py-1.5 rounded-lg border border-white/25 hover:border-white/60 transition-colors"
    >
      Sign out
    </button>
  )
}
