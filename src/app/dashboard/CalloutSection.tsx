'use client'

import { useState } from 'react'
import { sendCallout } from '@/app/actions/calloutActions'

type CalloutTask = {
  id: string
  name: string
  signupCount: number
}

export function CalloutSection({ tasks, familyId }: { tasks: CalloutTask[]; familyId: string }) {
  const [openTaskId, setOpenTaskId] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [sending, setSending] = useState(false)
  const [sentIds, setSentIds] = useState<Set<string>>(new Set())
  const [sentInfo, setSentInfo] = useState<Record<string, { text: string; ok: boolean }>>({})
  const [error, setError] = useState('')

  if (tasks.length === 0) return null

  async function handleSend(taskId: string) {
    setSending(true)
    setError('')
    const { error: err, pushSent, pushError } = await sendCallout(taskId, familyId, notes)
    if (err) { setError(err); setSending(false); return }
    setSentIds(s => new Set([...s, taskId]))
    setSentInfo(info => ({
      ...info,
      [taskId]: pushError
        ? { text: `Notifications failed: ${pushError}`, ok: false }
        : (pushSent ?? 0) > 0
          ? { text: `Notified ${pushSent} phone${pushSent !== 1 ? 's' : ''}`, ok: true }
          : { text: 'Sent, but no phones are registered for notifications yet', ok: false },
    }))
    setOpenTaskId(null)
    setNotes('')
    setSending(false)
  }

  function open(taskId: string) {
    setOpenTaskId(taskId)
    setNotes('')
    setError('')
  }

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-base font-semibold text-gray-900">Callouts</h2>
        <span className="text-xs text-gray-400">Short-notice tasks — notify signed-up helpers</span>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden divide-y divide-gray-100">
        {tasks.map(task => {
          const isOpen = openTaskId === task.id
          const sent = sentIds.has(task.id)

          return (
            <div key={task.id}>
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{task.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {task.signupCount} helper{task.signupCount !== 1 ? 's' : ''} signed up
                  </p>
                </div>
                {sent ? (
                  <div className="flex flex-col items-end gap-0.5 shrink-0">
                    <span className="text-xs font-medium text-[#1D9E75] bg-[#d1fae5] px-2.5 py-1 rounded-full">
                      Sent
                    </span>
                    {sentInfo[task.id] && (
                      <span className={`text-xs ${sentInfo[task.id].ok ? 'text-[#1D9E75]' : 'text-amber-600'}`}>
                        {sentInfo[task.id].text}
                      </span>
                    )}
                  </div>
                ) : task.signupCount === 0 ? (
                  <span className="text-xs text-gray-300 shrink-0">No helpers yet</span>
                ) : (
                  <button
                    onClick={() => isOpen ? setOpenTaskId(null) : open(task.id)}
                    className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                      isOpen
                        ? 'bg-gray-100 text-gray-600'
                        : 'bg-[#fee2e2] text-[#991b1b] hover:bg-[#fecaca]'
                    }`}
                  >
                    {isOpen ? 'Cancel' : 'Send callout'}
                  </button>
                )}
              </div>

              {isOpen && (
                <div className="px-4 py-4 bg-gray-50 border-t border-gray-100 space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Message to helpers <span className="text-gray-400 font-normal">(optional)</span>
                    </label>
                    <textarea
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      placeholder="e.g. Need pick-up by 3pm today, kids are at Lincoln Elementary"
                      rows={3}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5A50B5]/30 bg-white resize-none"
                      autoFocus
                    />
                  </div>

                  <p className="text-xs text-gray-400">
                    This will notify the {task.signupCount} helper{task.signupCount !== 1 ? 's' : ''} signed up for this task.
                  </p>

                  {error && (
                    <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSend(task.id)}
                      disabled={sending}
                      className="text-xs bg-[#5A50B5] hover:bg-[#453E8C] text-white font-medium px-4 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {sending ? 'Sending…' : 'Send callout'}
                    </button>
                    <button
                      onClick={() => setOpenTaskId(null)}
                      className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
