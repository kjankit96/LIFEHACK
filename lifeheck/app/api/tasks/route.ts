import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const categoryId = req.nextUrl.searchParams.get('categoryId')

    const tasks = await prisma.task.findMany({
      where: {
        ...(categoryId && { categoryId }),
        isActive: true,
      },
      orderBy: { sortOrder: 'asc' },
      include: { category: true },
    })

    return Response.json(tasks)
  } catch (err) {
    console.error('[GET /api/tasks]', err)
    return Response.json(
      { error: 'Failed to fetch tasks', details: err instanceof Error ? err.message : undefined },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { categoryId, name, type = 'BINARY', unit = '', targetValue = 0, description = '', scheduledDays = '' } = body

    if (!categoryId || !name?.trim()) {
      return Response.json({ error: 'categoryId and name are required' }, { status: 400 })
    }

    const count = await prisma.task.count({ where: { categoryId } })
    const task = await prisma.task.create({
      data: {
        categoryId,
        name: name.trim(),
        type,
        unit,
        targetValue: Number(targetValue),
        description,
        scheduledDays,
        sortOrder: count,
      },
      include: { category: true },
    })

    return Response.json(task, { status: 201 })
  } catch (err) {
    console.error('[POST /api/tasks]', err)
    return Response.json(
      { error: 'Failed to create task', details: err instanceof Error ? err.message : undefined },
      { status: 500 }
    )
  }
}
