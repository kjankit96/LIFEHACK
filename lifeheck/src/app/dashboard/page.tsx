'use client'

import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import {
  CheckCircle2,
  Circle,
  ChevronRight,
  Target,
  Bell,
  BellOff,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import type { Category, Task, DailyLog } from '@/lib/types'
import NotificationManager from '@/components/NotificationManager'

const TODAY = format(new Date(), 'yyyy-MM-dd')
const DISPLAY_DATE = format(new Date(), 'EEEE, MMMM d')

const ICON_MAP: Record<string, string> = {
  dumbbell: '🏋️',
  briefcase: '💼',
  sparkles: '✨',
  folder: '📁',
  star: '⭐',
  heart: '❤️',
  book: '📚',
  code: '💻',
  coffee: '☕',
  moon: '🌙',
  sun: '☀️',
  fire: '🔥',
}

type LogMap = Map<string, DailyLog>

function QuantitativeControl({
  task,
  log,
  onUpdate,
}: {
  task: Task
  log: DailyLog | null
  onUpdate: (value: number, completed: boolean) => void
}) {
  const current = log?.value ?? 0
  const target = task.targetValue
  const pct = target > 0 ? Math.min(100, (current / target) * 100) : 0

  function handleChange(raw: string) {
    const v = Math.max(0, parseFloat(raw) || 0)
    onUpdate(v, target > 0 ? v >= target : v > 0)
  }

  return (
    <div className="flex flex-col gap-1.5 mt-2">
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={0}
          step={task.unit === 'hours' ? 0.5 : 1}
          value={current || ''}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="0"
          className="w-24 px-2 py-1 rounded-md bg-[#0f0f11] border border-[#2e2e35] text-sm text-white focus:outline-none focus:border-indigo-500"
        />
        <span className="text-xs text-[#8888a0]">
          {task.unit}{target > 0 ? ` / ${target} ${task.unit}` : ''}
        </span>
      </div>
      {target > 0 && (
        <div className="h-1.5 w-full bg-[#2e2e35] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${pct}%`,
              backgroundColor: pct >= 100 ? '#22c55e' : '#6366f1',
            }}
          />
        </div>
      )}
    </div>
  )
}

