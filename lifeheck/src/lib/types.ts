export type TaskType = 'BINARY' | 'QUANTITATIVE'

export interface Category {
  id: string
  name: string
  icon: string
  color: string
  isDefault: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
  tasks?: Task[]
}

export interface Task {
  id: string
  categoryId: string
  category?: Category
  name: string
  description: string
  type: TaskType
  unit: string
  targetValue: number
  reminderTime: string
  scheduledDays: string
  isActive: boolean
  isDefault: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
  dailyLogs?: DailyLog[]
}

export interface DailyLog {
  id: string
  taskId: string
  task?: Task
  date: string
  completed: boolean
  value: number
  notes: string
  createdAt: string
  updatedAt: string
}

export interface DailyTaskStatus {
  task: Task
  log: DailyLog | null
}

export interface StreakData {
  taskId: string
  taskName: string
  currentStreak: number
  longestStreak: number
  completionRate: number
  logs: DailyLog[]
}
