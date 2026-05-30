export interface Category {
  id: string
  name: string
  icon: string
  color: string
  isDefault: boolean
  sortOrder: number
  createdAt: Date
  updatedAt: Date
  tasks?: Task[]
}

export interface Task {
  id: string
  categoryId: string
  name: string
  description: string
  type: 'BINARY' | 'QUANTITATIVE'
  unit: string
  targetValue: number
  reminderTime: string
  scheduledDays: string
  isActive: boolean
  isDefault: boolean
  sortOrder: number
  createdAt: Date
  updatedAt: Date
}

export interface DailyLog {
  id: string
  taskId: string
  date: string
  completed: boolean
  value: number
  notes: string
  createdAt: Date
  updatedAt: Date
}
