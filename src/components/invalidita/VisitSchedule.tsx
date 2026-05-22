'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, Clock, MapPin, Save, AlertCircle, User } from 'lucide-react'

type VisitScheduleProps = {
  caseId: string
  existingData?: {
    id: string
    inps_visit_date: string | null
    inps_visit_result: string | null
    inps_protocol_number: string | null
    medical_examiner_id: string | null
  }
  medicalExaminers?: Array<{
    id: string
    full_name: string | null
  }>
  isDoctorView?: boolean
  onSuccess?: () => void
}

const VISIT_RESULTS = [
  { value: 'accolta', label: 'Accolta', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  { value: 'respinta', label: 'Respinta', bg: 'bg-red-50', text: 'text-red-700' },
  { value: 'in_istruttoria', label: 'In Istruttoria', bg: 'bg-amber-50', text: 'text-amber-700' },
]

export function VisitSchedule({ 
  caseId, 
  existingData, 
  medicalExaminers = [],
  isDoctorView = false,
  onSuccess 
}: VisitScheduleProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)
  const [isError, setIsError] = useState(false)

  const [formData, setFormData] = useState({
    inps_visit_date: existingData?.inps_visit_date || '',
    inps_visit_result: existingData?.inps_visit_result || '',
    inps_protocol_number: existingData?.inps_protocol_number || '',
    medical_examiner_id: existingData?.medical_examiner_id || '',
  })

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(null)
    setIsError(false)

    const submitData = new FormData()
    submitData.set('caseId', caseId)
    submitData.set('inps_visit_date', formData.inps_visit_date)
    submitData.set('inps_visit_result', formData.inps_visit_result)
    submitData.set('inps_protocol_number', formData.inps_protocol_number)
    submitData.set('medical_examiner_id', formData.medical_examiner_id)

    startTransition(async () => {
      const response = await fetch('/api/invalidita/visit', {
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
      if (onSuccess) {
        onSuccess()
      } else {
        router.refresh()
      }
    })
  }

  const resultMeta = formData.inps_visit_result 
    ? VISIT_RESULTS.find(r => r.value === formData.inps_visit_result)
    : null

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
          <Calendar size={20} aria-hidden="true" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-950">Programmazione Visita INPS</h3>
          <p className="text-sm text-slate-500">Gestisci date e risultati delle visite</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {message && (
          <div className={`flex items-center gap-2 rounded-lg p-4 ${isError ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
            {isError && <AlertCircle size={18} aria-hidden="true" />}
            {!isError && <Calendar size={18} aria-hidden="true" />}
            <p className="text-sm font-medium">{message}</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="inps_visit_date" className="block text-sm font-medium text-slate-700">
              <Calendar size={14} className="inline mr-1" aria-hidden="true" />
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
              <Clock size={14} className="inline mr-1" aria-hidden="true" />
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
              <MapPin size={14} className="inline mr-1" aria-hidden="true" />
              Numero protocollo INPS
            </label>
            <input
              type="text"
              id="inps_protocol_number"
              name="inps_protocol_number"
              value={formData.inps_protocol_number}
              onChange={(e) => setFormData(prev => ({ ...prev, inps_protocol_number: e.target.value }))}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="es. 123456789"
            />
          </div>

          {!isDoctorView && medicalExaminers.length > 0 && (
            <div>
              <label htmlFor="medical_examiner_id" className="block text-sm font-medium text-slate-700">
                <User size={14} className="inline mr-1" aria-hidden="true" />
                Medico assegnato
              </label>
              <select
                id="medical_examiner_id"
                name="medical_examiner_id"
                value={formData.medical_examiner_id}
                onChange={(e) => setFormData(prev => ({ ...prev, medical_examiner_id: e.target.value }))}
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Seleziona medico...</option>
                {medicalExaminers.map(examiner => (
                  <option key={examiner.id} value={examiner.id}>
                    {examiner.full_name || 'Medico'}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {resultMeta && (
          <div className={`rounded-lg border p-3 ${resultMeta.bg}`}>
            <p className={`text-sm font-medium ${resultMeta.text}`}>
              Esito: {resultMeta.label}
            </p>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={16} aria-hidden="true" />
            {isPending ? 'Salvataggio...' : 'Salva'}
          </button>
        </div>
      </form>
    </div>
  )
}