'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Plus,
  Trash2,
  Edit2,
  ChevronDown,
  ChevronRight,
  Loader2,
  Bell,
  Save,
  X,
} from 'lucide-react'
import type { Category, Task } from '@/lib/types'

const ICON_OPTIONS = [
  { value: 'folder', label: '📁' },
  { value: 'dumbbell', label: '🏋️' },
  { value: 'briefcase', label: '💼' },
  { value: 'sparkles', label: '✨' },
  { value: 'star', label: '⭐' },
  { value: 'heart', label: '❤️' },
  { value: 'book', label: '📚' },
  { value: 'code', label: '💻' },
  { value: 'coffee', label: '☕' },
  { value: 'moon', label: '🌙' },
  { value: 'sun', label: '☀️' },
  { value: 'fire', label: '🔥' },
]

const ICON_MAP: Record<string, string> = Object.fromEntries(
  ICON_OPTIONS.map((o) => [o.value, o.label])
)

const COLOR_OPTIONS = [
  '#6366f1', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444',
  '#a855f7', '#ec4899', '#14b8a6', '#f97316', '#64748b',
]

interface CategoryFormState {
  name: string
  icon: string
  color: string
}

interface TaskFormState {
  name: string
  description: string
  type: 'BINARY' | 'QUANTITATIVE'
  unit: string
  targetValue: string
  reminderTime: string
  scheduledDays: string
}

