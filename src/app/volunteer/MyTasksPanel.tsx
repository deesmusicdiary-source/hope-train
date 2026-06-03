'use client'

import { useState } from 'react'

type TaskNature = 'rotation' | 'random' | 'signup' | 'as_needed' | 'scheduled'

type MySignup = {
  id: string
  selected_days: string | null
  queue_position: number | null
}

type MySlot = {
  id: string
  slot_date: string
}

type MyTask = {
  id: string
  name: string
  nature: TaskNature | null
  is_coordinator_task: boolean | null
  signup: MySignup | null
  slots: MySlot[]
}

const NATURE_BADGE: Partial<Record<TaskNature, { label: string; bg: string; text: string }>> = {
  rotation:  { label: 'Rotation',  bg: '#ede9ff', text: '#5c55b8' },
  signup:    { label: 'Sign-up',   bg: '#d1fae5', text: '#065f46' },
  as_needed: { label: 'Callout',   bg: '#fee2e2', text: '#991b1b' },
  random:    { label: 'Random',    bg: '#fef3c7', text: '#92400e' },
  scheduled: { label: 'Scheduled', bg: '#e0f2fe', text: '#0369a1' },
}

function formatSlotDate(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export function MyTasksPanel({ tasks }: { tasks: MyTask[] }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <button
        onClick={() => setCollapsed(c => !c)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 active:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#7F77DD] shrink-0" />
          <h2 className="text-sm font-medium text-gray-800">My tasks</h2>
          {tasks.length > 0 && (
            <span className="text-xs font-medium text-[#7F77DD] bg-[#ede9ff] px-1.5 py-0.5 rounded-full">
              {tasks.length}
            </span>
          )}
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${collapsed ? '-rotate-90' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {!collapsed && (
        <div className="border-t border-gray-100 divide-y divide-gray-50">
          {tasks.length === 0 ? (
            <p className="px-5 py-4 text-xs text-gray-400 italic">
              Nothing signed up yet — pick tasks from the list below.
            </p>
          ) : (
            tasks.map(task => {
              const badge = task.nature ? NATURE_BADGE[task.nature] : null
              return (
                <div key={task.id} className="px-5 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-gray-900 leading-snug">{task.name}</p>
                    {task.is_coordinator_task ? (
                      <span className="shrink-0 text-xs font-medium text-[#7F77DD] bg-[#ede9ff] px-2 py-0.5 rounded-full">
                        Point person
                      </span>
                    ) : badge ? (
                      <span
                        className="shrink-0 text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: badge.bg, color: badge.text }}
                      >
                        {badge.label}
                      </span>
                    ) : null}
                  </div>

                  {/* Rotation queue */}
                  {task.nature === 'rotation' && task.signup?.queue_position != null && (
                    <p className="text-xs text-[#7F77DD] mt-0.5">#{task.signup.queue_position} in rotation</p>
                  )}

                  {/* Sign-up days */}
                  {task.nature === 'signup' && task.signup?.selected_days && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {task.signup.selected_days.split(',').join(', ')}
                    </p>
                  )}

                  {/* Scheduled slots */}
                  {task.nature === 'scheduled' && task.slots.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {task.slots.map(slot => (
                        <span key={slot.id} className="text-xs bg-[#e0f2fe] text-[#0369a1] px-2 py-0.5 rounded-full">
                          {formatSlotDate(slot.slot_date)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