function TaskRow({
  task,
  log,
  onToggle,
  onQuantUpdate,
}: {
  task: Task
  log: DailyLog | null
  onToggle: () => void
  onQuantUpdate: (value: number, completed: boolean) => void
}) {
  const done = log?.completed ?? false

  return (
    <div
      className={`group flex flex-col gap-0.5 p-3 rounded-xl border transition-all ${
        done
          ? 'border-green-500/30 bg-green-500/5'
          : 'border-[#2e2e35] bg-[#1a1a1f] hover:border-[#3e3e45]'
      }`}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={onToggle}
          className="mt-0.5 shrink-0 transition-transform active:scale-90"
          aria-label={done ? 'Mark incomplete' : 'Mark complete'}
        >
          {done ? (
            <CheckCircle2 className="w-5 h-5 text-green-400" />
          ) : (
            <Circle className="w-5 h-5 text-[#4e4e60]" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`text-sm font-medium truncate ${done ? 'line-through text-[#8888a0]' : 'text-white'}`}
            >
              {task.name}
            </span>
            {task.type === 'QUANTITATIVE' && (
              <span className="shrink-0 text-xs px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                {task.unit}
              </span>
            )}
            {task.reminderTime && (
              <span className="shrink-0 text-xs text-[#8888a0] flex items-center gap-0.5">
                <Bell className="w-3 h-3" /> {task.reminderTime}
              </span>
            )}
          </div>
          {task.description && (
            <p className="text-xs text-[#8888a0] mt-0.5 truncate">{task.description}</p>
          )}

          {task.type === 'QUANTITATIVE' && (
            <QuantitativeControl task={task} log={log} onUpdate={onQuantUpdate} />
          )}
        </div>

        {task.type === 'BINARY' && done && (
          <Target className="w-4 h-4 text-green-400 shrink-0" />
        )}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [logMap, setLogMap] = useState<LogMap>(new Map())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<Set<string>>(new Set())
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [notifPerm, setNotifPerm] = useState<NotificationPermission | 'unsupported'>('unsupported')
  const [seeded, setSeeded] = useState(false)

  const allTasks = categories.flatMap((c) => c.tasks ?? [])

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
      setExpanded(new Set(cats.map((c) => c.id)))
      const map = new Map<string, DailyLog>()
      logs.forEach((l) => map.set(l.taskId, l))
      setLogMap(map)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    async function init() {
      if (!seeded) {
        await fetch('/api/seed', { method: 'POST' })
        setSeeded(true)
      }
      await load()
    }
    init()
  }, [load, seeded])

  useEffect(() => {
    if (typeof Notification !== 'undefined') {
      setNotifPerm(Notification.permission)
    }
  }, [])

  async function upsertLog(taskId: string, completed: boolean, value = 0) {
    setSaving((s) => new Set(s).add(taskId))
    try {
      const res = await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, date: TODAY, completed, value }),
      })
      const log: DailyLog = await res.json()
      setLogMap((m) => new Map(m).set(taskId, log))
    } finally {
      setSaving((s) => {
        const n = new Set(s)
        n.delete(taskId)
        return n
      })
    }
  }

  function toggleBinary(task: Task) {
    const log = logMap.get(task.id)
    upsertLog(task.id, !log?.completed, 0)
  }

  function handleQuantUpdate(task: Task, value: number, completed: boolean) {
    upsertLog(task.id, completed, value)
  }

  function toggleCategory(id: string) {
    setExpanded((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  }

  async function requestNotif() {
    if (typeof Notification === 'undefined') return
    const perm = await Notification.requestPermission()
    setNotifPerm(perm)
  }

  const completedToday = Array.from(logMap.values()).filter((l) => l.completed).length
  const totalActive = allTasks.length
  const overallPct = totalActive > 0 ? Math.round((completedToday / totalActive) * 100) : 0

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
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-[#8888a0] uppercase tracking-wider">{DISPLAY_DATE}</p>
            <h1 className="text-2xl font-bold text-white mt-0.5">Daily Dashboard</h1>
          </div>
          <div className="flex items-center gap-2">
            {notifPerm === 'default' && (
              <button
                onClick={requestNotif}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#2e2e35] text-xs text-[#8888a0] hover:text-white transition-colors"
              >
                <Bell className="w-3.5 h-3.5" /> Enable Reminders
              </button>
            )}
            {notifPerm === 'denied' && (
              <span className="flex items-center gap-1 text-xs text-red-400">
                <BellOff className="w-3.5 h-3.5" /> Notifications blocked
              </span>
            )}
            <button
              onClick={load}
              className="p-1.5 rounded-lg hover:bg-[#242429] text-[#8888a0] hover:text-white transition-colors"
              aria-label="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Overall progress */}
        <div className="p-4 rounded-xl border border-[#2e2e35] bg-[#1a1a1f]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[#8888a0]">
              {completedToday} of {totalActive} tasks done
            </span>
            <span className="text-sm font-semibold text-white">{overallPct}%</span>
          </div>
          <div className="h-2 w-full bg-[#2e2e35] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${overallPct}%`,
                background:
                  overallPct === 100
                    ? 'linear-gradient(90deg, #22c55e, #4ade80)'
                    : 'linear-gradient(90deg, #6366f1, #818cf8)',
              }}
            />
          </div>
          {overallPct === 100 && (
            <p className="mt-2 text-xs text-green-400 font-medium">🎉 All tasks complete!</p>
          )}
        </div>

        {/* Categories */}
        {categories.map((cat) => {
          const tasks = cat.tasks ?? []
          if (tasks.length === 0) return null
          const catDone = tasks.filter((t) => logMap.get(t.id)?.completed).length
          const isOpen = expanded.has(cat.id)

          return (
            <section key={cat.id}>
              <button
                onClick={() => toggleCategory(cat.id)}
                className="w-full flex items-center justify-between px-1 py-1.5 group"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{ICON_MAP[cat.icon] ?? '📁'}</span>
                  <span className="text-sm font-semibold text-white">{cat.name}</span>
                  <span className="text-xs text-[#8888a0]">
                    {catDone}/{tasks.length}
                  </span>
                </div>
                <ChevronRight
                  className={`w-4 h-4 text-[#8888a0] transition-transform ${isOpen ? 'rotate-90' : ''}`}
                />
              </button>

              {isOpen && (
                <div className="mt-2 space-y-2">
                  {tasks.map((task) => (
                    <div key={task.id} className="relative">
                      {saving.has(task.id) && (
                        <div className="absolute inset-0 flex items-center justify-end pr-3 z-10">
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                        </div>
                      )}
                      <TaskRow
                        task={task}
                        log={logMap.get(task.id) ?? null}
                        onToggle={() => toggleBinary(task)}
                        onQuantUpdate={(v, c) => handleQuantUpdate(task, v, c)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </section>
          )
        })}

        {categories.length === 0 && (
          <div className="text-center py-12 text-[#8888a0]">
            <p className="text-sm">No categories yet.</p>
            <a href="/manage" className="text-indigo-400 hover:underline text-sm">
              Add categories &amp; tasks →
            </a>
          </div>
        )}
      </div>

      <NotificationManager tasks={allTasks} />
    </div>
  )
}