const EMPTY_TASK: TaskFormState = {
  name: '',
  description: '',
  type: 'BINARY',
  unit: '',
  targetValue: '',
  reminderTime: '',
  scheduledDays: '',
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function toggleDay(scheduledDays: string, day: number): string {
  const days = scheduledDays ? scheduledDays.split(',').map(Number) : []
  const idx = days.indexOf(day)
  if (idx >= 0) {
    days.splice(idx, 1)
  } else {
    days.push(day)
    days.sort((a, b) => a - b)
  }
  return days.join(',')
}

function formatScheduledDays(sd: string): string {
  if (!sd) return 'Every day'
  const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const nums = sd.split(',').map(Number)
  if (nums.length === 7) return 'Every day'
  if (nums.length === 5 && [1, 2, 3, 4, 5].every((d) => nums.includes(d))) return 'Weekdays'
  if (nums.length === 2 && nums.includes(0) && nums.includes(6)) return 'Weekends'
  return nums.map((n) => names[n]).join(', ')
}

function CategoryForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: CategoryFormState
  onSave: (data: CategoryFormState) => Promise<void>
  onCancel: () => void
}) {
  const [form, setForm] = useState<CategoryFormState>(
    initial ?? { name: '', icon: 'folder', color: '#6366f1' }
  )
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    try {
      await onSave(form)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-4 rounded-xl border border-indigo-500/40 bg-[#1a1a1f]">
      <div className="flex gap-2">
        <input
          autoFocus
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="Category name"
          className="flex-1 px-3 py-2 rounded-lg bg-[#0f0f11] border border-[#2e2e35] text-sm text-white placeholder-[#4e4e60] focus:outline-none focus:border-indigo-500"
        />
        <select
          value={form.icon}
          onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
          className="px-2 py-2 rounded-lg bg-[#0f0f11] border border-[#2e2e35] text-sm text-white focus:outline-none focus:border-indigo-500"
        >
          {ICON_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label} {o.value}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap gap-2">
        {COLOR_OPTIONS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setForm((f) => ({ ...f, color: c }))}
            className={`w-6 h-6 rounded-full transition-transform ${form.color === c ? 'ring-2 ring-white scale-110' : 'hover:scale-105'}`}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving || !form.name.trim()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white text-sm font-medium transition-colors"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 rounded-lg border border-[#2e2e35] text-sm text-[#8888a0] hover:text-white transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

function TaskForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: TaskFormState
  onSave: (data: TaskFormState) => Promise<void>
  onCancel: () => void
}) {
  const [form, setForm] = useState<TaskFormState>(initial ?? EMPTY_TASK)
  const [saving, setSaving] = useState(false)

  function set<K extends keyof TaskFormState>(k: K, v: TaskFormState[K]) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    try {
      await onSave(form)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-3 rounded-xl border border-[#3e3e50] bg-[#0f0f11]">
      <input
        autoFocus
        value={form.name}
        onChange={(e) => set('name', e.target.value)}
        placeholder="Task name"
        className="w-full px-3 py-2 rounded-lg bg-[#1a1a1f] border border-[#2e2e35] text-sm text-white placeholder-[#4e4e60] focus:outline-none focus:border-indigo-500"
      />
      <input
        value={form.description}
        onChange={(e) => set('description', e.target.value)}
        placeholder="Description (optional)"
        className="w-full px-3 py-2 rounded-lg bg-[#1a1a1f] border border-[#2e2e35] text-sm text-white placeholder-[#4e4e60] focus:outline-none focus:border-indigo-500"
      />

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-[#8888a0] mb-1 block">Type</label>
          <select
            value={form.type}
            onChange={(e) => set('type', e.target.value as 'BINARY' | 'QUANTITATIVE')}
            className="w-full px-2 py-1.5 rounded-lg bg-[#1a1a1f] border border-[#2e2e35] text-sm text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="BINARY">Binary (Done / Not Done)</option>
            <option value="QUANTITATIVE">Quantitative (Value)</option>
          </select>
        </div>

        <div>
          <label className="text-xs text-[#8888a0] mb-1 block">Reminder time</label>
          <input
            type="time"
            value={form.reminderTime}
            onChange={(e) => set('reminderTime', e.target.value)}
            className="w-full px-2 py-1.5 rounded-lg bg-[#1a1a1f] border border-[#2e2e35] text-sm text-white focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {form.type === 'QUANTITATIVE' && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-[#8888a0] mb-1 block">Unit</label>
            <input
              value={form.unit}
              onChange={(e) => set('unit', e.target.value)}
              placeholder="e.g. grams, steps"
              className="w-full px-2 py-1.5 rounded-lg bg-[#1a1a1f] border border-[#2e2e35] text-sm text-white placeholder-[#4e4e60] focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="text-xs text-[#8888a0] mb-1 block">Target value</label>
            <input
              type="number"
              min={0}
              value={form.targetValue}
              onChange={(e) => set('targetValue', e.target.value)}
              placeholder="0"
              className="w-full px-2 py-1.5 rounded-lg bg-[#1a1a1f] border border-[#2e2e35] text-sm text-white placeholder-[#4e4e60] focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      )}

      <div>
        <label className="text-xs text-[#8888a0] mb-1.5 block">
          Schedule <span className="text-[#4e4e60]">(none = every day)</span>
        </label>
        <div className="flex gap-1 flex-wrap">
          {DAY_LABELS.map((label, day) => {
            const active = form.scheduledDays
              ? form.scheduledDays.split(',').map(Number).includes(day)
              : false
            return (
              <button
                key={day}
                type="button"
                onClick={() => set('scheduledDays', toggleDay(form.scheduledDays, day))}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  active
                    ? 'bg-indigo-500 text-white'
                    : 'bg-[#1a1a1f] border border-[#2e2e35] text-[#8888a0] hover:text-white'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving || !form.name.trim()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white text-sm font-medium transition-colors"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 rounded-lg border border-[#2e2e35] text-sm text-[#8888a0] hover:text-white transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

export default function ManagePage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [showNewCat, setShowNewCat] = useState(false)
  const [editingCat, setEditingCat] = useState<string | null>(null)
  const [addingTaskTo, setAddingTaskTo] = useState<string | null>(null)
  const [editingTask, setEditingTask] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/categories')
      const data: Category[] = await res.json()
      setCategories(data)
      setExpanded(new Set(data.map((c) => c.id)))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  function toggleCat(id: string) {
    setExpanded((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  }

  async function createCategory(data: CategoryFormState) {
    await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    setShowNewCat(false)
    await load()
  }

  async function updateCategory(id: string, data: CategoryFormState) {
    await fetch(`/api/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    setEditingCat(null)
    await load()
  }

  async function deleteCategory(id: string) {
    if (!confirm('Delete this category and all its tasks?')) return
    await fetch(`/api/categories/${id}`, { method: 'DELETE' })
    await load()
  }

  async function createTask(categoryId: string, data: TaskFormState) {
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        categoryId,
        name: data.name,
        description: data.description,
        type: data.type,
        unit: data.unit,
        targetValue: parseFloat(data.targetValue) || 0,
        reminderTime: data.reminderTime,
        scheduledDays: data.scheduledDays,
      }),
    })
    setAddingTaskTo(null)
    await load()
  }

  async function updateTask(taskId: string, data: TaskFormState) {
    await fetch(`/api/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: data.name,
        description: data.description,
        type: data.type,
        unit: data.unit,
        targetValue: parseFloat(data.targetValue) || 0,
        reminderTime: data.reminderTime,
        scheduledDays: data.scheduledDays,
      }),
    })
    setEditingTask(null)
    await load()
  }

  async function deleteTask(id: string) {
    if (!confirm('Delete this task?')) return
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
    await load()
  }

  function taskToForm(task: Task): TaskFormState {
    return {
      name: task.name,
      description: task.description,
      type: task.type as 'BINARY' | 'QUANTITATIVE',
      unit: task.unit,
      targetValue: task.targetValue ? String(task.targetValue) : '',
      reminderTime: task.reminderTime,
      scheduledDays: task.scheduledDays ?? '',
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Manage</h1>
            <p className="text-sm text-[#8888a0] mt-0.5">Customize categories and tasks</p>
          </div>
          <button
            onClick={() => { setShowNewCat(true); setEditingCat(null) }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" /> New Category
          </button>
        </div>

        {showNewCat && (
          <CategoryForm
            onSave={createCategory}
            onCancel={() => setShowNewCat(false)}
          />
        )}

        {categories.map((cat) => {
          const tasks = cat.tasks ?? []
          const isOpen = expanded.has(cat.id)
          const isEditingThis = editingCat === cat.id

          return (
            <section
              key={cat.id}
              className="rounded-xl border border-[#2e2e35] overflow-hidden bg-[#1a1a1f]"
            >
              {isEditingThis ? (
                <div className="p-4">
                  <CategoryForm
                    initial={{ name: cat.name, icon: cat.icon, color: cat.color }}
                    onSave={(d) => updateCategory(cat.id, d)}
                    onCancel={() => setEditingCat(null)}
                  />
                </div>
              ) : (
                <div
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[#242429] select-none"
                  onClick={() => toggleCat(cat.id)}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-lg shrink-0"
                    style={{ backgroundColor: cat.color + '33' }}
                  >
                    {ICON_MAP[cat.icon] ?? '📁'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white text-sm">{cat.name}</span>
                      <span className="text-xs text-[#8888a0]">{tasks.length} tasks</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => { setEditingCat(cat.id); setShowNewCat(false) }}
                      className="p-1.5 rounded-lg hover:bg-[#2e2e35] text-[#8888a0] hover:text-white transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteCategory(cat.id)}
                      className="p-1.5 rounded-lg hover:bg-red-500/20 text-[#8888a0] hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    {isOpen ? (
                      <ChevronDown className="w-4 h-4 text-[#8888a0]" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-[#8888a0]" />
                    )}
                  </div>
                </div>
              )}

              {isOpen && !isEditingThis && (
                <div className="border-t border-[#2e2e35] divide-y divide-[#2e2e35]">
                  {tasks.map((task) => (
                    <div key={task.id}>
                      {editingTask === task.id ? (
                        <div className="p-3">
                          <TaskForm
                            initial={taskToForm(task)}
                            onSave={(d) => updateTask(task.id, d)}
                            onCancel={() => setEditingTask(null)}
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#242429] group">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm text-white font-medium">{task.name}</span>
                              <span
                                className={`text-xs px-1.5 py-0.5 rounded ${
                                  task.type === 'QUANTITATIVE'
                                    ? 'bg-indigo-500/20 text-indigo-300'
                                    : 'bg-[#2e2e35] text-[#8888a0]'
                                }`}
                              >
                                {task.type === 'QUANTITATIVE'
                                  ? `${task.unit} · target ${task.targetValue}`
                                  : 'binary'}
                              </span>
                              {task.reminderTime && (
                                <span className="text-xs text-[#8888a0] flex items-center gap-1">
                                  <Bell className="w-3 h-3" /> {task.reminderTime}
                                </span>
                              )}
                            </div>
                            {task.description && (
                              <p className="text-xs text-[#8888a0] mt-0.5">{task.description}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => { setEditingTask(task.id); setAddingTaskTo(null) }}
                              className="p-1 rounded hover:bg-[#2e2e35] text-[#8888a0] hover:text-white transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => deleteTask(task.id)}
                              className="p-1 rounded hover:bg-red-500/20 text-[#8888a0] hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {addingTaskTo === cat.id ? (
                    <div className="p-3">
                      <TaskForm
                        onSave={(d) => createTask(cat.id, d)}
                        onCancel={() => setAddingTaskTo(null)}
                      />
                    </div>
                  ) : (
                    <button
                      onClick={() => { setAddingTaskTo(cat.id); setEditingTask(null) }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-xs text-[#8888a0] hover:text-indigo-400 hover:bg-[#242429] transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add task
                    </button>
                  )}
                </div>
              )}
            </section>
          )
        })}

        {categories.length === 0 && !showNewCat && (
          <div className="text-center py-12 text-[#8888a0]">
            <p className="text-sm">No categories yet. Create one to get started.</p>
          </div>
        )}
      </div>
    </div>
  )
}
