import { redirect } from 'next/navigation'
import { BookOpen } from 'lucide-react'
import { SetupNotice } from '@/components/setup-notice'
import { hasSupabaseConfig } from '@/utils/supabase/config'
import { createClient } from '@/utils/supabase/server'
import { getOrCreateUserProfile } from '@/lib/user-profile'
import { KnowledgeManager } from './knowledge-manager'

export default async function KnowledgePage() {
  if (!hasSupabaseConfig()) return <SetupNotice />

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await getOrCreateUserProfile(user)
  if (!profile) redirect('/login')

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
          <BookOpen size={20} aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Conoscenza</h1>
          <p className="mt-1 text-sm text-slate-500">
            Carica documenti (PDF, Word, testo) o incolla testo: l&apos;assistente AI userà questi contenuti per rispondere.
          </p>
        </div>
      </div>

      <KnowledgeManager />
    </div>
  )
}
