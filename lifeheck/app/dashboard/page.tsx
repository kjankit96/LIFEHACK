'use client'

import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import type { LucideIcon } from 'lucide-react'
import {
  Dumbbell, Briefcase, Sparkles, BookOpen, ShieldAlert, Home,
  Ban, Wine, Pizza, Smartphone, Moon, Activity, Gamepad2,
  CheckCircle2, Circle, Plus, ArrowLeft, Loader2, Target,
  Wind, PenLine, Heart, Brain, Inbox, Users, Leaf, DollarSign, ChefHat, Footprints, Egg, Droplets,
} from 'lucide-react'
import type { Category, Task, DailyLog } from '@/lib/types'

const TODAY = format(new Date(), 'yyyy-MM-dd')
const DISPLAY_DATE = format(new Date(), 'EEEE, MMMM d')

const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  dumbbell: Dumbbell,
  briefcase: Briefcase,
  sparkles: Sparkles,
  book: BookOpen,
  shield: ShieldAlert,
  home: Home,
}

const TASK_ICON_MAP: Record<string, LucideIcon> = {
  gym: Dumbbell,
  walk: Footprints,
  'protein intake': Egg,
  'water intake': Droplets,
  'deep work': Brain,
  'inbox zero': Inbox,
  standup: Users,
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
  'meal prep': ChefHat,
  'financial log': DollarSign,
  'plant / pet care': Leaf,
  gaming: Gamepad2,
}

function stripEmoji(s: string): string {
  return s.replace(/^\p{Emoji}\s*/u, '').trim()
}

function getCategoryIcon(key: string): LucideIcon {
  return CATEGORY_ICON_MAP[key] ?? Target
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

// ─── Progress Ring ────────────────────────────────────────────
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

// ─── Category Card ────────────────────────────────────────────
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
  const displayName = stripEmoji(category.name)

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
      <div className="absolute inset-x-0 top-0 h-1/2 opacity-10 pointer-events-none"
        style={{ background: `linear-gradient(180deg, ${category.color} 0%, transparent 100%)` }} />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
        <ProgressRing pct={pct} color={category.color} />
      </div>
      <div className="relative z-10 w-12 h-12 rounded-xl flex items-center justify-center"
        style={{ backgroundColor: `${category.color}28` }}>
        <Icon className="w-6 h-6" style={{ color: category.color }} />
      </div>
      <div className="relative z-10 text-center px-1">
        <p className="text-xs font-semibold text-white leading-tight line-clamp-2">{displayName}</p>
        <p className="text-[10px] mt-0.5 font-medium" style={{ color: `${category.color}cc` }}>
          {done}/{tasks.length}
        </p>
      </div>
      {allDone && <CheckCircle2 className="absolute top-2 right-2 w-3.5 h-3.5 text-green-400 z-10" />}
    </button>
  )
}

// ─── Task Card ────────────────────────────────────────────────
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

  if (task.type === 'BINARY') {
    return (
      <button
        onClick={onToggle}
        disabled={saving}
        className="flex items-center gap-3 p-3 rounded-lg border transition-colors disabled:opacity-50"
        style={{
          background: done ? `${categoryColor}20` : 'rgba(255,255,255,0.05)',
          borderColor: done ? `${categoryColor}50` : 'rgba(255,255,255,0.07)',
        }}
      >
        {done ? (
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: categoryColor }} />
        ) : (
          <Circle className="w-5 h-5 flex-shrink-0 text-[#4e4e60]" />
        )}
        <span className="text-sm font-medium flex-1 text-left">{task.name}</span>
      </button>
    )
  }

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border" style={{
      background: 'rgba(255,255,255,0.05)',
      borderColor: 'rgba(255,255,255,0.07)',
    }}>
      <Icon className="w-5 h-5 flex-shrink-0" style={{ color: categoryColor }} />
      <div className="flex-1">
        <p className="text-sm font-medium">{task.name}</p>
        <div className="mt-1 h-1.5 bg-[#2e2e35] rounded-full overflow-hidden">
          <div className="h-full transition-all" style={{ width: `${pct * 100}%`, background: categoryColor }} />
        </div>
        <p className="text-xs mt-1 text-[#8888a0]">{current} / {task.targetValue} {task.unit}</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onQuantUpdate(Math.max(0, current - step), done)}
          disabled={saving}
          className="p-1.5 rounded hover:bg-[#2e2e35] disabled:opacity-50 text-[#8888a0]"
        >
          −
        </button>
        <span className="text-sm font-semibold w-6 text-center">{current > 0 ? Math.round(current * 10) / 10 : 0}</span>
        <button
          onClick={() => onQuantUpdate(current + step, true)}
          disabled={saving}
          className="p-1.5 rounded hover:bg-[#2e2e35] disabled:opacity-50 text-[#8888a0]"
        >
          +
        </button>
      </div>
    </div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────
