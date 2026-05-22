'use client'

import { FormEvent, useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Save, AlertCircle, Upload, FileText } from 'lucide-react'

type MedicalCertificateFormProps = {
  caseId: string
  existingData?: {
    id: string
    certificate_type: string
    certificate_number: string | null
    certificate_series: string | null
    doctor_name: string
    doctor_tax_code: string | null
    doctor_phone: string | null
    doctor_email: string | null
    doctor_address: string | null
    doctor_structure: string | null
    asl_code: string | null
    diagnosis: string
    icd_code: string | null
    clinical_findings: string | null
    functional_limitations: string | null
    prognosis: string | null
    therapy_prescribed: string | null
    issue_date: string
    expiry_date: string | null
    visit_date: string | null
    document_id: string | null
    digital_signature_present: boolean
    signature_date: string | null
    is_valid: boolean
    verification_status: string
    verification_notes: string | null
  }
  onSuccess?: () => void
}

const CERTIFICATE_TYPES = [
  { value: 'hinch_60', label: 'Certificato INAIL 600 (ex L. 33/80)' },
  { value: 'hinch_65', label: 'Certificato INAIL 65 (ex L. 33/80)' },
  { value: '剖_70', label: 'Certificato 70 (Patologie specifiche)' },
  { value: '剖_104', label: 'Certificato Legge 104/92' },
  { value: 'altro', label: 'Altro certificato' },
]

const VERIFICATION_STATUSES = [
  { value: 'pending', label: 'Da verificare' },
  { value: 'verified', label: 'Verificato' },
  { value: 'rejected', label: 'Respinto' },
  { value: 'expired', label: 'Scaduto' },
]

