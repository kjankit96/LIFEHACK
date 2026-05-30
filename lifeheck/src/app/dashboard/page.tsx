'use client'

import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import type { LucideIcon } from 'lucide-react'
import {
  Dumbbell, Briefcase, Sparkles, BookOpen, ShieldAlert, Home, Star, Heart,
  Code2, Coffee, Moon, Sun, Flame, Folder, Footprints, Egg, Droplets,
  Brain, Inbox, Users, Wind, Ban, Wine, Pizza, Smartphone, Activity,
  PenLine, ChefHat, DollarSign, Leaf, Gamepad2, Paintbrush, Headphones,
  GraduationCap, Network, FileText, Timer,
  CheckCircle2, Circle, Plus, ArrowLeft, Loader2, Target, Zap,
} from 'lucide-react'
import type { Category, Task, DailyLog } from '@/lib/types'
import NotificationManager from '@/components/NotificationManager'

const TODAY = format(new Date(), 'yyyy-MM-dd')
const DISPLAY_DATE = format(new Date(), 'EEEE, MMMM d')

// ─── Icon maps ────────────────────────────────────────────────────────────────

const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  dumbbell: Dumbbell, briefcase: Briefcase, sparkles: Sparkles,
  book: BookOpen, shield: ShieldAlert, home: Home, star: Star,
  heart: Heart, code: Code2, coffee: Coffee, moon: Moon, sun: Sun,
  fire: Flame, folder: Folder,
}

const TASK_ICON_MAP: Record<string, LucideIcon> = {
  gym: Dumbbell,
  walk: Footprints,
  'protein intake': Egg,
  'calorie deficit': Flame,
  'water intake': Droplets,
  'deep work': Brain,
  'inbox zero': Inbox,
  standup: Users,
  planning: Users,
  reading: BookOpen,
  meditation: Wind,
  'cigarettes / vapes': Ban,
  alcohol: Wine,
  'junk food': Pizza,
  'social media': Smartphone,
  'no late screen': Moon,
  cardio: Activity,
  stretching: Activity,
  journaling: PenLine,
  gratitude: Heart,
  'therapy / reflection': Brain,
  'breathing exercises': Wind,
  'quick tidy': Sparkles,
  'meal prep': ChefHat,
  'financial log': DollarSign,
  'plant / pet care': Leaf,
  chores: Home,
  gaming: Gamepad2,
  'creative project': Paintbrush,
  'podcast / audiobook': Headphones,
  'skill learning': GraduationCap,
  networking: Network,
  documentation: FileText,
  'deep work session': Timer,
}

function getCategoryIcon(key: string): LucideIcon {
  return CATEGORY_ICON_MAP[key] ?? Folder
}
function getTaskIcon(name: string): LucideIcon {
  return TASK_ICON_MAP[name.toLowerCase()] ?? Target
}
function getStep(unit: string): number {
  const u = unit.toLowerCase()
  if (u === 'hours') return 0.5
  if (u === 'liters') return 0.25
  if (u === 'steps') return 500
  if (u === 'minutes') return 5
  if (u === 'grams' || u === 'kcal') return 10
  return 1
}
function stripLeadingEmoji(s: string): string {
  return s.replace(/^\p{Emoji}\s*/u, '').trim()
}

// ─── Progress Ring ────────────────────────────────────────────────────────────

function ProgressRing({ pct, color }: { pct: number; color: string }) {
  const r = 30
  const circ = 2 * Math.PI * r
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" className="-rotate-90" aria-hidden>
      <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3.5" />
      <circle
        cx="40" cy="40" r={r} fill="none"
        stroke={color} strokeWidth="3.5"
        strokeDasharray={`${pct * circ} ${circ}`}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.5s ease' }}
      />
    </svg>
  )
}

// ─── Category Card ────────────────────────────────────────────────────────────

