'use client'
import { useState, useEffect } from 'react'
import { X, CheckCheck, Bell } from 'lucide-react'
import NotificationItem, { Notification } from './NotificationItem'

interface NotificationPanelProps {
  onClose: () => void
}

function normalizeNotifications(value: unknown): Notification[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is Notification => {
    return Boolean(item && typeof item === 'object' && 'id' in item && 'title' in item && 'message' in item)
  })
}

async function fetchNotifications() {
  const res = await fetch('/api/notifications', { cache: 'no-store' })
  if (!res.ok) return []
  const data = await res.json().catch(() => [])
  return normalizeNotifications(data)
}

export default function NotificationPanel({ onClose }: NotificationPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  useEffect(() => {
    let active = true
    fetchNotifications()
      .then((items) => { if (active) setNotifications(items) })
      .catch(() => { if (active) setNotifications([]) })
      .finally(() => { if (active) setIsLoading(false) })
    return () => { active = false }
  }, [])

  async function markAsRead(id: string) {
    try {
      const res = await fetch(`/api/notifications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      })
      if (res.ok) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
      }
    } catch {
      // Non-blocking UI action.
    }
  }

  async function markAllAsRead() {
    try {
      const unread = notifications.filter(n => !n.is_read)
      await Promise.all(
        unread.map(n =>
          fetch(`/api/notifications/${n.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
          })
        )
      )
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    } catch {
      // Non-blocking UI action.
    }
  }

  async function deleteNotification(id: string) {
    try {
      const res = await fetch(`/api/notifications/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setNotifications(prev => prev.filter(n => n.id !== id))
      }
    } catch {
      // Non-blocking UI action.
    }
  }

  const safeNotifications = Array.isArray(notifications) ? notifications : []
  const filteredNotifications = filter === 'unread'
    ? safeNotifications.filter(n => !n.is_read)
    : safeNotifications

  const unreadCount = safeNotifications.filter(n => !n.is_read).length

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Chiudi pannello notifiche"
      />
      
      <div className="relative flex h-dvh w-full max-w-md flex-col bg-white shadow-2xl animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4 sm:px-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Notifiche</h2>
            <p className="text-sm text-slate-500">
              {unreadCount > 0 ? `${unreadCount} non lette` : 'Tutte le notifiche'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Chiudi notifiche"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex gap-1 overflow-x-auto border-b border-slate-200 px-3 py-2 sm:px-4">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-100 text-blue-700'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Tutte ({safeNotifications.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('unread')}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              filter === 'unread'
                ? 'bg-blue-100 text-blue-700'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Non lette ({unreadCount})
          </button>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllAsRead}
              className="ml-auto flex shrink-0 items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50"
            >
              <CheckCheck size={14} />
              Segna tutte
            </button>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-slate-500">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-12 text-center text-slate-500">
              <Bell size={48} className="mb-4 text-slate-300" />
              <p className="text-base font-medium">
                {filter === 'unread' ? 'Nessuna notifica non letta' : 'Nessuna notifica'}
              </p>
              <p className="mt-1 text-sm text-slate-400">
                {filter === 'unread'
                  ? 'Hai letto tutte le notifiche'
                  : 'Le notifiche appariranno qui'}
              </p>
            </div>
          ) : (
            filteredNotifications.map(notification => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onRead={markAsRead}
                onDelete={deleteNotification}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
