/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { FileText, AlertCircle, CheckCircle, Clock, TrendingUp, Calendar, User } from 'lucide-react'
import { SetupNotice } from '@/components/setup-notice'
import { InvaliditaList } from '@/components/invalidita/InvaliditaList'
import { hasSupabaseConfig } from '@/utils/supabase/config'
import { createClient } from '@/utils/supabase/server'
import { getOrCreateUserProfile } from '@/lib/user-profile'

export default async function DoctorDashboardPage() {
  if (!hasSupabaseConfig()) {
    return <SetupNotice />
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  const profile = await getOrCreateUserProfile(user)
  
  // Check if user is a doctor
  if (profile?.role !== 'doctor') {
    redirect('/')
  }

  // Fetch cases assigned to this doctor
  const { data: cases, error } = await supabase
    .from('cases')
    .select(`
      id,
      title,
      status,
      created_at,
      contacts (
        first_name,
        last_name
      ),
      invalidity_details (
        disability_type,
        disability_percentage,
        assessment_status,
        certification_expiry_date
      )
    `)
    .eq('type', 'invalidita_civile')
    .eq('doctor_id', user.id)
    .order('created_at', { ascending: false })

  const casesTyped = cases as any[]

  // Calculate stats
  const activeCases = casesTyped?.filter(c => !['completed', 'rejected'].includes(c.status)) || []
  const expiredCerts = casesTyped?.filter(c => {
    if (!c.invalidity_details?.certification_expiry_date) return false
    return new Date(c.invalidity_details.certification_expiry_date) < new Date()
  }) || []
  const expiringSoonCerts = casesTyped?.filter(c => {
    if (!c.invalidity_details?.certification_expiry_date) return false
    const expiry = new Date(c.invalidity_details.certification_expiry_date)
    const now = new Date()
    const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0
  }) || []
  const approvedCases = casesTyped?.filter(c => c.invalidity_details?.assessment_status === 'approvata') || []

  const stats = [
    { 
      label: 'Casi Attivi', 
      value: activeCases.length, 
      icon: Clock,
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      description: 'Pratiche in lavorazione'
    },
    { 
      label: 'Certificati Scaduti', 
      value: expiredCerts.length, 
      icon: AlertCircle,
      bg: 'bg-red-50',
      text: 'text-red-700',
      description: 'Richiedono renewal urgente'
    },
    { 
      label: 'In Scadenza', 
      value: expiringSoonCerts.length, 
      icon: Calendar,
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      description: 'Scadono entro 30 giorni'
    },
    { 
      label: 'Approvati', 
      value: approvedCases.length, 
      icon: CheckCircle,
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      description: 'Iter conclusi positivamente'
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 text-purple-700">
              <FileText size={24} aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-950">Dashboard Medico</h1>
              <p className="mt-1 text-sm text-slate-500">Benvenuto, {profile?.full_name || 'Dottore'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
        <div className="flex items-start gap-3">
          <FileText className="mt-0.5 h-5 w-5 shrink-0 text-purple-700" aria-hidden="true" />
          <div className="text-sm text-purple-800">
            <p className="font-semibold">Area Riservata Medici</p>
            <p className="mt-1">
              In questa sezione puoi gestire esclusivamente le pratiche di invalidità civile a te assegnate. 
              Non hai accesso ad altre sezioni del CRM.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-500">{stat.label}</p>
              <div className={`flex h-9 w-9 items-center justify-center rounded-md ${stat.bg} ${stat.text}`}>
                <stat.icon size={18} aria-hidden="true" />
              </div>
            </div>
            <p className="mt-4 text-3xl font-bold text-slate-950">{stat.value}</p>
            <p className="mt-1 text-xs text-slate-500">{stat.description}</p>
          </div>
        ))}
      </div>

      {/* Alert for expired/expiring certificates */}
      {(expiredCerts.length > 0 || expiringSoonCerts.length > 0) && (
        <div className={`rounded-lg border p-4 ${expiredCerts.length > 0 ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'}`}>
          <div className="flex items-start gap-3">
            <AlertCircle className={`mt-0.5 h-5 w-5 shrink-0 ${expiredCerts.length > 0 ? 'text-red-600' : 'text-amber-600'}`} aria-hidden="true" />
            <div className="text-sm">
              <p className={`font-semibold ${expiredCerts.length > 0 ? 'text-red-800' : 'text-amber-800'}`}>
                {expiredCerts.length > 0 
                  ? `${expiredCerts.length} certificato/i scaduto/i` 
                  : `${expiringSoonCerts.length} certificato/i in scadenza`}
              </p>
              <p className={`mt-1 ${expiredCerts.length > 0 ? 'text-red-700' : 'text-amber-700'}`}>
                {expiredCerts.length > 0 
                  ? 'Controlla i pazienti e richiedi renewal dei certificati medici.'
                  : 'I certificati scadranno entro 30 giorni. Pianifica i renewal.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Cases List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-950">Le Tue Pratiche</h2>
          <span className="text-sm text-slate-500">{activeCases.length} pratiche attive</span>
        </div>

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
            <p className="text-sm text-red-700">Errore nel caricamento delle pratiche: {error.message}</p>
          </div>
        ) : (
          <InvaliditaList cases={cases || []} isDoctorView={true} />
        )}
      </div>
    </div>
  )
}