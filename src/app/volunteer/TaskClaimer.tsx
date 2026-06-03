'use client'

import { useState, useTransition, useMemo, useEffect, useRef } from 'react'
import { claimTask, unclaimTask, updateSelectedDays } from '@/app/actions/taskSignupActions'
import { claimSlot, unclaimSlot } from '@/app/actions/slotActions'

const MAX_CLAIMS = 5

type TaskNature = 'rotation' | 'random' | 'signup' | 'as_needed' | 'scheduled'

type Signup = {
  id: string
  volunteer_id: string
  selected_days: string | null
  queue_position: number | null
}

type TaskSlot = {
  id: string
  slot_date: string
  claimed_by: string | null
}

type Task = {
  id: string
  name: string
  category: string | null
  frequency: string | null
  nature: TaskNature | null
  help_needed: boolean | null
  is_coordinator_task: boolean | null
  notes: string | null
  days: string | null
  task_signups: Signup[]
  task_slots: TaskSlot[]
}

const NATURE_BADGE: Record<TaskNature, { label: string; bg: string; text: string }> = {
  rotation:  { label: 'Rotation',  bg: '#ede9ff', text: '#5c55b8' },
  signup:    { label: 'Sign-up',   bg: '#d1fae5', text: '#065f46' },
  as_needed: { label: 'Callout',   bg: '#fee2e2', text: '#991b1b' },
  random:    { label: 'Random',    bg: '#fef3c7', text: '#92400e' },
  scheduled: { label: 'Scheduled', bg: '#e0f2fe', text: '#0369a1' },
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

function NatureDescription({ nature, days }: { nature: TaskNature | null; days: string | null }) {
  const parsedDays = days ? days.split(',') : []
  switch (nature) {
    case 'as_needed':
      return <p className="text-xs text-gray-400 mt-0.5">You&apos;ll get a callout when help is needed. First to respond gets it.</p>
    case 'signup':
      return parsedDays.length > 0
        ? <p className="text-xs text-gray-400 mt-0.5">Needed on: <span className="font-medium text-gray-500">{parsedDays.join(', ')}</span></p>
        : <p className="text-xs text-gray-400 mt-0.5">Sign up and choose which days work for you.</p>
    case 'rotation':
      return <p className="text-xs text-gray-400 mt-0.5">Volunteers take turns — you&apos;ll be added to the rotation.</p>
    case 'random':
      return <p className="text-xs text-gray-400 mt-0.5">Assignments are made randomly from everyone signed up.</p>
    case 'scheduled':
      return <p className="text-xs text-gray-400 mt-0.5">Claim specific dates below.</p>
    default:
      return null
  }
}

function formatSlotDate(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

type Props = {
  tasks: Task[]
  volunteerId: string
}

export function TaskClaimer({ tasks, volunteerId }: Props) {
  const [pending, startTransition] = useTransition()

  // signupMap: taskId → signupId (for non-scheduled tasks)
  const [signupMap, setSignupMap] = useState<Record<string, string | null>>(() => {
    const m: Record<string, string | null> = {}
    tasks.forEach(t => {
      if (t.nature === 'scheduled') return
      const mine = t.task_signups.find(s => s.volunteer_id === volunteerId)
      m[t.id] = mine?.id ?? null
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

  const [selectedDaysMap, setSelectedDaysMap] = useState<Record<string, string[]>>(() => {
    const m: Record<string, string[]> = {}
    tasks.forEach(t => {
      const mine = t.task_signups.find(s => s.volunteer_id === volunteerId)
      m[t.id] = mine?.selected_days ? mine.selected_days.split(',') : []
    })
    return m
  })

  // slotClaimedMap: slotId → claimed_by (volunteerId or null)
  const [slotClaimedMap, setSlotClaimedMap] = useState<Record<string, string | null>>(() => {
    const m: Record<string, string | null> = {}
    tasks.forEach(t => {
      t.task_slots?.forEach(s => { m[s.id] = s.claimed_by })
    })
    return m
  })

  const [error, setError] = useState('')
  const [listExpanded, setListExpanded] = useState(true)

  const claimedCount = Object.values(signupMap).filter(Boolean).length
  const atLimit = claimedCount >= MAX_CLAIMS

  // Auto-collapse when volunteer hits the limit
  const prevAtLimitRef = useRef(atLimit)
  useEffect(() => {
    if (atLimit && !prevAtLimitRef.current) setListExpanded(false)
    prevAtLimitRef.current = atLimit
  }, [atLimit])

  // Group tasks by category, preserving order
  const categoryOrder = useMemo(() => {
    const seen: string[] = []
    for (const t of tasks) {
      const cat = t.category ?? 'Other'
      if (!seen.includes(cat)) seen.push(cat)
    }
    return seen
  }, [tasks])

  const tasksByCategory = useMemo(() => {
    const map = new Map<string, Task[]>()
    for (const cat of categoryOrder) map.set(cat, [])
    for (const t of tasks) {
      const cat = t.category ?? 'Other'
      map.get(cat)!.push(t)
    }
    return map
  }, [tasks, categoryOrder])

  async function claim(taskId: string) {
    setError('')
    startTransition(async () => {
      const { data, error: err } = await claimTask(taskId, volunteerId)
      if (err) { setError(err); return }
      if (data) {
        setSignupMap(m => ({ ...m, [taskId]: data.id }))
        setQueueMap(q => ({ ...q, [taskId]: data.queue_position }))
      }
    })
  }

  async function unclaim(taskId: string, signupId: string) {
    setError('')
    startTransition(async () => {
      const { error: err } = await unclaimTask(signupId)
      if (err) { setError(err); return }
      setSignupMap(m => ({ ...m, [taskId]: null }))
      setQueueMap(q => ({ ...q, [taskId]: null }))
      setSelectedDaysMap(m => ({ ...m, [taskId]: [] }))
    })
  }

  async function handleDayToggle(taskId: string, signupId: string, day: string) {
    const current = selectedDaysMap[taskId] ?? []
    const updated = current.includes(day) ? current.filter(d => d !== day) : [...current, day]
    setSelectedDaysMap(m => ({ ...m, [taskId]: updated }))
    await updateSelectedDays(signupId, updated.length > 0 ? updated.join(',') : null)
  }

  async function handleClaimSlot(slotId: string) {
    setError('')
    startTransition(async () => {
      const { error: err } = await claimSlot(slotId, volunteerId)
      if (err) { setError(err); return }
      setSlotClaimedMap(m => ({ ...m, [slotId]: volunteerId }))
    })
  }

  async function handleUnclaimSlot(slotId: string) {
    setError('')
    startTransition(async () => {
      const { error: err } = await unclaimSlot(slotId, volunteerId)
      if (err) { setError(err); return }
      setSlotClaimedMap(m => ({ ...m, [slotId]: null }))
    })
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Instruction / status banner */}
      {atLimit ? (
        <div className="bg-[#d1fae5] border border-[#6ee7b7] rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-[#065f46]">You&apos;re all set — {MAX_CLAIMS} tasks selected</p>
            <p className="text-xs text-[#059669] mt-0.5">Remove a task first to swap it for a different one</p>
          </div>
          <button
            onClick={() => setListExpanded(e => !e)}
            className="shrink-0 text-xs font-medium text-[#065f46] bg-white border border-[#6ee7b7] hover:bg-[#ecfdf5] px-3 py-1.5 rounded-lg transition-colors"
          >
            {listExpanded ? 'Hide tasks' : 'Modify tasks'}
          </button>
        </div>
      ) : (
        <div className="bg-[#ede9ff] rounded-2xl px-4 py-3">
          <p className="text-sm font-medium text-[#5c55b8]">
            Choose up to {MAX_CLAIMS} tasks to help with
          </p>
          <p className="text-xs text-[#7F77DD] mt-0.5">
            {claimedCount} of {MAX_CLAIMS} selected
          </p>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}

      {/* Tasks grouped by category — hidden when at limit and user collapsed */}
      {(!atLimit || listExpanded) && categoryOrder.map(category => {
        const catTasks = tasksByCategory.get(category) ?? []

        return (
          <div key={category}>
            {/* Category heading */}
            <div className="flex items-center gap-2 mb-2 px-1">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">{category}</h3>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <div className="flex flex-col gap-2">
              {catTasks.map(task => {
                const isCoord = task.is_coordinator_task ?? false
                const isScheduled = task.nature === 'scheduled'

                if (isScheduled) {
                  // Scheduled tasks: show slots inline, no sign-up button
                  const slots = (task.task_slots ?? [])
                    .slice()
                    .sort((a, b) => a.slot_date.localeCompare(b.slot_date))
                  const mySlotCount = slots.filter(s => slotClaimedMap[s.id] === volunteerId).length

                  return (
                    <div key={task.id} className={`bg-white border rounded-2xl p-4 transition-colors ${mySlotCount > 0 ? 'border-[#0369a1]' : 'border-gray-200'}`}>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium text-gray-900">{task.name}</p>
                            <NatureBadge nature={task.nature} />
                            {mySlotCount > 0 && (
                              <span className="text-xs font-medium text-[#0369a1]">{mySlotCount} claimed</span>
                            )}
                          </div>
                          <NatureDescription nature={task.nature} days={task.days} />
                        </div>
                      </div>

                      {task.notes && (
                        <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-2.5 py-1.5 leading-relaxed mb-2">
                          {task.notes}
                        </p>
                      )}

                      {slots.length === 0 ? (
                        <p className="text-xs text-gray-400 italic mt-1">No dates posted yet — check back soon.</p>
                      ) : (
                        <div className="space-y-1.5 mt-1">
                          {slots.map(slot => {
                            const mine = slotClaimedMap[slot.id] === volunteerId
                            const taken = slotClaimedMap[slot.id] !== null && !mine
                            return (
                              <div
                                key={slot.id}
                                className={`flex items-center justify-between px-3 py-2 rounded-xl ${
                                  mine ? 'bg-[#e0f2fe] border border-[#bae6fd]' : taken ? 'bg-gray-50' : 'bg-gray-50 hover:bg-[#f0f9ff]'
                                }`}
                              >
                                <span className={`text-xs font-medium ${mine ? 'text-[#0369a1]' : taken ? 'text-gray-300' : 'text-gray-700'}`}>
                                  {formatSlotDate(slot.slot_date)}
                                </span>
                                {mine ? (
                                  <button
                                    onClick={() => handleUnclaimSlot(slot.id)}
                                    disabled={pending}
                                    className="text-xs text-[#0369a1] hover:text-red-500 font-medium transition-colors disabled:opacity-40"
                                  >
                                    Release
                                  </button>
                                ) : taken ? (
                                  <span className="text-xs text-gray-300">Taken</span>
                                ) : (
                                  <button
                                    onClick={() => handleClaimSlot(slot.id)}
                                    disabled={pending}
                                    className="text-xs bg-[#0369a1] hover:bg-[#0284c7] text-white font-medium px-2.5 py-1 rounded-lg transition-colors disabled:opacity-40"
                                  >
                                    Claim
                                  </button>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                }

                // Regular / coordinator tasks
                const mySignupId = signupMap[task.id]
                const isClaimed = !!mySignupId
                const myQueue = queueMap[task.id]
                const taskDays = task.days ? task.days.split(',') : []
                const myDays = selectedDaysMap[task.id] ?? []

                return (
                  <div
                    key={task.id}
                    className={`bg-white border rounded-2xl p-4 transition-colors ${isClaimed ? 'border-[#7F77DD]' : 'border-gray-200'}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium text-gray-900">{task.name}</p>
                          {isCoord ? (
                            <span className="text-xs font-medium text-[#7F77DD] bg-[#ede9ff] px-2 py-0.5 rounded-full">
                              Point person
                            </span>
                          ) : (
                            <NatureBadge nature={task.nature} />
                          )}
                        </div>

                        {isCoord ? (
                          <p className="text-xs text-gray-400 mt-0.5">Raise your hand to be considered as point person</p>
                        ) : (
                          <NatureDescription nature={task.nature} days={task.days} />
                        )}

                        {task.notes && (
                          <p className="text-xs text-gray-500 mt-1.5 bg-gray-50 rounded-lg px-2.5 py-1.5 leading-relaxed">
                            {task.notes}
                          </p>
                        )}

                        {/* Rotation queue info */}
                        {isClaimed && task.nature === 'rotation' && myQueue != null && (
                          <p className="text-xs text-[#7F77DD] mt-1.5 font-medium">
                            #{myQueue} in rotation · {task.task_signups.length} helper{task.task_signups.length !== 1 ? 's' : ''} total
                          </p>
                        )}

                        {/* Day selection for signup tasks */}
                        {isClaimed && mySignupId && task.nature === 'signup' && taskDays.length > 0 && (
                          <div className="mt-2.5">
                            <p className="text-xs text-gray-500 font-medium mb-1.5">Which days can you help?</p>
                            <div className="flex flex-wrap gap-1.5">
                              {taskDays.map(day => {
                                const sel = myDays.includes(day)
                                return (
                                  <label
                                    key={day}
                                    className={`flex items-center px-2.5 py-1 rounded-lg border cursor-pointer text-xs transition-colors ${
                                      sel
                                        ? 'border-[#7F77DD] bg-[#ede9ff] text-[#5c55b8] font-medium'
                                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={sel}
                                      onChange={() => handleDayToggle(task.id, mySignupId, day)}
                                      className="sr-only"
                                    />
                                    {day}
                                  </label>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() =>
                          isClaimed && mySignupId
                            ? unclaim(task.id, mySignupId)
                            : claim(task.id)
                        }
                        disabled={pending || (!isClaimed && atLimit)}
                        className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40 ${
                          isClaimed
                            ? 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600'
                            : 'bg-[#7F77DD] text-white hover:bg-[#5c55b8]'
                        }`}
                      >
                        {isClaimed ? 'Remove' : isCoord ? 'Raise hand' : 'Sign up'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

