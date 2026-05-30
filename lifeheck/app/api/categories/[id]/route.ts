import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { name, icon, color } = body

    const category = await prisma.category.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(icon !== undefined && { icon }),
        ...(color !== undefined && { color }),
      },
      include: { tasks: true },
    })

    return Response.json(category)
  } catch (err) {
    console.error('[PUT /api/categories/[id]]', err)
    return Response.json(
      { error: 'Failed to update category', details: err instanceof Error ? err.message : undefined },
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
    await prisma.category.delete({ where: { id } })
    return Response.json({ success: true })
  } catch (err) {
    console.error('[DELETE /api/categories/[id]]', err)
    return Response.json(
      { error: 'Failed to delete category', details: err instanceof Error ? err.message : undefined },
      { status: 500 }
    )
  }
}
