'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, Edit, Trash2, AlertTriangle, CheckCircle, Clock, XCircle, FileText, User, Calendar } from 'lucide-react'

type CaseItem = {
  id: string
  title: string
  status: string
  created_at: string | null
  contacts: {
    first_name: string
    last_name: string
  } | null
  invalidity_details?: {
    disability_type: string
    disability_percentage: number
    assessment_status: string
    certification_expiry_date: string | null
  } | null
}

type InvaliditaListProps = {
  cases: CaseItem[]
  isDoctorView?: boolean
}

function getStatusBadge(status: string) {
  const badges: Record<string, { bg: string; text: string; icon: typeof Clock }> = {
    open: { bg: 'bg-sky-50', text: 'text-sky-700', icon: Clock },
    in_progress: { bg: 'bg-amber-50', text: 'text-amber-700', icon: Clock },
    pending_documents: { bg: 'bg-orange-50', text: 'text-orange-700', icon: AlertTriangle },
    completed: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: CheckCircle },
    rejected: { bg: 'bg-rose-50', text: 'text-rose-700', icon: XCircle },
  }
  return badges[status] || badges.open
}

function getAssessmentBadge(assessmentStatus: string | undefined) {
  if (!assessmentStatus) return null

  const badges: Record<string, { bg: string; text: string }> = {
    'in_corso': { bg: 'bg-blue-50', text: 'text-blue-700' },
    'presentata': { bg: 'bg-indigo-50', text: 'text-indigo-700' },
    'in_istruttoria': { bg: 'bg-amber-50', text: 'text-amber-700' },
    'approvata': { bg: 'bg-emerald-50', text: 'text-emerald-700' },
    'respinta': { bg: 'bg-red-50', text: 'text-red-700' },
  }
  return badges[assessmentStatus] || badges['in_corso']
}

function getAssessmentLabel(status: string) {
  const labels: Record<string, string> = {
    'in_corso': 'In Corso',
    'presentata': 'Presentata',
    'in_istruttoria': 'In Istruttoria',
    'approvata': 'Approvata',
    'respinta': 'Respinta',
  }
  return labels[status] || status
}

function isExpiringSoon(expiryDate: string | null | undefined) {
  if (!expiryDate) return false
  const expiry = new Date(expiryDate)
  const now = new Date()
  const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  return daysUntilExpiry <= 30 && daysUntilExpiry > 0
}

function isExpired(expiryDate: string | null | undefined) {
  if (!expiryDate) return false
  return new Date(expiryDate) < new Date()
}

