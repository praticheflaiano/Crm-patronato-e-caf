import { createClient } from '@/utils/supabase/server'
import TaskNotes from '@/components/tasks/TaskNotes'
import { notFound } from 'next/navigation'

type TaskDetailRecord = {
  id: string
  title: string
  description: string | null
}

export default async function TaskDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', id)
    .single()

  const task = data as TaskDetailRecord | null

  if (error || !task) return notFound()

  return (
    <section className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold">{task.title}</h1>
      <p className="mt-2 text-gray-600">{task.description}</p>
      <TaskNotes taskId={task.id} />
    </section>
  )
}