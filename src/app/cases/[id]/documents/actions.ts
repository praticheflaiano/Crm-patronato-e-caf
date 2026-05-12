'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getOrCreateUserProfile } from '@/lib/user-profile'
import { createClient } from '@/utils/supabase/server'

const DOCUMENTS_BUCKET = 'documents'
const MAX_FILE_SIZE = 20 * 1024 * 1024

export async function registerUploadedCaseDocument(formData: FormData) {
  const caseId = String(formData.get('caseId') || '')
  const fileName = String(formData.get('fileName') || '')
  const filePath = String(formData.get('filePath') || '')
  const fileType = String(formData.get('fileType') || '') || null
  const fileSize = Number(formData.get('fileSize') || 0)

  if (
    !caseId ||
    !fileName ||
    !filePath.startsWith(`${caseId}/`) ||
    !Number.isFinite(fileSize) ||
    fileSize <= 0 ||
    fileSize > MAX_FILE_SIZE
  ) {
    return { ok: false, message: 'Documento non valido.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false, message: 'Accesso richiesto.' }
  }

  const profile = await getOrCreateUserProfile(user)
  if (!profile) {
    return { ok: false, message: 'Profilo utente non disponibile.' }
  }

  const { data: caseItemRaw, error: caseError } = await supabase
    .from('cases')
    .select('id, contact_id, organization_id')
    .eq('id', caseId)
    .single()

  if (caseError || !caseItemRaw) {
    return { ok: false, message: 'Pratica non trovata.' }
  }

  const caseItem = caseItemRaw as {
    id: string
    contact_id: string | null
    organization_id: string
  }

  const { error: metadataError } = await supabase.from('documents').insert({
    case_id: caseItem.id,
    contact_id: caseItem.contact_id,
    file_name: fileName,
    file_path: filePath,
    file_type: fileType,
    file_size: fileSize,
    uploaded_by: user.id,
    organization_id: caseItem.organization_id,
  } as any /* eslint-disable-line @typescript-eslint/no-explicit-any */)

  if (metadataError) {
    return { ok: false, message: 'Metadati non salvati.' }
  }

  revalidatePath(`/cases/${caseId}`)
  return { ok: true }
}

export async function downloadCaseDocument(formData: FormData) {
  const documentId = String(formData.get('documentId') || '')
  const caseId = String(formData.get('caseId') || '')

  if (!documentId || !caseId) {
    redirect(`/cases/${caseId || ''}`)
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: documentRaw, error } = await supabase
    .from('documents')
    .select('file_name, file_path')
    .eq('id', documentId)
    .eq('case_id', caseId)
    .single()

  if (error || !documentRaw) {
    redirect('/error')
  }

  const document = documentRaw as {
    file_name: string
    file_path: string
  }

  const { data, error: signedUrlError } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .createSignedUrl(document.file_path, 60, {
      download: document.file_name,
    })

  if (signedUrlError || !data?.signedUrl) {
    redirect('/error')
  }

  redirect(data.signedUrl)
}
