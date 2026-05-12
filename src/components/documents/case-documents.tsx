'use client'

import { FormEvent, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Download, FileText, Upload } from 'lucide-react'
import { downloadCaseDocument, registerUploadedCaseDocument } from '@/app/cases/[id]/documents/actions'
import { createClient } from '@/utils/supabase/client'

type CaseDocument = {
  id: string
  file_name: string
  file_size: number | null
  file_type: string | null
  created_at: string | null
}

type CaseDocumentsProps = {
  caseId: string
  documents: CaseDocument[]
}

const DOCUMENTS_BUCKET = 'documents'
const MAX_FILE_SIZE = 20 * 1024 * 1024

function formatFileSize(size: number | null) {
  if (!size) {
    return 'Dimensione non disponibile'
  }

  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

function sanitizeFileName(fileName: string) {
  return fileName
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120) || 'documento'
}

export function CaseDocuments({ caseId, documents }: CaseDocumentsProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isPending, startTransition] = useTransition()
  const [isUploading, setIsUploading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const isBusy = isUploading || isPending

  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(null)

    const file = fileInputRef.current?.files?.[0]
    if (!file) {
      setMessage('Seleziona un file.')
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      setMessage('Il file supera il limite di 20 MB.')
      return
    }

    const filePath = `${caseId}/${crypto.randomUUID()}-${sanitizeFileName(file.name)}`
    const supabase = createClient()
    setIsUploading(true)
    const { error: uploadError } = await supabase.storage.from(DOCUMENTS_BUCKET).upload(filePath, file, {
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    })
    setIsUploading(false)

    if (uploadError) {
      setMessage('Caricamento non riuscito.')
      return
    }

    const formData = new FormData()
    formData.set('caseId', caseId)
    formData.set('fileName', file.name)
    formData.set('filePath', filePath)
    formData.set('fileType', file.type)
    formData.set('fileSize', String(file.size))

    startTransition(async () => {
      const result = await registerUploadedCaseDocument(formData)

      if (!result.ok) {
        await supabase.storage.from(DOCUMENTS_BUCKET).remove([filePath])
        setMessage(result.message ?? 'Metadati non salvati.')
        return
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      setMessage('Documento caricato.')
      router.refresh()
    })
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-lg font-medium">Documenti Allegati</h2>
        </div>
        <form onSubmit={handleUpload} className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            ref={fileInputRef}
            type="file"
            name="document"
            required
            disabled={isBusy}
            className="block w-full text-sm text-gray-700 file:mr-3 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-200 sm:w-64"
          />
          <button
            type="submit"
            disabled={isBusy}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            <Upload size={16} aria-hidden="true" />
            {isBusy ? 'Caricamento' : 'Carica'}
          </button>
        </form>
      </div>
      {message ? <p className="mb-4 text-sm text-gray-600">{message}</p> : null}

      {documents.length === 0 ? (
        <p className="text-sm text-gray-500">Nessun documento caricato per questa pratica.</p>
      ) : (
        <ul className="divide-y divide-gray-200 border-t border-gray-200">
          {documents.map((document) => (
            <li key={document.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <FileText className="mt-0.5 h-5 w-5 shrink-0 text-gray-400" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-950">{document.file_name}</p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(document.file_size)}
                    {document.created_at ? ` - ${new Date(document.created_at).toLocaleDateString('it-IT')}` : ''}
                  </p>
                </div>
              </div>
              <form action={downloadCaseDocument}>
                <input type="hidden" name="caseId" value={caseId} />
                <input type="hidden" name="documentId" value={document.id} />
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <Download size={16} aria-hidden="true" />
                  Scarica
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
