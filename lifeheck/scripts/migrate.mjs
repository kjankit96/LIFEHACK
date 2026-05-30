/**
 * Applies the database schema to Turso (libSQL) using IF NOT EXISTS guards.
 * Run via: node scripts/migrate.mjs
 * Used in the Vercel build: "build": "node scripts/migrate.mjs && next build"
 */
import { createClient } from '@libsql/client'

const url = process.env.TURSO_DATABASE_URL ?? 'file:dev.db'
const authToken = process.env.TURSO_AUTH_TOKEN

const client = createClient({ url, authToken })

const statements = [
  `CREATE TABLE IF NOT EXISTS "Category" (
    "id"        TEXT    NOT NULL PRIMARY KEY,
    "name"      TEXT    NOT NULL,
    "icon"      TEXT    NOT NULL DEFAULT 'folder',
    "color"     TEXT    NOT NULL DEFAULT '#6366f1',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS "Task" (
    "id"           TEXT    NOT NULL PRIMARY KEY,
    "categoryId"   TEXT    NOT NULL,
    "name"         TEXT    NOT NULL,
    "description"  TEXT    NOT NULL DEFAULT '',
    "type"         TEXT    NOT NULL DEFAULT 'BINARY',
    "unit"         TEXT    NOT NULL DEFAULT '',
    "targetValue"  REAL    NOT NULL DEFAULT 0,
    "reminderTime" TEXT    NOT NULL DEFAULT '',
    "isActive"     BOOLEAN NOT NULL DEFAULT true,
    "isDefault"    BOOLEAN NOT NULL DEFAULT false,
    "sortOrder"    INTEGER NOT NULL DEFAULT 0,
    "createdAt"    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Task_categoryId_fkey"
      FOREIGN KEY ("categoryId") REFERENCES "Category" ("id")
      ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "DailyLog" (
    "id"        TEXT    NOT NULL PRIMARY KEY,
    "taskId"    TEXT    NOT NULL,
    "date"      TEXT    NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "value"     REAL    NOT NULL DEFAULT 0,
    "notes"     TEXT    NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DailyLog_taskId_fkey"
      FOREIGN KEY ("taskId") REFERENCES "Task" ("id")
      ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "DailyLog_taskId_date_key"
    ON "DailyLog"("taskId", "date")`,
]

console.log(`Applying schema to: ${url.replace(/^libsql:\/\//, '').split('.')[0]}`)

for (const sql of statements) {
  await client.execute(sql)
  const name = sql.match(/"(\w+)"/)?.[1] ?? '?'
  console.log(`  ✓ ${name}`)
}

console.log('Schema applied.')
