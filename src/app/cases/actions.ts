'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { z } from 'zod'

const taskSchema = z.object({
  case_id: z.string().uuid(),
  title: z.string().min(1, 'Il titolo è obbligatorio'),
  description: z.string().optional(),
  due_date: z.string().optional(),
})

export async function addTask(formData: FormData) {
  const supabase = await createClient()

  const caseId = formData.get('case_id') as string
  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const dueDateStr = formData.get('due_date') as string

  const parsedData = taskSchema.safeParse({
    case_id: caseId,
    title,
    description: description || undefined,
    due_date: dueDateStr || undefined,
  })

  if (!parsedData.success) {
    return { error: 'Dati non validi' }
  }

  const { error } = await supabase.from('tasks').insert([{
    case_id: parsedData.data.case_id,
    title: parsedData.data.title,
    description: parsedData.data.description,
    due_date: parsedData.data.due_date ? new Date(parsedData.data.due_date).toISOString() : null,
  }] as any) // eslint-disable-line @typescript-eslint/no-explicit-any

  if (error) {
    return { error: 'Errore durante la creazione del task' }
  }

  revalidatePath(`/cases/${caseId}`)
  return { success: true }
}

export async function toggleTaskCompletion(taskId: string, caseId: string, isCompleted: boolean) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('tasks')
    // @ts-expect-error - Update arguments generic constraint with Supabase client typing sometimes fails for simple updates
    .update({ is_completed: isCompleted })
    .eq('id', taskId)

  if (error) {
    return { error: 'Errore durante l\'aggiornamento del task' }
  }

  revalidatePath(`/cases/${caseId}`)
  return { success: true }
}

export async function deleteTask(taskId: string, caseId: string) {
  const supabase = await createClient()

  const { error } = await supabase.from('tasks').delete().eq('id', taskId)

  if (error) {
    return { error: 'Errore durante l\'eliminazione del task' }
  }

  revalidatePath(`/cases/${caseId}`)
  return { success: true }
}

const noteSchema = z.object({
  case_id: z.string().uuid(),
  content: z.string().min(1, 'Il contenuto della nota è obbligatorio'),
  is_private: z.boolean().default(false),
})

export async function addNote(formData: FormData) {
  const supabase = await createClient()

  const caseId = formData.get('case_id') as string
  const content = formData.get('content') as string
  const isPrivate = formData.get('is_private') === 'true'

  const parsedData = noteSchema.safeParse({
    case_id: caseId,
    content,
    is_private: isPrivate,
  })

  if (!parsedData.success) {
    return { error: 'Dati non validi' }
  }

  const { data: userData, error: userError } = await supabase.auth.getUser()

  if (userError || !userData.user) {
    return { error: 'Utente non autenticato' }
  }

  const { error } = await supabase.from('notes').insert([{
    case_id: parsedData.data.case_id,
    content: parsedData.data.content,
    is_private: parsedData.data.is_private,
    created_by: userData.user.id,
  }] as any) // eslint-disable-line @typescript-eslint/no-explicit-any

  if (error) {
    return { error: 'Errore durante la creazione della nota' }
  }

  revalidatePath(`/cases/${caseId}`)
  return { success: true }
}

export async function deleteNote(noteId: string, caseId: string) {
  const supabase = await createClient()

  const { error } = await supabase.from('notes').delete().eq('id', noteId)

  if (error) {
    return { error: 'Errore durante l\'eliminazione della nota' }
  }

  revalidatePath(`/cases/${caseId}`)
  return { success: true }
}
