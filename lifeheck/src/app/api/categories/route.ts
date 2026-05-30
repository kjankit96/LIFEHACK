import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: 'asc' },
    include: {
      tasks: {
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      },
    },
  })
  return Response.json(categories)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, icon = 'folder', color = '#6366f1' } = body

  if (!name?.trim()) {
    return Response.json({ error: 'Name is required' }, { status: 400 })
  }

  const count = await prisma.category.count()
  const category = await prisma.category.create({
    data: { name: name.trim(), icon, color, sortOrder: count },
    include: { tasks: true },
  })

  return Response.json(category, { status: 201 })
}
