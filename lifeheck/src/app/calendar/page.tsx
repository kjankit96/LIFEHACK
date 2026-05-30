'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  getDay,
  addMonths,
  subMonths,
  parseISO,
  isToday,
  isBefore,
  isAfter,
} from 'date-fns'
import { ChevronLeft, ChevronRight, CheckCircle2, Loader2, Circle } from 'lucide-react'
import type { Category, Task, DailyLog } from '@/lib/types'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isTaskScheduledOn(task: Task, date: Date): boolean {
  if (!task.scheduledDays) return true
  return task.scheduledDays.split(',').map(Number).includes(getDay(date))
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

function todayStr(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

// ─── Types ───────────────────────────────────────────────────────────────────

type LogMap = Map<string, DailyLog> // key: `${taskId}::${date}`

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())
  const [selectedDate, setSelectedDate] = useState<string>(todayStr())
  const [selectedTaskId, setSelectedTaskId] = useState<string>('')
  const [categories, setCategories] = useState<Category[]>([])
  const [logs, setLogs] = useState<DailyLog[]>([])
  const [loading, setLoading] = useState(true)

  // Derived
  const tasks: Task[] = categories.flatMap((c) =>
    (c.tasks ?? []).map((t) => ({ ...t, category: c }))
  )

  // Calendar grid range
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
  const gridDays = eachDayOfInterval({ start: gridStart, end: gridEnd })

  // Log lookup
  const logMap = new Map<string, DailyLog>()
  for (const log of logs) {
    logMap.set(`${log.taskId}::${log.date}`, log)
  }

  // ── Data loading ──────────────────────────────────────────────────────────

  const loadData = useCallback(async (month: Date) => {
    setLoading(true)
    try {
      const mStart = startOfMonth(month)
      const mEnd = endOfMonth(month)
      const gStart = startOfWeek(mStart, { weekStartsOn: 0 })
      const gEnd = endOfWeek(mEnd, { weekStartsOn: 0 })

      const from = format(gStart, 'yyyy-MM-dd')
      const to = format(gEnd, 'yyyy-MM-dd')

      const [catRes, logRes] = await Promise.all([
        fetch('/api/categories'),
        fetch(`/api/logs?from=${from}&to=${to}`),
      ])

      const catData: Category[] = await catRes.json()
      const logData: DailyLog[] = await logRes.json()

      setCategories(catData)
      setLogs(logData)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData(currentMonth)
  }, [currentMonth, loadData])

  // ── Navigation ────────────────────────────────────────────────────────────

  function prevMonth() {
    setCurrentMonth((m) => subMonths(m, 1))
  }
  function nextMonth() {
    setCurrentMonth((m) => addMonths(m, 1))
  }

  // ── Selected task ─────────────────────────────────────────────────────────

  const selectedTask = tasks.find((t) => t.id === selectedTaskId) ?? null
  const selectedCategory = selectedTask
    ? categories.find((c) => c.id === selectedTask.categoryId) ?? null
    : null

  // ── Side panel data ───────────────────────────────────────────────────────

  const scheduledForSelected = tasks.filter((t) => {
    try {
      return isTaskScheduledOn(t, parseISO(selectedDate))
    } catch {
      return false
    }
  })

  // ─── Cell rendering helpers ───────────────────────────────────────────────

  function getDots(day: Date): { color: string; completed: boolean }[] {
    const dateStr = format(day, 'yyyy-MM-dd')
    const dots: { color: string; completed: boolean }[] = []

    for (const task of tasks) {
      if (!isTaskScheduledOn(task, day)) continue
      const log = logMap.get(`${task.id}::${dateStr}`)
      const completed = log?.completed ?? false
      const cat = categories.find((c) => c.id === task.categoryId)
      dots.push({ color: cat?.color ?? '#6366f1', completed })
      if (dots.length >= 4) break
    }

    return dots
  }

  function getConsistencyStatus(
    task: Task,
    day: Date
  ): 'completed' | 'missed' | 'future' | 'not-scheduled' {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const d = new Date(day)
    d.setHours(0, 0, 0, 0)

    if (!isTaskScheduledOn(task, day)) return 'not-scheduled'

    if (isAfter(d, today)) return 'future'

    const dateStr = format(day, 'yyyy-MM-dd')
    const log = logMap.get(`${task.id}::${dateStr}`)
    return log?.completed ? 'completed' : 'missed'
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  const DAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="h-full overflow-y-auto scrollbar-thin" style={{ background: '#0f0f11' }}>
      <div className="max-w-6xl mx-auto px-4 py-6">

        {/* Page header */}
        <div className="flex items-start justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Calendar</h1>
            <p className="text-sm text-[#8888a0] mt-0.5">
              Track habits day by day
            </p>
          </div>

          {/* Mode selector */}
          <div>
            <select
              value={selectedTaskId}
              onChange={(e) => setSelectedTaskId(e.target.value)}
              className="px-3 py-2 rounded-lg bg-[#1a1a1f] border border-[#2e2e35] text-sm text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="">📅 Daily Agenda</option>
              {categories.map((cat) =>
                cat.tasks && cat.tasks.length > 0 ? (
                  <optgroup key={cat.id} label={cat.name}>
                    {cat.tasks.map((task) => (
                      <option key={task.id} value={task.id}>
                        {task.name}
                      </option>
                    ))}
                  </optgroup>
                ) : null
              )}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6">

            {/* ── Calendar panel ── */}
            <div className="flex-1 min-w-0">
              {/* Month navigation */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={prevMonth}
                  className="p-2 rounded-lg hover:bg-[#242429] text-[#8888a0] hover:text-white transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h2 className="text-lg font-semibold text-white">
                  {format(currentMonth, 'MMMM yyyy')}
                </h2>
                <button
                  onClick={nextMonth}
                  className="p-2 rounded-lg hover:bg-[#242429] text-[#8888a0] hover:text-white transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 mb-1">
                {DAY_HEADERS.map((d) => (
                  <div
                    key={d}
                    className="text-center text-xs font-medium text-[#8888a0] py-1"
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1">
                {gridDays.map((day) => {
                  const dateStr = format(day, 'yyyy-MM-dd')
                  const inMonth = isSameMonth(day, currentMonth)
                  const today = isToday(day)
                  const selected = dateStr === selectedDate

                  return (
                    <button
                      key={dateStr}
                      onClick={() => setSelectedDate(dateStr)}
                      className={`
                        relative flex flex-col items-center rounded-lg p-1 min-h-[56px] transition-all
                        ${inMonth ? 'text-white' : 'text-[#4e4e60]'}
                        ${selected
                          ? 'ring-2 ring-indigo-500 bg-indigo-500/10'
                          : 'hover:bg-[#242429]'
                        }
                      `}
                    >
                      {/* Date number */}
                      <span
                        className={`
                          text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1
                          ${today
                            ? 'bg-indigo-500 text-white'
                            : inMonth
                              ? 'text-white'
                              : 'text-[#4e4e60]'
                          }
                        `}
                      >
                        {format(day, 'd')}
                      </span>

                      {/* Dots or consistency indicators */}
                      {selectedTaskId === '' ? (
                        // Agenda mode: colored dots
                        <div className="flex flex-wrap gap-0.5 justify-center">
                          {getDots(day).map((dot, i) => (
                            <span
                              key={i}
                              className="w-1.5 h-1.5 rounded-full"
                              style={{
                                backgroundColor: dot.completed
                                  ? dot.color
                                  : '#4e4e60',
                              }}
                            />
                          ))}
                        </div>
                      ) : (
                        // Consistency mode: checkmark or X or dot
                        (() => {
                          if (!selectedTask) return null
                          const status = getConsistencyStatus(selectedTask, day)
                          if (!inMonth && status === 'not-scheduled') return null

                          if (status === 'completed') {
                            return (
                              <CheckCircle2
                                className="w-4 h-4 text-green-400"
                              />
                            )
                          }
                          if (status === 'missed') {
                            return (
                              <span className="text-[#ef4444] text-xs font-bold leading-none">✕</span>
                            )
                          }
                          if (status === 'future') {
                            return (
                              <span
                                className="w-2 h-2 rounded-full bg-indigo-500/50 block"
                              />
                            )
                          }
                          return null
                        })()
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Legend */}
              <div className="mt-4 pt-4 border-t border-[#2e2e35]">
                {selectedTaskId === '' ? (
                  <div className="flex items-center gap-4 text-xs text-[#8888a0]">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-indigo-500 block" />
                      Completed habit
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#4e4e60] block" />
                      Incomplete / not logged
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-white text-[10px] font-bold">1</span>
                      Today
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4 text-xs text-[#8888a0]">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                      Completed
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[#ef4444] font-bold">✕</span>
                      Missed
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-indigo-500/50 block" />
                      Upcoming scheduled
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── Side panel ── */}
            <div className="lg:w-72 xl:w-80 shrink-0">
              <div
                className="rounded-xl border border-[#2e2e35] overflow-hidden"
                style={{ background: '#1a1a1f' }}
              >
                {/* Panel header */}
                <div className="px-4 py-3 border-b border-[#2e2e35]">
                  <div className="text-sm font-semibold text-white">
                    {format(parseISO(selectedDate), 'EEEE, MMMM d')}
                  </div>
                  <div className="text-xs text-[#8888a0] mt-0.5">
                    {selectedTaskId === ''
                      ? `${scheduledForSelected.length} habit${scheduledForSelected.length !== 1 ? 's' : ''} scheduled`
                      : selectedTask?.name ?? ''}
                  </div>
                </div>

                {selectedTaskId === '' ? (
                  /* ── Agenda mode ── */
                  <div className="divide-y divide-[#2e2e35]">
                    {scheduledForSelected.length === 0 ? (
                      <div className="px-4 py-6 text-center text-sm text-[#8888a0]">
                        No habits scheduled for this day
                      </div>
                    ) : (
                      scheduledForSelected.map((task) => {
                        const log = logMap.get(`${task.id}::${selectedDate}`)
                        const completed = log?.completed ?? false
                        const cat = categories.find((c) => c.id === task.categoryId)

                        return (
                          <div
                            key={task.id}
                            className="flex items-start gap-3 px-4 py-3"
                          >
                            <div className="mt-0.5">
                              {completed ? (
                                <CheckCircle2 className="w-4 h-4 text-green-400" />
                              ) : (
                                <Circle className="w-4 h-4 text-[#4e4e60]" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm text-white font-medium leading-tight">
                                {task.name}
                              </div>
                              <div
                                className="text-xs mt-0.5 font-medium"
                                style={{ color: cat?.color ?? '#8888a0' }}
                              >
                                {cat?.name}
                              </div>
                              {task.type === 'QUANTITATIVE' && log && (
                                <div className="text-xs text-[#8888a0] mt-0.5">
                                  {log.value} / {task.targetValue} {task.unit}
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                ) : (
                  /* ── Consistency mode ── */
                  <div className="px-4 py-4">
                    {selectedTask ? (
                      <>
                        {/* Big status indicator */}
                        {(() => {
                          const status = getConsistencyStatus(
                            selectedTask,
                            parseISO(selectedDate)
                          )
                          const log = logMap.get(`${selectedTask.id}::${selectedDate}`)

                          return (
                            <div className="flex flex-col items-center py-4 gap-2">
                              {status === 'completed' ? (
                                <>
                                  <CheckCircle2 className="w-12 h-12 text-green-400" />
                                  <span className="text-sm font-semibold text-green-400">
                                    Completed
                                  </span>
                                  {selectedTask.type === 'QUANTITATIVE' && log && (
                                    <span className="text-xs text-[#8888a0]">
                                      {log.value} {selectedTask.unit}
                                    </span>
                                  )}
                                </>
                              ) : status === 'missed' ? (
                                <>
                                  <div className="w-12 h-12 rounded-full border-2 border-[#ef4444] flex items-center justify-center">
                                    <span className="text-[#ef4444] text-xl font-bold">✕</span>
                                  </div>
                                  <span className="text-sm font-semibold text-[#ef4444]">
                                    Missed
                                  </span>
                                </>
                              ) : status === 'future' ? (
                                <>
                                  <div className="w-12 h-12 rounded-full border-2 border-indigo-500/50 flex items-center justify-center">
                                    <span className="w-3 h-3 rounded-full bg-indigo-500/50 block" />
                                  </div>
                                  <span className="text-sm font-semibold text-[#8888a0]">
                                    Upcoming
                                  </span>
                                </>
                              ) : (
                                <>
                                  <div className="w-12 h-12 rounded-full border-2 border-[#2e2e35] flex items-center justify-center">
                                    <span className="text-[#4e4e60] text-sm">—</span>
                                  </div>
                                  <span className="text-sm font-semibold text-[#4e4e60]">
                                    Not scheduled
                                  </span>
                                </>
                              )}
                            </div>
                          )
                        })()}

                        {/* Task details */}
                        <div className="space-y-2 border-t border-[#2e2e35] pt-3 mt-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-[#8888a0]">Type</span>
                            <span className="text-white">
                              {selectedTask.type === 'BINARY' ? 'Binary' : 'Quantitative'}
                            </span>
                          </div>
                          {selectedTask.type === 'QUANTITATIVE' && (
                            <div className="flex justify-between text-xs">
                              <span className="text-[#8888a0]">Target</span>
                              <span className="text-white">
                                {selectedTask.targetValue} {selectedTask.unit}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between text-xs">
                            <span className="text-[#8888a0]">Schedule</span>
                            <span className="text-white">
                              {formatScheduledDays(selectedTask.scheduledDays)}
                            </span>
                          </div>
                          {selectedTask.reminderTime && (
                            <div className="flex justify-between text-xs">
                              <span className="text-[#8888a0]">Reminder</span>
                              <span className="text-white">{selectedTask.reminderTime}</span>
                            </div>
                          )}
                          {selectedCategory && (
                            <div className="flex justify-between text-xs">
                              <span className="text-[#8888a0]">Category</span>
                              <span
                                className="font-medium"
                                style={{ color: selectedCategory.color }}
                              >
                                {selectedCategory.name}
                              </span>
                            </div>
                          )}
                          {selectedTask.description && (
                            <div className="pt-1">
                              <p className="text-xs text-[#8888a0]">
                                {selectedTask.description}
                              </p>
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="py-6 text-center text-sm text-[#8888a0]">
                        Select a task to view consistency
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
