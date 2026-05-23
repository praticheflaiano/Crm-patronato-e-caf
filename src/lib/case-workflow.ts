import type { Database } from '@/types/database'

export type CaseStatus = Database['public']['Enums']['case_status']
export type CaseType = Database['public']['Enums']['case_type']

type CaseStatusMeta = {
  label: string
  description: string
  badgeClassName: string
}

type CaseTypeMeta = {
  label: string
  description: string
}

export const CASE_STATUSES: readonly CaseStatus[] = [
  'open',
  'in_progress',
  'pending_documents',
  'completed',
  'rejected',
]

export const CASE_TYPES: readonly CaseType[] = ['caf', 'patronato', 'invalidita_civile']

export const CASE_STATUS_META = {
  open: {
    label: 'Aperta',
    description: 'Pratica registrata, da prendere in carico.',
    badgeClassName: 'bg-sky-50 text-sky-700 ring-sky-200',
  },
  in_progress: {
    label: 'In lavorazione',
    description: 'Pratica presa in carico e in gestione.',
    badgeClassName: 'bg-amber-50 text-amber-700 ring-amber-200',
  },
  pending_documents: {
    label: 'Documenti mancanti',
    description: 'In attesa di integrazioni o documenti dal cittadino.',
    badgeClassName: 'bg-orange-50 text-orange-700 ring-orange-200',
  },
  completed: {
    label: 'Completata',
    description: 'Iter concluso con esito positivo.',
    badgeClassName: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  },
  rejected: {
    label: 'Respinta',
    description: 'Iter concluso con esito negativo o non procedibile.',
    badgeClassName: 'bg-rose-50 text-rose-700 ring-rose-200',
  },
} satisfies Record<CaseStatus, CaseStatusMeta>

export const CASE_TYPE_META = {
  caf: {
    label: 'CAF',
    description: 'Pratiche fiscali, dichiarazioni, ISEE e servizi CAF.',
  },
  patronato: {
    label: 'Patronato',
    description: 'Pratiche previdenziali, pensionistiche e assistenziali.',
  },
  invalidita_civile: {
    label: 'Invalidità Civile',
    description: 'Domande e iter collegati al riconoscimento di invalidità civile.',
  },
} satisfies Record<CaseType, CaseTypeMeta>

export const CASE_STATUS_TRANSITIONS = {
  open: ['in_progress', 'pending_documents', 'rejected'],
  in_progress: ['pending_documents', 'completed', 'rejected'],
  pending_documents: ['in_progress', 'rejected'],
  completed: [],
  rejected: [],
} satisfies Record<CaseStatus, readonly CaseStatus[]>

export function validateStatusTransition(
  currentStatus: CaseStatus | null,
  newStatus: CaseStatus
): boolean {
  if (!currentStatus) return newStatus === 'open'
  const transitions = CASE_STATUS_TRANSITIONS as Record<string, readonly string[]>
  return transitions[currentStatus]?.includes(newStatus) ?? false
}

export async function handleStatusChange(
  caseId: string,
  newStatus: CaseStatus,
  userId: string,
  organizationId: string
): Promise<void> {
  // Create relevant tasks based on status change
  switch (newStatus) {
    case 'pending_documents':
      await createTask({
        case_id: caseId,
        title: 'Richiedi documenti mancanti',
        description: 'Contattare il cittadino per richiedere i documenti necessari',
        assigned_to: userId,
        organization_id: organizationId,
      })
      break
    case 'in_progress':
      await createTask({
        case_id: caseId,
        title: 'Gestisci pratica',
        description: 'Procedere con la gestione della pratica',
        assigned_to: userId,
        organization_id: organizationId,
      })
      break
  }

  // TODO: Add notification system integration
}

function formatUnknownValue(value: string | null | undefined) {
  if (!value) {
    return 'N/D'
  }

  return value
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function getCaseStatusMeta(status: string | null | undefined): CaseStatusMeta {
  if (status && status in CASE_STATUS_META) {
    return CASE_STATUS_META[status as CaseStatus]
  }

  return {
    label: formatUnknownValue(status),
    description: 'Stato pratica non riconosciuto.',
    badgeClassName: 'bg-slate-50 text-slate-700 ring-slate-200',
  }
}

export function getCaseStatusLabel(status: string | null | undefined) {
  return getCaseStatusMeta(status).label
}

export function getCaseTypeLabel(type: string | null | undefined) {
  if (type && type in CASE_TYPE_META) {
    return CASE_TYPE_META[type as CaseType].label
  }

  return formatUnknownValue(type)
}

export function getAllowedNextStatuses(status: CaseStatus | null | undefined): readonly CaseStatus[] {
  if (!status) {
    return ['open']
  }

  return (CASE_STATUS_TRANSITIONS as Record<string, readonly CaseStatus[]>)[status]
}

// Helper type for task creation
interface TaskInput {
  case_id: string | null
  title: string
  description: string | null
  assigned_to: string | null
  organization_id: string
}

// Mock task creation function - should be replaced with actual implementation
async function createTask(task: TaskInput): Promise<void> {
  // In a real implementation, this would call your task service
  console.log('Creating task:', task)
  // Example implementation using Supabase:
  // await supabase.from('tasks').insert(task)
}

export function getCaseStatusOptions(currentStatus: CaseStatus | null | undefined) {
  const nextStatuses = getAllowedNextStatuses(currentStatus)
  const visibleStatuses = currentStatus ? [currentStatus, ...nextStatuses] : nextStatuses

  return CASE_STATUSES.filter((status) => visibleStatuses.includes(status))
}
