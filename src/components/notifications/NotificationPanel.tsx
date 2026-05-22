'use client'
import { useState, useEffect } from 'react'
import { X, CheckCheck, Bell } from 'lucide-react'
import NotificationItem, { Notification } from './NotificationItem'

interface NotificationPanelProps {
  onClose: () => void
}

export default function NotificationPanel({ onClose }: NotificationPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [isInitialized, setIsInitialized] = useState(false)

  // Fetch notifications
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    if (isInitialized) return
    setIsInitialized(true)
    
    setIsLoading(true)
    fetch('/api/notifications')
      .then(res => res.json())
      .then((data: Notification[]) => {
        setNotifications(data)
        setIsLoading(false)
      })
      .catch(err => {
        console.error('Failed to fetch notifications:', err)
        setIsLoading(false)
      })
  }, [isInitialized])

  async function markAsRead(id: string) {
    try {
      const res = await fetch(`/api/notifications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      })
      if (res.ok) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
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
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }

  async function deleteNotification(id: string) {
    try {
      const res = await fetch(`/api/notifications/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setNotifications(prev => prev.filter(n => n.id !== id))
      }
    } catch (error) {
      console.error('Failed to delete notification:', error)
    }
  }

  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.is_read)
    : notifications

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="relative flex h-full w-full max-w-md flex-col bg-white shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Notifiche</h2>
            <p className="text-sm text-slate-500">
              {unreadCount > 0 ? `${unreadCount} non lette` : 'Tutte le notifiche'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 border-b border-slate-200 px-4 py-2">
          <button
            onClick={() => setFilter('all')}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-100 text-blue-700'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Tutte ({notifications.length})
          </button>
          <button
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
              onClick={markAllAsRead}
              className="ml-auto flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50"
            >
              <CheckCheck size={14} />
              Segna tutte come lette
            </button>
          )}
        </div>

        {/* Notification list */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-slate-500">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
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