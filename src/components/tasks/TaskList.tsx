'use client'

type Task = {
  id?: string
  title: string
  description?: string | null
  due_date: string
  completed?: boolean
}

import { useEffect, useState } from 'react'
import TaskItem from './TaskItem'

export default function TaskList({ caseId }: { caseId: string }) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await fetch(`/api/tasks?case_id=${caseId}`)
        const data = await res.json()
        setTasks(data)
      } catch (error) {
        console.error('Error fetching tasks:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTasks()
  }, [caseId])

  if (loading) return <div>Loading tasks...</div>

  return (
    <div className="space-y-2">
      {tasks.length > 0 ? (
        tasks.map((task) => <TaskItem key={task.id} task={task} />)
      ) : (
        <p>No tasks found</p>
      )}
    </div>
  )
}