'use client'

import { useState } from 'react'
import { updateFamily } from '@/app/actions/updateFamily'

type Family = {
  id: string
  name: string
  coordinator_name: string | null
  patient_name: string | null
}

export function FamilyProfile({ family }: { family: Family }) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(family.name)
  const [coordinatorName, setCoordinatorName] = useState(family.coordinator_name ?? '')
  const [patientName, setPatientName] = useState(family.patient_name ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function save() {
    if (!name.trim()) return
    setSaving(true)
    const { error: err } = await updateFamily(family.id, {
      name: name.trim(),
      coordinator_name: coordinatorName.trim(),
      patient_name: patientName.trim(),
    })
    if (err) { setError(err); setSaving(false); return }
    setEditing(false)
    setSaving(false)
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5">
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-sm font-semibold text-gray-900">Family profile</h2>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="text-xs text-[#5A50B5] hover:text-[#453E8C] font-medium shrink-0"
          >
            Edit
          </button>
        )}
      </div>

      {editing ? (
        <div className="mt-3 flex flex-col gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Family name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5A50B5]/30"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Your name (account holder)</label>
            <input
              type="text"
              value={coordinatorName}
              onChange={e => setCoordinatorName(e.target.value)}
              placeholder="e.g. Sarah Johnson"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5A50B5]/30"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Who is being cared for?</label>
            <input
              type="text"
              value={patientName}
              onChange={e => setPatientName(e.target.value)}
              placeholder="e.g. Robert Johnson"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5A50B5]/30"
            />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={save}
              disabled={saving || !name.trim()}
              className="text-xs bg-[#5A50B5] hover:bg-[#453E8C] text-white font-medium px-4 py-1.5 rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button onClick={() => setEditing(false)} className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-3 grid sm:grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-gray-400">Family name</p>
            <p className="text-sm font-medium text-gray-900 mt-0.5">{name || <span className="text-gray-300 italic">Not set</span>}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Account holder</p>
            <p className="text-sm font-medium text-gray-900 mt-0.5">{coordinatorName || <span className="text-gray-300 italic">Not set</span>}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Being cared for</p>
            <p className="text-sm font-medium text-gray-900 mt-0.5">{patientName || <span className="text-gray-300 italic">Not set</span>}</p>
          </div>
        </div>
      )}
    </div>
  )
}
