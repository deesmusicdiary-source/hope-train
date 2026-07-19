'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { savePlan } from '@/app/actions/updateActions'
import { VISIBILITY_OPTIONS, VISIBILITY_BADGE, type Visibility } from './visibility'

export function PlanSection({
  familyId,
  plan,
  planVisibility,
  isFamily,
}: {
  familyId: string
  plan: string | null
  planVisibility: Visibility
  isFamily: boolean
}) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(plan ?? '')
  const [visibility, setVisibility] = useState<Visibility>(planVisibility)
  const [saving, setSaving] = useState(false)

  const badge = VISIBILITY_BADGE[planVisibility]

  async function submit() {
    setSaving(true)
    await savePlan(familyId, draft, visibility)
    setEditing(false)
    setSaving(false)
    router.refresh()
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-gray-900">The plan</h2>
        <div className="flex items-center gap-2">
          {isFamily && !editing && (
            <>
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap"
                style={{ backgroundColor: badge.bg, color: badge.text }}
              >
                {badge.label}
              </span>
              <button
                onClick={() => { setDraft(plan ?? ''); setVisibility(planVisibility); setEditing(true) }}
                className="text-xs text-[#7F77DD] hover:text-[#5c55b8] font-medium"
              >
                Edit
              </button>
            </>
          )}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-4">
        {editing ? (
          <div className="flex flex-col gap-3">
            <textarea
              value={draft}
              onChange={e => setDraft(e.target.value)}
              rows={5}
              placeholder="What comes next in the treatment plan…"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c4bfff] bg-white text-gray-900"
            />
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
                disabled={saving}
                className="bg-[#7F77DD] hover:bg-[#5c55b8] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save plan'}
              </button>
              <button
                onClick={() => setEditing(false)}
                className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : plan ? (
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{plan}</p>
        ) : (
          <p className="text-gray-400 text-sm text-center py-4">
            {isFamily ? 'No plan written yet — tap Edit to add what comes next.' : 'The family hasn\u2019t shared a plan yet.'}
          </p>
        )}
      </div>
    </section>
  )
}
