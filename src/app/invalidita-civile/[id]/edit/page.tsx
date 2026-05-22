import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { SetupNotice } from '@/components/setup-notice'
import { hasSupabaseConfig } from '@/utils/supabase/config'
import { createClient } from '@/utils/supabase/server'
import { InvaliditaForm } from '@/components/invalidita/InvaliditaForm'

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function EditInvaliditaPage({ params }: PageProps) {
  if (!hasSupabaseConfig()) {
    return <SetupNotice />
  }

  const { id } = await params
  const supabase = await createClient()

  const { data: caseData, error } = await supabase
    .from('cases')
    .select(`
      *,
      invalidity_details (*)
    `)
    .eq('id', id)
    .eq('type', 'invalidita_civile')
    .single()

  const caseDataTyped = caseData as any

  if (error || !caseDataTyped) {
    notFound()
  }

  const invalidityDetails = caseDataTyped.invalidity_details

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/invalidita-civile/${id}`} className="text-sm font-medium text-slate-500 hover:text-slate-900">
          &larr; Indietro ai dettagli
        </Link>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-950">
          Modifica Dettagli Invalidità
        </h1>
        <p className="mt-1 text-sm text-slate-500">Aggiorna le informazioni sulla pratica di invalidità civile.</p>
      </div>

      <InvaliditaForm
        caseId={id}
        existingData={invalidityDetails}
      />
    </div>
  )
}