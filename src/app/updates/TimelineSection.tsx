'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { addTimelineEntry, deleteUpdate } from '@/app/actions/updateActions'
import { VISIBILITY_OPTIONS, VISIBILITY_BADGE, type Visibility } from './visibility'

export type TimelineEntry = {
  id: string
  body: string
  event_date: string | null
  image_urls: string[]
  visibility: Visibility
}

function formatDate(d: string | null) {
  if (!d) return ''
  const date = new Date(d + 'T12:00:00')
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function TimelineSection({
  entries,
  familyId,
  isFamily,
}: {
  entries: TimelineEntry[]
  familyId: string
  isFamily: boolean
}) {
  const router = useRouter()
  const [adding, setAdding] = useState(false)
  const [date, setDate] = useState('')
  const [body, setBody] = useState('')
  const [visibility, setVisibility] = useState<Visibility>('all')
  const [saving, setSaving] = useState(false)

  async function submit() {
    if (!date || !body.trim()) return
    setSaving(true)
    await addTimelineEntry(familyId, date, body, visibility)
    setDate('')
    setBody('')
    setAdding(false)
    setSaving(false)
    router.refresh()
  }

  async function remove(id: string) {
    if (!confirm('Delete this timeline entry?')) return
    await deleteUpdate(id)
    router.refresh()
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-gray-900">Timeline</h2>
        {isFamily && !adding && (
          <button
            onClick={() => setAdding(true)}
            className="text-xs text-[#7F77DD] hover:text-[#5c55b8] font-medium"
          >
            + Add entry
          </button>
        )}
      </div>

      {isFamily && adding && (
        <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-3 flex flex-col gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">When did this happen?</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c4bfff] bg-white text-gray-900"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">What happened?</label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              rows={3}
              placeholder="e.g. First day of treatment — went smoothly, spirits are high."
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c4bfff] bg-white text-gray-900"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Who can see this?</label>
            <select
              value={visibility}
              onChange={e => setVisibility(e.target.value as Visibility)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c4bfff] bg-white text-gray-900"
            >
              {VISIBILITY_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={submit}
              disabled={saving || !date || !body.trim()}
              className="bg-[#7F77DD] hover:bg-[#5c55b8] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Add to timeline'}
            </button>
            <button
              onClick={() => setAdding(false)}
              className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {entries.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl px-5 py-8 text-center">
          <p className="text-gray-400 text-sm">No timeline entries yet.</p>
        </div>
      ) : (
        <div className="relative pl-5">
          {/* the rail */}
          <div className="absolute left-1.5 top-2 bottom-2 border-l-2 border-dashed border-[#c4bfff]" />
          <div className="flex flex-col gap-3">
            {entries.map(entry => {
              const badge = VISIBILITY_BADGE[entry.visibility]
              return (
                <div key={entry.id} className="relative bg-white border border-gray-200 rounded-2xl p-4">
                  <span className="absolute -left-[1.42rem] top-5 w-3 h-3 rounded-full bg-[#7F77DD] border-2 border-white" />
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#5c55b8]">{formatDate(entry.event_date)}</p>
                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap mt-1">{entry.body}</p>
                      {entry.image_urls.length > 0 && (
                        <div className={`grid gap-2 mt-3 ${entry.image_urls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                          {entry.image_urls.map((url, i) => (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              key={i}
                              src={url}
                              alt="Update photo"
                              className="w-full rounded-xl object-cover max-h-56"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                    {isFamily && (
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span
                          className="text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap"
                          style={{ backgroundColor: badge.bg, color: badge.text }}
                        >
                          {badge.label}
                        </span>
                        <button
                          onClick={() => remove(entry.id)}
                          className="text-xs text-gray-300 hover:text-red-500 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
}
