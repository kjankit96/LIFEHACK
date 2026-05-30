import { NextRequest } from 'next/server'
import { createClient } from '@libsql/client'

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
      { name: 'No Late Screen', type: 'BINARY', unit: '', targetValue: 0, description: 'Devices off by 11 PM' },
    ],
  },
  {
    name: '🏋️ Health & Fitness',
    icon: 'dumbbell',
    color: '#22c55e',
    tasks: [
      { name: 'Gym', type: 'BINARY', unit: '', targetValue: 0, description: 'Resistance training session' },
      { name: 'Walk', type: 'QUANTITATIVE', unit: 'steps', targetValue: 8000, description: '' },
      { name: 'Protein Intake', type: 'QUANTITATIVE', unit: 'grams', targetValue: 150, description: '' },
      { name: 'Calorie Deficit', type: 'QUANTITATIVE', unit: 'kcal', targetValue: 500, description: '' },
      { name: 'Water Intake', type: 'QUANTITATIVE', unit: 'liters', targetValue: 2.5, description: '' },
      { name: 'Stretching', type: 'QUANTITATIVE', unit: 'minutes', targetValue: 15, description: 'Yoga or mobility' },
      { name: 'Cardio', type: 'QUANTITATIVE', unit: 'minutes', targetValue: 30, description: 'Running/cycling' },
    ],
  },
  {
    name: '💼 Work & Productivity',
    icon: 'briefcase',
    color: '#3b82f6',
    tasks: [
      { name: 'Deep Work', type: 'QUANTITATIVE', unit: 'hours', targetValue: 4, description: '' },
      { name: 'Inbox Zero', type: 'BINARY', unit: '', targetValue: 0, description: '' },
      { name: 'Standup', type: 'BINARY', unit: '', targetValue: 0, description: 'Daily standup / planning' },
      { name: 'Skill Learning', type: 'QUANTITATIVE', unit: 'minutes', targetValue: 30, description: 'Coding / language courses' },
      { name: 'Networking', type: 'BINARY', unit: '', targetValue: 0, description: 'Reach out to contacts' },
      { name: 'Documentation', type: 'BINARY', unit: '', targetValue: 0, description: 'Daily logs / reports' },
    ],
  },
  {
    name: '🧠 Mental Health',
    icon: 'sparkles',
    color: '#a855f7',
    tasks: [
      { name: 'Meditation', type: 'QUANTITATIVE', unit: 'minutes', targetValue: 10, description: '' },
      { name: 'Journaling', type: 'BINARY', unit: '', targetValue: 0, description: 'Write thoughts / reflections' },
      { name: 'Gratitude', type: 'BINARY', unit: '', targetValue: 0, description: 'List 3 things grateful for' },
      { name: 'Therapy / Reflection', type: 'BINARY', unit: '', targetValue: 0, description: 'Mental check-in' },
      { name: 'Breathing Exercises', type: 'QUANTITATIVE', unit: 'minutes', targetValue: 5, description: '' },
    ],
  },
  {
    name: '🏡 Home & Life',
    icon: 'home',
    color: '#f59e0b',
    tasks: [
      { name: 'Quick Tidy', type: 'BINARY', unit: '', targetValue: 0, description: '15-min daily reset of space' },
      { name: 'Meal Prep', type: 'BINARY', unit: '', targetValue: 0, description: 'Cook healthy options ahead' },
      { name: 'Financial Log', type: 'BINARY', unit: '', targetValue: 0, description: 'Log expenses for the day' },
      { name: 'Plant / Pet Care', type: 'BINARY', unit: '', targetValue: 0, description: 'Water plants / feed pets' },
      { name: 'Chores', type: 'BINARY', unit: '', targetValue: 0, description: 'Rotational household tasks' },
    ],
  },
  {
    name: '📚 Personal Growth',
    icon: 'book',
    color: '#14b8a6',
    tasks: [
      { name: 'Reading', type: 'QUANTITATIVE', unit: 'pages', targetValue: 20, description: '' },
      { name: 'Gaming', type: 'QUANTITATIVE', unit: 'hours', targetValue: 2, description: 'Intentional gaming session' },
      { name: 'Creative Project', type: 'QUANTITATIVE', unit: 'minutes', targetValue: 30, description: 'Writing / art / passion project' },
      { name: 'Podcast / Audiobook', type: 'QUANTITATIVE', unit: 'minutes', targetValue: 20, description: 'During commute / passive time' },
    ],
  },
]

