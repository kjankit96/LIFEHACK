'use client'

import { useState, useEffect, useCallback } from 'react'
import { format, subDays, eachDayOfInterval, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Flame, TrendingUp, Calendar, ChevronDown, Loader2 } from 'lucide-react'
import type { Category, Task, DailyLog } from '@/lib/types'

type Period = '7d' | '30d' | 'week' | 'month'

function computeStreak(logs: DailyLog[], taskId: string): { current: number; longest: number } {
  const dates = logs
    .filter((l) => l.taskId === taskId && l.completed)
    .map((l) => l.date)
    .sort()
    .reverse()

  let current = 0
  let longest = 0
  let streak = 0
  let prev: string | null = null

  const today = format(new Date(), 'yyyy-MM-dd')
  const sortedAsc = [...dates].reverse()

  for (const date of sortedAsc) {
    if (!prev) {
      streak = 1
    } else {
      const diff = (parseISO(date).getTime() - parseISO(prev).getTime()) / 86400000
      if (diff === 1) {
        streak++
      } else {
        streak = 1
      }
    }
    longest = Math.max(longest, streak)
    prev = date
  }

  // Current streak: count backwards from today
  let cur = 0
  let d = today
  const dateSet = new Set(dates)
  while (dateSet.has(d)) {
    cur++
    d = format(subDays(parseISO(d), 1), 'yyyy-MM-dd')
  }

  return { current: cur, longest }
}

interface HeatmapProps {
  logs: DailyLog[]
  taskId: string
  days: string[]
}

function HeatmapRow({ logs, taskId, days }: HeatmapProps) {
  const logSet = new Set(
    logs.filter((l) => l.taskId === taskId && l.completed).map((l) => l.date)
  )

  const quantLogs = new Map(
    logs.filter((l) => l.taskId === taskId).map((l) => [l.date, l.value])
  )

  return (
    <div className="flex gap-0.5 flex-wrap">
      {days.map((d) => {
        const done = logSet.has(d)
        const val = quantLogs.get(d)
        return (
          <div
            key={d}
            title={`${d}${val !== undefined ? ` — ${val}` : ''}`}
            className={`w-3.5 h-3.5 rounded-sm transition-colors ${
              done ? 'bg-green-400' : 'bg-[#2e2e35]'
            }`}
          />
        )
      })}
    </div>
  )
}

const PERIOD_LABELS: Record<Period, string> = {
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  week: 'This week',
  month: 'This month',
}

function getDateRange(period: Period): [string, string] {
  const today = new Date()
  switch (period) {
    case '7d':
      return [format(subDays(today, 6), 'yyyy-MM-dd'), format(today, 'yyyy-MM-dd')]
    case '30d':
      return [format(subDays(today, 29), 'yyyy-MM-dd'), format(today, 'yyyy-MM-dd')]
    case 'week': {
      const s = startOfWeek(today, { weekStartsOn: 1 })
      const e = endOfWeek(today, { weekStartsOn: 1 })
      return [format(s, 'yyyy-MM-dd'), format(e, 'yyyy-MM-dd')]
    }
    case 'month': {
      const s = startOfMonth(today)
      const e = endOfMonth(today)
      return [format(s, 'yyyy-MM-dd'), format(e, 'yyyy-MM-dd')]
    }
  }
}

const ICON_MAP: Record<string, string> = {
  dumbbell: '🏋️', briefcase: '💼', sparkles: '✨', folder: '📁',
  star: '⭐', heart: '❤️', book: '📚', code: '💻', coffee: '☕',
  moon: '🌙', sun: '☀️', fire: '🔥',
}

