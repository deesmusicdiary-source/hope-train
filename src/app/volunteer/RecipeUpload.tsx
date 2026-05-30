'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'

type Props = {
  volunteerId: string
  familyId: string
}

export function RecipeUpload({ volunteerId, familyId }: Props) {
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) { setError('A title is required.'); return }
    setSaving(true)
    setError('')

    let imagePath: string | null = null

    if (file) {
      const ext = file.name.split('.').pop()
      const path = `${familyId}/${Date.now()}.${ext}`
      const { error: uploadErr } = await supabase.storage
        .from('recipes')
        .upload(path, file, { upsert: false })
      if (uploadErr) { setError(uploadErr.message); setSaving(false); return }

      const { data: { publicUrl } } = supabase.storage
        .from('recipes')
        .getPublicUrl(path)
      imagePath = publicUrl
    }

    const { error: insertErr } = await supabase.from('recipes').insert({
      volunteer_id: volunteerId,
      family_id: familyId,
      title: title.trim(),
      recipe_url: url.trim() || null,
      image_path: imagePath,
      saved_by_family: false,
    })

    if (insertErr) { setError(insertErr.message); setSaving(false); return }

    setTitle('')
    setUrl('')
    setFile(null)
    setSaving(false)
    setSuccess(true)
    setTimeout(() => { setSuccess(false); setOpen(false) }, 2000)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-sm text-[#7F77DD] hover:text-[#5c55b8] font-medium border border-[#7F77DD]/30 hover:border-[#7F77DD] px-4 py-2 rounded-xl transition-colors"
      >
        <span>+</span> Add a recipe
      </button>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">Add a recipe</h3>
        <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
      </div>

      {success ? (
        <p className="text-sm text-[#1D9E75] font-medium py-4 text-center">Recipe shared! ✓</p>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Recipe name *</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Chicken soup"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7F77DD]/30"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Recipe link (optional)</label>
            <input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7F77DD]/30"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Photo (optional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={e => setFile(e.target.files?.[0] ?? null)}
              className="w-full text-xs text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-[#ede9ff] file:text-[#5c55b8] file:text-xs file:font-medium file:cursor-pointer"
            />
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="bg-[#7F77DD] hover:bg-[#5c55b8] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? 'Sharing…' : 'Share recipe'}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
