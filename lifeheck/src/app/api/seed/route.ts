import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'

const DEFAULTS = [
  {
    name: '🚭 Avoid / Limit',
    icon: 'shield',
    color: '#ef4444',
    tasks: [
      { name: 'Cigarettes / Vapes', type: 'QUANTITATIVE', unit: 'cigarettes', targetValue: 0, description: 'How many did you smoke today?' },
      { name: 'Alcohol', type: 'QUANTITATIVE', unit: 'drinks', targetValue: 0, description: 'How many drinks today?' },
      { name: 'Junk Food', type: 'QUANTITATIVE', unit: 'treats', targetValue: 0, description: 'Junk food / sweet treats count' },
      { name: 'Social Media', type: 'QUANTITATIVE', unit: 'minutes', targetValue: 30, description: 'Doomscrolling / screen time' },
      { name: 'No Late Screen', type: 'BINARY', description: 'Devices off by 11 PM' },
    ],
  },
  {
    name: '🏋️ Health & Fitness',
    icon: 'dumbbell',
    color: '#22c55e',
    tasks: [
      { name: 'Gym', type: 'BINARY', description: 'Resistance training session' },
      { name: 'Walk', type: 'QUANTITATIVE', unit: 'steps', targetValue: 8000 },
      { name: 'Protein Intake', type: 'QUANTITATIVE', unit: 'grams', targetValue: 150 },
      { name: 'Calorie Deficit', type: 'QUANTITATIVE', unit: 'kcal', targetValue: 500 },
      { name: 'Water Intake', type: 'QUANTITATIVE', unit: 'liters', targetValue: 2.5 },
      { name: 'Stretching', type: 'QUANTITATIVE', unit: 'minutes', targetValue: 15, description: 'Yoga or mobility' },
      { name: 'Cardio', type: 'QUANTITATIVE', unit: 'minutes', targetValue: 30, description: 'Running/cycling' },
    ],
  },
  {
    name: '💼 Work & Productivity',
    icon: 'briefcase',
    color: '#3b82f6',
    tasks: [
      { name: 'Deep Work', type: 'QUANTITATIVE', unit: 'hours', targetValue: 4 },
      { name: 'Inbox Zero', type: 'BINARY' },
      { name: 'Standup', type: 'BINARY', description: 'Daily standup / planning' },
      { name: 'Skill Learning', type: 'QUANTITATIVE', unit: 'minutes', targetValue: 30, description: 'Coding / language courses' },
      { name: 'Networking', type: 'BINARY', description: 'Reach out to contacts' },
      { name: 'Documentation', type: 'BINARY', description: 'Daily logs / reports' },
    ],
  },
  {
    name: '🧠 Mental Health',
    icon: 'sparkles',
    color: '#a855f7',
    tasks: [
      { name: 'Meditation', type: 'QUANTITATIVE', unit: 'minutes', targetValue: 10 },
      { name: 'Journaling', type: 'BINARY', description: 'Write thoughts / reflections' },
      { name: 'Gratitude', type: 'BINARY', description: 'List 3 things grateful for' },
      { name: 'Therapy / Reflection', type: 'BINARY', description: 'Mental check-in' },
      { name: 'Breathing Exercises', type: 'QUANTITATIVE', unit: 'minutes', targetValue: 5 },
    ],
  },
  {
    name: '🏡 Home & Life',
    icon: 'home',
    color: '#f59e0b',
    tasks: [
      { name: 'Quick Tidy', type: 'BINARY', description: '15-min daily reset of space' },
      { name: 'Meal Prep', type: 'BINARY', description: 'Cook healthy options ahead' },
      { name: 'Financial Log', type: 'BINARY', description: 'Log expenses for the day' },
      { name: 'Plant / Pet Care', type: 'BINARY', description: 'Water plants / feed pets' },
      { name: 'Chores', type: 'BINARY', description: 'Rotational household tasks' },
    ],
  },
  {
    name: '📚 Personal Growth',
    icon: 'book',
    color: '#14b8a6',
    tasks: [
      { name: 'Reading', type: 'QUANTITATIVE', unit: 'pages', targetValue: 20 },
      { name: 'Gaming', type: 'QUANTITATIVE', unit: 'hours', targetValue: 2, description: 'Intentional gaming session' },
      { name: 'Creative Project', type: 'QUANTITATIVE', unit: 'minutes', targetValue: 30, description: 'Writing / art / passion project' },
      { name: 'Podcast / Audiobook', type: 'QUANTITATIVE', unit: 'minutes', targetValue: 20, description: 'During commute / passive time' },
    ],
  },
]

async function ensureSchema() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Category" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "name" TEXT NOT NULL,
      "icon" TEXT NOT NULL DEFAULT '',
      "color" TEXT NOT NULL DEFAULT '#6366f1',
      "isDefault" INTEGER NOT NULL DEFAULT 0,
      "sortOrder" INTEGER NOT NULL DEFAULT 0,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Task" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "categoryId" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "description" TEXT NOT NULL DEFAULT '',
      "type" TEXT NOT NULL DEFAULT 'BINARY',
      "unit" TEXT NOT NULL DEFAULT '',
      "targetValue" REAL NOT NULL DEFAULT 0,
      "reminderTime" TEXT,
      "scheduledDays" TEXT NOT NULL DEFAULT '',
      "isActive" INTEGER NOT NULL DEFAULT 1,
      "isDefault" INTEGER NOT NULL DEFAULT 0,
      "sortOrder" INTEGER NOT NULL DEFAULT 0,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Task_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )
  `)

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "DailyLog" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "taskId" TEXT NOT NULL,
      "date" TEXT NOT NULL,
      "completed" INTEGER NOT NULL DEFAULT 0,
      "value" REAL,
      "notes" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "DailyLog_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )
  `)

  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "DailyLog_taskId_date_key"
    ON "DailyLog"("taskId", "date")
  `)

  try {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "Task" ADD COLUMN "scheduledDays" TEXT NOT NULL DEFAULT ''`
    )
  } catch {
    // column already exists — expected on re-runs
  }
}

export async function POST(_req: NextRequest) {
  try {
    await ensureSchema()
  } catch (err) {
    console.error('[seed] ensureSchema failed:', err)
    return Response.json({ error: 'Schema migration failed', detail: String(err) }, { status: 500 })
  }

  let created = 0
  let skipped = 0
  const errors: string[] = []

  for (let ci = 0; ci < DEFAULTS.length; ci++) {
    const cat = DEFAULTS[ci]
    try {
      const existing = await prisma.category.findFirst({ where: { name: cat.name } })
      if (existing) { skipped++; continue }

      const category = await prisma.category.create({
        data: { name: cat.name, icon: cat.icon, color: cat.color, isDefault: true, sortOrder: ci },
      })

      for (let ti = 0; ti < cat.tasks.length; ti++) {
        const t = cat.tasks[ti]
        await prisma.task.create({
          data: {
            categoryId: category.id,
            name: t.name,
            type: t.type,
            unit: 'unit' in t ? (t.unit ?? '') : '',
            targetValue: 'targetValue' in t ? (t.targetValue ?? 0) : 0,
            description: 'description' in t ? (t.description ?? '') : '',
            isDefault: true,
            sortOrder: ti,
          },
        })
      }
      created++
    } catch (err) {
      console.error(`[seed] failed on category "${cat.name}":`, err)
      errors.push(`${cat.name}: ${String(err)}`)
    }
  }

  return Response.json({ created, skipped, errors }, { status: 201 })
}
