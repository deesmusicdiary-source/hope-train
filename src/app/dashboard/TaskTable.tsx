'use client'

import { useState, useTransition, useMemo } from 'react'
import {
  createTask, updateTask, deleteTask,
  seedDefaultTasks, addCategory, designateVolunteer,
} from '@/app/actions/taskActions'
import { addSlot, removeSlot } from '@/app/actions/slotActions'

type TaskNature = 'rotation' | 'random' | 'signup' | 'as_needed' | 'scheduled'

type CoordinatorSignup = {
  volunteer_id: string
  is_designated: boolean
  volunteers: { full_name: string } | null
}

type TaskSlot = {
  id: string
  slot_date: string
  claimed_by: string | null
}

export type Task = {
  id: string
  name: string
  category: string | null
  frequency: string | null
  nature: TaskNature | null
  notification: string | null
  help_needed: boolean | null
  notes: string | null
  days: string | null
  is_coordinator_task: boolean | null
  task_signups: CoordinatorSignup[]
  task_slots: TaskSlot[]
}

type Draft = {
  name: string
  frequency: string
  nature: TaskNature | ''
  notification: string
  help_needed: boolean
  notes: string
  days: string[]
}

const FREQUENCIES = [
  { value: 'daily',          label: 'Daily' },
  { value: 'few_times_week', label: 'A few times a week' },
  { value: 'weekly',         label: 'Weekly' },
  { value: 'biweekly',       label: 'Every 2 weeks' },
  { value: 'monthly',        label: 'Monthly' },
  { value: 'as_needed',      label: 'As needed' },
]

const NATURES: { value: TaskNature; label: string; description: string; bg: string; text: string }[] = [
  { value: 'rotation',  label: 'Rotation',  description: 'Volunteers take turns in a fixed order',              bg: '#ede9ff', text: '#5c55b8' },
  { value: 'signup',    label: 'Sign-up',   description: 'Volunteers pick days that work for them',              bg: '#d1fae5', text: '#065f46' },
  { value: 'scheduled', label: 'Scheduled', description: 'You add specific dates; helpers claim individual ones', bg: '#e0f2fe', text: '#0369a1' },
  { value: 'random',    label: 'Random',    description: 'Assigned randomly from signed-up volunteers',          bg: '#fef3c7', text: '#92400e' },
  { value: 'as_needed', label: 'Callout',   description: 'Send a callout notification when help is needed',      bg: '#fee2e2', text: '#991b1b' },
]

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
  </svg>
)

function emptyDraft(): Draft {
  return { name: '', frequency: '', nature: '', notification: '', help_needed: false, notes: '', days: [] }
}

function taskToDraft(task: Task): Draft {
  return {
    name: task.name,
    frequency: task.frequency ?? '',
    nature: task.nature ?? '',
    notification: task.notification ?? '',
    help_needed: task.help_needed ?? false,
    notes: task.notes ?? '',
    days: task.days ? task.days.split(',') : [],
  }
}

function formatSlotDate(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function FreqLabel({ value }: { value: string | null }) {
  if (!value) return <span className="text-gray-300 text-xs">—</span>
  const f = FREQUENCIES.find(f => f.value === value)
  return <span className="text-xs text-gray-500">{f?.label ?? value}</span>
}

function NatureChip({ value }: { value: TaskNature | null }) {
  if (!value) return null
  const n = NATURES.find(n => n.value === value)
  if (!n) return null
  return (
    <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: n.bg, color: n.text }}>
      {n.label}
    </span>
  )
}

function NotesField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        Instructions for volunteers <span className="text-gray-400 font-normal">(optional)</span>
      </label>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="e.g. Park in the driveway, ring doorbell twice, meals go in the fridge not the freezer"
        rows={3}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7F77DD]/30 bg-white resize-none"
      />
    </div>
  )
}

function SaveCancelRow({
  onSave, onCancel, saving, disabled,
}: {
  onSave: () => void
  onCancel: () => void
  saving: boolean
  disabled?: boolean
}) {
  return (
    <div className="flex gap-2 pt-1">
      <button
        onClick={onSave}
        disabled={saving || disabled}
        className="text-xs bg-[#7F77DD] hover:bg-[#5c55b8] text-white font-medium px-4 py-1.5 rounded-lg transition-colors disabled:opacity-50"
      >
        {saving ? 'Saving…' : 'Save'}
      </button>
      <button onClick={onCancel} className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5">
        Cancel
      </button>
    </div>
  )
}

