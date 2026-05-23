'use client'
import { Bell, FileText, FolderKanban, CheckCircle2 } from 'lucide-react'
import { formatDistanceToNow } from '@/lib/utils'

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: 'task' | 'case' | 'document' | string
  related_id: string | null
  is_read: boolean
  created_at: string
  organization_id: string
}

interface NotificationItemProps {
  notification: Notification
  onRead?: (id: string) => void
  onDelete?: (id: string) => void
}

const typeIcons = {
  task: CheckCircle2,
  case: FolderKanban,
  document: FileText,
}

const typeColors = {
  task: 'text-blue-600 bg-blue-50',
  case: 'text-purple-600 bg-purple-50',
  document: 'text-amber-600 bg-amber-50',
}

export default function NotificationItem({ notification, onRead, onDelete }: NotificationItemProps) {
  const Icon = typeIcons[notification.type as keyof typeof typeIcons] ?? Bell
  const colorClass = typeColors[notification.type as keyof typeof typeColors] ?? 'text-slate-600 bg-slate-50'

  return (
    <div
      className={`group flex items-start gap-3 border-b border-slate-100 px-4 py-3 transition-colors hover:bg-slate-50 ${
        !notification.is_read ? 'bg-blue-50/50' : ''
      }`}
    >
      <div className={`mt-0.5 rounded-full p-2 ${colorClass}`}>
        <Icon size={16} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className={`break-words text-sm font-medium ${!notification.is_read ? 'text-slate-900' : 'text-slate-700'}`}>
            {notification.title || 'Notifica'}
          </p>
          {!notification.is_read && (
            <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
          )}
        </div>
        <p className="mt-0.5 break-words text-sm text-slate-500">{notification.message || 'Aggiornamento CRM'}</p>
        <p className="mt-1 text-xs text-slate-400">
          {notification.created_at ? formatDistanceToNow(notification.created_at) : 'Ora'}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
        {!notification.is_read && onRead && (
          <button
            type="button"
            onClick={() => onRead(notification.id)}
            className="rounded p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
            title="Segna come letta"
          >
            <CheckCircle2 size={14} />
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(notification.id)}
            className="rounded p-1.5 text-slate-400 hover:bg-red-100 hover:text-red-600"
            title="Elimina"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
