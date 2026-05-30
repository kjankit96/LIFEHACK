import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'

const DEFAULTS = [
  {
    name: 'Health & Fitness',
    icon: 'dumbbell',
    color: '#22c55e',
    tasks: [
      { name: 'Gym', type: 'BINARY', description: 'Workout session' },
      { name: 'Walk', type: 'QUANTITATIVE', unit: 'steps', targetValue: 8000, description: 'Daily steps' },
      { name: 'Protein Intake', type: 'QUANTITATIVE', unit: 'grams', targetValue: 150, description: 'Daily protein goal' },
      { name: 'Calorie Deficit', type: 'QUANTITATIVE', unit: 'kcal', targetValue: 500, description: 'Calorie deficit target' },
    ],
  },
  {
    name: 'Work & Productivity',
    icon: 'briefcase',
    color: '#3b82f6',
    tasks: [
      { name: 'Deep Work', type: 'QUANTITATIVE', unit: 'hours', targetValue: 4, description: 'Focused work sessions' },
      { name: 'Inbox Zero', type: 'BINARY', description: 'Clear all emails' },
      { name: 'Standup', type: 'BINARY', description: 'Daily standup meeting' },
    ],
  },
  {
    name: 'Habits',
    icon: 'sparkles',
    color: '#a855f7',
    tasks: [
      { name: 'Reading', type: 'QUANTITATIVE', unit: 'pages', targetValue: 20, description: 'Daily reading goal' },
      { name: 'Meditation', type: 'QUANTITATIVE', unit: 'minutes', targetValue: 10, description: 'Mindfulness practice' },
    ],
  },
]

export async function POST(_req: NextRequest) {
  const existing = await prisma.category.count()
  if (existing > 0) {
    return Response.json({ message: 'Already seeded' }, { status: 200 })
  }

  for (let ci = 0; ci < DEFAULTS.length; ci++) {
    const cat = DEFAULTS[ci]
    const category = await prisma.category.create({
      data: {
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        isDefault: true,
        sortOrder: ci,
      },
    })

    for (let ti = 0; ti < cat.tasks.length; ti++) {
      const t = cat.tasks[ti]
      await prisma.task.create({
        data: {
          categoryId: category.id,
          name: t.name,
          type: t.type,
          unit: 'unit' in t ? t.unit ?? '' : '',
          targetValue: 'targetValue' in t ? t.targetValue ?? 0 : 0,
          description: t.description,
          isDefault: true,
          sortOrder: ti,
        },
      })
    }
  }

  return Response.json({ message: 'Seeded successfully' }, { status: 201 })
}
