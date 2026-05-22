'use client'
import { useState, useEffect, useRef } from 'react'
import { Bell, CheckCheck } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database'
import { getSupabasePublishableKey, getSupabaseUrl } from '@/utils/supabase/config'
import NotificationItem, { Notification } from './NotificationItem'

interface NotificationDropdownProps {
  onViewAll?: () => void
}

export default function NotificationDropdown({ onViewAll }: NotificationDropdownProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const initialized = useRef(false)

  // Handle initial data fetch and real-time subscription
  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    
    const supabaseUrl = getSupabaseUrl()
    const supabaseKey = getSupabasePublishableKey()
    
    if (!supabaseUrl || !supabaseKey) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsLoading(false)
      return
    }

    const supabase = createBrowserClient<Database>(supabaseUrl, supabaseKey)

    // Real-time subscription
    // eslint-disable-next-line react-hooks/set-state-in-effect
    const channel = supabase
      .channel('notifications-dropdown')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
        },
        () => {
          // Re-fetch on any change
          fetch('/api/notifications')
            .then(res => res.json())
            .then(setNotifications)
            .catch(console.error)
        }
      )
      .subscribe()

    // Initial fetch
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetch('/api/notifications')
      .then(res => res.json())
      .then(data => {
        setNotifications(data)
        setIsLoading(false)
      })
      .catch(err => {
        console.error('Failed to fetch notifications:', err)
        setIsLoading(false)
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
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

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-medium text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-96 rounded-xl border border-slate-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <h3 className="text-sm font-semibold text-slate-900">Notifiche</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
              >
                <CheckCheck size={14} />
                Segna tutte come lette
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8 text-sm text-slate-500">
                Caricamento...
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-sm text-slate-500">
                <Bell size={32} className="mb-2 text-slate-300" />
                Nessuna notifica
              </div>
            ) : (
              notifications.slice(0, 10).map(notification => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onRead={markAsRead}
                  onDelete={deleteNotification}
                />
              ))
            )}
          </div>

          {notifications.length > 10 && (
            <div className="border-t border-slate-100 p-3">
              <button
                onClick={() => {
                  setIsOpen(false)
                  onViewAll?.()
                }}
                className="w-full rounded-lg py-2 text-center text-sm font-medium text-blue-600 hover:bg-blue-50"
              >
                Vedi tutte le notifiche
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}