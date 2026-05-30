import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const date = req.nextUrl.searchParams.get('date')
    const from = req.nextUrl.searchParams.get('from')
    const to = req.nextUrl.searchParams.get('to')
    const logs = await prisma.dailyLog.findMany({
      where: {
        ...(date && { date }),
        ...(from && to && { date: { gte: from, lte: to } }),
      },
      orderBy: { date: 'desc' },
    })
    return Response.json(logs)
  } catch (err) {
    console.error('[GET /api/logs]', err)
    return Response.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { taskId, date, completed = false, value = 0 } = await req.json()
    if (!taskId || !date) return Response.json({ error: 'taskId and date required' }, { status: 400 })
    const log = await prisma.dailyLog.upsert({
      where: { taskId_date: { taskId, date } },
      update: { completed, value: Number(value) },
      create: { taskId, date, completed, value: Number(value) },
    })
    return Response.json(log, { status: 201 })
  } catch (err) {
    console.error('[POST /api/logs]', err)
    return Response.json({ error: String(err) }, { status: 500 })
  }
}
