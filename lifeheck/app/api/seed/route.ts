import { NextRequest } from 'next/server'
import { createClient } from '@libsql/client'

// 6 default categories with ~32 pre-built tasks total
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
      { name: 'Inbox Zero', type: 'BINARY', unit: '', targetValue: 0 },
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
      { name: 'Meditation', type: 'QUANTITATIVE', unit: 'minutes', targetValue: 10 },
      { name: 'Journaling', type: 'BINARY', unit: '', targetValue: 0, description: 'Write thoughts / reflections' },
      { name: 'Gratitude', type: 'BINARY', unit: '', targetValue: 0, description: 'List 3 things grateful for' },
      { name: 'Therapy / Reflection', type: 'BINARY', unit: '', targetValue: 0, description: 'Mental check-in' },
      { name: 'Breathing Exercises', type: 'QUANTITATIVE', unit: 'minutes', targetValue: 5 },
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
      { name: 'Reading', type: 'QUANTITATIVE', unit: 'pages', targetValue: 20 },
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
  console.log('[seed] Starting seed operation')
  const client = db()

  try {
    // ── Create tables if they don't exist ──────────────────────────────────
    console.log('[seed] Creating schema tables...')
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
        "reminderTime" TEXT     DEFAULT '',
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
    console.log('[seed] Schema created successfully')

    // ── Add scheduledDays column if missing ────────────────────────────────
    try {
      await client.execute(`ALTER TABLE "Task" ADD COLUMN "scheduledDays" TEXT NOT NULL DEFAULT ''`)
      console.log('[seed] Added scheduledDays column')
    } catch {
      // Column already exists, that's fine
    }

    // ── Seed categories and tasks ──────────────────────────────────────────
    let created = 0
    let skipped = 0

    for (let ci = 0; ci < DEFAULTS.length; ci++) {
      const cat = DEFAULTS[ci]
      console.log(`[seed] Processing category: ${cat.name}`)

      // Check if category already exists
      const existing = await client.execute({
        sql: `SELECT id FROM "Category" WHERE name = ? LIMIT 1`,
        args: [cat.name],
      })

      if (existing.rows.length > 0) {
        console.log(`[seed]   → Already exists, skipping`)
        skipped++
        continue
      }

      // Insert category
      const catId = uid()
      const ts = now()

      await client.execute({
        sql: `INSERT INTO "Category" (id, name, icon, color, isDefault, sortOrder, createdAt, updatedAt)
              VALUES (?, ?, ?, ?, 1, ?, ?, ?)`,
        args: [catId, cat.name, cat.icon, cat.color, ci, ts, ts],
      })
      console.log(`[seed]   → Created category (${cat.tasks.length} tasks)`)

      // Insert tasks for this category
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

    console.log(`[seed] Complete: created ${created}, skipped ${skipped}`)
    return Response.json({ created, skipped }, { status: 201 })
  } catch (err) {
    console.error('[seed] Error:', err)
    client.close()
    return Response.json(
      {
        error: 'Seed failed',
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    )
  }
}
