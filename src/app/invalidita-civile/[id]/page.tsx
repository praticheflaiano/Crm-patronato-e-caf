/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Edit, FileText, User, Calendar, Stethoscope, AlertCircle, CheckCircle } from 'lucide-react'
import { SetupNotice } from '@/components/setup-notice'
import { CaseCollaboration } from '@/components/invalidita/CaseCollaboration'
import { getOrCreateUserProfile } from '@/lib/user-profile'
import { hasSupabaseConfig } from '@/utils/supabase/config'
import { createClient } from '@/utils/supabase/server'
import type { Database } from '@/types/database'

type CaseContact = Database['public']['Tables']['contacts']['Row']
type InvalidityDetails = Database['public']['Tables']['invalidity_details']['Row']
type MedicalCertificate = Database['public']['Tables']['medical_certificates']['Row']

type PageProps = {
  params: Promise<{ id: string }>
}

const DISABILITY_LABELS: Record<string, string> = {
  motoria: 'Motoria',
  visiva: 'Visiva',
  uditiva: 'Uditiva',
  intellettiva: 'Intellettiva',
  psichica: 'Psichica',
  viscerale: 'Viscerale',
  multipla: 'Multipla',
  altra: 'Altra',
}

const ASSESSMENT_LABELS: Record<string, { label: string; bg: string; text: string }> = {
  'in_corso': { label: 'In Corso', bg: 'bg-blue-50', text: 'text-blue-700' },
  'presentata': { label: 'Presentata', bg: 'bg-indigo-50', text: 'text-indigo-700' },
  'in_istruttoria': { label: 'In Istruttoria', bg: 'bg-amber-50', text: 'text-amber-700' },
  'approvata': { label: 'Approvata', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  'respinta': { label: 'Respinta', bg: 'bg-red-50', text: 'text-red-700' },
}

export default async function InvaliditaDetailPage({ params }: PageProps) {
  if (!hasSupabaseConfig()) {
    return <SetupNotice />
  }

  const { id } = await params
  const supabase = await createClient()

  const { data: caseData, error } = await supabase
    .from('cases')
    .select(`
      *,
      contacts (*),
      invalidity_details (*),
      medical_certificates (*)
    `)
    .eq('id', id)
    .eq('type', 'invalidita_civile')
    .single()

  if (error || !caseData) {
    notFound()
  }

  const { data: { user } } = await supabase.auth.getUser()
  const profile = user ? await getOrCreateUserProfile(user) : null
  const canInvite = profile ? ['admin', 'operator'].includes(profile.role) : false

  const caseDataTyped = caseData as any
  const invalidityDetails = caseDataTyped.invalidity_details as InvalidityDetails | null
  const medicalCertificates = (caseDataTyped.medical_certificates || []) as MedicalCertificate[]
  const contact = caseDataTyped.contacts as CaseContact | null

  const assessmentStatus = (invalidityDetails as { assessment_status?: string } | null)?.assessment_status
  const assessmentMeta = assessmentStatus
    ? ASSESSMENT_LABELS[assessmentStatus] || ASSESSMENT_LABELS['in_corso']
    : ASSESSMENT_LABELS['in_corso']

  const isExpired = invalidityDetails?.certification_expiry_date 
    ? new Date(invalidityDetails.certification_expiry_date) < new Date()
    : false

  const isExpiringSoon = invalidityDetails?.certification_expiry_date 
    ? (() => {
        const expiry = new Date(invalidityDetails.certification_expiry_date)
        const now = new Date()
        const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        return daysUntilExpiry <= 30 && daysUntilExpiry > 0
      })()
    : false

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <Link href="/invalidita-civile" className="text-sm font-medium text-slate-500 hover:text-slate-900">
            &larr; Indietro a Invalidità Civile
          </Link>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-950">{caseDataTyped.title}</h1>
          <p className="mt-1 text-sm text-slate-500">
            Pratica creat{caseDataTyped.created_at ? `a il ${new Date(caseDataTyped.created_at).toLocaleDateString('it-IT')}` : 'a'}
          </p>
        </div>
        <Link 
          href={`/invalidita-civile/${caseDataTyped.id}/edit`}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
        >
          <Edit size={16} aria-hidden="true" />
          Modifica Pratica
        </Link>
      </div>

      {/* Warning/Alert Banners */}
      {(isExpired || isExpiringSoon) && (
        <div className={`rounded-lg border p-4 ${isExpired ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'}`}>
          <div className="flex items-start gap-3">
            {isExpired ? (
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" aria-hidden="true" />
            ) : (
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
            )}
            <div className="text-sm">
              <p className={`font-semibold ${isExpired ? 'text-red-800' : 'text-amber-800'}`}>
                {isExpired ? 'Certificato scaduto' : 'Certificato in scadenza'}
              </p>
              <p className={`mt-1 ${isExpired ? 'text-red-700' : 'text-amber-700'}`}>
                {isExpired 
                  ? 'Il certificato medico è scaduto. È necessario renewal un nuovo certificato.'
                  : `Il certificato scadrà tra ${Math.ceil((new Date(invalidityDetails!.certification_expiry_date!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} giorni.`
                }
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Invalidity Details */}
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                <Stethoscope size={20} aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Dettagli Invalidità</h2>
                <p className="text-sm text-slate-500">Informazioni sulla disabilità e iter</p>
              </div>
            </div>

            {invalidityDetails ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                  <div>
                    <p className="text-xs font-medium uppercase text-slate-500">Tipo disabilità</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {DISABILITY_LABELS[invalidityDetails.disability_type] || invalidityDetails.disability_type}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase text-slate-500">Percentuale</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {invalidityDetails.disability_percentage}%
                    </p>
                  </div>
                </div>

                {invalidityDetails.disability_details && (
                  <div>
                    <p className="text-xs font-medium uppercase text-slate-500">Dettagli</p>
                    <p className="mt-1 text-sm text-slate-700">{invalidityDetails.disability_details}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                  <div>
                    <p className="text-xs font-medium uppercase text-slate-500">Stato iter</p>
                    <span className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${assessmentMeta.bg} ${assessmentMeta.text}`}>
                      {assessmentMeta.label}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase text-slate-500">Data visita INPS</p>
                    <p className="mt-1 text-sm text-slate-700">
                      {invalidityDetails.inps_visit_date 
                        ? new Date(invalidityDetails.inps_visit_date).toLocaleDateString('it-IT')
                        : 'Non programmata'}
                    </p>
                  </div>
                </div>

                {invalidityDetails.benefits_requested && invalidityDetails.benefits_requested.length > 0 && (
                  <div>
                    <p className="text-xs font-medium uppercase text-slate-500">Prestazioni richieste</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {invalidityDetails.benefits_requested.map((benefit: string) => (
                        <span key={benefit} className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                          {benefit}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {invalidityDetails.benefits_approved && invalidityDetails.benefits_approved.length > 0 && (
                  <div>
                    <p className="text-xs font-medium uppercase text-slate-500">Prestazioni approvate</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {invalidityDetails.benefits_approved.map((benefit: string) => (
                        <span key={benefit} className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                          <CheckCircle size={12} className="mr-1" aria-hidden="true" />
                          {benefit}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-lg border border-dashed border-slate-300 p-4">
                <AlertCircle className="h-5 w-5 text-slate-400" aria-hidden="true" />
                <p className="text-sm text-slate-600">Dettagli invalidità non ancora compilati.</p>
                <Link 
                  href={`/invalidita-civile/${caseDataTyped.id}/edit`}
                  className="ml-auto text-sm font-medium text-blue-600 hover:text-blue-800"
                >
                  Compila ora &rarr;
                </Link>
              </div>
            )}
          </div>

          {/* Medical Certificates */}
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-700">
                  <FileText size={20} aria-hidden="true" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">Certificati Medici</h2>
                  <p className="text-sm text-slate-500">{medicalCertificates.length} certificato/i</p>
                </div>
              </div>
              <Link 
                href={`/invalidita-civile/${caseDataTyped.id}/certificate/new`}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-purple-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-purple-700"
              >
                + Nuovo Certificato
              </Link>
            </div>

            {medicalCertificates.length === 0 ? (
              <div className="flex items-center gap-3 rounded-lg border border-dashed border-slate-300 p-4">
                <FileText className="h-5 w-5 text-slate-400" aria-hidden="true" />
                <p className="text-sm text-slate-600">Nessun certificato medico caricato.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {medicalCertificates.map((cert) => {
                  const isCertExpired = cert.expiry_date && new Date(cert.expiry_date) < new Date()
                  const isCertExpiringSoon = cert.expiry_date && !isCertExpired && (() => {
                    const expiry = new Date(cert.expiry_date)
                    const now = new Date()
                    return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) <= 30
                  })()

                  return (
                    <div
                      key={cert.id}
                      className="flex items-center justify-between rounded-lg border border-slate-200 p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${isCertExpired ? 'bg-red-100 text-red-600' : isCertExpiringSoon ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-600'}`}>
                          <FileText size={16} aria-hidden="true" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{cert.certificate_type}</p>
                          <p className="text-xs text-slate-500">
                            Dr. {cert.doctor_name} - {new Date(cert.issue_date).toLocaleDateString('it-IT')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
                          cert.verification_status === 'verified' ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' :
                          cert.verification_status === 'pending' ? 'bg-amber-50 text-amber-700 ring-amber-200' :
                          cert.verification_status === 'rejected' ? 'bg-red-50 text-red-700 ring-red-200' :
                          'bg-slate-50 text-slate-700 ring-slate-200'
                        }`}>
                          {cert.verification_status === 'verified' ? 'Verificato' :
                           cert.verification_status === 'pending' ? 'Da verificare' :
                           cert.verification_status === 'rejected' ? 'Respinto' : 'Scaduto'}
                        </span>
                        {cert.expiry_date && (
                          <p className={`mt-1 text-xs ${isCertExpired ? 'text-red-600 font-medium' : isCertExpiringSoon ? 'text-amber-600 font-medium' : 'text-slate-500'}`}>
                            Scade: {new Date(cert.expiry_date).toLocaleDateString('it-IT')}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact Info */}
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                <User size={20} aria-hidden="true" />
              </div>
              <h2 className="text-lg font-semibold text-slate-950">Contatto</h2>
            </div>

            {contact ? (
              <div className="space-y-2 text-sm">
                <p className="font-semibold text-slate-900">{contact.first_name} {contact.last_name}</p>
                <p className="text-slate-600">{contact.fiscal_code}</p>
                {contact.email && <p className="text-slate-600">{contact.email}</p>}
                {contact.phone && <p className="text-slate-600">{contact.phone}</p>}
                <Link 
                  href={`/contacts/${contact.id}`}
                  className="mt-3 inline-block text-sm font-medium text-blue-600 hover:text-blue-800"
                >
                  Vedi profilo completo &rarr;
                </Link>
              </div>
            ) : (
              <p className="text-sm text-slate-500">Nessun contatto associato.</p>
            )}
          </div>

          {/* Case Status */}
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                <Calendar size={20} aria-hidden="true" />
              </div>
              <h2 className="text-lg font-semibold text-slate-950">Stato Pratica</h2>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium uppercase text-slate-500">Stato corrente</p>
                <span className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
                  caseDataTyped.status === 'completed' ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' :
                  caseDataTyped.status === 'rejected' ? 'bg-red-50 text-red-700 ring-red-200' :
                  caseDataTyped.status === 'in_progress' ? 'bg-amber-50 text-amber-700 ring-amber-200' :
                  caseDataTyped.status === 'pending_documents' ? 'bg-orange-50 text-orange-700 ring-orange-200' :
                  'bg-sky-50 text-sky-700 ring-sky-200'
                }`}>
                  {caseDataTyped.status.replace('_', ' ')}
                </span>
              </div>

              {invalidityDetails?.inps_protocol_number && (
                <div>
                  <p className="text-xs font-medium uppercase text-slate-500">Protocollo INPS</p>
                  <p className="mt-1 text-sm text-slate-700">{invalidityDetails.inps_protocol_number}</p>
                </div>
              )}

              {invalidityDetails?.ap70_filed && (
                <div>
                  <p className="text-xs font-medium uppercase text-slate-500">Modulo AP70</p>
                  <span className="mt-1 inline-flex items-center gap-1 text-sm text-emerald-700">
                    <CheckCircle size={14} aria-hidden="true" />
                    Presentato
                    {invalidityDetails.ap70_protocol_number && ` - ${invalidityDetails.ap70_protocol_number}`}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950 mb-4">Azioni Rapide</h2>
            <div className="space-y-2">
              <Link 
                href={`/invalidita-civile/${caseDataTyped.id}/edit`}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
              >
                <Edit size={16} aria-hidden="true" />
                Modifica Dettagli
              </Link>
              <Link 
                href={`/invalidita-civile/${caseDataTyped.id}/certificate/new`}
                className="flex w-full items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
              >
                <FileText size={16} aria-hidden="true" />
                Nuovo Certificato
              </Link>
            </div>
          </div>
        </div>
      </div>

      <CaseCollaboration caseId={caseDataTyped.id} canInvite={canInvite} />
    </div>
  )
}