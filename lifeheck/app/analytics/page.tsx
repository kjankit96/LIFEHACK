'use client'

import { useState, useEffect } from 'react'
import { format, subDays } from 'date-fns'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { Category, Task, DailyLog } from '@/lib/types'

export default function AnalyticsPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [logs, setLogs] = useState<DailyLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const from = format(subDays(new Date(), 30), 'yyyy-MM-dd')
      const to = format(new Date(), 'yyyy-MM-dd')

      const [catRes, logRes] = await Promise.all([
        fetch('/api/categories'),
        fetch(`/api/logs?from=${from}&to=${to}`),
      ])

      const cats = await catRes.json()
      const logsData = await logRes.json()
      setCategories(cats)
      setLogs(logsData)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return <div className="text-center py-10 text-[#8888a0]">Loading analytics…</div>
  }

  const allTasks = categories.flatMap(c => (c.tasks ?? []).filter(t => t.isActive))

  // Calculate daily completion rate
  const dailyData = new Map<string, { completed: number; total: number }>()
  for (let i = 30; i >= 0; i--) {
    const date = format(subDays(new Date(), i), 'yyyy-MM-dd')
    dailyData.set(date, { completed: 0, total: allTasks.length })
  }

  logs.forEach(log => {
    const entry = dailyData.get(log.date)
    if (entry && log.completed) {
      entry.completed++
    }
  })

  const chartData = Array.from(dailyData.entries()).map(([date, data]) => ({
    date: format(new Date(date), 'MMM d'),
    completion: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
  }))

  // Calculate streaks per category
  const categoryStats = categories.map(cat => {
    const catTasks = cat.tasks?.filter(t => t.isActive) ?? []
    const completedCount = logs.filter(
      l => catTasks.some(t => t.id === l.taskId) && l.completed
    ).length
    return {
      name: cat.name,
      completed: completedCount,
      total: catTasks.length,
      percentage: catTasks.length > 0 ? Math.round((completedCount / catTasks.length) * 100) : 0,
    }
  })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white mb-6">Analytics</h1>
      </div>

      <div>
        <h2 className="text-lg font-bold text-white mb-4">30-Day Completion Rate</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="date" stroke="#8888a0" style={{ fontSize: '12px' }} />
            <YAxis stroke="#8888a0" style={{ fontSize: '12px' }} />
            <Tooltip
              contentStyle={{ background: '#1a1a1f', border: '1px solid #2e2e35', borderRadius: '8px' }}
              labelStyle={{ color: '#fff' }}
            />
            <Bar dataKey="completion" fill="#6366f1" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div>
        <h2 className="text-lg font-bold text-white mb-4">Category Completion</h2>
        <div className="space-y-3">
          {categoryStats.map(stat => (
            <div key={stat.name} className="space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-white">{stat.name}</p>
                <p className="text-sm font-semibold text-indigo-400">{stat.percentage}%</p>
              </div>
              <div className="h-2 bg-[#2e2e35] rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 transition-all"
                  style={{ width: `${stat.percentage}%` }}
                />
              </div>
              <p className="text-xs text-[#8888a0]">{stat.completed} of {stat.total} tasks</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
