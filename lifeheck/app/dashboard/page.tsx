'use client'
import { useState, useEffect } from 'react'

export default function Dashboard() {
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function init() {
      try {
        // Seed on first load
        await fetch('/api/seed', { method: 'POST' })
      } catch (e) {
        console.error('Seed failed:', e)
      }

      // Load categories
      try {
        const res = await fetch('/api/categories')
        if (res.ok) {
          const data = await res.json()
          setCategories(data)
        }
      } catch (e) {
        console.error('Load failed:', e)
      }
      setLoading(false)
    }
    init()
  }, [])

  if (loading) {
    return <div className="p-8 text-center text-[#8888a0]">Loading...</div>
  }

  if (categories.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-[#8888a0] mb-4">No categories yet</p>
        <button
          onClick={async () => {
            await fetch('/api/seed', { method: 'POST' })
            window.location.reload()
          }}
          className="px-4 py-2 bg-indigo-500 text-white rounded"
        >
          Initialize
        </button>
      </div>
    )
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-6">Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {categories.map((cat: any) => (
          <div
            key={cat.id}
            className="p-4 rounded-lg border border-[#2e2e35] bg-[#1a1a1f]"
          >
            <h2 className="font-semibold text-white">{cat.name}</h2>
            <p className="text-sm text-[#8888a0] mt-1">
              {cat.tasks?.length ?? 0} tasks
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
