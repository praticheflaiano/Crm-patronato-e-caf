
'use client'
import { useState } from 'react'

export default function TaskForm({ caseId }: { caseId: string }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    due_date: '',
    case_id: caseId
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (!res.ok) throw new Error('Failed to create task')
      // Handle success
    } catch (error) {
      console.error('Error creating task:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label>Title</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({...formData, title: e.target.value})}
          required
        />
      </div>
      {/* Altri campi del form */}
      <button type="submit">Create Task</button>
    </form>
  )
}