export function InvaliditaList({ cases, isDoctorView = false }: InvaliditaListProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterExpiry, setFilterExpiry] = useState<string>('all')

  const filteredCases = cases.filter(c => {
    // Status filter
    if (filterStatus !== 'all' && c.status !== filterStatus) return false
    
    // Expiry filter
    if (filterExpiry === 'expired' && !isExpired(c.invalidity_details?.certification_expiry_date)) return false
    if (filterExpiry === 'expiring' && !isExpiringSoon(c.invalidity_details?.certification_expiry_date)) return false
    if (filterExpiry === 'valid' && (isExpired(c.invalidity_details?.certification_expiry_date) || isExpiringSoon(c.invalidity_details?.certification_expiry_date))) return false
    
    return true
  })

  async function handleDelete(caseId: string) {
    if (!confirm('Sei sicuro di voler eliminare questa pratica?')) return

    startTransition(async () => {
      const formData = new FormData()
      formData.set('caseId', caseId)

      const response = await fetch('/api/invalidita/delete', {
        method: 'DELETE',
        body: formData,
      })

      if (response.ok) {
        router.refresh()
      }
    })
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="flex items-center gap-2">
          <label htmlFor="filterStatus" className="text-sm font-medium text-slate-600">Stato:</label>
          <select
            id="filterStatus"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">Tutti</option>
            <option value="open">Aperta</option>
            <option value="in_progress">In Lavorazione</option>
            <option value="pending_documents">Doc. Mancanti</option>
            <option value="completed">Completata</option>
            <option value="rejected">Respinta</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="filterExpiry" className="text-sm font-medium text-slate-600">Certificato:</label>
          <select
            id="filterExpiry"
            value={filterExpiry}
            onChange={(e) => setFilterExpiry(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">Tutti</option>
            <option value="valid">Valido</option>
            <option value="expiring">Scadenza 30gg</option>
            <option value="expired">Scaduto</option>
          </select>
        </div>

        <div className="text-sm text-slate-500 sm:ml-auto">
          {filteredCases.length} pratiche
        </div>
      </div>

      {/* Cases List - Mobile Card View */}
      <div className="space-y-3 md:hidden">
        {filteredCases.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
              <FileText size={20} aria-hidden="true" />
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-700">Nessuna pratica trovata</p>
            <p className="mt-1 text-sm text-slate-500">Non ci sono pratiche corrispondenti ai filtri.</p>
          </div>
        ) : (
          filteredCases.map((caseItem) => {
            const statusBadge = getStatusBadge(caseItem.status)
            const assessmentBadge = caseItem.invalidity_details ? getAssessmentBadge(caseItem.invalidity_details.assessment_status) : null
            const expired = isExpired(caseItem.invalidity_details?.certification_expiry_date)
            const expiringSoon = isExpiringSoon(caseItem.invalidity_details?.certification_expiry_date)

            return (
              <div key={caseItem.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${expired ? 'bg-red-100 text-red-600' : expiringSoon ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                    <FileText size={16} aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-950 truncate">{caseItem.title}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {caseItem.contacts ? `${caseItem.contacts.last_name} ${caseItem.contacts.first_name}` : 'N/D'}
                    </p>
                    {caseItem.invalidity_details && (
                      <p className="text-xs text-slate-600 mt-1 capitalize">
                        {caseItem.invalidity_details.disability_type} - {caseItem.invalidity_details.disability_percentage}%
                      </p>
                    )}
                  </div>
                  <span className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ring-1 ring-inset ${statusBadge.bg} ${statusBadge.text}`}>
                    {getCaseStatusMeta(caseItem.status).label}
                  </span>
                </div>
                
                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                  {assessmentBadge && (
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ring-1 ring-inset ${assessmentBadge.bg} ${assessmentBadge.text}`}>
                      {getAssessmentLabel(caseItem.invalidity_details?.assessment_status || '')}
                    </span>
                  )}
                  {caseItem.invalidity_details?.certification_expiry_date && (
                    <span className={`text-xs ${expired ? 'text-red-600 font-medium' : expiringSoon ? 'text-amber-600 font-medium' : 'text-slate-500'}`}>
                      Scadenza: {new Date(caseItem.invalidity_details.certification_expiry_date).toLocaleDateString('it-IT')}
                    </span>
                  )}
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <Link
                    href={isDoctorView ? `/medico/dashboard/${caseItem.id}` : `/invalidita-civile/${caseItem.id}`}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                  >
                    <Eye size={14} aria-hidden="true" />
                    Dettagli
                  </Link>
                  <Link
                    href={isDoctorView ? `/medico/dashboard/${caseItem.id}/edit` : `/invalidita-civile/${caseItem.id}/edit`}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    <Edit size={14} aria-hidden="true" />
                    Modifica
                  </Link>
                  {!isDoctorView && (
                    <button
                      onClick={() => handleDelete(caseItem.id)}
                      disabled={isPending}
                      className="flex items-center justify-center rounded-md p-2 text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      <Trash2 size={14} aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Cases Table - Desktop */}
      <div className="hidden md:block rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-500">Pratica</th>
                <th scope="col" className="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-500">Contatto</th>
                <th scope="col" className="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-500">Invalidità</th>
                <th scope="col" className="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-500">Stato</th>
                <th scope="col" className="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-500">Iter</th>
                <th scope="col" className="px-5 py-3 text-right text-xs font-semibold uppercase text-slate-500">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredCases.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                      <FileText size={20} aria-hidden="true" />
                    </div>
                    <p className="mt-3 text-sm font-semibold text-slate-700">Nessuna pratica trovata</p>
                    <p className="mt-1 text-sm text-slate-500">Non ci sono pratiche di invalidità civile corrispondenti ai filtri.</p>
                  </td>
                </tr>
              ) : (
                filteredCases.map((caseItem) => {
                  const statusBadge = getStatusBadge(caseItem.status)
                  const StatusIcon = statusBadge.icon
                  const assessmentBadge = caseItem.invalidity_details ? getAssessmentBadge(caseItem.invalidity_details.assessment_status) : null
                  const expired = isExpired(caseItem.invalidity_details?.certification_expiry_date)
                  const expiringSoon = isExpiringSoon(caseItem.invalidity_details?.certification_expiry_date)

                  return (
                    <tr key={caseItem.id} className="hover:bg-slate-50">
                      <td className="whitespace-nowrap px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${expired ? 'bg-red-100 text-red-600' : expiringSoon ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                            <FileText size={16} aria-hidden="true" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-950">{caseItem.title}</p>
                            <p className="text-xs text-slate-500">
                              Creata il {caseItem.created_at ? new Date(caseItem.created_at).toLocaleDateString('it-IT') : 'N/D'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4">
                        {caseItem.contacts ? (
                          <div className="flex items-center gap-2">
                            <User size={14} className="text-slate-400" aria-hidden="true" />
                            <span className="text-sm text-slate-600">
                              {caseItem.contacts.last_name} {caseItem.contacts.first_name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400">N/D</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4">
                        {caseItem.invalidity_details ? (
                          <div>
                            <p className="text-sm font-medium text-slate-700 capitalize">
                              {caseItem.invalidity_details.disability_type}
                            </p>
                            <p className="text-xs text-slate-500">
                              {caseItem.invalidity_details.disability_percentage}%
                            </p>
                            {caseItem.invalidity_details.certification_expiry_date && (
                              <p className={`text-xs mt-1 ${expired ? 'text-red-600 font-medium' : expiringSoon ? 'text-amber-600 font-medium' : 'text-slate-500'}`}>
                                <Calendar size={12} className="inline mr-1" aria-hidden="true" />
                                Scadenza: {new Date(caseItem.invalidity_details.certification_expiry_date).toLocaleDateString('it-IT')}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400">Dati non compilati</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusBadge.bg} ${statusBadge.text}`}>
                          <StatusIcon size={12} aria-hidden="true" />
                          {getCaseStatusMeta(caseItem.status).label}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4">
                        {assessmentBadge ? (
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${assessmentBadge.bg} ${assessmentBadge.text}`}>
                            {getAssessmentLabel(caseItem.invalidity_details?.assessment_status || '')}
                          </span>
                        ) : (
                          <span className="text-sm text-slate-400">N/D</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={isDoctorView ? `/medico/dashboard/${caseItem.id}` : `/invalidita-civile/${caseItem.id}`}
                            className="inline-flex items-center justify-center rounded-md p-2 text-blue-700 hover:bg-blue-50"
                            title="Dettagli"
                          >
                            <Eye size={16} aria-hidden="true" />
                          </Link>
                          <Link
                            href={isDoctorView ? `/medico/dashboard/${caseItem.id}/edit` : `/invalidita-civile/${caseItem.id}/edit`}
                            className="inline-flex items-center justify-center rounded-md p-2 text-slate-600 hover:bg-slate-100"
                            title="Modifica"
                          >
                            <Edit size={16} aria-hidden="true" />
                          </Link>
                          {!isDoctorView && (
                            <button
                              onClick={() => handleDelete(caseItem.id)}
                              disabled={isPending}
                              className="inline-flex items-center justify-center rounded-md p-2 text-red-600 hover:bg-red-50 disabled:opacity-50"
                              title="Elimina"
                            >
                              <Trash2 size={16} aria-hidden="true" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}