'use client'

import { useState, useEffect } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, getDay } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Category, Task, DailyLog } from '@/lib/types'

export default function CalendarPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [logs, setLogs] = useState<DailyLog[]>([])
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd')
      const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd')

      const [catRes, logRes] = await Promise.all([
        fetch('/api/categories'),
        fetch(`/api/logs?from=${start}&to=${end}`),
      ])

      const cats = await catRes.json()
      const logsData = await logRes.json()
      setCategories(cats)
      setLogs(logsData)
      setLoading(false)
    }
    load()
  }, [currentMonth])

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calendarStart = startOfWeek(monthStart)
  const calendarEnd = endOfWeek(monthEnd)
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const allTasks = categories.flatMap(c => (c.tasks ?? []).filter(t => t.isActive))

  const getLogForDate = (taskId: string, date: Date): DailyLog | undefined => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return logs.find(l => l.taskId === taskId && l.date === dateStr)
  }

  if (loading) {
    return <div className="text-center py-10 text-[#8888a0]">Loading calendar…</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">{format(currentMonth, 'MMMM yyyy')}</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
            className="p-2 rounded hover:bg-[#2e2e35]"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => setCurrentMonth(new Date())}
            className="px-3 py-1 text-sm rounded hover:bg-[#2e2e35]"
          >
            Today
          </button>
          <button
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
            className="p-2 rounded hover:bg-[#2e2e35]"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div>
        <div className="grid grid-cols-7 gap-1 mb-1">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-xs font-semibold text-[#8888a0] py-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map(day => {
            const isCurrentMonth = day.getMonth() === currentMonth.getMonth()
            return (
              <div
                key={day.toISOString()}
                className={`min-h-20 p-1 rounded border ${
                  isCurrentMonth ? 'bg-[#1a1a1f] border-[#2e2e35]' : 'bg-[#0f0f12] border-[#1a1a1f]'
                }`}
              >
                <p className="text-xs font-semibold text-[#8888a0]">{format(day, 'd')}</p>
              </div>
            )
          })}
        </div>
      </div>

      <div className="border-t border-[#2e2e35] pt-6">
        <h2 className="text-lg font-bold mb-4">Task Consistency</h2>
        <select
          value={selectedTaskId ?? ''}
          onChange={e => setSelectedTaskId(e.target.value || null)}
          className="px-3 py-2 rounded-lg border bg-[#1a1a1f] border-[#2e2e35] text-white w-full md:w-60"
        >
          <option value="">Select a task to view consistency…</option>
          {allTasks.map(task => (
            <option key={task.id} value={task.id}>
              {task.name}
            </option>
          ))}
        </select>

        {selectedTaskId && (
          <div className="mt-6">
            <div className="grid grid-cols-7 gap-1">
              {days.map(day => {
                if (day.getMonth() !== currentMonth.getMonth()) return null
                const log = getLogForDate(selectedTaskId, day)
                return (
                  <div
                    key={day.toISOString()}
                    className={`h-8 rounded ${
                      log?.completed
                        ? 'bg-green-500/30 border border-green-500/50'
                        : 'bg-[#2e2e35] border border-[#3e3e50]'
                    }`}
                    title={format(day, 'MMM d')}
                  />
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