export default function AnalyticsPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [logs, setLogs] = useState<DailyLog[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<Period>('30d')
  const [selectedCat, setSelectedCat] = useState<string>('all')

  const load = useCallback(async (p: Period) => {
    setLoading(true)
    try {
      const [from, to] = getDateRange(p)
      const [catRes, logRes] = await Promise.all([
        fetch('/api/categories'),
        fetch(`/api/logs?from=${from}&to=${to}`),
      ])
      const cats: Category[] = await catRes.json()
      const ls: DailyLog[] = await logRes.json()
      setCategories(cats)
      setLogs(ls)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(period) }, [load, period])

  const [from, to] = getDateRange(period)
  const days = eachDayOfInterval({ start: parseISO(from), end: parseISO(to) }).map((d) =>
    format(d, 'yyyy-MM-dd')
  )

  const allTasks = categories.flatMap((c) => c.tasks ?? [])
  const filteredTasks =
    selectedCat === 'all'
      ? allTasks
      : allTasks.filter((t) => t.categoryId === selectedCat)

  // Completion bar chart data
  const barData = days.map((d) => {
    const dayLogs = logs.filter((l) => l.date === d && filteredTasks.some((t) => t.id === l.taskId))
    const done = dayLogs.filter((l) => l.completed).length
    const total = filteredTasks.length
    return {
      date: format(parseISO(d), 'd MMM'),
      pct: total > 0 ? Math.round((done / total) * 100) : 0,
      done,
      total,
    }
  })

  const totalDays = days.length
  const perfectDays = barData.filter((d) => d.pct === 100).length
  const avgCompletion =
    barData.length > 0 ? Math.round(barData.reduce((s, d) => s + d.pct, 0) / barData.length) : 0

  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">Analytics</h1>
            <p className="text-sm text-[#8888a0] mt-0.5">Streaks, history & completion trends</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={selectedCat}
                onChange={(e) => setSelectedCat(e.target.value)}
                className="appearance-none px-3 py-1.5 pr-7 rounded-lg bg-[#1a1a1f] border border-[#2e2e35] text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8888a0] pointer-events-none" />
            </div>

            <div className="relative">
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as Period)}
                className="appearance-none px-3 py-1.5 pr-7 rounded-lg bg-[#1a1a1f] border border-[#2e2e35] text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
                  <option key={p} value={p}>{PERIOD_LABELS[p]}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8888a0] pointer-events-none" />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
          </div>
        ) : (
          <>
            {/* Summary stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Avg completion', value: `${avgCompletion}%`, icon: TrendingUp, color: 'text-indigo-400' },
                { label: 'Perfect days', value: String(perfectDays), icon: Flame, color: 'text-orange-400' },
                { label: 'Days tracked', value: String(totalDays), icon: Calendar, color: 'text-blue-400' },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="p-4 rounded-xl border border-[#2e2e35] bg-[#1a1a1f]">
                  <Icon className={`w-4 h-4 ${color} mb-2`} />
                  <p className="text-xl font-bold text-white">{value}</p>
                  <p className="text-xs text-[#8888a0] mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            {/* Bar chart */}
            <div className="p-4 rounded-xl border border-[#2e2e35] bg-[#1a1a1f]">
              <h2 className="text-sm font-semibold text-white mb-4">Daily Completion %</h2>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={barData} margin={{ left: -20 }}>
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: '#8888a0' }}
                    tickLine={false}
                    axisLine={false}
                    interval={Math.ceil(barData.length / 8) - 1}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 10, fill: '#8888a0' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#1a1a1f',
                      border: '1px solid #2e2e35',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    formatter={(v, _n, props) => [
                      `${v ?? 0}% (${(props.payload as { done: number; total: number }).done}/${(props.payload as { done: number; total: number }).total})`,
                      'Completion',
                    ]}
                    labelStyle={{ color: '#f0f0f5' }}
                  />
                  <Bar dataKey="pct" radius={[3, 3, 0, 0]}>
                    {barData.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={entry.pct === 100 ? '#22c55e' : entry.pct >= 50 ? '#6366f1' : '#2e2e35'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Per-task streaks */}
            <div>
              <h2 className="text-sm font-semibold text-white mb-3">Task Streaks & History</h2>
              <div className="space-y-3">
                {filteredTasks.map((task) => {
                  const taskLogs = logs.filter((l) => l.taskId === task.id)
                  const { current, longest } = computeStreak(taskLogs, task.id)
                  const completedCount = taskLogs.filter((l) => l.completed).length
                  const rate = days.length > 0 ? Math.round((completedCount / days.length) * 100) : 0
                  const cat = categories.find((c) => c.id === task.categoryId)

                  return (
                    <div
                      key={task.id}
                      className="p-4 rounded-xl border border-[#2e2e35] bg-[#1a1a1f] space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-white">{task.name}</span>
                            {cat && (
                              <span className="text-xs text-[#8888a0]">
                                {ICON_MAP[cat.icon] ?? '📁'} {cat.name}
                              </span>
                            )}
                          </div>
                          {task.type === 'QUANTITATIVE' && (
                            <p className="text-xs text-[#8888a0] mt-0.5">
                              Target: {task.targetValue} {task.unit}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-right shrink-0">
                          <div>
                            <p className="text-xs text-[#8888a0]">Current streak</p>
                            <p className="text-lg font-bold text-orange-400 leading-tight">
                              {current} <span className="text-xs font-normal">days</span>
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-[#8888a0]">Best</p>
                            <p className="text-lg font-bold text-indigo-400 leading-tight">
                              {longest} <span className="text-xs font-normal">days</span>
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-[#8888a0]">Rate</p>
                            <p className="text-lg font-bold text-white leading-tight">
                              {rate}<span className="text-xs font-normal">%</span>
                            </p>
                          </div>
                        </div>
                      </div>

                      <HeatmapRow logs={logs} taskId={task.id} days={days} />
                    </div>
                  )
                })}

                {filteredTasks.length === 0 && (
                  <p className="text-center text-sm text-[#8888a0] py-8">
                    No tasks found. Add some in Manage.
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
