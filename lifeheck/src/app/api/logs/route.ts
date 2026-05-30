import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const date = searchParams.get('date')
  const taskId = searchParams.get('taskId')
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  const logs = await prisma.dailyLog.findMany({
    where: {
      ...(date ? { date } : {}),
      ...(taskId ? { taskId } : {}),
      ...(from && to ? { date: { gte: from, lte: to } } : {}),
    },
    include: { task: { include: { category: true } } },
    orderBy: { date: 'desc' },
  })

  return Response.json(logs)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { taskId, date, completed, value = 0, notes = '' } = body

  if (!taskId || !date) {
    return Response.json({ error: 'taskId and date are required' }, { status: 400 })
  }

  const log = await prisma.dailyLog.upsert({
    where: { taskId_date: { taskId, date } },
    create: { taskId, date, completed: Boolean(completed), value: Number(value), notes },
    update: { completed: Boolean(completed), value: Number(value), notes },
    include: { task: { include: { category: true } } },
  })

  return Response.json(log)
}
