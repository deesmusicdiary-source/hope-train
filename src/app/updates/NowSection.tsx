'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { addNowPost, deleteUpdate } from '@/app/actions/updateActions'
import { VISIBILITY_OPTIONS, VISIBILITY_BADGE, type Visibility } from './visibility'

export type NowPost = {
  id: string
  body: string
  image_urls: string[]
  visibility: Visibility
  created_at: string
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return mins <= 1 ? 'just now' : `${mins} min ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function NowSection({
  posts,
  familyId,
  isFamily,
}: {
  posts: NowPost[]
  familyId: string
  isFamily: boolean
}) {
  const router = useRouter()
  const [composing, setComposing] = useState(false)
  const [body, setBody] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [visibility, setVisibility] = useState<Visibility>('all')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function submit() {
    if (!body.trim() && files.length === 0) return
    setSaving(true)
    setError('')
    try {
      const supabase = createClient()
      const urls: string[] = []
      for (const file of files) {
        const ext = file.name.split('.').pop() || 'jpg'
        const path = `${familyId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
        const { error: upErr } = await supabase.storage.from('update-photos').upload(path, file)
        if (upErr) throw new Error(`Photo upload failed: ${upErr.message}`)
        const { data } = supabase.storage.from('update-photos').getPublicUrl(path)
        urls.push(data.publicUrl)
      }
      const { error: postErr } = await addNowPost(familyId, body, urls, visibility)
      if (postErr) throw new Error(postErr)
      setBody('')
      setFiles([])
      setComposing(false)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    }
    setSaving(false)
  }

  async function remove(id: string) {
    if (!confirm('Delete this post?')) return
    await deleteUpdate(id)
    router.refresh()
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-gray-900">Where we&apos;re at now</h2>
        {isFamily && !composing && (
          <button
            onClick={() => setComposing(true)}
            className="text-xs text-[#7F77DD] hover:text-[#5c55b8] font-medium"
          >
            + New post
          </button>
        )}
      </div>

      {isFamily && composing && (
        <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-3 flex flex-col gap-3">
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            rows={4}
            placeholder="Share how things are going right now…"
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c4bfff] bg-white text-gray-900"
          />
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Photos (optional)</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={e => setFiles(Array.from(e.target.files ?? []))}
              className="text-xs text-gray-600 file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-[#ede9ff] file:text-[#5c55b8] file:text-xs file:font-medium hover:file:bg-[#ddd9ff] file:cursor-pointer"
            />
            {files.length > 0 && (
              <p className="text-xs text-gray-400 mt-1">{files.length} photo{files.length !== 1 ? 's' : ''} selected</p>
            )}
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
          {error && (
            <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}
          <div className="flex gap-2">
            <button
              onClick={submit}
              disabled={saving || (!body.trim() && files.length === 0)}
              className="bg-[#7F77DD] hover:bg-[#5c55b8] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? 'Posting…' : 'Post update'}
            </button>
            <button
              onClick={() => setComposing(false)}
              className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {posts.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl px-5 py-8 text-center">
          <p className="text-gray-400 text-sm">No posts yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {posts.map(post => {
            const badge = VISIBILITY_BADGE[post.visibility]
            return (
              <div key={post.id} className="bg-white border border-gray-200 rounded-2xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-xs text-gray-400">{timeAgo(post.created_at)}</p>
                  {isFamily && (
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap"
                        style={{ backgroundColor: badge.bg, color: badge.text }}
                      >
                        {badge.label}
                      </span>
                      <button
                        onClick={() => remove(post.id)}
                        className="text-xs text-gray-300 hover:text-red-500 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
                {post.body && (
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap mt-2">{post.body}</p>
                )}
                {post.image_urls.length > 0 && (
                  <div className={`grid gap-2 mt-3 ${post.image_urls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                    {post.image_urls.map((url, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={i}
                        src={url}
                        alt="Family update photo"
                        className="w-full rounded-xl object-cover max-h-72"
                      />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
