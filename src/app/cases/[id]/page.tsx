import Link from 'next/link'
import { Edit } from 'lucide-react'
import { CaseDocuments } from '@/components/documents/case-documents'
import { CaseTasks } from '@/components/cases/case-tasks'
import { CaseNotes } from '@/components/cases/case-notes'
import { SetupNotice } from '@/components/setup-notice'
import { getAllowedNextStatuses, getCaseStatusMeta, getCaseTypeLabel, type CaseStatus } from '@/lib/case-workflow'
import { hasSupabaseConfig } from '@/utils/supabase/config'
import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'

export default async function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  if (!hasSupabaseConfig()) {
    return <SetupNotice />
  }

  const { id } = await params; const supabase = await createClient()

  const { data: userData } = await supabase.auth.getUser()

  const { data: caseItemRaw, error } = await supabase
    .from('cases')
    .select(`
      *,
      contacts (*),
      documents (*),
      tasks (*),
      notes (
        *,
        profiles:created_by (full_name)
      )
    `)
    .eq('id', id)
    .single()

  if (error || !caseItemRaw) {
    notFound()
  }

  const caseItem = caseItemRaw as any /* eslint-disable-line @typescript-eslint/no-explicit-any */
  const statusMeta = getCaseStatusMeta(caseItem.status)
  const nextStatuses = getAllowedNextStatuses(caseItem.status as CaseStatus | null)

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <Link href="/cases" className="text-sm font-medium text-slate-500 hover:text-slate-900">
            &larr; Indietro alle Pratiche
          </Link>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-950">Dettaglio Pratica</h1>
        </div>
        <Link href={`/cases/${caseItem.id}/edit`} className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">
          <Edit size={16} aria-hidden="true" />
          Modifica
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold">{caseItem.title}</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Creata il: {new Date(caseItem.created_at!).toLocaleDateString('it-IT')}
                </p>
              </div>
              <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ring-1 ring-inset ${statusMeta.badgeClassName}`}>
                {statusMeta.label}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 border-t border-gray-100 pt-4 sm:grid-cols-2">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Tipo pratica</h3>
                <p className="mt-1 text-sm font-semibold text-gray-900">{getCaseTypeLabel(caseItem.type)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Prossimi stati consentiti</h3>
                {nextStatuses.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {nextStatuses.map((status) => {
                      const nextStatusMeta = getCaseStatusMeta(status)

                      return (
                        <span key={status} className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${nextStatusMeta.badgeClassName}`}>
                          {nextStatusMeta.label}
                        </span>
                      )
                    })}
                  </div>
                ) : (
                  <p className="mt-1 text-sm text-gray-500">Nessuna transizione disponibile.</p>
                )}
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-500">Descrizione</h3>
              <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                {caseItem.description || 'Nessuna descrizione.'}
              </p>
            </div>
          </div>

          <CaseDocuments caseId={caseItem.id} documents={caseItem.documents ?? []} />
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-medium mb-4">Informazioni Contatto</h2>
            {caseItem.contacts ? (
              <div className="space-y-2 text-sm">
                <p><strong>Nome:</strong> {caseItem.contacts.last_name} {caseItem.contacts.first_name}</p>
                <p><strong>CF:</strong> {caseItem.contacts.fiscal_code}</p>
                {caseItem.contacts.email && <p><strong>Email:</strong> {caseItem.contacts.email}</p>}
                {caseItem.contacts.phone && <p><strong>Telefono:</strong> {caseItem.contacts.phone}</p>}
                <Link href={`/contacts/${caseItem.contacts.id}`} className="text-blue-600 hover:underline mt-2 inline-block">
                  Vedi profilo completo &rarr;
                </Link>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Nessun contatto associato.</p>
            )}
          </div>

          <CaseTasks caseId={caseItem.id} tasks={[...(caseItem.tasks || [])].sort((a: { created_at: string }, b: { created_at: string }) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())} />
          <CaseNotes caseId={caseItem.id} notes={[...(caseItem.notes || [])].sort((a: { created_at: string }, b: { created_at: string }) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())} currentUserId={userData.user?.id || ''} />
        </div>
      </div>
    </div>
  )
}
