import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const categoryId = searchParams.get('categoryId')

  const tasks = await prisma.task.findMany({
    where: {
      isActive: true,
      ...(categoryId ? { categoryId } : {}),
    },
    orderBy: [{ categoryId: 'asc' }, { sortOrder: 'asc' }],
    include: { category: true },
  })

  return Response.json(tasks)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const {
    categoryId,
    name,
    description = '',
    type = 'BINARY',
    unit = '',
    targetValue = 0,
    reminderTime = '',
    scheduledDays = '',
  } = body

  if (!categoryId || !name?.trim()) {
    return Response.json({ error: 'categoryId and name are required' }, { status: 400 })
  }

  const count = await prisma.task.count({ where: { categoryId } })
  const task = await prisma.task.create({
    data: {
      categoryId,
      name: name.trim(),
      description,
      type,
      unit,
      targetValue: Number(targetValue),
      reminderTime,
      scheduledDays,
      sortOrder: count,
    },
    include: { category: true },
  })

  return Response.json(task, { status: 201 })
}
