'use client'

import { useEffect } from 'react'
import type { Task } from '@/lib/types'

function scheduleReminder(task: Task) {
  if (!task.reminderTime || typeof Notification === 'undefined') return

  const [h, m] = task.reminderTime.split(':').map(Number)
  const now = new Date()
  const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0)

  const ms = target.getTime() - now.getTime()
  if (ms < 0) return // already passed today

  return setTimeout(() => {
    new Notification(`LifeHeck: ${task.name}`, {
      body: task.description || `Time to complete: ${task.name}`,
      icon: '/favicon.ico',
      tag: task.id,
    })
  }, ms)
}

interface Props {
  tasks: Task[]
}

export default function NotificationManager({ tasks }: Props) {
  useEffect(() => {
    if (typeof Notification === 'undefined') return

    const tasksWithReminders = tasks.filter((t) => t.reminderTime && t.isActive)
    if (tasksWithReminders.length === 0) return

    if (Notification.permission === 'default') {
      Notification.requestPermission()
      return
    }

    if (Notification.permission !== 'granted') return

    const timers: ReturnType<typeof setTimeout>[] = []
    for (const task of tasksWithReminders) {
      const t = scheduleReminder(task)
      if (t) timers.push(t)
    }

    return () => timers.forEach(clearTimeout)
  }, [tasks])

  return null
}
