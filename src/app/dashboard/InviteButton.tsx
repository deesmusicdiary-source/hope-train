'use client'

import { useState } from 'react'

export function InviteButton({ familyId }: { familyId: string }) {
  const [copied, setCopied] = useState(false)

  function getLink() {
    return `${window.location.origin}/join/${familyId}`
  }

  async function copy() {
    await navigator.clipboard.writeText(getLink())
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Invite a villager</h2>
          <p className="text-xs text-gray-500 mt-1">
            Share this private link with anyone you&apos;d like to join your support village.
          </p>
        </div>
        <button
          onClick={copy}
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
              Copy invite link
            </>
          )}
        </button>
      </div>
    </div>
  )
}