function SlotManagerSection({
  slots,
  onAddSlot,
  onRemoveSlot,
}: {
  slots: TaskSlot[]
  onAddSlot: (date: string) => void
  onRemoveSlot: (slotId: string) => void
}) {
  const [newDate, setNewDate] = useState('')
  const today = new Date().toISOString().split('T')[0]
  const sorted = [...slots].sort((a, b) => a.slot_date.localeCompare(b.slot_date))
  const claimedCount = slots.filter(s => s.claimed_by !== null).length

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-xs font-medium text-gray-600">Date slots</label>
        {slots.length > 0 && (
          <span className="text-xs text-gray-400">{claimedCount}/{slots.length} claimed</span>
        )}
      </div>
      <div className="flex gap-2 mb-3">
        <input
          type="date"
          value={newDate}
          min={today}
          onChange={e => setNewDate(e.target.value)}
          className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7F77DD]/30 bg-white"
        />
        <button
          onClick={() => { if (newDate) { onAddSlot(newDate); setNewDate('') } }}
          disabled={!newDate}
          className="text-xs bg-[#0369a1] hover:bg-[#0284c7] text-white font-medium px-3 py-2 rounded-lg disabled:opacity-50 whitespace-nowrap"
        >
          + Add date
        </button>
      </div>
      {sorted.length === 0 ? (
        <p className="text-xs text-gray-400 italic">No dates added yet.</p>
      ) : (
        <div className="space-y-1.5">
          {sorted.map(slot => (
            <div key={slot.id} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-3 py-2">
              <span className="text-xs font-medium text-gray-700">{formatSlotDate(slot.slot_date)}</span>
              {slot.claimed_by ? (
                <span className="text-xs font-medium text-[#1D9E75]">Claimed</span>
              ) : (
                <button
                  onClick={() => onRemoveSlot(slot.id)}
                  className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function RegularEditForm({
  draft, setDraft, onSave, onCancel, saving, error,
  taskId, taskSlots, onAddSlot, onRemoveSlot,
}: {
  draft: Draft
  setDraft: (d: Draft) => void
  onSave: () => void
  onCancel: () => void
  saving: boolean
  error: string
  taskId?: string
  taskSlots?: TaskSlot[]
  onAddSlot?: (date: string) => void
  onRemoveSlot?: (slotId: string) => void
}) {
  return (
    <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 space-y-4">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Task name</label>
        <input
          type="text"
          value={draft.name}
          onChange={e => setDraft({ ...draft, name: e.target.value })}
          placeholder="e.g. Meal delivery"
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7F77DD]/30 bg-white"
          autoFocus
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-2">Frequency</label>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {FREQUENCIES.map(f => (
            <label key={f.value} className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="edit-freq"
                value={f.value}
                checked={draft.frequency === f.value}
                onChange={() => setDraft({ ...draft, frequency: f.value })}
                className="accent-[#7F77DD]"
              />
              <span className="text-xs text-gray-700">{f.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-2">Task type</label>
        <div className="grid sm:grid-cols-2 gap-2">
          {NATURES.map(n => (
            <label
              key={n.value}
              className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-colors ${
                draft.nature === n.value
                  ? 'border-[#7F77DD] bg-[#ede9ff]'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="edit-nature"
                value={n.value}
                checked={draft.nature === n.value}
                onChange={() => setDraft({ ...draft, nature: n.value })}
                className="accent-[#7F77DD] mt-0.5 shrink-0"
              />
              <div>
                <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: n.bg, color: n.text }}>
                  {n.label}
                </span>
                <p className="text-xs text-gray-500 mt-1">{n.description}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Days selection — only for sign-up tasks */}
      {draft.nature === 'signup' && (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">
            Days needed <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {DAYS.map(day => {
              const checked = draft.days.includes(day)
              return (
                <label
                  key={day}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border cursor-pointer text-xs transition-colors ${
                    checked ? 'border-[#7F77DD] bg-[#ede9ff] text-[#5c55b8] font-medium' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      const updated = checked
                        ? draft.days.filter(d => d !== day)
                        : [...draft.days, day]
                      setDraft({ ...draft, days: updated })
                    }}
                    className="sr-only"
                  />
                  {day}
                </label>
              )
            })}
          </div>
        </div>
      )}

      {/* Slot manager — only for scheduled tasks when editing an existing task */}
      {draft.nature === 'scheduled' && (
        <div className="bg-[#e0f2fe]/50 border border-[#bae6fd] rounded-xl p-4">
          {taskId && taskSlots && onAddSlot && onRemoveSlot ? (
            <SlotManagerSection
              slots={taskSlots}
              onAddSlot={onAddSlot}
              onRemoveSlot={onRemoveSlot}
            />
          ) : (
            <p className="text-xs text-[#0369a1]">Save this task first to start adding specific dates.</p>
          )}
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Notification preference <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <input
          type="text"
          value={draft.notification}
          onChange={e => setDraft({ ...draft, notification: e.target.value })}
          placeholder="e.g. Text morning of, 24hr notice preferred"
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7F77DD]/30 bg-white"
        />
      </div>

      <NotesField value={draft.notes} onChange={v => setDraft({ ...draft, notes: v })} />

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={draft.help_needed}
          onChange={e => setDraft({ ...draft, help_needed: e.target.checked })}
          className="accent-[#7F77DD]"
        />
        <span className="text-xs text-gray-700">Needs consistent help</span>
      </label>

      {error && (
        <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}

      <SaveCancelRow onSave={onSave} onCancel={onCancel} saving={saving} disabled={!draft.name.trim()} />
    </div>
  )
}

function CoordinatorEditForm({
  task, draft, setDraft, onSave, onCancel, saving, error, onDesignate,
}: {
  task: Task
  draft: Draft
  setDraft: (d: Draft) => void
  onSave: () => void
  onCancel: () => void
  saving: boolean
  error: string
  onDesignate: (volunteerId: string | null) => void
}) {
  const signups = task.task_signups ?? []

  return (
    <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 space-y-4">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Task name</label>
        <input
          type="text"
          value={draft.name}
          onChange={e => setDraft({ ...draft, name: e.target.value })}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7F77DD]/30 bg-white"
          autoFocus
        />
      </div>

      <NotesField value={draft.notes} onChange={v => setDraft({ ...draft, notes: v })} />

      <div>
        <p className="text-xs font-medium text-gray-600 mb-2">Interested volunteers</p>
        {signups.length === 0 ? (
          <p className="text-xs text-gray-400 italic">No one has raised their hand yet.</p>
        ) : (
          <div className="space-y-2">
            {signups.map(signup => {
              const name = signup.volunteers?.full_name ?? 'Unknown'
              return (
                <div key={signup.volunteer_id} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-800">{name}</span>
                    {signup.is_designated && (
                      <span className="text-xs font-medium text-[#1D9E75] bg-[#d1fae5] px-2 py-0.5 rounded-full">
                        Point person
                      </span>
                    )}
                  </div>
                  {signup.is_designated ? (
                    <button
                      onClick={() => onDesignate(null)}
                      className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                    >
                      Remove
                    </button>
                  ) : (
                    <button
                      onClick={() => onDesignate(signup.volunteer_id)}
                      className="text-xs text-[#7F77DD] hover:text-[#5c55b8] font-medium transition-colors"
                    >
                      Designate
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}

      <SaveCancelRow onSave={onSave} onCancel={onCancel} saving={saving} disabled={!draft.name.trim()} />
    </div>
  )
}

export function TaskTable({ initialTasks, familyId }: { initialTasks: Task[]; familyId: string }) {
  const [tasks, setTasks] = useState(initialTasks)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [draft, setDraft] = useState<Draft>(emptyDraft())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [, startTransition] = useTransition()

  // Slot state — keyed by taskId
  const [slotsByTaskId, setSlotsByTaskId] = useState<Record<string, TaskSlot[]>>(() => {
    const m: Record<string, TaskSlot[]> = {}
    initialTasks.forEach(t => { m[t.id] = t.task_slots ?? [] })
    return m
  })

  // Per-category new task form
  const [newTaskCategory, setNewTaskCategory] = useState<string | null>(null)
  const [newTaskDraft, setNewTaskDraft] = useState<Draft>(emptyDraft())

  // Add sub-heading
  const [addingCategory, setAddingCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [categoryError, setCategoryError] = useState('')

  // Seed defaults
  const [seeding, setSeeding] = useState(false)
  const [seedError, setSeedError] = useState('')

  // Group tasks by category, preserving insertion order
  const categoryOrder = useMemo(() => {
    const seen: string[] = []
    for (const task of tasks) {
      const cat = task.category ?? 'Other'
      if (!seen.includes(cat)) seen.push(cat)
    }
    return seen
  }, [tasks])

  const tasksByCategory = useMemo(() => {
    const map = new Map<string, Task[]>()
    for (const cat of categoryOrder) map.set(cat, [])
    for (const task of tasks) {
      const cat = task.category ?? 'Other'
      map.get(cat)!.push(task)
    }
    return map
  }, [tasks, categoryOrder])

  function selectTask(id: string) {
    if (expandedId === id) {
      setExpandedId(null)
    } else {
      const task = tasks.find(t => t.id === id)!
      setDraft(taskToDraft(task))
      setExpandedId(id)
      setError('')
      setNewTaskCategory(null)
    }
  }

  function openNewTask(category: string) {
    setNewTaskDraft(emptyDraft())
    setNewTaskCategory(category)
    setExpandedId(null)
    setError('')
  }

  async function handleSave(taskId: string) {
    if (!draft.name.trim()) return
    setSaving(true)
    setError('')
    const task = tasks.find(t => t.id === taskId)!
    const isCoord = task.is_coordinator_task ?? false
    const { error: err } = await updateTask(taskId, {
      ...draft,
      days: draft.days.join(','),
      is_coordinator_task: isCoord,
    })
    if (err) { setError(err); setSaving(false); return }
    setTasks(ts => ts.map(t => t.id === taskId ? {
      ...t,
      name: draft.name,
      notes: draft.notes || null,
      ...(isCoord ? {} : {
        frequency: draft.frequency || null,
        nature: (draft.nature as TaskNature) || null,
        notification: draft.notification || null,
        help_needed: draft.help_needed,
        days: draft.days.join(',') || null,
      }),
    } : t))
    setExpandedId(null)
    setSaving(false)
  }

  async function handleNewTask(category: string) {
    if (!newTaskDraft.name.trim()) return
    setSaving(true)
    setError('')
    const { error: err } = await createTask(familyId, {
      ...newTaskDraft,
      days: newTaskDraft.days.join(','),
      category,
    })
    if (err) { setError(err); setSaving(false); return }
    startTransition(() => { window.location.reload() })
  }

  async function handleDelete(taskId: string) {
    startTransition(async () => {
      await deleteTask(taskId)
      setTasks(ts => ts.filter(t => t.id !== taskId))
      if (expandedId === taskId) setExpandedId(null)
    })
  }

  async function handleDesignate(taskId: string, volunteerId: string | null) {
    setError('')
    const { error: err } = await designateVolunteer(taskId, volunteerId)
    if (err) { setError(err); return }
    setTasks(ts => ts.map(t => {
      if (t.id !== taskId) return t
      return {
        ...t,
        task_signups: t.task_signups.map(s => ({
          ...s,
          is_designated: volunteerId !== null && s.volunteer_id === volunteerId,
        })),
      }
    }))
  }

  async function handleAddSlot(taskId: string, slotDate: string) {
    setError('')
    const { data, error: err } = await addSlot(taskId, slotDate)
    if (err) { setError(err); return }
    if (data) setSlotsByTaskId(m => ({ ...m, [taskId]: [...(m[taskId] ?? []), data] }))
  }

  async function handleRemoveSlot(taskId: string, slotId: string) {
    setError('')
    const { error: err } = await removeSlot(slotId)
    if (err) { setError(err); return }
    setSlotsByTaskId(m => ({ ...m, [taskId]: (m[taskId] ?? []).filter(s => s.id !== slotId) }))
  }

  async function handleSeed() {
    setSeeding(true)
    setSeedError('')
    const { error: err } = await seedDefaultTasks(familyId)
    if (err) { setSeedError(err); setSeeding(false); return }
    startTransition(() => { window.location.reload() })
  }

  async function handleAddCategory() {
    if (!newCategoryName.trim()) return
    setCategoryError('')
    const { error: err } = await addCategory(familyId, newCategoryName.trim())
    if (err) { setCategoryError(err); return }
    setAddingCategory(false)
    setNewCategoryName('')
    startTransition(() => { window.location.reload() })
  }

  const isEmpty = tasks.length === 0

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-gray-900">Tasks</h2>
        {!isEmpty && !addingCategory && (
          <button
            onClick={() => { setAddingCategory(true); setNewCategoryName('') }}
            className="text-xs text-[#7F77DD] hover:text-[#5c55b8] font-medium px-3 py-1.5 border border-[#7F77DD]/30 hover:border-[#7F77DD] rounded-lg transition-colors"
          >
            + Add sub-heading
          </button>
        )}
      </div>

      {isEmpty ? (
        <div className="bg-white border border-gray-200 rounded-2xl px-5 py-10 text-center">
          <p className="text-gray-500 text-sm mb-1">No tasks yet.</p>
          <p className="text-gray-400 text-xs mb-5">Start with our suggested list or build your own.</p>
          {seedError && <p className="text-xs text-red-500 mb-3">{seedError}</p>}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="text-sm bg-[#7F77DD] hover:bg-[#5c55b8] text-white font-medium px-5 py-2.5 rounded-xl transition-colors disabled:opacity-50"
            >
              {seeding ? 'Loading…' : 'Load default tasks'}
            </button>
            <button
              onClick={() => { setAddingCategory(true); setNewCategoryName('') }}
              className="text-sm text-[#7F77DD] border border-[#7F77DD]/30 hover:border-[#7F77DD] font-medium px-5 py-2.5 rounded-xl transition-colors"
            >
              Start from scratch
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {categoryOrder.map(category => {
            const catTasks = tasksByCategory.get(category) ?? []
            const coordinatorTask = catTasks.find(t => t.is_coordinator_task)
            const regularTasks = catTasks.filter(t => !t.is_coordinator_task)
            const designatedSignup = coordinatorTask?.task_signups?.find(s => s.is_designated)

            return (
              <div key={category}>
                {/* Category heading */}
                <div className="flex items-center gap-2 mb-2 px-1">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">{category}</h3>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden divide-y divide-gray-100">
                  {/* Coordinator task */}
                  {coordinatorTask && (
                    <div>
                      <div className="flex items-center gap-3 px-4 py-3">
                        <input
                          type="radio"
                          name="task-select"
                          checked={expandedId === coordinatorTask.id}
                          onClick={() => selectTask(coordinatorTask.id)}
                          onChange={() => {}}
                          className="accent-[#7F77DD] shrink-0 cursor-pointer"
                        />
                        <span className="flex-1 text-sm font-medium text-gray-900 min-w-0 truncate">
                          {coordinatorTask.name}
                        </span>
                        {designatedSignup ? (
                          <span className="text-xs font-medium text-[#1D9E75] bg-[#d1fae5] px-2 py-0.5 rounded-full shrink-0">
                            {designatedSignup.volunteers?.full_name ?? 'Designated'}
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-[#7F77DD] bg-[#ede9ff] px-2 py-0.5 rounded-full shrink-0">
                            Point person
                          </span>
                        )}
                        {coordinatorTask.task_signups && coordinatorTask.task_signups.length > 0 && !designatedSignup && (
                          <span className="hidden sm:inline text-xs text-gray-400 shrink-0">
                            {coordinatorTask.task_signups.length} interested
                          </span>
                        )}
                        <button
                          onClick={() => handleDelete(coordinatorTask.id)}
                          className="text-gray-300 hover:text-red-400 transition-colors shrink-0 p-1"
                          title="Remove task"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                      {expandedId === coordinatorTask.id && (
                        <CoordinatorEditForm
                          task={coordinatorTask}
                          draft={draft}
                          setDraft={setDraft}
                          onSave={() => handleSave(coordinatorTask.id)}
                          onCancel={() => setExpandedId(null)}
                          saving={saving}
                          error={error}
                          onDesignate={(vid) => handleDesignate(coordinatorTask.id, vid)}
                        />
                      )}
                    </div>
                  )}

                  {/* Regular tasks */}
                  {regularTasks.map(task => {
                    const slots = slotsByTaskId[task.id] ?? []
                    const claimedSlots = slots.filter(s => s.claimed_by !== null).length

                    return (
                      <div key={task.id}>
                        <div className="flex items-center gap-3 px-4 py-3">
                          <input
                            type="radio"
                            name="task-select"
                            checked={expandedId === task.id}
                            onClick={() => selectTask(task.id)}
                            onChange={() => {}}
                            className="accent-[#7F77DD] shrink-0 cursor-pointer"
                          />
                          <span className="flex-1 text-sm font-medium text-gray-900 min-w-0 truncate">{task.name}</span>
                          {task.nature === 'scheduled' ? (
                            <span className="hidden sm:inline text-xs text-gray-400 shrink-0">
                              {claimedSlots}/{slots.length} dates claimed
                            </span>
                          ) : (
                            task.task_signups && task.task_signups.length > 0 && (
                              <span className="hidden sm:inline text-xs text-gray-400 shrink-0">
                                {task.task_signups.length} signed up
                              </span>
                            )
                          )}
                          {task.nature === 'signup' && task.days && (
                            <span className="hidden sm:inline text-xs text-gray-400 shrink-0">
                              {task.days.split(',').join(', ')}
                            </span>
                          )}
                          <FreqLabel value={task.frequency} />
                          <div className="hidden sm:block">
                            <NatureChip value={task.nature} />
                          </div>
                          {task.help_needed && (
                            <span className="hidden sm:inline text-xs font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full shrink-0">
                              Consistent help
                            </span>
                          )}
                          <button
                            onClick={() => handleDelete(task.id)}
                            className="text-gray-300 hover:text-red-400 transition-colors shrink-0 p-1"
                            title="Remove task"
                          >
                            <TrashIcon />
                          </button>
                        </div>
                        {expandedId === task.id && (
                          <RegularEditForm
                            draft={draft}
                            setDraft={setDraft}
                            onSave={() => handleSave(task.id)}
                            onCancel={() => setExpandedId(null)}
                            saving={saving}
                            error={error}
                            taskId={task.id}
                            taskSlots={slots}
                            onAddSlot={(date) => handleAddSlot(task.id, date)}
                            onRemoveSlot={(slotId) => handleRemoveSlot(task.id, slotId)}
                          />
                        )}
                      </div>
                    )
                  })}

                  {/* Per-category new task form */}
                  {newTaskCategory === category ? (
                    <div>
                      <div className="px-4 py-2.5 text-xs font-medium text-[#7F77DD] bg-[#ede9ff]/40">
                        New task
                      </div>
                      <RegularEditForm
                        draft={newTaskDraft}
                        setDraft={setNewTaskDraft}
                        onSave={() => handleNewTask(category)}
                        onCancel={() => setNewTaskCategory(null)}
                        saving={saving}
                        error={error}
                      />
                    </div>
                  ) : (
                    <button
                      onClick={() => openNewTask(category)}
                      className="w-full text-left px-4 py-2.5 text-xs text-gray-400 hover:text-[#7F77DD] hover:bg-[#ede9ff]/20 transition-colors"
                    >
                      + Add task
                    </button>
                  )}
                </div>
              </div>
            )
          })}

          {/* Add sub-heading form */}
          {addingCategory && (
            <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3">
              <p className="text-sm font-medium text-gray-800">New sub-heading</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={e => setNewCategoryName(e.target.value)}
                  placeholder="e.g. ERRANDS"
                  className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7F77DD]/30"
                  autoFocus
                  onKeyDown={e => { if (e.key === 'Enter') handleAddCategory() }}
                />
                <button
                  onClick={handleAddCategory}
                  disabled={!newCategoryName.trim()}
                  className="text-sm bg-[#7F77DD] hover:bg-[#5c55b8] text-white font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  Add
                </button>
                <button
                  onClick={() => { setAddingCategory(false); setNewCategoryName('') }}
                  className="text-sm text-gray-500 hover:text-gray-700 px-3"
                >
                  Cancel
                </button>
              </div>
              {categoryError && <p className="text-xs text-red-500">{categoryError}</p>}
              <p className="text-xs text-gray-400">Creates the sub-heading and a "point person" coordinator task.</p>
            </div>
          )}

          {!addingCategory && (
            <button
              onClick={() => { setAddingCategory(true); setNewCategoryName('') }}
              className="w-full text-sm text-gray-400 hover:text-[#7F77DD] border border-dashed border-gray-200 hover:border-[#7F77DD]/40 rounded-2xl py-3 transition-colors"
            >
              + Add sub-heading
            </button>
          )}
        </div>
      )}
    </section>
  )
}