function db() {
  return createClient({
    url: process.env.TURSO_DATABASE_URL ?? 'file:dev.db',
    authToken: process.env.TURSO_AUTH_TOKEN,
  })
}

function uid() {
  return crypto.randomUUID()
}

function now() {
  return new Date().toISOString()
}

export async function POST(_req: NextRequest) {
  const client = db()

  // ── 1. Ensure schema exists ───────────────────────────────────────────────
  await client.executeMultiple(`
    CREATE TABLE IF NOT EXISTS "Category" (
      "id"        TEXT     NOT NULL PRIMARY KEY,
      "name"      TEXT     NOT NULL,
      "icon"      TEXT     NOT NULL DEFAULT '',
      "color"     TEXT     NOT NULL DEFAULT '#6366f1',
      "isDefault" INTEGER  NOT NULL DEFAULT 0,
      "sortOrder" INTEGER  NOT NULL DEFAULT 0,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS "Task" (
      "id"           TEXT     NOT NULL PRIMARY KEY,
      "categoryId"   TEXT     NOT NULL,
      "name"         TEXT     NOT NULL,
      "description"  TEXT     NOT NULL DEFAULT '',
      "type"         TEXT     NOT NULL DEFAULT 'BINARY',
      "unit"         TEXT     NOT NULL DEFAULT '',
      "targetValue"  REAL     NOT NULL DEFAULT 0,
      "reminderTime" TEXT,
      "scheduledDays" TEXT    NOT NULL DEFAULT '',
      "isActive"     INTEGER  NOT NULL DEFAULT 1,
      "isDefault"    INTEGER  NOT NULL DEFAULT 0,
      "sortOrder"    INTEGER  NOT NULL DEFAULT 0,
      "createdAt"    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt"    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Task_categoryId_fkey"
        FOREIGN KEY ("categoryId") REFERENCES "Category" ("id")
        ON DELETE CASCADE ON UPDATE CASCADE
    );
    CREATE TABLE IF NOT EXISTS "DailyLog" (
      "id"        TEXT     NOT NULL PRIMARY KEY,
      "taskId"    TEXT     NOT NULL,
      "date"      TEXT     NOT NULL,
      "completed" INTEGER  NOT NULL DEFAULT 0,
      "value"     REAL     NOT NULL DEFAULT 0,
      "notes"     TEXT     NOT NULL DEFAULT '',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "DailyLog_taskId_fkey"
        FOREIGN KEY ("taskId") REFERENCES "Task" ("id")
        ON DELETE CASCADE ON UPDATE CASCADE
    );
    CREATE UNIQUE INDEX IF NOT EXISTS "DailyLog_taskId_date_key"
      ON "DailyLog"("taskId", "date");
  `)

  try {
    await client.execute(`ALTER TABLE "Task" ADD COLUMN "scheduledDays" TEXT NOT NULL DEFAULT ''`)
  } catch { /* column already exists */ }

  // ── 2. Seed categories & tasks ────────────────────────────────────────────
  let created = 0
  let skipped = 0

  for (let ci = 0; ci < DEFAULTS.length; ci++) {
    const cat = DEFAULTS[ci]

    const existing = await client.execute({
      sql: `SELECT id FROM "Category" WHERE name = ? LIMIT 1`,
      args: [cat.name],
    })

    if (existing.rows.length > 0) {
      skipped++
      continue
    }

    const catId = uid()
    const ts = now()

    await client.execute({
      sql: `INSERT INTO "Category" (id, name, icon, color, isDefault, sortOrder, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, 1, ?, ?, ?)`,
      args: [catId, cat.name, cat.icon, cat.color, ci, ts, ts],
    })

    for (let ti = 0; ti < cat.tasks.length; ti++) {
      const t = cat.tasks[ti]
      await client.execute({
        sql: `INSERT INTO "Task" (id, categoryId, name, description, type, unit, targetValue, scheduledDays, isActive, isDefault, sortOrder, createdAt, updatedAt)
              VALUES (?, ?, ?, ?, ?, ?, ?, '', 1, 1, ?, ?, ?)`,
        args: [uid(), catId, t.name, t.description, t.type, t.unit, t.targetValue, ti, ts, ts],
      })
    }

    created++
  }

  client.close()
  return Response.json({ created, skipped }, { status: 201 })
}