function CategoryCard({ category, logs, onClick }: {
  category: Category
  logs: Map<string, DailyLog>
  onClick: () => void
}) {
  const tasks = (category.tasks ?? []).filter(t => t.isActive)
  const done = tasks.filter(t => logs.get(t.id)?.completed).length
  const pct = tasks.length > 0 ? done / tasks.length : 0
  const allDone = tasks.length > 0 && done === tasks.length
  const Icon = getCategoryIcon(category.icon)
  const displayName = stripLeadingEmoji(category.name)

  return (
    <button
      onClick={onClick}
      className="relative flex flex-col items-center justify-center gap-2.5 p-4 rounded-2xl border
        aspect-square transition-all duration-200 active:scale-95 overflow-hidden group"
      style={{
        background: `linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)`,
        borderColor: allDone ? `${category.color}50` : 'rgba(255,255,255,0.07)',
        boxShadow: allDone ? `0 0 28px -4px ${category.color}50` : undefined,
      }}
    >
      {/* Subtle color wash at top */}
      <div
        className="absolute inset-x-0 top-0 h-1/2 opacity-10 pointer-events-none"
        style={{ background: `linear-gradient(180deg, ${category.color} 0%, transparent 100%)` }}
      />

      {/* Progress ring background */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
        <ProgressRing pct={pct} color={category.color} />
      </div>

      {/* Icon bubble */}
      <div
        className="relative z-10 w-12 h-12 rounded-xl flex items-center justify-center"
        style={{ backgroundColor: `${category.color}28` }}
      >
        <Icon className="w-6 h-6" style={{ color: category.color }} />
      </div>

      {/* Label */}
      <div className="relative z-10 text-center px-1">
        <p className="text-xs font-semibold text-white leading-tight line-clamp-2">{displayName}</p>
        <p className="text-[10px] mt-0.5 font-medium" style={{ color: `${category.color}cc` }}>
          {done}/{tasks.length}
        </p>
      </div>

      {/* All-done badge */}
      {allDone && (
        <CheckCircle2 className="absolute top-2 right-2 w-3.5 h-3.5 text-green-400 z-10" />
      )}
    </button>
  )
}

// ─── Task Card ────────────────────────────────────────────────────────────────

function TaskCard({ task, log, categoryColor, onToggle, onQuantUpdate, saving }: {
  task: Task
  log: DailyLog | null
  categoryColor: string
  onToggle: () => void
  onQuantUpdate: (value: number, completed: boolean) => void
  saving: boolean
}) {
  const done = log?.completed ?? false
  const Icon = getTaskIcon(task.name)
  const step = getStep(task.unit)
  const current = log?.value ?? 0
  const pct = task.targetValue > 0 ? Math.min(1, current / task.targetValue) : 0

  function adjust(delta: number) {
    const next = Math.max(0, parseFloat((current + delta).toFixed(2)))
    const completed = task.targetValue > 0 ? next >= task.targetValue : next > 0
    onQuantUpdate(next, completed)
  }

  return (
    <div
      className="relative flex flex-col items-center gap-2.5 p-3.5 rounded-2xl border transition-all duration-200"
      style={{
        background: done
          ? `linear-gradient(145deg, ${categoryColor}18 0%, rgba(255,255,255,0.04) 100%)`
          : 'linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)',
        borderColor: done ? `${categoryColor}40` : 'rgba(255,255,255,0.07)',
        boxShadow: done ? `0 0 20px -4px ${categoryColor}40` : undefined,
      }}
    >
      {saving && (
        <Loader2 className="absolute top-2 right-2 w-3 h-3 animate-spin text-indigo-400" />
      )}

      {/* Icon */}
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: done ? `${categoryColor}30` : `${categoryColor}18` }}
      >
        <Icon className="w-5 h-5" style={{ color: done ? categoryColor : `${categoryColor}99` }} />
      </div>

      {/* Name */}
      <p className={`text-xs font-medium text-center leading-tight line-clamp-2 w-full px-0.5
        ${done ? 'text-white' : 'text-[#b0b0c0]'}`}
      >
        {task.name}
      </p>

      {/* Action */}
      {task.type === 'BINARY' ? (
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center py-1.5 rounded-xl transition-all active:scale-95"
          style={{ backgroundColor: done ? `${categoryColor}28` : 'rgba(255,255,255,0.05)' }}
          aria-label={done ? 'Mark incomplete' : 'Mark complete'}
        >
          {done
            ? <CheckCircle2 className="w-5 h-5 text-green-400" />
            : <Circle className="w-5 h-5 text-[#4e4e60]" />
          }
        </button>
      ) : (
        <div className="w-full space-y-1.5">
          {task.targetValue > 0 && (
            <div className="h-1 w-full rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${pct * 100}%`,
                  backgroundColor: pct >= 1 ? '#22c55e' : categoryColor,
                }}
              />
            </div>
          )}
          <div className="flex items-center justify-between gap-1">
            <button
              onClick={() => adjust(-step)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-sm transition-all active:scale-90"
              style={{ background: 'rgba(255,255,255,0.08)' }}
            >
              −
            </button>
            <span className="text-[11px] text-white font-semibold tabular-nums text-center leading-tight">
              {Number.isInteger(current) ? current : current.toFixed(1)}
              {task.unit && (
                <span className="text-[#8888a0] font-normal ml-0.5">{task.unit.slice(0, 5)}</span>
              )}
            </span>
            <button
              onClick={() => adjust(step)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-sm transition-all active:scale-90"
              style={{ background: 'rgba(255,255,255,0.08)' }}
            >
              +
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Quick-Add Modal ──────────────────────────────────────────────────────────

type AddMode = 'choose' | 'category' | 'task'

function QuickAddModal({ categories, defaultCategoryId, onClose, onAdded }: {
  categories: Category[]
  defaultCategoryId: string | null
  onClose: () => void
  onAdded: () => void
}) {
  const [mode, setMode] = useState<AddMode>('choose')
  const [catName, setCatName] = useState('')
  const [taskName, setTaskName] = useState('')
  const [taskCatId, setTaskCatId] = useState(defaultCategoryId ?? categories[0]?.id ?? '')
  const [taskType, setTaskType] = useState<'BINARY' | 'QUANTITATIVE'>('BINARY')
  const [taskUnit, setTaskUnit] = useState('')
  const [saving, setSaving] = useState(false)

  async function saveCategory() {
    if (!catName.trim()) return
    setSaving(true)
    try {
      await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: catName.trim(), icon: 'folder', color: '#6366f1' }),
      })
      onAdded(); onClose()
    } finally { setSaving(false) }
  }

  async function saveTask() {
    if (!taskName.trim() || !taskCatId) return
    setSaving(true)
    try {
      await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryId: taskCatId, name: taskName.trim(), type: taskType, unit: taskUnit }),
      })
      onAdded(); onClose()
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />
      <div
        className="relative z-10 w-full max-w-sm rounded-2xl border border-white/[0.12] bg-[#1a1a1f] p-5 space-y-4"
        onClick={e => e.stopPropagation()}
      >
        {mode === 'choose' && (
          <>
            <p className="text-base font-bold text-white text-center">Add New</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Category', icon: Folder, color: '#6366f1', next: 'category' as AddMode },
                { label: 'Task', icon: Target, color: '#22c55e', next: 'task' as AddMode },
              ].map(({ label, icon: Icon, color, next }) => (
                <button
                  key={label}
                  onClick={() => setMode(next)}
                  className="flex flex-col items-center gap-2.5 p-4 rounded-xl border border-white/[0.08] hover:bg-white/[0.06] transition-colors"
                  style={{ background: 'rgba(255,255,255,0.03)' }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}25` }}>
                    <Icon className="w-5 h-5" style={{ color }} />
                  </div>
                  <span className="text-sm text-white font-medium">{label}</span>
                </button>
              ))}
            </div>
            <button onClick={onClose} className="w-full text-sm text-[#8888a0] hover:text-white transition-colors py-1">
              Cancel
            </button>
          </>
        )}

        {mode === 'category' && (
          <>
            <div className="flex items-center gap-2">
              <button onClick={() => setMode('choose')} className="text-[#8888a0] hover:text-white transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <p className="text-base font-bold text-white">New Category</p>
            </div>
            <input
              autoFocus
              value={catName}
              onChange={e => setCatName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveCategory()}
              placeholder="e.g. Sleep & Recovery"
              className="w-full px-3 py-2.5 rounded-xl border text-sm text-white placeholder-[#4e4e60] focus:outline-none focus:border-indigo-500"
              style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.09)' }}
            />
            <button
              onClick={saveCategory}
              disabled={saving || !catName.trim()}
              className="w-full py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Create Category
            </button>
          </>
        )}

        {mode === 'task' && (
          <>
            <div className="flex items-center gap-2">
              <button onClick={() => setMode('choose')} className="text-[#8888a0] hover:text-white transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <p className="text-base font-bold text-white">New Task</p>
            </div>
            <div className="space-y-2.5">
              <input
                autoFocus
                value={taskName}
                onChange={e => setTaskName(e.target.value)}
                placeholder="Task name"
                className="w-full px-3 py-2.5 rounded-xl border text-sm text-white placeholder-[#4e4e60] focus:outline-none focus:border-indigo-500"
                style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.09)' }}
              />
              <select
                value={taskCatId}
                onChange={e => setTaskCatId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border text-sm text-white focus:outline-none focus:border-indigo-500"
                style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.09)' }}
              >
                {categories.map(c => (
                  <option key={c.id} value={c.id} style={{ background: '#1a1a1f' }}>
                    {c.name}
                  </option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={taskType}
                  onChange={e => setTaskType(e.target.value as 'BINARY' | 'QUANTITATIVE')}
                  className="px-3 py-2.5 rounded-xl border text-sm text-white focus:outline-none focus:border-indigo-500"
                  style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.09)' }}
                >
                  <option value="BINARY" style={{ background: '#1a1a1f' }}>Done / Not Done</option>
                  <option value="QUANTITATIVE" style={{ background: '#1a1a1f' }}>Track a value</option>
                </select>
                {taskType === 'QUANTITATIVE' && (
                  <input
                    value={taskUnit}
                    onChange={e => setTaskUnit(e.target.value)}
                    placeholder="Unit (grams…)"
                    className="px-3 py-2.5 rounded-xl border text-sm text-white placeholder-[#4e4e60] focus:outline-none focus:border-indigo-500"
                    style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.09)' }}
                  />
                )}
              </div>
            </div>
            <button
              onClick={saveTask}
              disabled={saving || !taskName.trim()}
              className="w-full py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Add Task
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [logMap, setLogMap] = useState<Map<string, DailyLog>>(new Map())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<Set<string>>(new Set())
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [seeded, setSeeded] = useState(false)

  const allTasks = categories.flatMap(c => (c.tasks ?? []).filter(t => t.isActive))

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [catRes, logRes] = await Promise.all([
        fetch('/api/categories'),
        fetch(`/api/logs?date=${TODAY}`),
      ])
      const cats: Category[] = await catRes.json()
      const logs: DailyLog[] = await logRes.json()
      setCategories(cats)
      const map = new Map<string, DailyLog>()
      logs.forEach(l => map.set(l.taskId, l))
      setLogMap(map)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    async function init() {
      if (!seeded) {
        try {
          const res = await fetch('/api/seed', { method: 'POST' })
          if (!res.ok) {
            const body = await res.text()
            console.error('[seed] HTTP', res.status, body)
          } else {
            const body = await res.json()
            if (body.errors?.length) console.error('[seed] partial errors:', body.errors)
          }
        } catch (e) {
          console.error('[seed] fetch failed:', e)
        }
        setSeeded(true)
      }
      await load()
    }
    init()
  }, [load, seeded])

  async function upsertLog(taskId: string, completed: boolean, value = 0) {
    setSaving(s => new Set(s).add(taskId))
    try {
      const res = await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, date: TODAY, completed, value }),
      })
      const log: DailyLog = await res.json()
      setLogMap(m => new Map(m).set(taskId, log))
    } finally {
      setSaving(s => { const n = new Set(s); n.delete(taskId); return n })
    }
  }

  function handleToggle(task: Task) {
    const log = logMap.get(task.id)
    upsertLog(task.id, !(log?.completed ?? false), log?.value ?? 0)
  }

  function handleQuantUpdate(task: Task, value: number, completed: boolean) {
    upsertLog(task.id, completed, value)
  }

  const completedCount = Array.from(logMap.values()).filter(l => l.completed).length
  const overallPct = allTasks.length > 0 ? completedCount / allTasks.length : 0
  const selectedCat = categories.find(c => c.id === selectedCatId)
  const selectedTasks = selectedCat?.tasks?.filter(t => t.isActive) ?? []

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
        <p className="text-sm text-[#8888a0]">Loading your day…</p>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      <div className="max-w-2xl mx-auto px-4 py-5 pb-24 space-y-5">

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {selectedCatId && (
              <button
                onClick={() => setSelectedCatId(null)}
                className="p-1.5 rounded-xl hover:bg-white/[0.07] text-[#8888a0] hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div>
              <p className="text-[11px] text-[#8888a0] uppercase tracking-widest font-medium">
                {DISPLAY_DATE}
              </p>
              <h1 className="text-xl font-bold text-white leading-tight">
                {selectedCat ? stripLeadingEmoji(selectedCat.name) : 'Today'}
              </h1>
            </div>
          </div>

          {/* Overall progress pill */}
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border"
            style={{
              background: 'rgba(255,255,255,0.04)',
              borderColor: 'rgba(255,255,255,0.09)',
            }}
          >
            <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${overallPct * 100}%`,
                  background: overallPct >= 1
                    ? 'linear-gradient(90deg,#22c55e,#4ade80)'
                    : 'linear-gradient(90deg,#6366f1,#818cf8)',
                }}
              />
            </div>
            <span className="text-xs font-semibold text-white">{Math.round(overallPct * 100)}%</span>
          </div>
        </div>

        {/* ── Category grid ── */}
        {!selectedCatId && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {categories.map(cat => (
              <CategoryCard
                key={cat.id}
                category={cat}
                logs={logMap}
                onClick={() => setSelectedCatId(cat.id)}
              />
            ))}
            {categories.length === 0 && (
              <div className="col-span-2 sm:col-span-3 flex flex-col items-center justify-center py-16 gap-3 text-[#8888a0]">
                <Zap className="w-10 h-10 text-indigo-400/30" />
                <p className="text-sm">No categories yet.</p>
                <button onClick={() => setShowAdd(true)} className="text-indigo-400 text-sm hover:underline">
                  Add your first category →
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Task grid (drill-down) ── */}
        {selectedCatId && selectedCat && (
          <div className="space-y-4">
            {/* Category progress bar */}
            <div
              className="flex items-center gap-3 p-3 rounded-2xl border"
              style={{
                background: `linear-gradient(135deg, ${selectedCat.color}12 0%, rgba(255,255,255,0.02) 100%)`,
                borderColor: `${selectedCat.color}30`,
              }}
            >
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${selectedCat.color}30` }}>
                {(() => { const Icon = getCategoryIcon(selectedCat.icon); return <Icon className="w-4 h-4" style={{ color: selectedCat.color }} /> })()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between mb-1.5">
                  <span className="text-xs text-[#8888a0]">
                    {selectedTasks.filter(t => logMap.get(t.id)?.completed).length} of {selectedTasks.length} done
                  </span>
                  <span className="text-xs font-semibold text-white">
                    {selectedTasks.length > 0
                      ? Math.round((selectedTasks.filter(t => logMap.get(t.id)?.completed).length / selectedTasks.length) * 100)
                      : 0}%
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${selectedTasks.length > 0
                        ? (selectedTasks.filter(t => logMap.get(t.id)?.completed).length / selectedTasks.length) * 100
                        : 0}%`,
                      backgroundColor: selectedCat.color,
                    }}
                  />
                </div>
              </div>
            </div>

            {selectedTasks.length === 0 ? (
              <div className="text-center py-10 text-[#8888a0] text-sm">
                No tasks yet.{' '}
                <button onClick={() => setShowAdd(true)} className="text-indigo-400 hover:underline">
                  Add one →
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {selectedTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    log={logMap.get(task.id) ?? null}
                    categoryColor={selectedCat.color}
                    onToggle={() => handleToggle(task)}
                    onQuantUpdate={(v, c) => handleQuantUpdate(task, v, c)}
                    saving={saving.has(task.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Floating Action Button ── */}
      <button
        onClick={() => setShowAdd(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center
          transition-all active:scale-90 z-40 shadow-xl"
        style={{
          background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
          boxShadow: '0 8px 32px -4px rgba(99,102,241,0.5)',
        }}
        aria-label="Add category or task"
      >
        <Plus className="w-6 h-6 text-white" />
      </button>

      {/* ── Quick-Add Modal ── */}
      {showAdd && (
        <QuickAddModal
          categories={categories}
          defaultCategoryId={selectedCatId}
          onClose={() => setShowAdd(false)}
          onAdded={load}
        />
      )}

      <NotificationManager tasks={allTasks} />
    </div>
  )
}