export default function DashboardPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [logMap, setLogMap] = useState<Map<string, DailyLog>>(new Map())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<Set<string>>(new Set())
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null)
  const [seeded, setSeeded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const allTasks = categories.flatMap(c => (c.tasks ?? []).filter(t => t.isActive))

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [catRes, logRes] = await Promise.all([
        fetch('/api/categories'),
        fetch(`/api/logs?date=${TODAY}`),
      ])

      if (!catRes.ok || !logRes.ok) {
        setError('Failed to load data')
        return
      }

      const cats = await catRes.json()
      const logs = await logRes.json()
      setCategories(cats)
      const map = new Map<string, DailyLog>()
      logs.forEach((l: DailyLog) => map.set(l.taskId, l))
      setLogMap(map)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
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
            const data = await res.json()
            console.log('[seed] Success:', data)
          }
        } catch (e) {
          console.error('[seed] Error:', e)
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
      const log = await res.json()
      setLogMap(m => new Map(m).set(taskId, log))
    } catch (e) {
      console.error('Log update failed:', e)
    } finally {
      setSaving(s => {
        const n = new Set(s)
        n.delete(taskId)
        return n
      })
    }
  }

  const completedCount = Array.from(logMap.values()).filter(l => l.completed).length
  const overallPct = allTasks.length > 0 ? completedCount / allTasks.length : 0
  const selectedCat = categories.find(c => c.id === selectedCatId)
  const selectedTasks = selectedCat?.tasks?.filter(t => t.isActive) ?? []

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
        <p className="text-sm text-[#8888a0]">Loading your day…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20">
        <p className="text-sm text-red-400">{error}</p>
        <button
          onClick={() => load()}
          className="px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium"
        >
          Retry
        </button>
      </div>
    )
  }

  if (categories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <Target className="w-8 h-8 text-[#4e4e60]" />
        <p className="text-[#8888a0]">No categories yet</p>
        <button
          onClick={() => load()}
          className="px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium"
        >
          Initialize with Default Categories
        </button>
      </div>
    )
  }

  if (selectedCatId) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSelectedCatId(null)}
            className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <h1 className="text-lg font-bold text-white">{stripEmoji(selectedCat?.name ?? '')}</h1>
          <div className="w-20" />
        </div>

        <div className="space-y-2">
          {selectedTasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              log={logMap.get(task.id) ?? null}
              categoryColor={selectedCat?.color ?? '#6366f1'}
              onToggle={() => {
                const log = logMap.get(task.id)
                upsertLog(task.id, !(log?.completed ?? false), log?.value ?? 0)
              }}
              onQuantUpdate={(value, completed) => upsertLog(task.id, completed, value)}
              saving={saving.has(task.id)}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-[#8888a0]">{DISPLAY_DATE}</p>
          <h1 className="text-2xl font-bold text-white">Today</h1>
        </div>
        <div className="flex flex-col items-end">
          <p className="text-2xl font-bold text-white">{Math.round(overallPct * 100)}%</p>
          <p className="text-xs text-[#8888a0]">{completedCount} of {allTasks.length} done</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {categories.map(cat => (
          <CategoryCard
            key={cat.id}
            category={cat}
            logs={logMap}
            onClick={() => setSelectedCatId(cat.id)}
          />
        ))}
      </div>
    </div>
  )
}
