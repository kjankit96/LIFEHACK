import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const date = req.nextUrl.searchParams.get('date')
    const taskId = req.nextUrl.searchParams.get('taskId')
    const from = req.nextUrl.searchParams.get('from')
    const to = req.nextUrl.searchParams.get('to')

    const logs = await prisma.dailyLog.findMany({
      where: {
        ...(date && { date }),
        ...(taskId && { taskId }),
        ...(from && to && { date: { gte: from, lte: to } }),
      },
      orderBy: { date: 'desc' },
      include: { task: true },
    })

    return Response.json(logs)
  } catch (err) {
    console.error('[GET /api/logs]', err)
    return Response.json(
      { error: 'Failed to fetch logs', details: err instanceof Error ? err.message : undefined },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { taskId, date, completed = false, value = 0, notes = '' } = body

    if (!taskId || !date) {
      return Response.json({ error: 'taskId and date are required' }, { status: 400 })
    }

    const log = await prisma.dailyLog.upsert({
      where: { taskId_date: { taskId, date } },
      update: { completed, value: Number(value), notes },
      create: { taskId, date, completed, value: Number(value), notes },
      include: { task: true },
    })

    return Response.json(log, { status: 201 })
  } catch (err) {
    console.error('[POST /api/logs]', err)
    return Response.json(
      { error: 'Failed to create log', details: err instanceof Error ? err.message : undefined },
      { status: 500 }
    )
  }
}
