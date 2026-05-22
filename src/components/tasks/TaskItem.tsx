'use client'

type Task = {
  id?: string
  title: string
  description?: string | null
  due_date: string
  completed?: boolean
}

export default function TaskItem({ task }: { task: Task }) {
  return (
    <div className="p-4 border rounded-lg">
      <h3 className="font-medium">{task.title}</h3>
      <p className="text-sm text-gray-600">{task.description}</p>
      <div className="flex items-center mt-2 text-xs text-gray-500">
        <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
      </div>
    </div>
  )
}