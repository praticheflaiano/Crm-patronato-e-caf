/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { FileText, User, Calendar, AlertCircle } from 'lucide-react'
import { SetupNotice } from '@/components/setup-notice'
import { hasSupabaseConfig } from '@/utils/supabase/config'
import { createClient } from '@/utils/supabase/server'
import { getOrCreateUserProfile } from '@/lib/user-profile'
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

export default async function DoctorCaseDetailPage({ params }: PageProps) {
  if (!hasSupabaseConfig()) {
    return <SetupNotice />
  }

  const { id } = await params
  const supabase = await createClient()

  // Verify user is a doctor
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const profile = await getOrCreateUserProfile(user)
  if (profile?.role !== 'doctor') {
    redirect('/')
  }

  // Ensure the doctor is a collaborator on this case (source of truth)
  const { data: membership } = await (supabase as any)
    .from('case_collaborators')
    .select('id')
    .eq('case_id', id)
    .eq('user_id', user.id)
    .eq('role', 'doctor')
    .maybeSingle()

  if (!membership) {
    notFound()
  }

  // Fetch case with details
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

  const caseDataTyped = caseData as any

  const invalidityDetails = caseDataTyped.invalidity_details as InvalidityDetails | null
  const medicalCertificates = (caseDataTyped.medical_certificates || []) as MedicalCertificate[]
  const contact = caseDataTyped.contacts as CaseContact | null

  const isExpired = invalidityDetails?.certification_expiry_date 
    ? new Date(invalidityDetails.certification_expiry_date) < new Date()
    : false

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <Link href="/medico/dashboard" className="text-sm font-medium text-slate-500 hover:text-slate-900">
            &larr; Dashboard Medico
          </Link>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-950">{caseDataTyped.title}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {contact ? `${contact.last_name} ${contact.first_name}` : 'Paziente'}
          </p>
        </div>
      </div>

      {/* Alert for expired certificate */}
      {isExpired && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" aria-hidden="true" />
            <div className="text-sm text-red-800">
              <p className="font-semibold">Certificato scaduto</p>
              <p className="mt-1">Il certificato medico è scaduto. È necessario renewal un nuovo certificato.</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Invalidity Details - Read Only for Doctor */}
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                <FileText size={20} aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Dettagli Invalidità</h2>
                <p className="text-sm text-slate-500">Informazioni sulla disabilità</p>
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
              </div>
            ) : (
              <p className="text-sm text-slate-500">Dettagli non disponibili.</p>
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
            </div>

            {medicalCertificates.length === 0 ? (
              <div className="flex items-center gap-3 rounded-lg border border-dashed border-slate-300 p-4">
                <FileText className="h-5 w-5 text-slate-400" aria-hidden="true" />
                <p className="text-sm text-slate-600">Nessun certificato medico.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {medicalCertificates.map((cert) => (
                  <div key={cert.id} className="rounded-lg border border-slate-200 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{cert.certificate_type}</p>
                        <p className="text-xs text-slate-500">
                          Dr. {cert.doctor_name} - {new Date(cert.issue_date).toLocaleDateString('it-IT')}
                        </p>
                      </div>
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
                    </div>
                    {cert.diagnosis && (
                      <p className="mt-2 text-sm text-slate-700">{cert.diagnosis}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Patient Info */}
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                <User size={20} aria-hidden="true" />
              </div>
              <h2 className="text-lg font-semibold text-slate-950">Paziente</h2>
            </div>

            {contact ? (
              <div className="space-y-2 text-sm">
                <p className="font-semibold text-slate-900">{contact.first_name} {contact.last_name}</p>
                <p className="text-slate-600">{contact.fiscal_code}</p>
                {contact.email && <p className="text-slate-600">{contact.email}</p>}
                {contact.phone && <p className="text-slate-600">{contact.phone}</p>}
              </div>
            ) : (
              <p className="text-sm text-slate-500">Dati non disponibili.</p>
            )}
          </div>

          {/* Case Status */}
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                <Calendar size={20} aria-hidden="true" />
              </div>
              <h2 className="text-lg font-semibold text-slate-950">Stato</h2>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium uppercase text-slate-500">Stato pratica</p>
                <span className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
                  caseDataTyped.status === 'completed' ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' :
                  caseDataTyped.status === 'rejected' ? 'bg-red-50 text-red-700 ring-red-200' :
                  caseDataTyped.status === 'in_progress' ? 'bg-amber-50 text-amber-700 ring-amber-200' :
                  'bg-sky-50 text-sky-700 ring-sky-200'
                }`}>
                  {caseDataTyped.status.replace('_', ' ')}
                </span>
              </div>

              {invalidityDetails?.inps_visit_date && (
                <div>
                  <p className="text-xs font-medium uppercase text-slate-500">Data visita INPS</p>
                  <p className="mt-1 text-sm text-slate-700">
                    {new Date(invalidityDetails.inps_visit_date).toLocaleDateString('it-IT')}
                  </p>
                </div>
              )}

              {invalidityDetails?.assessment_status && (
                <div>
                  <p className="text-xs font-medium uppercase text-slate-500">Iter</p>
                  <span className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
                    invalidityDetails.assessment_status === 'approvata' ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' :
                    invalidityDetails.assessment_status === 'respinta' ? 'bg-red-50 text-red-700 ring-red-200' :
                    invalidityDetails.assessment_status === 'in_istruttoria' ? 'bg-amber-50 text-amber-700 ring-amber-200' :
                    'bg-blue-50 text-blue-700 ring-blue-200'
                  }`}>
                    {invalidityDetails.assessment_status.replace('_', ' ')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}