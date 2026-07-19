'use client'

import { useState } from 'react'
import { removeCoManager } from '@/app/actions/coManagerActions'

type Manager = {
  id: string
  full_name: string | null
  email: string
}

function initials(name: string | null, email: string) {
  if (!name) return email[0].toUpperCase()
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export function CoManagerSection({
  familyId,
  initialManagers,
}: {
  familyId: string
  initialManagers: Manager[]
}) {
  const [managers, setManagers] = useState(initialManagers)
  const [copied, setCopied] = useState(false)

  function getLink() {
    return `${window.location.origin}/manage/${familyId}`
  }

  async function copyLink() {
    await navigator.clipboard.writeText(getLink())
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  async function handleRemove(managerId: string) {
    await removeCoManager(managerId)
    setManagers(ms => ms.filter(m => m.id !== managerId))
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Co-managers</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Others who can manage tasks and this account.
          </p>
        </div>
        <button
          onClick={copyLink}
          className={`shrink-0 flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
            copied
              ? 'bg-[#d1fae5] text-[#065f46] border-[#d1fae5]'
              : 'bg-[#dcd6f7] text-[#453E8C] border-[#dcd6f7] hover:border-[#5A50B5]'
          }`}
        >
          {copied ? (
            <>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Invite co-manager
            </>
          )}
        </button>
      </div>

      {managers.length === 0 ? (
        <p className="text-xs text-gray-400 italic">No co-managers yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {managers.map(m => (
            <div key={m.id} className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-[#dcd6f7] flex items-center justify-center shrink-0">
                <span className="text-xs font-semibold text-[#453E8C]">{initials(m.full_name, m.email)}</span>
              </div>
              <div className="flex-1 min-w-0">
                {m.full_name && <p className="text-xs font-medium text-gray-900">{m.full_name}</p>}
                <p className="text-xs text-gray-400 truncate">{m.email}</p>
              </div>
              <button
                onClick={() => handleRemove(m.id)}
                className="text-gray-300 hover:text-red-400 transition-colors p-1 shrink-0"
                title="Remove co-manager"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