export function MedicalCertificateForm({ caseId, existingData, onSuccess }: MedicalCertificateFormProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isPending, startTransition] = useTransition()
  const [isUploading, setIsUploading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [isError, setIsError] = useState(false)

  const [formData, setFormData] = useState({
    certificate_type: existingData?.certificate_type || '',
    certificate_number: existingData?.certificate_number || '',
    certificate_series: existingData?.certificate_series || '',
    doctor_name: existingData?.doctor_name || '',
    doctor_tax_code: existingData?.doctor_tax_code || '',
    doctor_phone: existingData?.doctor_phone || '',
    doctor_email: existingData?.doctor_email || '',
    doctor_address: existingData?.doctor_address || '',
    doctor_structure: existingData?.doctor_structure || '',
    asl_code: existingData?.asl_code || '',
    diagnosis: existingData?.diagnosis || '',
    icd_code: existingData?.icd_code || '',
    clinical_findings: existingData?.clinical_findings || '',
    functional_limitations: existingData?.functional_limitations || '',
    prognosis: existingData?.prognosis || '',
    therapy_prescribed: existingData?.therapy_prescribed || '',
    issue_date: existingData?.issue_date || '',
    expiry_date: existingData?.expiry_date || '',
    visit_date: existingData?.visit_date || '',
    digital_signature_present: existingData?.digital_signature_present || false,
    signature_date: existingData?.signature_date || '',
    is_valid: existingData?.is_valid ?? true,
    verification_status: existingData?.verification_status || 'pending',
    verification_notes: existingData?.verification_notes || '',
  })

  async function handleUploadDocument(file: File) {
    const supabase = (await import('@/utils/supabase/client')).createClient()
    const filePath = `${caseId}/certificates/${crypto.randomUUID()}-${file.name}`

    const { error: uploadError } = await supabase.storage.from('documents').upload(filePath, file, {
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    })

    if (uploadError) {
      throw new Error('Upload failed')
    }

    return filePath
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(null)
    setIsError(false)

    const file = fileInputRef.current?.files?.[0]
    let documentPath = null

    if (file) {
      setIsUploading(true)
      try {
        documentPath = await handleUploadDocument(file)
      } catch {
        setMessage('Errore nel caricamento del documento')
        setIsError(true)
        setIsUploading(false)
        return
      }
      setIsUploading(false)
    }

    const submitData = new FormData()
    submitData.set('caseId', caseId)
    Object.entries(formData).forEach(([key, value]) => {
      submitData.set(key, String(value))
    })
    if (documentPath) {
      submitData.set('document_path', documentPath)
    }

    startTransition(async () => {
      const response = await fetch('/api/invalidita/certificate', {
        method: existingData ? 'PATCH' : 'POST',
        body: submitData,
      })

      const result = await response.json()

      if (!response.ok) {
        setMessage(result.message || 'Errore nel salvataggio')
        setIsError(true)
        return
      }

      setMessage('Certificato salvato correttamente')
      if (onSuccess) {
        onSuccess()
      } else {
        router.refresh()
      }
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

      {/* Certificate Type */}
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-950 mb-4">Tipo di Certificato</h3>
        
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="certificate_type" className="block text-sm font-medium text-slate-700">
              Tipologia <span className="text-red-500">*</span>
            </label>
            <select
              id="certificate_type"
              name="certificate_type"
              required
              value={formData.certificate_type}
              onChange={(e) => setFormData(prev => ({ ...prev, certificate_type: e.target.value }))}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Seleziona tipo</option>
              {CERTIFICATE_TYPES.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="certificate_number" className="block text-sm font-medium text-slate-700">
              Numero certificato
            </label>
            <input
              type="text"
              id="certificate_number"
              name="certificate_number"
              value={formData.certificate_number}
              onChange={(e) => setFormData(prev => ({ ...prev, certificate_number: e.target.value }))}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="certificate_series" className="block text-sm font-medium text-slate-700">
              Serie certificato
            </label>
            <input
              type="text"
              id="certificate_series"
              name="certificate_series"
              value={formData.certificate_series}
              onChange={(e) => setFormData(prev => ({ ...prev, certificate_series: e.target.value }))}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Doctor Information */}
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-950 mb-4">Informazioni Medico Certificatore</h3>
        
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="doctor_name" className="block text-sm font-medium text-slate-700">
              Nome e Cognome Medico <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="doctor_name"
              name="doctor_name"
              required
              value={formData.doctor_name}
              onChange={(e) => setFormData(prev => ({ ...prev, doctor_name: e.target.value }))}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="doctor_tax_code" className="block text-sm font-medium text-slate-700">
              Codice Fiscale Medico
            </label>
            <input
              type="text"
              id="doctor_tax_code"
              name="doctor_tax_code"
              value={formData.doctor_tax_code}
              onChange={(e) => setFormData(prev => ({ ...prev, doctor_tax_code: e.target.value }))}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="doctor_phone" className="block text-sm font-medium text-slate-700">
              Telefono
            </label>
            <input
              type="tel"
              id="doctor_phone"
              name="doctor_phone"
              value={formData.doctor_phone}
              onChange={(e) => setFormData(prev => ({ ...prev, doctor_phone: e.target.value }))}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="doctor_email" className="block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              type="email"
              id="doctor_email"
              name="doctor_email"
              value={formData.doctor_email}
              onChange={(e) => setFormData(prev => ({ ...prev, doctor_email: e.target.value }))}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="doctor_address" className="block text-sm font-medium text-slate-700">
              Indirizzo Studio
            </label>
            <input
              type="text"
              id="doctor_address"
              name="doctor_address"
              value={formData.doctor_address}
              onChange={(e) => setFormData(prev => ({ ...prev, doctor_address: e.target.value }))}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="doctor_structure" className="block text-sm font-medium text-slate-700">
              Struttura di appartenenza
            </label>
            <input
              type="text"
              id="doctor_structure"
              name="doctor_structure"
              value={formData.doctor_structure}
              onChange={(e) => setFormData(prev => ({ ...prev, doctor_structure: e.target.value }))}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="asl_code" className="block text-sm font-medium text-slate-700">
              Codice ASL
            </label>
            <input
              type="text"
              id="asl_code"
              name="asl_code"
              value={formData.asl_code}
              onChange={(e) => setFormData(prev => ({ ...prev, asl_code: e.target.value }))}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Certificate Content */}
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-950 mb-4">Contenuto Certificato</h3>
        
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label htmlFor="diagnosis" className="block text-sm font-medium text-slate-700">
              Diagnosi <span className="text-red-500">*</span>
            </label>
            <textarea
              id="diagnosis"
              name="diagnosis"
              required
              rows={3}
              value={formData.diagnosis}
              onChange={(e) => setFormData(prev => ({ ...prev, diagnosis: e.target.value }))}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Descrivi la diagnosi in dettaglio..."
            />
          </div>

          <div>
            <label htmlFor="icd_code" className="block text-sm font-medium text-slate-700">
              Codice ICD-10
            </label>
            <input
              type="text"
              id="icd_code"
              name="icd_code"
              value={formData.icd_code}
              onChange={(e) => setFormData(prev => ({ ...prev, icd_code: e.target.value }))}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Es. G35, M54.5..."
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="clinical_findings" className="block text-sm font-medium text-slate-700">
              Riscontri Clinici
            </label>
            <textarea
              id="clinical_findings"
              name="clinical_findings"
              rows={3}
              value={formData.clinical_findings}
              onChange={(e) => setFormData(prev => ({ ...prev, clinical_findings: e.target.value }))}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="functional_limitations" className="block text-sm font-medium text-slate-700">
              Limitazioni Funzionali
            </label>
            <textarea
              id="functional_limitations"
              name="functional_limitations"
              rows={3}
              value={formData.functional_limitations}
              onChange={(e) => setFormData(prev => ({ ...prev, functional_limitations: e.target.value }))}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Descrivi le limitazioni nelle attività quotidiane..."
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="prognosis" className="block text-sm font-medium text-slate-700">
              Prognosi
            </label>
            <textarea
              id="prognosis"
              name="prognosis"
              rows={2}
              value={formData.prognosis}
              onChange={(e) => setFormData(prev => ({ ...prev, prognosis: e.target.value }))}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="therapy_prescribed" className="block text-sm font-medium text-slate-700">
              Terapia Prescritta
            </label>
            <textarea
              id="therapy_prescribed"
              name="therapy_prescribed"
              rows={2}
              value={formData.therapy_prescribed}
              onChange={(e) => setFormData(prev => ({ ...prev, therapy_prescribed: e.target.value }))}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Dates */}
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-950 mb-4">Date Important</h3>
        
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label htmlFor="issue_date" className="block text-sm font-medium text-slate-700">
              Data Emissione <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="issue_date"
              name="issue_date"
              required
              value={formData.issue_date}
              onChange={(e) => setFormData(prev => ({ ...prev, issue_date: e.target.value }))}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="visit_date" className="block text-sm font-medium text-slate-700">
              Data Visita
            </label>
            <input
              type="date"
              id="visit_date"
              name="visit_date"
              value={formData.visit_date}
              onChange={(e) => setFormData(prev => ({ ...prev, visit_date: e.target.value }))}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="expiry_date" className="block text-sm font-medium text-slate-700">
              Data Scadenza
            </label>
            <input
              type="date"
              id="expiry_date"
              name="expiry_date"
              value={formData.expiry_date}
              onChange={(e) => setFormData(prev => ({ ...prev, expiry_date: e.target.value }))}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Document Upload */}
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-950 mb-4">Documento Allegato</h3>
        
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <label htmlFor="document" className="block text-sm font-medium text-slate-700">
                Carica certificato firmato (PDF, max 20MB)
              </label>
              <input
                ref={fileInputRef}
                type="file"
                id="document"
                name="document"
                accept=".pdf,image/*"
                className="mt-1 block w-full text-sm text-slate-700 file:mr-4 file:rounded-md file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.digital_signature_present}
                onChange={(e) => setFormData(prev => ({ ...prev, digital_signature_present: e.target.checked }))}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-700">Firma digitale presente</span>
            </label>

            {formData.digital_signature_present && (
              <div>
                <label htmlFor="signature_date" className="sr-only">Data firma</label>
                <input
                  type="date"
                  id="signature_date"
                  name="signature_date"
                  value={formData.signature_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, signature_date: e.target.value }))}
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Verification Status (for doctors) */}
      {existingData && (
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-950 mb-4">Verifica Certificato</h3>
          
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="verification_status" className="block text-sm font-medium text-slate-700">
                Stato verifica
              </label>
              <select
                id="verification_status"
                name="verification_status"
                value={formData.verification_status}
                onChange={(e) => setFormData(prev => ({ ...prev, verification_status: e.target.value }))}
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {VERIFICATION_STATUSES.map(status => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-4 pt-6">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_valid}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_valid: e.target.checked }))}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700">Certificato valido</span>
              </label>
            </div>

            <div className="md:col-span-2">
              <label htmlFor="verification_notes" className="block text-sm font-medium text-slate-700">
                Note verifica
              </label>
              <textarea
                id="verification_notes"
                name="verification_notes"
                rows={2}
                value={formData.verification_notes}
                onChange={(e) => setFormData(prev => ({ ...prev, verification_notes: e.target.value }))}
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending || isUploading}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save size={16} aria-hidden="true" />
          {isPending || isUploading ? 'Salvataggio...' : 'Salva Certificato'}
        </button>
      </div>
    </form>
  )
}