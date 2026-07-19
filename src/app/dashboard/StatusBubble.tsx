'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

type Family = {
  id: string
  name: string
  patient_name: string | null
  status_bubble: string | null
  status_updated_at: string | null
}

function timeAgo(isoString: string | null): string {
  if (!isoString) return 'never'
  const diff = Date.now() - new Date(isoString).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function useTimeAgo(isoString: string | null): string {
  const [label, setLabel] = useState('')
  useEffect(() => {
    setLabel(timeAgo(isoString))
  }, [isoString])
  return label
}

export function StatusBubble({ family }: { family: Family }) {
  const [status, setStatus] = useState(family.status_bubble ?? '')
  const [updatedAt, setUpdatedAt] = useState(family.status_updated_at)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(status)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()
  const timeAgoLabel = useTimeAgo(updatedAt)

  useEffect(() => {
    const channel = supabase
      .channel('family-status')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'families',
          filter: `id=eq.${family.id}`,
        },
        (payload) => {
          const updated = payload.new as Family
          setStatus(updated.status_bubble ?? '')
          setUpdatedAt(updated.status_updated_at)
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [family.id]) // eslint-disable-line react-hooks/exhaustive-deps

  function startEditing() {
    setDraft(status)
    setEditing(true)
  }

  function cancelEditing() {
    setEditing(false)
  }

  async function save() {
    setSaving(true)
    const now = new Date().toISOString()
    await supabase
      .from('families')
      .update({ status_bubble: draft, status_updated_at: now })
      .eq('id', family.id)
    setStatus(draft)
    setUpdatedAt(now)
    setEditing(false)
    setSaving(false)
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#5A50B5] shrink-0 mt-0.5" />
          <h2 className="text-sm font-medium text-gray-800">
            How is {family.patient_name ?? family.name} doing?
          </h2>
        </div>
        {!editing && (
          <button
            onClick={startEditing}
            className="text-xs text-[#5A50B5] hover:text-[#453E8C] font-medium shrink-0"
          >
            Edit
          </button>
        )}
      </div>

      <div className="mt-3 ml-4">
        {editing ? (
          <>
            <textarea
              value={draft}
              onChange={e => setDraft(e.target.value)}
              rows={3}
              placeholder="Share how things are going — volunteers will see this."
              className="w-full text-sm text-gray-700 border border-[#5A50B5] rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-[#5A50B5]/30"
              autoFocus
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={save}
                disabled={saving}
                className="text-xs bg-[#5A50B5] hover:bg-[#453E8C] text-white px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button
                onClick={cancelEditing}
                className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5"
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
            {status || (
              <span className="text-gray-400 italic">
                No update yet — tap Edit to share how things are going.
              </span>
            )}
          </p>
        )}
      </div>

      {!editing && (
        <p className="text-xs text-gray-400 mt-3 ml-4">
          {timeAgoLabel && <>Updated {timeAgoLabel}</>}
        </p>
      )}
    </div>
  )
}
