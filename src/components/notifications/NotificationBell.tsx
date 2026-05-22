'use client'
import { useState, useEffect } from 'react'
import NotificationDropdown from './NotificationDropdown'
import NotificationPanel from './NotificationPanel'

export default function NotificationBell() {
  const [showPanel, setShowPanel] = useState(false)

  useEffect(() => {
    // Poll for updates every 30 seconds
    const interval = setInterval(() => {
      // Force re-render to update unread count in dropdown
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <>
      <NotificationDropdown onViewAll={() => setShowPanel(true)} />
      {showPanel && (
        <NotificationPanel onClose={() => setShowPanel(false)} />
      )}
    </>
  )
}