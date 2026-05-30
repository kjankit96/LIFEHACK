import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { name, description, type, unit, targetValue, reminderTime, scheduledDays, isActive, categoryId } = body

    const task = await prisma.task.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description }),
        ...(type !== undefined && { type }),
        ...(unit !== undefined && { unit }),
        ...(targetValue !== undefined && { targetValue: Number(targetValue) }),
        ...(reminderTime !== undefined && { reminderTime }),
        ...(scheduledDays !== undefined && { scheduledDays }),
        ...(isActive !== undefined && { isActive }),
        ...(categoryId !== undefined && { categoryId }),
      },
      include: { category: true },
    })

    return Response.json(task)
  } catch (err) {
    console.error('[PUT /api/tasks/[id]]', err)
    return Response.json(
      { error: 'Failed to update task', details: err instanceof Error ? err.message : undefined },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.task.delete({ where: { id } })
    return Response.json({ success: true })
  } catch (err) {
    console.error('[DELETE /api/tasks/[id]]', err)
    return Response.json(
      { error: 'Failed to delete task', details: err instanceof Error ? err.message : undefined },
      { status: 500 }
    )
  }
}
