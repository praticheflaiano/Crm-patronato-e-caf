'use client'

import { FormEvent, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Save, AlertCircle } from 'lucide-react'

type InvaliditaFormProps = {
  caseId: string
  existingData?: {
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
  isDoctorView?: boolean
}

const DISABILITY_TYPES = [
  { value: 'motoria', label: 'Motoria' },
  { value: 'visiva', label: 'Visiva' },
  { value: 'uditiva', label: 'Uditiva' },
  { value: 'intellettiva', label: 'Intellettiva' },
  { value: 'psichica', label: 'Psichica' },
  { value: 'viscerale', label: 'Viscerale' },
  { value: 'multipla', label: 'Multipla' },
  { value: 'altra', label: 'Altra' },
]

const ASSESSMENT_STATUSES = [
  { value: 'in_corso', label: 'In Corso' },
  { value: 'presentata', label: 'Presentata' },
  { value: 'in_istruttoria', label: 'In Istruttoria' },
  { value: 'approvata', label: 'Approvata' },
  { value: 'respinta', label: 'Respinta' },
]

const BENEFITS_OPTIONS = [
  { value: 'pensione', label: 'Pensione di invalidità' },
  { value: 'indennita', label: 'Indennità di frequenza' },
  { value: 'accompanied', label: 'Indennità di accompagnamento' },
  { value: 'legen', label: 'Legge 104/92 - Agevolazioni' },
]

export function InvaliditaForm({ caseId, existingData, isDoctorView = false }: InvaliditaFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)
  const [isError, setIsError] = useState(false)

  const [formData, setFormData] = useState({
    disability_type: existingData?.disability_type || '',
    disability_percentage: existingData?.disability_percentage || 0,
    disability_details: existingData?.disability_details || '',
    inps_visit_date: existingData?.inps_visit_date || '',
    inps_visit_result: existingData?.inps_visit_result || '',
    inps_protocol_number: existingData?.inps_protocol_number || '',
    certification_date: existingData?.certification_date || '',
    certification_expiry_date: existingData?.certification_expiry_date || '',
    benefits_requested: existingData?.benefits_requested || [],
    benefits_approved: existingData?.benefits_approved || [],
    assessment_status: existingData?.assessment_status || 'in_corso',
    ap70_filed: existingData?.ap70_filed || false,
    ap70_filing_date: existingData?.ap70_filing_date || '',
    ap70_protocol_number: existingData?.ap70_protocol_number || '',
  })

  function handleBenefitChange(benefit: string, isApproved: boolean) {
    setFormData(prev => {
      const targetArray = isApproved ? 'benefits_approved' : 'benefits_requested'
      const current = prev[targetArray] || []
      if (current.includes(benefit)) {
        return { ...prev, [targetArray]: current.filter((b: string) => b !== benefit) }
      } else {
        return { ...prev, [targetArray]: [...current, benefit] }
      }
    })
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(null)
    setIsError(false)

    const submitData = new FormData()
    submitData.set('caseId', caseId)
    submitData.set('disability_type', formData.disability_type)
    submitData.set('disability_percentage', String(formData.disability_percentage))
    submitData.set('disability_details', formData.disability_details)
    submitData.set('inps_visit_date', formData.inps_visit_date)
    submitData.set('inps_visit_result', formData.inps_visit_result)
    submitData.set('inps_protocol_number', formData.inps_protocol_number)
    submitData.set('certification_date', formData.certification_date)
    submitData.set('certification_expiry_date', formData.certification_expiry_date)
    submitData.set('benefits_requested', JSON.stringify(formData.benefits_requested))
    submitData.set('benefits_approved', JSON.stringify(formData.benefits_approved))
    submitData.set('assessment_status', formData.assessment_status)
    submitData.set('ap70_filed', String(formData.ap70_filed))
    submitData.set('ap70_filing_date', formData.ap70_filing_date)
    submitData.set('ap70_protocol_number', formData.ap70_protocol_number)

    startTransition(async () => {
      const response = await fetch('/api/invalidita/details', {
        method: existingData ? 'PATCH' : 'POST',
        body: submitData,
      })

      const result = await response.json()

      if (!response.ok) {
        setMessage(result.message || 'Errore nel salvataggio')
        setIsError(true)
        return
      }

      setMessage('Dati salvati correttamente')
      router.refresh()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {message && (
        <div className={`flex items-center gap-2 rounded-lg p-4 ${isError ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
          {isError && <AlertCircle size={18} aria-hidden="true" />}
          {!isError && <Save size={18} aria-hidden="true" />}
          <p className="text-sm font-medium">{message}</p>
        </div>
      )}

      {/* Disability Information */}
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-950 mb-4">Informazioni Invalidità</h3>
        
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="disability_type" className="block text-sm font-medium text-slate-700">
              Tipo di disabilità <span className="text-red-500">*</span>
            </label>
            <select
              id="disability_type"
              name="disability_type"
              required
              value={formData.disability_type}
              onChange={(e) => setFormData(prev => ({ ...prev, disability_type: e.target.value }))}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Seleziona tipo</option>
              {DISABILITY_TYPES.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="disability_percentage" className="block text-sm font-medium text-slate-700">
              Percentuale di invalidità <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="disability_percentage"
              name="disability_percentage"
              required
              min="0"
              max="100"
              value={formData.disability_percentage}
              onChange={(e) => setFormData(prev => ({ ...prev, disability_percentage: parseInt(e.target.value) || 0 }))}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mt-4">
          <label htmlFor="disability_details" className="block text-sm font-medium text-slate-700">
            Dettagli invalidità
          </label>
          <textarea
            id="disability_details"
            name="disability_details"
            rows={3}
            value={formData.disability_details}
            onChange={(e) => setFormData(prev => ({ ...prev, disability_details: e.target.value }))}
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Descrivi eventuali limitazioni funzionali specifiche..."
          />
        </div>
      </div>

      {/* INPS Visit Information */}
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-950 mb-4">Informazioni Visita INPS</h3>
        
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label htmlFor="inps_visit_date" className="block text-sm font-medium text-slate-700">
              Data visita INPS
            </label>
            <input
              type="date"
              id="inps_visit_date"
              name="inps_visit_date"
              value={formData.inps_visit_date}
              onChange={(e) => setFormData(prev => ({ ...prev, inps_visit_date: e.target.value }))}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="inps_visit_result" className="block text-sm font-medium text-slate-700">
              Esito visita
            </label>
            <select
              id="inps_visit_result"
              name="inps_visit_result"
              value={formData.inps_visit_result}
              onChange={(e) => setFormData(prev => ({ ...prev, inps_visit_result: e.target.value }))}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Seleziona esito</option>
              <option value="accolta">Accolta</option>
              <option value="respinta">Respinta</option>
              <option value="in_istruttoria">In istruttoria</option>
            </select>
          </div>

          <div>
            <label htmlFor="inps_protocol_number" className="block text-sm font-medium text-slate-700">
              Numero protocollo INPS
            </label>
            <input
              type="text"
              id="inps_protocol_number"
              name="inps_protocol_number"
              value={formData.inps_protocol_number}
              onChange={(e) => setFormData(prev => ({ ...prev, inps_protocol_number: e.target.value }))}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Certification Dates */}
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-950 mb-4">Date Certificazione</h3>
        
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="certification_date" className="block text-sm font-medium text-slate-700">
              Data certificazione
            </label>
            <input
              type="date"
              id="certification_date"
              name="certification_date"
              value={formData.certification_date}
              onChange={(e) => setFormData(prev => ({ ...prev, certification_date: e.target.value }))}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="certification_expiry_date" className="block text-sm font-medium text-slate-700">
              Data scadenza certificazione
            </label>
            <input
              type="date"
              id="certification_expiry_date"
              name="certification_expiry_date"
              value={formData.certification_expiry_date}
              onChange={(e) => setFormData(prev => ({ ...prev, certification_expiry_date: e.target.value }))}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Benefits Requested */}
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-950 mb-4">Prestazioni Richieste</h3>
        
        <div className="space-y-3">
          <p className="text-sm font-medium text-slate-600">Seleziona le prestazioni richieste:</p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {BENEFITS_OPTIONS.map(benefit => (
              <label key={benefit.value} className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.benefits_requested.includes(benefit.value)}
                  onChange={() => handleBenefitChange(benefit.value, false)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700">{benefit.label}</span>
              </label>
            ))}
          </div>
        </div>

        {isDoctorView && formData.benefits_requested.length > 0 && (
          <div className="mt-4 space-y-3">
            <p className="text-sm font-medium text-slate-600">Prestazioni approvate (solo per medici):</p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {BENEFITS_OPTIONS.map(benefit => (
                <label key={`approved-${benefit.value}`} className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 hover:bg-emerald-100 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.benefits_approved.includes(benefit.value)}
                    onChange={() => handleBenefitChange(benefit.value, true)}
                    className="h-4 w-4 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-sm text-emerald-700">{benefit.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Assessment Status */}
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-950 mb-4">Stato Pratica</h3>
        
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="assessment_status" className="block text-sm font-medium text-slate-700">
              Stato iter <span className="text-red-500">*</span>
            </label>
            <select
              id="assessment_status"
              name="assessment_status"
              required
              value={formData.assessment_status}
              onChange={(e) => setFormData(prev => ({ ...prev, assessment_status: e.target.value }))}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {ASSESSMENT_STATUSES.map(status => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* AP70 Information */}
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-950 mb-4">Modulo AP70</h3>
        
        <div className="space-y-4">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={formData.ap70_filed}
              onChange={(e) => setFormData(prev => ({ ...prev, ap70_filed: e.target.checked }))}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-slate-700">Modulo AP70 già presentato</span>
          </label>

          {formData.ap70_filed && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="ap70_filing_date" className="block text-sm font-medium text-slate-700">
                  Data presentazione AP70
                </label>
                <input
                  type="date"
                  id="ap70_filing_date"
                  name="ap70_filing_date"
                  value={formData.ap70_filing_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, ap70_filing_date: e.target.value }))}
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="ap70_protocol_number" className="block text-sm font-medium text-slate-700">
                  Numero protocollo AP70
                </label>
                <input
                  type="text"
                  id="ap70_protocol_number"
                  name="ap70_protocol_number"
                  value={formData.ap70_protocol_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, ap70_protocol_number: e.target.value }))}
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save size={16} aria-hidden="true" />
          {isPending ? 'Salvataggio...' : 'Salva Dati'}
        </button>
      </div>
    </form>
  )
}