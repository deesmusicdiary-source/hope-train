'use client'

import { useState } from 'react'
import { setCloseFriend } from '@/app/actions/updateActions'

export function CloseFriendToggle({
  volunteerId,
  initialIsClose,
}: {
  volunteerId: string
  initialIsClose: boolean
}) {
  const [isClose, setIsClose] = useState(initialIsClose)
  const [saving, setSaving] = useState(false)

  async function toggle() {
    const next = !isClose
    setIsClose(next)
    setSaving(true)
    await setCloseFriend(volunteerId, next)
    setSaving(false)
  }

  return (
    <label className="flex items-center gap-1.5 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={isClose}
        onChange={toggle}
        disabled={saving}
        className="w-3.5 h-3.5 rounded border-gray-300 accent-[#7F77DD] cursor-pointer"
      />
      <span className="text-xs text-gray-500">Close family/friend</span>
    </label>
  )
}
