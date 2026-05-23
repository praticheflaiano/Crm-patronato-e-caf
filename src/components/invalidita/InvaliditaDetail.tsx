/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Edit, 
  FileText, 
  User, 
  Calendar, 
  Stethoscope, 
  AlertCircle, 
  CheckCircle,
  MapPin,
  Phone,
  Mail
} from 'lucide-react'

type CaseContact = {
  id: string
  first_name: string
  last_name: string
  fiscal_code: string | null
  email: string | null
  phone: string | null
  address: string | null
}

type InvalidityDetails = {
  id: string
  disability_type: string
  disability_percentage: number
  disability_details: string | null
  inps_visit_date: string | null
  inps_visit_result: string | null
  inps_protocol_number: string | null
  certification_date: string | null
  certification_expiry_date: string | null
  benefits_requested: string[] | null
  benefits_approved: string[] | null
  assessment_status: string
  ap70_filed: boolean
  ap70_filing_date: string | null
  ap70_protocol_number: string | null
}

type MedicalCertificate = {
  id: string
  certificate_type: string
  doctor_name: string
  issue_date: string
  expiry_date: string | null
  verification_status: string
}

type CaseData = {
  id: string
  title: string
  status: string
  description: string | null
  created_at: string | null
  contacts: CaseContact | null
  invalidity_details: InvalidityDetails | null
  medical_certificates: MedicalCertificate[]
}

type InvaliditaDetailProps = {
  caseData: CaseData
  isDoctorView?: boolean
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

export function InvaliditaDetail({ caseData, isDoctorView = false }: InvaliditaDetailProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const invalidityDetails = caseData.invalidity_details
  const medicalCertificates = caseData.medical_certificates || []
  const contact = caseData.contacts

  const assessmentMeta = invalidityDetails?.assessment_status 
    ? ASSESSMENT_LABELS[invalidityDetails.assessment_status] || ASSESSMENT_LABELS['in_corso']
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

  async function handleDelete() {
    startTransition(async () => {
      const formData = new FormData()
      formData.set('caseId', caseData.id)

      const response = await fetch('/api/invalidita/delete', {
        method: 'DELETE',
        body: formData,
      })

      if (response.ok) {
        router.push('/invalidita-civile')
      }
    })
  }

  const detailLink = isDoctorView ? `/medico/dashboard/${caseData.id}` : `/invalidita-civile/${caseData.id}`
  const editLink = isDoctorView ? `/medico/dashboard/${caseData.id}/edit` : `/invalidita-civile/${caseData.id}/edit`

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <Link href={isDoctorView ? "/medico/dashboard" : "/invalidita-civile"} className="text-sm font-medium text-slate-500 hover:text-slate-900">
            &larr; {isDoctorView ? "Torna alla Dashboard" : "Torna a Invalidità Civile"}
          </Link>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-950">{caseData.title}</h1>
          <p className="mt-1 text-sm text-slate-500">
            Pratica creata{caseData.created_at ? ` il ${new Date(caseData.created_at).toLocaleDateString('it-IT')}` : ''}
          </p>
        </div>
        <Link 
          href={editLink}
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
            <AlertCircle className={`mt-0.5 h-5 w-5 shrink-0 ${isExpired ? 'text-red-600' : 'text-amber-600'}`} aria-hidden="true" />
            <div className="text-sm">
              <p className={`font-semibold ${isExpired ? 'text-red-800' : 'text-amber-800'}`}>
                {isExpired ? 'Certificato scaduto' : 'Certificato in scadenza'}
              </p>
              <p className={`mt-1 ${isExpired ? 'text-red-700' : 'text-amber-700'}`}>
                {isExpired 
                  ? 'Il certificato medico è scaduto. È necessario presentare un nuovo certificato.'
                  : `Il certificato scadrà tra ${Math.ceil((new Date(invalidityDetails?.certification_expiry_date || '').getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} giorni.`
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
                  href={editLink}
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
                href={`${detailLink}/certificate/new`}
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
                    <Link 
                      key={cert.id} 
                      href={`${detailLink}/certificate/${cert.id}`}
                      className="flex items-center justify-between rounded-lg border border-slate-200 p-4 hover:bg-slate-50"
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
                    </Link>
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
                {contact.fiscal_code && <p className="text-slate-600">{contact.fiscal_code}</p>}
                {contact.email && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Mail size={14} aria-hidden="true" />
                    <span>{contact.email}</span>
                  </div>
                )}
                {contact.phone && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Phone size={14} aria-hidden="true" />
                    <span>{contact.phone}</span>
                  </div>
                )}
                {contact.address && (
                  <div className="flex items-start gap-2 text-slate-600">
                    <MapPin size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
                    <span>{contact.address}</span>
                  </div>
                )}
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
                  caseData.status === 'completed' ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' :
                  caseData.status === 'rejected' ? 'bg-red-50 text-red-700 ring-red-200' :
                  caseData.status === 'in_progress' ? 'bg-amber-50 text-amber-700 ring-amber-200' :
                  caseData.status === 'pending_documents' ? 'bg-orange-50 text-orange-700 ring-orange-200' :
                  'bg-sky-50 text-sky-700 ring-sky-200'
                }`}>
                  {caseData.status.replace('_', ' ')}
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
                href={editLink}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
              >
                <Edit size={16} aria-hidden="true" />
                Modifica Dettagli
              </Link>
              <Link 
                href={`${detailLink}/certificate/new`}
                className="flex w-full items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
              >
                <FileText size={16} aria-hidden="true" />
                Nuovo Certificato
              </Link>
              {!isDoctorView && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isPending}
                  className="flex w-full items-center justify-center gap-2 rounded-md border border-red-300 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 shadow-sm hover:bg-red-50 disabled:opacity-50"
                >
                  Elimina Pratica
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-950">Conferma eliminazione</h3>
            <p className="mt-2 text-sm text-slate-600">
              Sei sicuro di voler eliminare questa pratica? L&apos;azione non può essere annullata.
            </p>
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Annulla
              </button>
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isPending ? 'Eliminazione...' : 'Conferma'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}