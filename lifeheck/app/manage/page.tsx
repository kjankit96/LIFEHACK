'use client'

import { useState, useEffect } from 'react'
import { Loader2, Trash2, Plus } from 'lucide-react'
import type { Category, Task } from '@/lib/types'

export default function ManagePage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [showTaskForm, setShowTaskForm] = useState<string | null>(null)
  const [newCatName, setNewCatName] = useState('')
  const [newCatIcon, setNewCatIcon] = useState('folder')
  const [newCatColor, setNewCatColor] = useState('#6366f1')
  const [newTaskName, setNewTaskName] = useState('')
  const [newTaskType, setNewTaskType] = useState('BINARY')
  const [newTaskUnit, setNewTaskUnit] = useState('')
  const [newTaskTarget, setNewTaskTarget] = useState('0')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const res = await fetch('/api/categories')
    const cats = await res.json()
    setCategories(cats)
    setLoading(false)
  }

  async function createCategory() {
    if (!newCatName.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCatName, icon: newCatIcon, color: newCatColor }),
      })
      const cat = await res.json()
      setCategories([...categories, cat])
      setNewCatName('')
      setNewCatIcon('folder')
      setNewCatColor('#6366f1')
      setShowCategoryForm(false)
    } finally {
      setSaving(false)
    }
  }

  async function createTask(categoryId: string) {
    if (!newTaskName.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId,
          name: newTaskName,
          type: newTaskType,
          unit: newTaskUnit,
          targetValue: Number(newTaskTarget),
        }),
      })
      await res.json()
      await load()
      setNewTaskName('')
      setNewTaskType('BINARY')
      setNewTaskUnit('')
      setNewTaskTarget('0')
      setShowTaskForm(null)
    } finally {
      setSaving(false)
    }
  }

  async function deleteCategory(id: string) {
    if (!confirm('Delete this category?')) return
    await fetch(`/api/categories/${id}`, { method: 'DELETE' })
    setCategories(categories.filter(c => c.id !== id))
  }

  async function deleteTask(id: string) {
    if (!confirm('Delete this task?')) return
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
    await load()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 py-10">
        <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
        <p className="text-[#8888a0]">Loading…</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white mb-4">Manage</h1>
      </div>

      {/* Categories Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Categories</h2>
          <button
            onClick={() => setShowCategoryForm(!showCategoryForm)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>

        {showCategoryForm && (
          <div className="mb-6 p-4 rounded-lg border border-[#2e2e35] bg-[#1a1a1f] space-y-3">
            <input
              value={newCatName}
              onChange={e => setNewCatName(e.target.value)}
              placeholder="Category name…"
              className="w-full px-3 py-2 rounded border border-[#2e2e35] bg-[#0f0f12] text-white placeholder-[#4e4e60] focus:outline-none focus:border-indigo-500"
            />
            <input
              value={newCatIcon}
              onChange={e => setNewCatIcon(e.target.value)}
              placeholder="Icon name…"
              className="w-full px-3 py-2 rounded border border-[#2e2e35] bg-[#0f0f12] text-white placeholder-[#4e4e60] focus:outline-none focus:border-indigo-500"
            />
            <input
              value={newCatColor}
              type="color"
              onChange={e => setNewCatColor(e.target.value)}
              className="w-12 h-10 rounded cursor-pointer"
            />
            <div className="flex gap-2">
              <button
                onClick={createCategory}
                disabled={saving || !newCatName.trim()}
                className="px-4 py-2 rounded bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white font-medium text-sm"
              >
                Create
              </button>
              <button
                onClick={() => setShowCategoryForm(false)}
                className="px-4 py-2 rounded border border-[#2e2e35] text-white font-medium text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {categories.map(cat => (
            <div key={cat.id} className="p-4 rounded-lg border border-[#2e2e35] bg-[#1a1a1f]">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-white">{cat.name}</p>
                  <p className="text-xs text-[#8888a0]">{cat.tasks?.length ?? 0} tasks</p>
                </div>
                <button
                  onClick={() => deleteCategory(cat.id)}
                  className="p-1.5 rounded hover:bg-[#2e2e35] text-[#8888a0]"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Tasks for this category */}
              <div className="space-y-2 mb-3">
                {(cat.tasks ?? []).map(task => (
                  <div key={task.id} className="flex items-center justify-between p-2 rounded bg-[#0f0f12]">
                    <div>
                      <p className="text-sm font-medium text-white">{task.name}</p>
                      <p className="text-xs text-[#8888a0]">{task.type} {task.unit && `(${task.unit})`}</p>
                    </div>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="p-1 rounded hover:bg-[#2e2e35] text-[#8888a0]"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {showTaskForm === cat.id && (
                <div className="p-3 rounded bg-[#0f0f12] space-y-2 border border-[#2e2e35]">
                  <input
                    value={newTaskName}
                    onChange={e => setNewTaskName(e.target.value)}
                    placeholder="Task name…"
                    className="w-full px-2 py-1.5 rounded border border-[#2e2e35] bg-[#1a1a1f] text-white placeholder-[#4e4e60] text-sm focus:outline-none focus:border-indigo-500"
                  />
                  <select
                    value={newTaskType}
                    onChange={e => setNewTaskType(e.target.value)}
                    className="w-full px-2 py-1.5 rounded border border-[#2e2e35] bg-[#1a1a1f] text-white text-sm focus:outline-none focus:border-indigo-500"
                  >
                    <option>BINARY</option>
                    <option>QUANTITATIVE</option>
                  </select>
                  {newTaskType === 'QUANTITATIVE' && (
                    <>
                      <input
                        value={newTaskUnit}
                        onChange={e => setNewTaskUnit(e.target.value)}
                        placeholder="Unit…"
                        className="w-full px-2 py-1.5 rounded border border-[#2e2e35] bg-[#1a1a1f] text-white placeholder-[#4e4e60] text-sm focus:outline-none focus:border-indigo-500"
                      />
                      <input
                        type="number"
                        value={newTaskTarget}
                        onChange={e => setNewTaskTarget(e.target.value)}
                        placeholder="Target…"
                        className="w-full px-2 py-1.5 rounded border border-[#2e2e35] bg-[#1a1a1f] text-white placeholder-[#4e4e60] text-sm focus:outline-none focus:border-indigo-500"
                      />
                    </>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => createTask(cat.id)}
                      disabled={saving || !newTaskName.trim()}
                      className="px-3 py-1 rounded bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white font-medium text-xs"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => setShowTaskForm(null)}
                      className="px-3 py-1 rounded border border-[#2e2e35] text-white font-medium text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {showTaskForm !== cat.id && (
                <button
                  onClick={() => setShowTaskForm(cat.id)}
                  className="w-full py-1.5 rounded border border-dashed border-[#2e2e35] text-[#8888a0] hover:text-white text-xs font-medium"
                >
                  + Add task
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
