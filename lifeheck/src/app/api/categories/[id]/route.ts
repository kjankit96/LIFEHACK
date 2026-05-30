import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    include: { tasks: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } } },
  })

  return Response.json(category)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await prisma.category.delete({ where: { id } })
  return Response.json({ success: true })
}
