# LifeHeck v2 Deployment Guide

## Local Development

```bash
npm install
npm run dev
```

Open http://localhost:3000

### First Run

1. Navigate to `/dashboard`
2. The seed endpoint is called automatically
3. Default categories will appear on first load

### Testing Endpoints

```bash
# Seed database with default categories
curl -X POST http://localhost:3000/api/seed

# Get all categories
curl http://localhost:3000/api/categories

# Get logs for today
curl 'http://localhost:3000/api/logs?date=2026-05-30'
```

## Vercel Deployment

### 1. Set Environment Variables

In Vercel project dashboard, add to **Production** environment:

```
TURSO_DATABASE_URL=libsql://your-db.aws-us-east-1.turso.io
TURSO_AUTH_TOKEN=your-token
```

### 2. Push to GitHub

```bash
git add .
git commit -m "feat: complete LifeHeck v2 rebuild"
git push origin main
```

### 3. Deploy

Vercel will automatically deploy on push. Wait for deployment to complete (~2 min).

### 4. Verify

1. Visit your Vercel deployment URL
2. Open DevTools → Console
3. Watch for `[seed] Starting seed operation` logs
4. Categories should appear automatically

### Troubleshooting

**"No categories yet" on first load**
- Check Vercel Function logs for seed errors
- Verify `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` are set
- Check that database URL format is correct: `libsql://...`

**"Cannot find module '@prisma/client'"**
- This is already installed, but if you see it:
  - Delete `node_modules` and `.next`
  - Run `npm install`
  - Rebuild: `npm run build`

**Seed fails with "table already exists"**
- This is expected on retry — the endpoint is idempotent
- Check response: `{ "created": 0, "skipped": 6 }`

## Architecture

### Database

- **Provider**: Turso (libSQL) — cloud SQLite
- **Tables**: Category, Task, DailyLog
- **Adapter**: @prisma/adapter-libsql

### API Routes

- `POST /api/seed` — Creates schema and seeds defaults (idempotent)
- `GET/POST /api/categories` — List and create categories
- `PUT/DELETE /api/categories/[id]` — Update and delete categories
- `GET/POST /api/tasks` — List and create tasks
- `PUT/DELETE /api/tasks/[id]` — Update and delete tasks
- `GET/POST /api/logs` — Fetch and upsert daily logs

### Schema

```sql
Category
  id TEXT PRIMARY KEY
  name TEXT
  icon TEXT
  color TEXT
  isDefault BOOLEAN
  sortOrder INTEGER
  createdAt DATETIME
  updatedAt DATETIME

Task
  id TEXT PRIMARY KEY
  categoryId TEXT (FK → Category)
  name TEXT
  description TEXT
  type TEXT (BINARY | QUANTITATIVE)
  unit TEXT
  targetValue FLOAT
  reminderTime TEXT
  scheduledDays TEXT (comma-separated 0-6)
  isActive BOOLEAN
  isDefault BOOLEAN
  sortOrder INTEGER
  createdAt DATETIME
  updatedAt DATETIME

DailyLog
  id TEXT PRIMARY KEY
  taskId TEXT (FK → Task)
  date TEXT (YYYY-MM-DD)
  completed BOOLEAN
  value FLOAT
  notes TEXT
  createdAt DATETIME
  updatedAt DATETIME
  @@unique([taskId, date])
```

## Features Implemented

✓ 6 default categories with 32 pre-built tasks
✓ Binary task logging (Done/Not Done)
✓ Quantitative tracking (log numbers)
✓ Weekly scheduling (scheduledDays per task)
✓ Mobile-first glassmorphism UI
✓ Category grid → task drill-down navigation
✓ Dashboard with progress tracking
✓ Calendar with monthly view
✓ Analytics with 30-day charts
✓ Manage page (create/edit/delete)
✓ Real-time UI updates via Prisma
✓ Error handling and logging
✓ Idempotent seed endpoint

## Future Enhancements

- Web Notifications for reminders
- Streak calculations
- Consistency heatmaps in calendar
- Custom task creation UI improvements
- Data export/import
- Dark/light theme toggle
- Offline support (PWA)
