'use client'

import { useState } from 'react'
import { setNotifyUpdates } from '@/app/actions/updateActions'

export function NotifyToggle({
  volunteerId,
  initialEnabled,
}: {
  volunteerId: string
  initialEnabled: boolean
}) {
  const [enabled, setEnabled] = useState(initialEnabled)
  const [saving, setSaving] = useState(false)

  async function toggle() {
    const next = !enabled
    setEnabled(next)
    setSaving(true)
    await setNotifyUpdates(volunteerId, next)
    setSaving(false)
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
      <div>
        <p className="text-sm font-medium text-gray-800">Notify me about new updates</p>
        <p className="text-xs text-gray-400 mt-0.5">Get a notification when the family posts here.</p>
      </div>
      <button
        onClick={toggle}
        disabled={saving}
        role="switch"
        aria-checked={enabled}
        className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${enabled ? 'bg-[#7F77DD]' : 'bg-gray-200'}`}
      >
        <span
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${enabled ? 'left-[1.375rem]' : 'left-0.5'}`}
        />
      </button>
    </div>
  )
}
