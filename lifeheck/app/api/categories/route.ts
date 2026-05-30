import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
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
  } catch (err) {
    console.error('[GET /api/categories]', err)
    return Response.json(
      { error: 'Failed to fetch categories', details: err instanceof Error ? err.message : undefined },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
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
  } catch (err) {
    console.error('[POST /api/categories]', err)
    return Response.json(
      { error: 'Failed to create category', details: err instanceof Error ? err.message : undefined },
      { status: 500 }
    )
  }
}
