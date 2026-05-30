import { NextRequest } from 'next/server'
import { createClient } from '@libsql/client'

const DEFAULTS = [
  { name: '🚭 Avoid / Limit', icon: 'shield', color: '#ef4444', tasks: [
    { name: 'Cigarettes / Vapes', type: 'QUANTITATIVE', unit: 'cigarettes', targetValue: 0, description: 'Count' },
    { name: 'Alcohol', type: 'QUANTITATIVE', unit: 'drinks', targetValue: 0, description: 'Drinks' },
    { name: 'Junk Food', type: 'QUANTITATIVE', unit: 'treats', targetValue: 0, description: 'Treats' },
    { name: 'Social Media', type: 'QUANTITATIVE', unit: 'minutes', targetValue: 30, description: 'Doomscroll' },
    { name: 'No Late Screen', type: 'BINARY', unit: '', targetValue: 0, description: 'Off by 11 PM' },
  ]},
  { name: '🏋️ Health & Fitness', icon: 'dumbbell', color: '#22c55e', tasks: [
    { name: 'Gym', type: 'BINARY', unit: '', targetValue: 0, description: 'Workout' },
    { name: 'Walk', type: 'QUANTITATIVE', unit: 'steps', targetValue: 8000, description: '' },
    { name: 'Protein Intake', type: 'QUANTITATIVE', unit: 'grams', targetValue: 150, description: '' },
    { name: 'Calorie Deficit', type: 'QUANTITATIVE', unit: 'kcal', targetValue: 500, description: '' },
    { name: 'Water Intake', type: 'QUANTITATIVE', unit: 'liters', targetValue: 2.5, description: '' },
    { name: 'Stretching', type: 'QUANTITATIVE', unit: 'minutes', targetValue: 15, description: 'Yoga' },
    { name: 'Cardio', type: 'QUANTITATIVE', unit: 'minutes', targetValue: 30, description: 'Running' },
  ]},
  { name: '💼 Work & Productivity', icon: 'briefcase', color: '#3b82f6', tasks: [
    { name: 'Deep Work', type: 'QUANTITATIVE', unit: 'hours', targetValue: 4, description: '' },
    { name: 'Inbox Zero', type: 'BINARY', unit: '', targetValue: 0, description: '' },
    { name: 'Standup', type: 'BINARY', unit: '', targetValue: 0, description: 'Planning' },
    { name: 'Skill Learning', type: 'QUANTITATIVE', unit: 'minutes', targetValue: 30, description: '' },
    { name: 'Networking', type: 'BINARY', unit: '', targetValue: 0, description: 'Reach out' },
    { name: 'Documentation', type: 'BINARY', unit: '', targetValue: 0, description: '' },
  ]},
  { name: '🧠 Mental Health', icon: 'sparkles', color: '#a855f7', tasks: [
    { name: 'Meditation', type: 'QUANTITATIVE', unit: 'minutes', targetValue: 10, description: '' },
    { name: 'Journaling', type: 'BINARY', unit: '', targetValue: 0, description: '' },
    { name: 'Gratitude', type: 'BINARY', unit: '', targetValue: 0, description: '' },
    { name: 'Therapy / Reflection', type: 'BINARY', unit: '', targetValue: 0, description: '' },
    { name: 'Breathing Exercises', type: 'QUANTITATIVE', unit: 'minutes', targetValue: 5, description: '' },
  ]},
  { name: '🏡 Home & Life', icon: 'home', color: '#f59e0b', tasks: [
    { name: 'Quick Tidy', type: 'BINARY', unit: '', targetValue: 0, description: '' },
    { name: 'Meal Prep', type: 'BINARY', unit: '', targetValue: 0, description: '' },
    { name: 'Financial Log', type: 'BINARY', unit: '', targetValue: 0, description: '' },
    { name: 'Plant / Pet Care', type: 'BINARY', unit: '', targetValue: 0, description: '' },
    { name: 'Chores', type: 'BINARY', unit: '', targetValue: 0, description: '' },
  ]},
  { name: '📚 Personal Growth', icon: 'book', color: '#14b8a6', tasks: [
    { name: 'Reading', type: 'QUANTITATIVE', unit: 'pages', targetValue: 20, description: '' },
    { name: 'Gaming', type: 'QUANTITATIVE', unit: 'hours', targetValue: 2, description: '' },
    { name: 'Creative Project', type: 'QUANTITATIVE', unit: 'minutes', targetValue: 30, description: '' },
    { name: 'Podcast / Audiobook', type: 'QUANTITATIVE', unit: 'minutes', targetValue: 20, description: '' },
  ]},
]

export async function POST(_req: NextRequest) {
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL ?? 'file:dev.db',
    authToken: process.env.TURSO_AUTH_TOKEN,
  })

  try {
    await client.executeMultiple(`
      CREATE TABLE IF NOT EXISTS "Category" (
        "id" TEXT PRIMARY KEY,
        "name" TEXT NOT NULL,
        "icon" TEXT DEFAULT '',
        "color" TEXT DEFAULT '#6366f1',
        "isDefault" INTEGER DEFAULT 0,
        "sortOrder" INTEGER DEFAULT 0,
        "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS "Task" (
        "id" TEXT PRIMARY KEY,
        "categoryId" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "description" TEXT DEFAULT '',
        "type" TEXT DEFAULT 'BINARY',
        "unit" TEXT DEFAULT '',
        "targetValue" REAL DEFAULT 0,
        "reminderTime" TEXT,
        "scheduledDays" TEXT DEFAULT '',
        "isActive" INTEGER DEFAULT 1,
        "isDefault" INTEGER DEFAULT 0,
        "sortOrder" INTEGER DEFAULT 0,
        "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Task_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS "DailyLog" (
        "id" TEXT PRIMARY KEY,
        "taskId" TEXT NOT NULL,
        "date" TEXT NOT NULL,
        "completed" INTEGER DEFAULT 0,
        "value" REAL DEFAULT 0,
        "notes" TEXT DEFAULT '',
        "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "DailyLog_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE CASCADE
      );
      CREATE UNIQUE INDEX IF NOT EXISTS "DailyLog_taskId_date_key" ON "DailyLog"("taskId", "date");
    `)

    let created = 0, skipped = 0
    for (let ci = 0; ci < DEFAULTS.length; ci++) {
      const cat = DEFAULTS[ci]
      const existing = await client.execute({ sql: `SELECT id FROM "Category" WHERE name = ?`, args: [cat.name] })
      if (existing.rows.length > 0) { skipped++; continue }

      const catId = crypto.randomUUID()
      const ts = new Date().toISOString()
      await client.execute({
        sql: `INSERT INTO "Category" (id, name, icon, color, isDefault, sortOrder, createdAt, updatedAt) VALUES (?, ?, ?, ?, 1, ?, ?, ?)`,
        args: [catId, cat.name, cat.icon, cat.color, ci, ts, ts],
      })

      for (let ti = 0; ti < cat.tasks.length; ti++) {
        const t = cat.tasks[ti]
        await client.execute({
          sql: `INSERT INTO "Task" (id, categoryId, name, description, type, unit, targetValue, scheduledDays, isActive, isDefault, sortOrder, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, '', 1, 1, ?, ?, ?)`,
          args: [crypto.randomUUID(), catId, t.name, t.description, t.type, t.unit, t.targetValue, ti, ts, ts],
        })
      }
      created++
    }

    client.close()
    return Response.json({ created, skipped }, { status: 201 })
  } catch (err) {
    console.error('[seed]', err)
    client.close()
    return Response.json({ error: String(err) }, { status: 500 })
  }
}
