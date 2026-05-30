'use client'

import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase'

type TaskNature = 'rotation' | 'random' | 'signup' | 'as_needed'

type Signup = {
  id: string
  volunteer_id: string
  availability: string | null
  queue_position: number | null
}

type Task = {
  id: string
  name: string
  frequency: string | null
  nature: TaskNature | null
  help_needed: boolean | null
  task_signups: Signup[]
}

const NATURE_BADGE: Record<TaskNature, { label: string; bg: string; text: string }> = {
  rotation:  { label: 'Rotation',  bg: '#ede9ff', text: '#5c55b8' },
  signup:    { label: 'Sign-up',   bg: '#d1fae5', text: '#065f46' },
  as_needed: { label: 'As needed', bg: '#fee2e2', text: '#991b1b' },
  random:    { label: 'Random',    bg: '#fef3c7', text: '#92400e' },
}

function NatureBadge({ nature }: { nature: TaskNature | null }) {
  if (!nature) return null
  const b = NATURE_BADGE[nature]
  return (
    <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: b.bg, color: b.text }}>
      {b.label}
    </span>
  )
}

function formatFreq(f: string | null) {
  if (!f) return ''
  return f.charAt(0).toUpperCase() + f.slice(1).replace(/_/g, ' ')
}

type Props = {
  tasks: Task[]
  volunteerId: string
}

export function TaskClaimer({ tasks, volunteerId }: Props) {
  const supabase = createClient()
  const [pending, startTransition] = useTransition()
  // Track per-task signup id that this volunteer has
  const [signupMap, setSignupMap] = useState<Record<string, string | null>>(() => {
    const m: Record<string, string | null> = {}
    tasks.forEach(t => {
      const mine = t.task_signups.find(s => s.volunteer_id === volunteerId)
      m[t.id] = mine?.id ?? null
    })
    return m
  })
  const [availMap, setAvailMap] = useState<Record<string, string>>(() => {
    const m: Record<string, string> = {}
    tasks.forEach(t => {
      const mine = t.task_signups.find(s => s.volunteer_id === volunteerId)
      m[t.id] = mine?.availability ?? 'available'
    })
    return m
  })
  const [queueMap, setQueueMap] = useState<Record<string, number | null>>(() => {
    const m: Record<string, number | null> = {}
    tasks.forEach(t => {
      const mine = t.task_signups.find(s => s.volunteer_id === volunteerId)
      m[t.id] = mine?.queue_position ?? null
    })
    return m
  })
  const [error, setError] = useState('')

  async function claim(taskId: string) {
    setError('')
    startTransition(async () => {
      // Get max queue position
      const { data: existing } = await supabase
        .from('task_signups')
        .select('queue_position')
        .eq('task_id', taskId)
        .order('queue_position', { ascending: false })
        .limit(1)

      const nextPos = existing && existing.length > 0 && existing[0].queue_position != null
        ? existing[0].queue_position + 1
        : 1

      const { data, error: err } = await supabase
        .from('task_signups')
        .insert({
          task_id: taskId,
          volunteer_id: volunteerId,
          availability: availMap[taskId] ?? 'available',
          queue_position: nextPos,
        })
        .select('id, queue_position')
        .single()

      if (err) { setError(err.message); return }
      setSignupMap(m => ({ ...m, [taskId]: data.id }))
      setQueueMap(q => ({ ...q, [taskId]: data.queue_position }))
    })
  }

  async function unclaim(taskId: string, signupId: string) {
    setError('')
    startTransition(async () => {
      const { error: err } = await supabase
        .from('task_signups')
        .delete()
        .eq('id', signupId)
      if (err) { setError(err.message); return }
      setSignupMap(m => ({ ...m, [taskId]: null }))
      setQueueMap(q => ({ ...q, [taskId]: null }))
    })
  }

  async function updateAvailability(taskId: string, signupId: string, val: string) {
    setAvailMap(m => ({ ...m, [taskId]: val }))
    await supabase
      .from('task_signups')
      .update({ availability: val })
      .eq('id', signupId)
  }

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}
      {tasks.map(task => {
        const mySignupId = signupMap[task.id]
        const isClaimed = !!mySignupId
        const myQueue = queueMap[task.id]
        const totalSignups = task.task_signups.length

        return (
          <div
            key={task.id}
            className={`bg-white border rounded-2xl p-4 transition-colors ${isClaimed ? 'border-[#7F77DD]' : 'border-gray-200'}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-gray-900">{task.name}</p>
                  <NatureBadge nature={task.nature} />
                </div>
                {task.frequency && (
                  <p className="text-xs text-gray-400 mt-0.5">{formatFreq(task.frequency)}</p>
                )}

                {/* Queue position for rotation tasks */}
                {isClaimed && task.nature === 'rotation' && myQueue != null && (
                  <p className="text-xs text-[#7F77DD] mt-1 font-medium">
                    #{myQueue} in rotation · {totalSignups} helper{totalSignups !== 1 ? 's' : ''} total
                  </p>
                )}

                {/* Availability radio — only shown when claimed */}
                {isClaimed && mySignupId && (
                  <div className="flex gap-3 mt-2.5">
                    {['available', 'sometimes', 'unavailable'].map(opt => (
                      <label key={opt} className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name={`avail-${task.id}`}
                          value={opt}
                          checked={availMap[task.id] === opt}
                          onChange={() => updateAvailability(task.id, mySignupId, opt)}
                          className="accent-[#7F77DD]"
                        />
                        <span className="text-xs text-gray-600 capitalize">{opt}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() =>
                  isClaimed && mySignupId
                    ? unclaim(task.id, mySignupId)
                    : claim(task.id)
                }
                disabled={pending}
                className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                  isClaimed
                    ? 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600'
                    : 'bg-[#7F77DD] text-white hover:bg-[#5c55b8]'
                }`}
              >
                {isClaimed ? 'Leave' : 'Claim'}
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
